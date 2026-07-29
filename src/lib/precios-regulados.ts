import "server-only";
import { getSheetValues } from "./google-sheets";
import { parseNumeroCO } from "./cambios-precios-constants";
import {
  type PrecioReguladoRow,
  type CambioRegulacion,
  type PortafolioVsCircular,
  type CambioCount,
  type PortafolioCount,
  CAMBIO_ORDER,
  PORTAFOLIO_ORDER,
  normalizar,
  normalizarCambio,
  normalizarPortafolio,
} from "./precios-regulados-constants";

// Hoja "Validación" compartida por Camila — cruce entre el portafolio
// completo de proveedores y la circular de regulación de precios (19 vs 22).
// El spreadsheet tiene varias pestañas, así que a diferencia de
// prorroga-proveedores acá sí hace falta apuntar al nombre exacto en vez de
// tomar titles[0].
const SPREADSHEET_ID = "1A63G0Yg7iIKiYtA6Lipe9Tsnzl_5dsD1DtIAm8uPznk";
const SHEET_NAME = "VALIDACIÓN";

// La hoja ha cambiado de estructura varias veces (nombre de pestaña,
// columnas insertadas/movidas) — en vez de hardcodear posiciones por letra
// como antes, se busca cada columna por su encabezado (fila 1), igual que
// cambios-precios.ts. Mientras el texto del encabezado no cambie, el orden
// de las columnas puede moverse sin romper esto.
const HEADER_VARIANTS = {
  codigo: ["Código", "Codigo"],
  nombreComercial: ["Nombre Comercial"],
  laboratorio: ["Laboratorio"],
  proveedor: ["Proveedor"],
  principioActivo: ["Principio Activo"],
  // A pedido de Camila (2026-07-29): ya no hay una columna de precio de
  // circular 19 dedicada — "PRECIO MÁX EMB" se usa en su lugar para esa
  // columna de la pestaña Circular 19 vs 22.
  precioCircular19: ["PRECIO MÁX EMB", "PRECIO MAX EMB"],
  costo: ["Precio portafolio"],
  // Camila eligió explícitamente "emb" (empaque) sobre "und" (unidad) para
  // todas las comparaciones contra circular 22.
  circular22: ["Circular 22 emb"],
  cambioRegulacion: ["Cambio regulación 19 vs 22", "Cambio regulacion 19 vs 22"],
  portafolioVsCircular: ["Portafolio vs circular 22"],
} as const;

type ColKey = keyof typeof HEADER_VARIANTS;

function findColIndex(headers: string[], variants: readonly string[]): number {
  const norm = headers.map(normalizar);
  for (const variant of variants) {
    const idx = norm.indexOf(normalizar(variant));
    if (idx !== -1) return idx;
  }
  return -1;
}

type FetchResult = {
  rows: PrecioReguladoRow[];
  totalPortafolio: number;
};

async function fetchPreciosReguladosRaw(): Promise<FetchResult> {
  const values = await getSheetValues(SPREADSHEET_ID, SHEET_NAME, "FORMATTED_VALUE");
  // Fila 1 = fila de agrupación con celdas combinadas (ej. "MANTIS FICC
  // ARTÍCULOS", "ARCHIVO CIRCULAR 19 TÉCNICA") — los encabezados reales de
  // columna están en la fila 2, y los datos arrancan en la fila 3.
  if (values.length < 3) return { rows: [], totalPortafolio: 0 };

  const headers = (values[1] ?? []).map((h) => String(h ?? "").trim());
  const col = {} as Record<ColKey, number>;
  for (const key of Object.keys(HEADER_VARIANTS) as ColKey[]) {
    col[key] = findColIndex(headers, HEADER_VARIANTS[key]);
  }

  const rows: PrecioReguladoRow[] = [];
  let totalPortafolio = 0;
  for (let r = 2; r < values.length; r++) {
    const row = values[r] ?? [];
    const codigo = String(row[col.codigo] ?? "").trim();
    if (!codigo) continue;
    totalPortafolio++;

    // Solo nos interesan los productos que la circular 22 realmente evaluó
    // (columna "Cambio regulación 19 vs 22" con dato) — el resto del
    // portafolio no tiene comparación.
    const cambioRaw = String(row[col.cambioRegulacion] ?? "").trim();
    if (!cambioRaw) continue;

    const costo = parseNumeroCO(row[col.costo] as string);

    // Dos comparaciones independientes, cada una con su propio par de
    // columnas de precio y su propia columna de resultado — no se deben
    // mezclar en una sola: (1) circular 19 [PRECIO MÁX EMB] vs circular 22
    // [Circular 22 emb], con resultado en "Cambio regulación 19 vs 22"; (2)
    // portafolio [Precio portafolio] vs circular 22, con resultado en
    // "Portafolio vs circular 22".
    const circular19Raw = String(row[col.precioCircular19] ?? "").trim();
    const precioCircular19 = circular19Raw.includes("$") ? parseNumeroCO(circular19Raw) : null;
    const circular19Comentario = precioCircular19 === null && circular19Raw ? circular19Raw : null;

    // La columna "Circular 22 emb" a veces no trae un precio sino un
    // comentario de la hoja (ej. "CONTINUA CON EL MISMO VALOR DE LA 19"
    // cuando no hubo cambio) — solo se interpreta como precio si el texto
    // trae "$", para no extraerle un número al comentario (p.ej. el "19" de
    // "...DE LA 19").
    const circular22Raw = String(row[col.circular22] ?? "").trim();
    const precioCircular22 = circular22Raw.includes("$") ? parseNumeroCO(circular22Raw) : null;
    const circular22Comentario = precioCircular22 === null && circular22Raw ? circular22Raw : null;

    // Cuando "Portafolio vs circular 22" viene vacía (p.ej. hay precio de
    // portafolio pero no de circular 22), Camila pidió mostrar ahí lo que
    // diga "Cambio regulación 19 vs 22" en vez de inventar una categoría —
    // así que ese es el fallback, no un default fijo.
    const portafolioRaw = String(row[col.portafolioVsCircular] ?? "").trim() || cambioRaw;

    rows.push({
      codigo,
      proveedor: String(row[col.proveedor] ?? "").trim(),
      nombreComercial: String(row[col.nombreComercial] ?? "").trim(),
      principioActivo: String(row[col.principioActivo] ?? "").trim(),
      laboratorio: String(row[col.laboratorio] ?? "").trim(),
      costo,
      precioCircular19,
      circular19Comentario,
      precioCircular22,
      circular22Comentario,
      diferencia: costo !== null && precioCircular22 !== null ? costo - precioCircular22 : null,
      diferenciaCircular:
        precioCircular19 !== null && precioCircular22 !== null ? precioCircular22 - precioCircular19 : null,
      cambioRegulacion: normalizarCambio(cambioRaw),
      cambioRegulacionRaw: cambioRaw,
      portafolioVsCircular: normalizarPortafolio(portafolioRaw),
      portafolioVsCircularRaw: portafolioRaw,
    });
  }
  return { rows, totalPortafolio };
}

// La hoja se actualiza cuando Camila registra una nueva circular — cacheado
// 5 min igual que los demás módulos Sheets-backed, con botón "Actualizar"
// manual. No se puede usar unstable_cache acá (como en los demás módulos
// Sheets-backed) porque la hoja "VALIDACIÓN" pasó de ~3.200 a ~11.450 filas
// y el resultado cacheado (~7MB) supera el límite de 2MB por entrada del
// data cache de Next.js — unstable_cache falla silenciosamente y la página
// queda sin datos. Se usa un caché en memoria del proceso en su lugar, sin
// ese límite de tamaño.
let cache: { data: FetchResult; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getPreciosRegulados(): Promise<FetchResult> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  const data = await fetchPreciosReguladosRaw();
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export function invalidatePreciosReguladosCache(): void {
  cache = null;
}

// ---------- Filtros ----------

// Filtro de primer nivel (Todos/Regulados/No regulados), a pedido de Camila:
// "los que digan NO ES REGULADO EN LA CIRCULAR 22 serían los NO REGULADO, y
// si tiene otro concepto es porque es regulado" — es decir, no regulado es
// únicamente esa categoría explícita, cualquier otro valor (incluido
// "Validar" u "Otro") cuenta como regulado.
export const NO_REGULADO_CAMBIO: CambioRegulacion[] = ["NO_REGULADO_C22", "NO_REGULADO_C19"];
export const NO_REGULADO_PORTAFOLIO: PortafolioVsCircular[] = ["NO_REGULADO_C22"];

export function applyReguladoCambioFilter(rows: PrecioReguladoRow[], regulado?: string): PrecioReguladoRow[] {
  if (regulado === "SI") return rows.filter((r) => !NO_REGULADO_CAMBIO.includes(r.cambioRegulacion));
  if (regulado === "NO") return rows.filter((r) => NO_REGULADO_CAMBIO.includes(r.cambioRegulacion));
  return rows;
}

export function applyReguladoPortafolioFilter(rows: PrecioReguladoRow[], regulado?: string): PrecioReguladoRow[] {
  if (regulado === "SI") return rows.filter((r) => !NO_REGULADO_PORTAFOLIO.includes(r.portafolioVsCircular));
  if (regulado === "NO") return rows.filter((r) => NO_REGULADO_PORTAFOLIO.includes(r.portafolioVsCircular));
  return rows;
}

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

// Ranking de proveedores por cantidad de productos — se le pasan las filas
// ya filtradas por el filtro activo de la página (ver
// portafolio-vs-circular/page.tsx), así que el ranking cambia con cada
// filtro seleccionado en vez de quedar fijo en "por encima".
export function computeProveedoresPorEncima(rows: PrecioReguladoRow[]): ProveedorPorEncima[] {
  const porProveedor = new Map<string, PrecioReguladoRow[]>();
  for (const r of rows) {
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

export type ProveedorPorSubio = {
  proveedor: string;
  count: number;
  incrementoTotal: number;
  productos: PrecioReguladoRow[];
};

// Mismo ranking que computeProveedoresPorEncima pero para la otra pestaña
// (Circular 19 vs 22) — también recibe las filas ya filtradas por el filtro
// activo de la página, en vez de quedar fijo en "subió".
export function computeProveedoresPorSubio(rows: PrecioReguladoRow[]): ProveedorPorSubio[] {
  const porProveedor = new Map<string, PrecioReguladoRow[]>();
  for (const r of rows) {
    const key = r.proveedor || "Sin proveedor";
    const list = porProveedor.get(key);
    if (list) list.push(r);
    else porProveedor.set(key, [r]);
  }

  return Array.from(porProveedor.entries())
    .map(([proveedor, productos]) => ({
      proveedor,
      count: productos.length,
      incrementoTotal: productos.reduce((sum, p) => sum + (p.diferenciaCircular ?? 0), 0),
      productos: [...productos].sort((a, b) => (b.diferenciaCircular ?? 0) - (a.diferenciaCircular ?? 0)),
    }))
    .sort((a, b) => b.count - a.count);
}
