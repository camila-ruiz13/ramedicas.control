import "server-only";
import { unstable_cache } from "next/cache";
import { getSheetValues } from "./google-sheets";
import {
  type CambioPrecioRow,
  parseFechaCell,
  parseNumeroCO,
  calcularVariacionPct,
  esAumento,
  esDisminucion,
  esRealizado,
  displayFecha,
} from "./cambios-precios-constants";

// Ported from the "Cambios_Precios" Google Apps Script dashboard —
// same spreadsheet tab, same column layout.
const SPREADSHEET_ID = "1NQmxYsIisJjuSkaoee41bBb16Xmgxqbr_j40X-3c1ak";
const SHEET_NAME = "Cambios_Precios";

const HEADER_VARIANTS = {
  fecha: ["Fecha"],
  codigo: ["Codigo", "Código"],
  cur: ["CUR"],
  nombre: ["Nombre"],
  proveedor: ["Proveedor"],
  condicion: ["CONDICION", "Condición", "Condicion"],
  anterior: ["Anterior"],
  nuevo: ["Nuevo"],
  listasDePrecios: ["LISTAS DE PRECIOS"],
  variacionReportada: ["VARIACION REPORTADA", "VARIACIÓN REPORTADA"],
  observacion: ["Observación", "Observacion"],
} as const;

type ColKey = keyof typeof HEADER_VARIANTS;

function findColIndex(headers: string[], variants: readonly string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const variant of variants) {
    const idx = lower.indexOf(variant.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

async function fetchCambiosPreciosRaw(): Promise<CambioPrecioRow[]> {
  const values = await getSheetValues(SPREADSHEET_ID, SHEET_NAME, "FORMATTED_VALUE");
  if (values.length < 2) return [];

  const headers = values[0].map((h) => String(h).trim());
  const col = {} as Record<ColKey, number>;
  for (const key of Object.keys(HEADER_VARIANTS) as ColKey[]) {
    col[key] = findColIndex(headers, HEADER_VARIANTS[key]);
  }

  const rows: CambioPrecioRow[] = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    // Same skip rule as the original: blank if the first two columns are both empty.
    if (!row || (!row[0] && !row[1])) continue;

    const anteriorRaw = col.anterior !== -1 ? String(row[col.anterior] ?? "") : "";
    const nuevoRaw = col.nuevo !== -1 ? String(row[col.nuevo] ?? "") : "";
    const variacionReportadaRaw =
      col.variacionReportada !== -1 ? String(row[col.variacionReportada] ?? "") : "";

    const anterior = parseNumeroCO(anteriorRaw);
    const nuevo = parseNumeroCO(nuevoRaw);
    const variacionReportada = parseNumeroCO(variacionReportadaRaw);
    const condicion =
      (col.condicion !== -1 ? String(row[col.condicion] ?? "").trim() : "") || "Sin definir";
    const listaRaw = col.listasDePrecios !== -1 ? String(row[col.listasDePrecios] ?? "").trim() : "";

    rows.push({
      fecha: col.fecha !== -1 ? parseFechaCell(row[col.fecha]) : "",
      codigo: col.codigo !== -1 ? String(row[col.codigo] ?? "").trim() : "",
      cur: col.cur !== -1 ? String(row[col.cur] ?? "").trim() : "",
      nombre: col.nombre !== -1 ? String(row[col.nombre] ?? "").trim() : "",
      proveedor: col.proveedor !== -1 ? String(row[col.proveedor] ?? "").trim() : "",
      condicion,
      anteriorRaw,
      nuevoRaw,
      anterior,
      nuevo,
      variacionReportadaRaw,
      variacionPct: calcularVariacionPct(anterior, nuevo, variacionReportada),
      listaRaw,
      realizado: esRealizado(listaRaw),
      observacion: col.observacion !== -1 ? String(row[col.observacion] ?? "").trim() : "",
    });
  }
  return rows;
}

// The sheet only changes when compras registra un cambio de precio — cached
// 5 min so the dashboard doesn't hit the Sheets API on every page view/filter,
// with a manual "Actualizar" button (see actions.ts) for a fresh pull.
export const CAMBIOS_PRECIOS_CACHE_TAG = "cambios-precios";

export const getCambiosPrecios = unstable_cache(
  fetchCambiosPreciosRaw,
  ["cambios-precios-all"],
  { tags: [CAMBIOS_PRECIOS_CACHE_TAG], revalidate: 300 },
);

// ---------- Filtering (two stages, mirrors the original dashboard) ----------

export type CambiosPreciosFilters = {
  condicion?: string;
  proveedor?: string;
  lista?: "realizado" | "pendiente" | "";
  desde?: string; // ISO yyyy-MM-dd
  hasta?: string;
};

// Respects proveedor/lista/fecha but NOT condición — used to build the
// condición cards themselves (so picking one condición doesn't hide the
// others from the card row).
export function applyBaseFilters(
  rows: CambioPrecioRow[],
  f: CambiosPreciosFilters,
): CambioPrecioRow[] {
  return rows.filter((r) => {
    if (f.proveedor && r.proveedor !== f.proveedor) return false;
    if (f.lista === "realizado" && !r.realizado) return false;
    if (f.lista === "pendiente" && r.realizado) return false;
    if (f.desde && (!r.fecha || r.fecha < f.desde)) return false;
    if (f.hasta && (!r.fecha || r.fecha > f.hasta)) return false;
    return true;
  });
}

export function applyCondicionFilter(rows: CambioPrecioRow[], condicion?: string): CambioPrecioRow[] {
  if (!condicion) return rows;
  return rows.filter((r) => r.condicion === condicion);
}

// ---------- Aggregations ----------

export function computeKpisGlobales(rows: CambioPrecioRow[]) {
  const proveedores = new Set<string>();
  let aumentos = 0;
  let disminuciones = 0;
  let sumaVar = 0;
  let cuentaVar = 0;
  for (const r of rows) {
    if (r.proveedor) proveedores.add(r.proveedor);
    const aum = esAumento(r.condicion);
    const dis = esDisminucion(r.condicion);
    if (aum) aumentos++;
    if (dis) disminuciones++;
    if ((aum || dis) && r.variacionPct !== null) {
      sumaVar += r.variacionPct;
      cuentaVar++;
    }
  }
  return {
    total: rows.length,
    proveedores: proveedores.size,
    aumentos,
    disminuciones,
    variacionPromedio: cuentaVar ? sumaVar / cuentaVar : null,
  };
}

export function computeProgreso(rows: CambioPrecioRow[]) {
  let realizado = 0;
  for (const r of rows) if (r.realizado) realizado++;
  const total = rows.length;
  return {
    realizado,
    pendiente: total - realizado,
    pct: total ? Math.round((realizado / total) * 100) : 0,
  };
}

export type CondicionCount = { condicion: string; count: number };

export function computeCondicionCounts(rows: CambioPrecioRow[]): CondicionCount[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.condicion, (map.get(r.condicion) ?? 0) + 1);
  return [...map.entries()]
    .map(([condicion, count]) => ({ condicion, count }))
    .sort((a, b) => b.count - a.count);
}

export type ProviderCount = { proveedor: string; count: number };

export function computeProviderCounts(rows: CambioPrecioRow[], limit = 10): ProviderCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const p = r.proveedor || "Sin proveedor";
    map.set(p, (map.get(p) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([proveedor, count]) => ({ proveedor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ---------- CSV export ----------

const CSV_HEADERS = [
  "Fecha",
  "Codigo",
  "CUR",
  "Nombre",
  "Proveedor",
  "CONDICION",
  "Anterior",
  "Nuevo",
  "LISTAS DE PRECIOS",
  "VARIACION REPORTADA",
  "Observación",
];

function csvEscape(v: string): string {
  const s = v.replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export function buildCsv(rows: CambioPrecioRow[]): string {
  const lines = [CSV_HEADERS.map(csvEscape).join(",")];
  for (const r of rows) {
    lines.push(
      [
        displayFecha(r.fecha),
        r.codigo,
        r.cur,
        r.nombre,
        r.proveedor,
        r.condicion,
        r.anteriorRaw,
        r.nuevoRaw,
        r.listaRaw,
        r.variacionReportadaRaw,
        r.observacion,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  // Leading BOM so Excel opens the UTF-8 file with accents intact.
  return "﻿" + lines.join("\n");
}
