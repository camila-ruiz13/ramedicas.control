import "server-only";
import { unstable_cache } from "next/cache";
import { getSheetValues } from "./google-sheets";
import type { AutorizacionRow, Variacion } from "./autorizacion-compras-constants";

// Ported from the "AUTORIZACIÓN COMPRAS" Google Apps Script dashboard
// (Code.gs / obtenerDatosAutorizaciones) — same spreadsheet, same sheet
// tab, same "Precio Por Portafolio" filter and cost math.
const SPREADSHEET_ID = "1T_qr_haKsyhD1YvViIWvgqdE5O8yWRsQxRuLni0v0AE";
const SHEET_NAME = "REPORTE AUTORIZACIÓN";
const CONCEPTO_FILTRO = "Precio Por Portafolio";

const HEADER_VARIANTS = {
  nroFactura: ["Nro Factura"],
  fechaFactura: ["Fecha Factura"],
  codArticulo: ["Cod Artículo", "Cod Articulo", "Código Artículo"],
  nombreArticulo: ["Nombre Artículo", "Nombre Articulo"],
  unidadesLegacy: ["Total Unidades", "Unidades"],
  costoUnit: ["Costo"],
  costoListaUnit: ["Costo Lista"],
  concepto: ["Concepto"],
  fecha: ["Fecha"],
  usuario: ["Usuario"],
  observacion: ["Observación", "Observacion"],
  proveedor: ["Proveedor"],
  variacionCol: ["Variación", "Variacion"],
  totalPorEmpaque: ["Total por empaque", "Total Por Empaque"],
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

// Google Sheets serial day 0 = 1899-12-30; 25569 is the day-count offset to
// the Unix epoch (1970-01-01). Treating the result as UTC avoids the
// timezone off-by-one that comes from running .setHours()/local getters
// on a date with no inherent timezone of its own.
function excelSerialToISODate(serial: number): string {
  const ms = Math.round((serial - 25569) * 86_400_000);
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatFechaCell(raw: unknown): string {
  if (typeof raw === "number") return excelSerialToISODate(raw);
  return String(raw ?? "").trim();
}

function toNumber(raw: unknown): number {
  return Number(raw) || 0;
}

async function fetchAutorizacionesRaw(): Promise<AutorizacionRow[]> {
  const values = await getSheetValues(SPREADSHEET_ID, SHEET_NAME);
  if (values.length < 2) return [];

  const headers = values[0].map((h) => String(h).trim());
  const col = {} as Record<ColKey, number>;
  for (const key of Object.keys(HEADER_VARIANTS) as ColKey[]) {
    col[key] = findColIndex(headers, HEADER_VARIANTS[key]);
  }

  const rows: AutorizacionRow[] = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row || row.join("") === "") continue;

    if (CONCEPTO_FILTRO && col.concepto !== -1) {
      const concepto = String(row[col.concepto] ?? "").trim();
      if (concepto !== CONCEPTO_FILTRO) continue;
    }

    const costoUnit = col.costoUnit !== -1 ? toNumber(row[col.costoUnit]) : 0;
    const costoListaUnit = col.costoListaUnit !== -1 ? toNumber(row[col.costoListaUnit]) : 0;
    const totalPorEmpaque = col.totalPorEmpaque !== -1 ? toNumber(row[col.totalPorEmpaque]) : 0;
    const unidadesLegacy = col.unidadesLegacy !== -1 ? toNumber(row[col.unidadesLegacy]) : 0;

    const usaEmpaque = totalPorEmpaque > 0;
    const unidades = usaEmpaque ? totalPorEmpaque : unidadesLegacy;
    const costo = usaEmpaque ? costoUnit * totalPorEmpaque : costoUnit;
    const costoLista = usaEmpaque ? costoListaUnit * totalPorEmpaque : costoListaUnit;
    const difValor = costo - costoLista;
    const difPct = costoLista !== 0 ? (difValor / costoLista) * 100 : 0;

    const variacionRaw =
      col.variacionCol !== -1 ? String(row[col.variacionCol] ?? "").trim().toUpperCase() : "";
    const variacion: Variacion =
      variacionRaw === "POR ENCIMA" || variacionRaw === "POR DEBAJO"
        ? variacionRaw
        : difValor >= 0
          ? "POR ENCIMA"
          : "POR DEBAJO";

    rows.push({
      nroFactura: col.nroFactura !== -1 ? String(row[col.nroFactura] ?? "") : "",
      fechaFactura: col.fechaFactura !== -1 ? formatFechaCell(row[col.fechaFactura]) : "",
      fechaAutorizacion: col.fecha !== -1 ? formatFechaCell(row[col.fecha]) : "",
      codArticulo: col.codArticulo !== -1 ? String(row[col.codArticulo] ?? "") : "",
      nombreArticulo: col.nombreArticulo !== -1 ? String(row[col.nombreArticulo] ?? "") : "",
      unidades,
      costo,
      costoLista,
      difValor,
      difPct,
      variacion,
      proveedor:
        col.proveedor !== -1 ? String(row[col.proveedor] ?? "").trim() || "Sin proveedor" : "Sin proveedor",
      usuario: col.usuario !== -1 ? String(row[col.usuario] ?? "") : "",
      observacion: col.observacion !== -1 ? String(row[col.observacion] ?? "") : "",
    });
  }

  return rows;
}

// The sheet only changes when someone authorizes a new purchase from the
// spreadsheet itself — cached for 5 min so the dashboard doesn't hit the
// Sheets API on every page view/filter/sort, with a manual "Actualizar"
// button (see actions.ts) for whoever needs the latest row right now.
export const AUTORIZACIONES_CACHE_TAG = "autorizacion-compras";

export const getAutorizaciones = unstable_cache(
  fetchAutorizacionesRaw,
  ["autorizacion-compras-all"],
  { tags: [AUTORIZACIONES_CACHE_TAG], revalidate: 300 },
);

// ---------- Aggregations (ported from Dashboard.html's render* functions) ----------

export function computeKpis(rows: AutorizacionRow[]) {
  if (rows.length === 0) {
    return {
      count: 0,
      totalCosto: 0,
      totalLista: 0,
      totalDif: 0,
      porEncima: 0,
      porDebajo: 0,
      avgPct: 0,
      proveedoresActivos: 0,
    };
  }
  const totalCosto = rows.reduce((s, d) => s + d.costo, 0);
  const totalLista = rows.reduce((s, d) => s + d.costoLista, 0);
  const porEncima = rows.filter((d) => d.variacion === "POR ENCIMA").length;
  const porDebajo = rows.filter((d) => d.variacion === "POR DEBAJO").length;
  const avgPct = rows.reduce((s, d) => s + d.difPct, 0) / rows.length;
  const proveedoresActivos = new Set(rows.map((d) => d.proveedor)).size;

  return {
    count: rows.length,
    totalCosto,
    totalLista,
    totalDif: totalCosto - totalLista,
    porEncima,
    porDebajo,
    avgPct,
    proveedoresActivos,
  };
}

export type TrendPoint = { fecha: string; count: number; valor: number };

export function computeTrend(rows: AutorizacionRow[]): TrendPoint[] {
  const byDate = new Map<string, TrendPoint>();
  for (const d of rows) {
    if (!d.fechaFactura) continue;
    const existing = byDate.get(d.fechaFactura) ?? { fecha: d.fechaFactura, count: 0, valor: 0 };
    existing.count++;
    existing.valor += Math.abs(d.difValor);
    byDate.set(d.fechaFactura, existing);
  }
  // fechaFactura is stored as ISO "yyyy-MM-dd" so a plain string sort is
  // already chronological.
  return [...byDate.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export type ProviderRanking = {
  proveedor: string;
  ahorro: number;
  sobrecosto: number;
  neto: number;
  count: number;
};

export function computeProviderRanking(rows: AutorizacionRow[]): ProviderRanking[] {
  const byProv = new Map<string, ProviderRanking>();
  for (const d of rows) {
    const entry = byProv.get(d.proveedor) ?? {
      proveedor: d.proveedor,
      ahorro: 0,
      sobrecosto: 0,
      neto: 0,
      count: 0,
    };
    if (d.difValor < 0) entry.ahorro += Math.abs(d.difValor);
    else entry.sobrecosto += d.difValor;
    entry.count++;
    byProv.set(d.proveedor, entry);
  }
  const list = [...byProv.values()].map((r) => ({ ...r, neto: r.sobrecosto - r.ahorro }));
  list.sort((a, b) => b.ahorro + b.sobrecosto - (a.ahorro + a.sobrecosto));
  return list.slice(0, 10);
}

export type PriorityGroup = {
  key: string;
  codArticulo: string;
  nombreArticulo: string;
  proveedor: string;
  difValor: number;
  facturas: { nroFactura: string; fechaFactura: string; difValor: number }[];
};

// Grouped by (codArticulo, proveedor) so recurring issues on the same
// article surface as one row instead of drowning the top 10 in duplicates.
export function computePriorityList(rows: AutorizacionRow[]): PriorityGroup[] {
  const groups = new Map<string, PriorityGroup>();
  for (const d of rows) {
    const key = `${d.codArticulo}||${d.proveedor}`;
    const group = groups.get(key) ?? {
      key,
      codArticulo: d.codArticulo,
      nombreArticulo: d.nombreArticulo,
      proveedor: d.proveedor,
      difValor: 0,
      facturas: [],
    };
    group.difValor += d.difValor;
    group.facturas.push({
      nroFactura: d.nroFactura,
      fechaFactura: d.fechaFactura,
      difValor: d.difValor,
    });
    groups.set(key, group);
  }

  const list = [...groups.values()];
  list.sort((a, b) => Math.abs(b.difValor) - Math.abs(a.difValor));
  for (const g of list) {
    g.facturas.sort((a, b) => Math.abs(b.difValor) - Math.abs(a.difValor));
  }
  return list.slice(0, 10);
}
