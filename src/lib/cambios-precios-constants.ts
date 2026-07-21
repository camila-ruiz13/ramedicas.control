// Plain data + parsing helpers shared by server queries AND client
// components — no "server-only" here, unlike src/lib/cambios-precios.ts
// (does Sheets API access). Ported from the "Cambios_Precios" Apps Script
// dashboard's client-side JS.
export type CambioPrecioRow = {
  fecha: string; // ISO "yyyy-MM-dd", or "" if the cell was unparseable
  codigo: string;
  cur: string;
  nombre: string;
  proveedor: string;
  condicion: string;
  anteriorRaw: string;
  nuevoRaw: string;
  anterior: number | null;
  nuevo: number | null;
  variacionReportadaRaw: string;
  variacionPct: number | null;
  listaRaw: string;
  realizado: boolean;
  observacion: string;
};

export function esAumento(condicion: string): boolean {
  return condicion.toLowerCase().includes("aumento");
}

export function esDisminucion(condicion: string): boolean {
  const c = condicion.toLowerCase();
  return c.includes("disminu") || c.includes("baja") || c.includes("reduc");
}

export function esRealizado(listaValue: string): boolean {
  const v = listaValue.toLowerCase().trim();
  return (
    v.includes("realizado") ||
    v.includes("listo") ||
    v.includes("completado") ||
    v.includes("hecho") ||
    v === "si" ||
    v === "sí"
  );
}

// Color rules by condición. Order matters: "inactivacion" is checked before
// "activacion" because it contains it as a substring.
const COND_COLOR_RULES: { test: string; color: string; bg: string }[] = [
  { test: "inactivacion", color: "#7C3AED", bg: "#F5F3FF" }, // violeta
  { test: "activacion", color: "#0EA5E9", bg: "#F0F9FF" }, // celeste
  { test: "aumento", color: "#E11D48", bg: "#FFF1F2" }, // coral
  { test: "disminu", color: "#059669", bg: "#ECFDF5" }, // verde
  { test: "baja", color: "#059669", bg: "#ECFDF5" }, // verde
  { test: "nuevo", color: "#2563EB", bg: "#EFF6FF" }, // azul
  { test: "rebate", color: "#DB2777", bg: "#FDF2F8" }, // magenta
  { test: "sin definir", color: "#64748B", bg: "#F1F5F9" }, // gris
];

export function colorDeCondicion(nombre: string): { color: string; bg: string } {
  const nl = nombre.toLowerCase();
  for (const rule of COND_COLOR_RULES) {
    if (nl.includes(rule.test)) return { color: rule.color, bg: rule.bg };
  }
  return { color: "#2563EB", bg: "#EFF6FF" };
}

// Colombian/Latin number format: "." is always a thousands separator
// (stripped) and "," (if present) is the decimal separator.
// "15.000" -> 15000 | "15.000,50" -> 15000.5 | "-30,48" -> -30.48
export function parseNumeroCO(raw: string | null | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  let s = raw.toString().trim().replace(/[^0-9,.-]/g, "");
  if (s === "") return null;
  s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function calcularVariacionPct(
  anterior: number | null,
  nuevo: number | null,
  variacionReportada: number | null,
): number | null {
  if (anterior !== null && nuevo !== null && anterior !== 0) {
    return ((nuevo - anterior) / anterior) * 100;
  }
  return variacionReportada;
}

// Accepts "DD/MM/YYYY", "YYYY-MM-DD", or falls back to native Date parsing —
// same formats the original parsearFecha() handled for getDisplayValues()
// strings. Returns ISO "yyyy-MM-dd" (sortable) or "" if unparseable.
export function parseFechaCell(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  const d2 = new Date(s);
  if (!isNaN(d2.getTime())) {
    return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}-${String(d2.getDate()).padStart(2, "0")}`;
  }
  return "";
}

// Reformats an ISO "yyyy-MM-dd" to "dd/mm/yyyy" for display — plain string
// ops, no Date parsing, so there's no timezone shift risk.
export function displayFecha(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso || "—";
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

export const fmtNum = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function fmtPct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}
