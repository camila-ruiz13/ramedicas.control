import "server-only";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

// Misma unidad "G:\" (Google Drive de escritorio de esta máquina) que usa
// descuentos-proveedores.ts, pero acá los archivos son de una carpeta
// distinta — Camila sube ahí ArticulosDetallado.xls + un LISTA N.xls por
// lista de precios, siempre con estos mismos nombres (2026-09-23).
const BASE_DIR = "G:\\Mi unidad\\SEGUIMIENTO Y CONTROL DE PRECIOS";
const ANALISIS_DIR = path.join(BASE_DIR, "ANÁLISIS LISTAS DE PRECIOS");
const ARTICULOS_FILE = path.join(ANALISIS_DIR, "ArticulosDetallado.xls");

// Camila pidió Lista 24 primero (es la referencia contra la que se mide la
// rentabilidad de las demás listas) y el resto en orden numérico ascendente
// (2026-09-23).
const LISTA_NUMBERS = [24, 1, 2, 3, 6, 7, 9] as const;
type ListaNumero = (typeof LISTA_NUMBERS)[number];

function findColIndex(headers: string[], variants: readonly string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const variant of variants) {
    const idx = lower.indexOf(variant.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

// El archivo de cada lista siempre se llama "LISTA <número>[ texto libre].xls"
// (ej. "LISTA 1.xls", "LISTA 24 CLIENTES POTENCIALES.xls") — se busca por
// número en vez de nombre completo porque el sufijo descriptivo puede
// cambiar. El límite (\D|$) evita que "LISTA 2" matchee "LISTA 24 ...".
function findListaFile(num: number): string {
  const files = fs
    .readdirSync(ANALISIS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".xls") && !name.startsWith("~$"));
  const re = new RegExp(`^LISTA\\s+${num}(\\D|$)`, "i");
  const match = files.find((name) => re.test(name.trim()));
  if (!match) throw new Error(`No se encontró el archivo de "LISTA ${num}" en ${ANALISIS_DIR}`);
  return path.join(ANALISIS_DIR, match);
}

function readSheetRows(filePath: string): unknown[][] {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

// ---------- ArticulosDetallado.xls ----------
// Fila 1 = título ("Artículos"), fila 2 vacía, encabezados en la fila 3,
// datos desde la fila 4.

const ARTICULOS_HEADER_ROW = 3; // 1-indexado
const ARTICULOS_HEADERS = {
  codigo: ["Código"],
  descripcion: ["Descripción"],
  nombreComercial: ["Nombre Comercial"],
  precioMaximo: ["Precio Máximo"],
  presentacion: ["Nombre presentación"],
  factorConversion: ["Factor de conversión"],
  costoReferencia1: ["Costo referencia 1"],
  costoReferencia2: ["Costo referencia 2"],
  descontinuadoCompra: ["Descontinuado para compra"],
  descontinuadoVenta: ["Descontinuado para venta"],
} as const;
type ArticuloKey = keyof typeof ARTICULOS_HEADERS;

type ArticuloBase = {
  codigo: string;
  descripcion: string;
  nombreComercial: string;
  presentacion: string;
  factorConversion: number;
  precioRegulacion: number | null;
  costoReferencia1: number | null;
  costoReferencia2: number | null;
  descontinuadoCompra: boolean;
  descontinuadoVenta: boolean;
};

function parseArticulosDetallado(): ArticuloBase[] {
  const rows = readSheetRows(ARTICULOS_FILE);
  const headers = (rows[ARTICULOS_HEADER_ROW - 1] ?? []).map((h) => String(h ?? "").trim());
  const col = {} as Record<ArticuloKey, number>;
  for (const key of Object.keys(ARTICULOS_HEADERS) as ArticuloKey[]) {
    col[key] = findColIndex(headers, ARTICULOS_HEADERS[key]);
  }

  const result: ArticuloBase[] = [];
  for (let r = ARTICULOS_HEADER_ROW; r < rows.length; r++) {
    const row = rows[r];
    const codigo = String(row[col.codigo] ?? "").trim();
    if (!codigo) continue;

    const factorConversion = toNumber(row[col.factorConversion]) ?? 1;
    const precioMaximo = toNumber(row[col.precioMaximo]);
    const costoRef1 = toNumber(row[col.costoReferencia1]);
    const costoRef2 = toNumber(row[col.costoReferencia2]);

    result.push({
      codigo,
      descripcion: String(row[col.descripcion] ?? "").trim(),
      nombreComercial: String(row[col.nombreComercial] ?? "").trim(),
      presentacion: String(row[col.presentacion] ?? "").trim(),
      factorConversion,
      // "Precio Máximo" (AN) y "Costo referencia 2" (BP) vienen en unidad —
      // se multiplican por el factor de conversión para llevarlos a
      // presentación, que es en lo que están expresados los precios de cada
      // lista. "Costo referencia 1" (BO) ya viene en presentación, no se toca
      // (a pedido de Camila, 2026-09-23).
      precioRegulacion: precioMaximo !== null ? precioMaximo * factorConversion : null,
      costoReferencia1: costoRef1,
      costoReferencia2: costoRef2 !== null ? costoRef2 * factorConversion : null,
      descontinuadoCompra: String(row[col.descontinuadoCompra] ?? "").trim().toUpperCase() === "S",
      descontinuadoVenta: String(row[col.descontinuadoVenta] ?? "").trim().toUpperCase() === "S",
    });
  }
  return result;
}

// ---------- LISTA N.xls ----------
// Fila 1 = título ("Listado de artículos"), filas 2-3 vacías, encabezados en
// la fila 4, datos desde la fila 5.

const LISTA_HEADER_ROW = 4; // 1-indexado
const LISTA_HEADERS = {
  codigo: ["Código"],
  // OJO: "Precio Ventas con IVA" NO es el precio por presentación — trae el
  // total del embalaje completo (precio × cantidad de la columna
  // "Pastillas"). Confirmado con Camila (2026-09-23) y verificado contra los
  // datos crudos: ej. AB0003 en Lista 24 tiene embalaje 50 y esa columna
  // trae 50× el precio real. El precio por presentación (sin multiplicar
  // por el embalaje) es "Precios Ventas antes de IVA" + "Valor IVA".
  precioAntesIva: ["Precios Ventas antes de IVA"],
  valorIva: ["Valor IVA"],
} as const;
type ListaKey = keyof typeof LISTA_HEADERS;

function parseListaPrecios(num: ListaNumero): Map<string, number> {
  const rows = readSheetRows(findListaFile(num));
  const headers = (rows[LISTA_HEADER_ROW - 1] ?? []).map((h) => String(h ?? "").trim());
  const col = {} as Record<ListaKey, number>;
  for (const key of Object.keys(LISTA_HEADERS) as ListaKey[]) {
    col[key] = findColIndex(headers, LISTA_HEADERS[key]);
  }

  const map = new Map<string, number>();
  for (let r = LISTA_HEADER_ROW; r < rows.length; r++) {
    const row = rows[r];
    const codigo = String(row[col.codigo] ?? "").trim();
    if (!codigo) continue;
    const antesIva = toNumber(row[col.precioAntesIva]);
    if (antesIva === null) continue;
    const precio = antesIva + (toNumber(row[col.valorIva]) ?? 0);
    map.set(codigo, precio);
  }
  return map;
}

// ---------- Tabla combinada ----------

export type AnalisisPrecioRow = ArticuloBase & {
  lista24: number | null;
  pctLista24: number | null;
  lista1: number | null;
  pctLista1: number | null;
  lista2: number | null;
  pctLista2: number | null;
  lista3: number | null;
  pctLista3: number | null;
  lista6: number | null;
  pctLista6: number | null;
  lista7: number | null;
  pctLista7: number | null;
  lista9: number | null;
  pctLista9: number | null;
};

// (precio - referencia) / precio × 100 — sirve tanto para la rentabilidad de
// Lista 24 contra el costo como para la de las demás listas contra Lista 24,
// misma forma de fórmula (confirmado con Camila, 2026-09-23).
function pctSobrePrecio(precio: number | null, referencia: number | null): number | null {
  if (precio === null || referencia === null || precio === 0) return null;
  return ((precio - referencia) / precio) * 100;
}

async function fetchAnalisisPreciosRaw(): Promise<AnalisisPrecioRow[]> {
  const articulos = parseArticulosDetallado();
  const listaMaps = new Map<ListaNumero, Map<string, number>>();
  for (const num of LISTA_NUMBERS) listaMaps.set(num, parseListaPrecios(num));

  return articulos.map((a) => {
    const precios = {} as Record<ListaNumero, number | null>;
    for (const num of LISTA_NUMBERS) {
      precios[num] = listaMaps.get(num)!.get(a.codigo) ?? null;
    }
    const lista24 = precios[24];

    return {
      ...a,
      lista24,
      pctLista24: pctSobrePrecio(lista24, a.costoReferencia2),
      lista1: precios[1],
      pctLista1: pctSobrePrecio(precios[1], lista24),
      lista2: precios[2],
      pctLista2: pctSobrePrecio(precios[2], lista24),
      lista3: precios[3],
      pctLista3: pctSobrePrecio(precios[3], lista24),
      lista6: precios[6],
      pctLista6: pctSobrePrecio(precios[6], lista24),
      lista7: precios[7],
      pctLista7: pctSobrePrecio(precios[7], lista24),
      lista9: precios[9],
      pctLista9: pctSobrePrecio(precios[9], lista24),
    };
  });
}

// ---------- Alertas ----------
// Dos condiciones que Camila pidió resaltar (2026-09-23): una lista vendiendo
// por encima del precio regulado, o por debajo del costo de referencia 2.
// Mismo predicado se usa tanto para la tabla principal (resaltar la celda en
// rojo) como para las dos listas de alertas debajo de la tabla.

function listasDeFila(r: AnalisisPrecioRow): { n: ListaNumero; precio: number | null }[] {
  return LISTA_NUMBERS.map((n) => ({ n, precio: r[`lista${n}` as keyof AnalisisPrecioRow] as number | null }));
}

// precioRegulacion === 0 significa "no regulado" (la mayoría del portafolio),
// no "regulado a $0" — solo se evalúa cuando hay un precio regulado real.
export function esSobrePrecioRegulado(row: AnalisisPrecioRow, precioLista: number | null): boolean {
  return (
    precioLista !== null &&
    row.precioRegulacion !== null &&
    row.precioRegulacion > 0 &&
    precioLista > row.precioRegulacion
  );
}

export function esBajoCostoReferencia2(row: AnalisisPrecioRow, precioLista: number | null): boolean {
  return precioLista !== null && row.costoReferencia2 !== null && precioLista < row.costoReferencia2;
}

export type AlertaPrecioRow = {
  codigo: string;
  descripcion: string;
  nombreComercial: string;
  lista: number;
  precioLista: number;
  referencia: number;
  diferencia: number;
};

export function computeAlertasSobrePrecioRegulado(rows: AnalisisPrecioRow[]): AlertaPrecioRow[] {
  const out: AlertaPrecioRow[] = [];
  for (const r of rows) {
    if (r.precioRegulacion === null || r.precioRegulacion <= 0) continue;
    for (const { n, precio } of listasDeFila(r)) {
      if (!esSobrePrecioRegulado(r, precio)) continue;
      out.push({
        codigo: r.codigo,
        descripcion: r.descripcion,
        nombreComercial: r.nombreComercial,
        lista: n,
        precioLista: precio!,
        referencia: r.precioRegulacion,
        diferencia: precio! - r.precioRegulacion,
      });
    }
  }
  return out;
}

export function computeAlertasBajoCostoReferencia2(rows: AnalisisPrecioRow[]): AlertaPrecioRow[] {
  const out: AlertaPrecioRow[] = [];
  for (const r of rows) {
    if (r.costoReferencia2 === null) continue;
    for (const { n, precio } of listasDeFila(r)) {
      if (!esBajoCostoReferencia2(r, precio)) continue;
      out.push({
        codigo: r.codigo,
        descripcion: r.descripcion,
        nombreComercial: r.nombreComercial,
        lista: n,
        precioLista: precio!,
        referencia: r.costoReferencia2,
        diferencia: precio! - r.costoReferencia2,
      });
    }
  }
  return out;
}

// Dos alertas más de "datos faltantes" (2026-09-23): códigos activos (ni
// descontinuados para compra ni para venta — si ya está descontinuado, que
// falten estos datos no es una alerta) que no tienen con qué calcular algo.
export type AlertaSinDatoRow = {
  codigo: string;
  descripcion: string;
  nombreComercial: string;
};

function esActivo(r: AnalisisPrecioRow): boolean {
  return !r.descontinuadoCompra && !r.descontinuadoVenta;
}

export function computeAlertaSinCostoReferencia(rows: AnalisisPrecioRow[]): AlertaSinDatoRow[] {
  return rows
    .filter((r) => esActivo(r) && r.costoReferencia1 === null && r.costoReferencia2 === null)
    .map(({ codigo, descripcion, nombreComercial }) => ({ codigo, descripcion, nombreComercial }));
}

// Corregido (2026-09-23): no es "sin precio en las 7 listas" sino una fila
// por cada lista puntual en la que falte el precio — Camila quiere ver en
// cuál lista específica falta, no solo si falta en todas.
export type AlertaListaFaltanteRow = {
  codigo: string;
  descripcion: string;
  nombreComercial: string;
  lista: number;
};

export function computeAlertasListaFaltante(rows: AnalisisPrecioRow[]): AlertaListaFaltanteRow[] {
  const out: AlertaListaFaltanteRow[] = [];
  for (const r of rows) {
    if (!esActivo(r)) continue;
    for (const { n, precio } of listasDeFila(r)) {
      if (precio === null) {
        out.push({ codigo: r.codigo, descripcion: r.descripcion, nombreComercial: r.nombreComercial, lista: n });
      }
    }
  }
  return out;
}

// ---------- Filtros ----------
// A pedido de Camila (2026-09-23): "Descontinuado para compra" y
// "Descontinuado para venta" son dos columnas independientes de
// ArticulosDetallado (S = descontinuado, N = activo) — se filtran por
// separado, no como una sola condición combinada.

export function applyDescontinuadoCompraFilter(rows: AnalisisPrecioRow[], value?: string): AnalisisPrecioRow[] {
  if (value === "SI") return rows.filter((r) => r.descontinuadoCompra);
  if (value === "NO") return rows.filter((r) => !r.descontinuadoCompra);
  return rows;
}

export function applyDescontinuadoVentaFilter(rows: AnalisisPrecioRow[], value?: string): AnalisisPrecioRow[] {
  if (value === "SI") return rows.filter((r) => r.descontinuadoVenta);
  if (value === "NO") return rows.filter((r) => !r.descontinuadoVenta);
  return rows;
}

// Leer los 8 archivos .xls toma varios segundos (el detallado solo ya son
// ~7s) — se cachea en memoria como precios-regulados.ts, con botón
// "Actualizar" manual en vez de releer en cada request.
let cache: { data: AnalisisPrecioRow[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getAnalisisPrecios(): Promise<AnalisisPrecioRow[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  const data = await fetchAnalisisPreciosRaw();
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export function invalidateAnalisisPreciosCache(): void {
  cache = null;
}

export const ANALISIS_PRECIOS_LISTA_NUMBERS = LISTA_NUMBERS;
