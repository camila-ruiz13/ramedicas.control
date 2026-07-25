import "server-only";
import { unstable_cache } from "next/cache";
import { getSheetValues, getSheetTitles } from "./google-sheets";
import { parseNumeroCO } from "./cambios-precios-constants";
import {
  type PrecioReguladoRow,
  type CambioRegulacion,
  type PortafolioVsCircular,
  type CambioCount,
  type PortafolioCount,
  CAMBIO_ORDER,
  PORTAFOLIO_ORDER,
  normalizarCambio,
  normalizarPortafolio,
} from "./precios-regulados-constants";

// Hoja "PRECIOS REGULADOS" compartida por Camila — cruce entre el portafolio
// completo de proveedores y la circular de regulación de precios (19 vs 22).
// Solo tiene una pestaña, igual que prorroga-proveedores: tomamos titles[0]
// en vez de hardcodear el nombre exacto.
const SPREADSHEET_ID = "1A63G0Yg7iIKiYtA6Lipe9Tsnzl_5dsD1DtIAm8uPznk";

// Columnas por índice (A=0 ... AC=28) — la hoja no tiene nombres de columna
// estables para todo (hay dos con el mismo texto), así que se lee por
// posición como en prorroga-proveedores, no por nombre de header.
const COL = {
  codigo: 0,
  comprar: 2,
  principioActivo: 5,
  costo: 10,
  laboratorio: 15,
  nombreComercial: 17,
  circular22: 24,
  cambioRegulacion: 25,
  portafolioVsCircular: 26,
} as const;

type FetchResult = {
  rows: PrecioReguladoRow[];
  totalPortafolio: number;
};

async function fetchPreciosReguladosRaw(): Promise<FetchResult> {
  const titles = await getSheetTitles(SPREADSHEET_ID);
  const sheetName = titles[0];
  if (!sheetName) return { rows: [], totalPortafolio: 0 };

  const values = await getSheetValues(SPREADSHEET_ID, sheetName, "FORMATTED_VALUE");
  if (values.length < 2) return { rows: [], totalPortafolio: 0 };

  const rows: PrecioReguladoRow[] = [];
  let totalPortafolio = 0;
  for (let r = 1; r < values.length; r++) {
    const row = values[r] ?? [];
    const codigo = String(row[COL.codigo] ?? "").trim();
    if (!codigo) continue;
    totalPortafolio++;

    // Solo nos interesan los productos que la circular 22 realmente evaluó
    // (columna Z con dato) — el resto del portafolio no tiene comparación.
    const cambioRaw = String(row[COL.cambioRegulacion] ?? "").trim();
    if (!cambioRaw) continue;

    const costo = parseNumeroCO(row[COL.costo] as string);

    // La columna "CIRCULAR 22" a veces no trae un precio sino un comentario
    // de la hoja (ej. "CONTINUA CON EL MISMO VALOR DE LA 19" cuando no hubo
    // cambio) — solo se interpreta como precio si el texto trae "$", para no
    // extraerle un número al comentario (p.ej. el "19" de "...DE LA 19").
    const circular22Raw = String(row[COL.circular22] ?? "").trim();
    const precioCircular22 = circular22Raw.includes("$") ? parseNumeroCO(circular22Raw) : null;
    const circular22Comentario = precioCircular22 === null && circular22Raw ? circular22Raw : null;

    rows.push({
      codigo,
      proveedor: String(row[COL.comprar] ?? "").trim(),
      nombreComercial: String(row[COL.nombreComercial] ?? "").trim(),
      principioActivo: String(row[COL.principioActivo] ?? "").trim(),
      laboratorio: String(row[COL.laboratorio] ?? "").trim(),
      costo,
      precioCircular22,
      circular22Comentario,
      diferencia: costo !== null && precioCircular22 !== null ? costo - precioCircular22 : null,
      cambioRegulacion: normalizarCambio(cambioRaw),
      portafolioVsCircular: normalizarPortafolio(String(row[COL.portafolioVsCircular] ?? "")),
    });
  }
  return { rows, totalPortafolio };
}

// La hoja se actualiza cuando Camila registra una nueva circular — cacheado
// 5 min igual que los demás módulos Sheets-backed, con botón "Actualizar" manual.
export const PRECIOS_REGULADOS_CACHE_TAG = "precios-regulados";

export const getPreciosRegulados = unstable_cache(fetchPreciosReguladosRaw, ["precios-regulados-all"], {
  tags: [PRECIOS_REGULADOS_CACHE_TAG],
  revalidate: 300,
});

// ---------- Filtros ----------

export function applyCambioFilter(rows: PrecioReguladoRow[], cambio?: string): PrecioReguladoRow[] {
  if (!cambio) return rows;
  return rows.filter((r) => r.cambioRegulacion === cambio);
}

export function applyPortafolioFilter(rows: PrecioReguladoRow[], portafolio?: string): PrecioReguladoRow[] {
  if (!portafolio) return rows;
  return rows.filter((r) => r.portafolioVsCircular === portafolio);
}

// ---------- Agregaciones ----------

export function computeKpis(rows: PrecioReguladoRow[]) {
  const conteo = Object.fromEntries(CAMBIO_ORDER.map((c) => [c, 0])) as Record<CambioRegulacion, number>;
  for (const r of rows) conteo[r.cambioRegulacion]++;
  return { total: rows.length, conteo };
}

export function computeCambioCounts(rows: PrecioReguladoRow[]): CambioCount[] {
  const conteo = Object.fromEntries(CAMBIO_ORDER.map((c) => [c, 0])) as Record<CambioRegulacion, number>;
  for (const r of rows) conteo[r.cambioRegulacion]++;
  return CAMBIO_ORDER.map((cambio) => ({ cambio, count: conteo[cambio] })).filter((c) => c.count > 0);
}

export function computePortafolioCounts(rows: PrecioReguladoRow[]): PortafolioCount[] {
  const conteo = Object.fromEntries(PORTAFOLIO_ORDER.map((p) => [p, 0])) as Record<PortafolioVsCircular, number>;
  for (const r of rows) conteo[r.portafolioVsCircular]++;
  return PORTAFOLIO_ORDER.map((portafolio) => ({ portafolio, count: conteo[portafolio] })).filter((c) => c.count > 0);
}

export type ProveedorPorEncima = {
  proveedor: string;
  count: number;
  sobrecostoTotal: number;
  productos: PrecioReguladoRow[];
};

// Ranking para la visual clave del módulo: qué proveedores tienen productos
// vendiéndose por encima del techo regulado, con el detalle de cuáles son —
// ordenado por cantidad de productos (lo que más urge negociar primero).
export function computeProveedoresPorEncima(rows: PrecioReguladoRow[]): ProveedorPorEncima[] {
  const porProveedor = new Map<string, PrecioReguladoRow[]>();
  for (const r of rows) {
    if (r.portafolioVsCircular !== "POR_ENCIMA") continue;
    const key = r.proveedor || "Sin proveedor";
    const list = porProveedor.get(key);
    if (list) list.push(r);
    else porProveedor.set(key, [r]);
  }

  return Array.from(porProveedor.entries())
    .map(([proveedor, productos]) => ({
      proveedor,
      count: productos.length,
      sobrecostoTotal: productos.reduce((sum, p) => sum + (p.diferencia ?? 0), 0),
      productos: [...productos].sort((a, b) => (b.diferencia ?? 0) - (a.diferencia ?? 0)),
    }))
    .sort((a, b) => b.count - a.count);
}
