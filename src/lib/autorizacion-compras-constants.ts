// Plain data + formatters shared by server queries AND client components —
// no "server-only" here, unlike src/lib/autorizacion-compras.ts (does DB/API access).
export type Variacion = "POR ENCIMA" | "POR DEBAJO";

// Sentinel for the provider multiselect's "prov" query param: distinct from
// an absent param (= "all selected") since an empty string would parse back
// as falsy and get misread as "no filter" instead of "nothing selected".
export const NONE_SENTINEL = "__none__";

export type AutorizacionRow = {
  nroFactura: string;
  fechaFactura: string;
  fechaAutorizacion: string;
  codArticulo: string;
  nombreArticulo: string;
  unidades: number;
  costo: number;
  costoLista: number;
  difValor: number;
  difPct: number;
  variacion: Variacion;
  proveedor: string;
  usuario: string;
  observacion: string;
};

export const VARIACION_LABELS: Record<Variacion, string> = {
  "POR ENCIMA": "Por encima",
  "POR DEBAJO": "Por debajo",
};

// "Por encima" (sobrecosto) reads as a warning, "Por debajo" (ahorro) as good —
// same coral/teal split the original Apps Script dashboard used.
export const VARIACION_CLASSES: Record<Variacion, string> = {
  "POR ENCIMA": "bg-red-500/15 text-red-700 dark:text-red-400",
  "POR DEBAJO": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

export const fmtCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const fmtNum = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function fmtPct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

// Reformats an ISO "yyyy-MM-dd" (how dates are stored internally, see
// excelSerialToISODate in autorizacion-compras.ts) to "dd/mm/yyyy" for
// display — plain string ops, no Date parsing, so there's no timezone
// shift risk (the bug fixed in the tareas module).
export function displayFecha(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}
