// Plain data + parsing helpers shared by server queries AND client
// components — no "server-only" here, unlike src/lib/prorroga-proveedores.ts
// (does Sheets API access). Ported from the "Dashboard Prórrogas Proveedores
// 2025-2026" Apps Script dashboard's leerDatos()/normalización logic.
export type Estado = "SI" | "NO" | "PARCIAL" | "PENDIENTE" | "NO APLICA" | "NEG. NUEVA" | "OTRO";

export const ESTADO_ORDER: Estado[] = ["SI", "NO", "PARCIAL", "PENDIENTE", "NO APLICA", "NEG. NUEVA", "OTRO"];

export const ESTADO_LABELS: Record<Estado, string> = {
  SI: "Sí acepta",
  NO: "No acepta",
  PARCIAL: "Parcial",
  PENDIENTE: "Pendiente",
  "NO APLICA": "No aplica",
  "NEG. NUEVA": "Neg. nueva",
  OTRO: "Otro",
};

// Mismos colores del dashboard original — Camila ya los asocia a cada estado.
export const ESTADO_COLORS: Record<Estado, string> = {
  SI: "#22c55e",
  NO: "#ef4444",
  PARCIAL: "#f97316",
  PENDIENTE: "#eab308",
  "NO APLICA": "#94a3b8",
  "NEG. NUEVA": "#06b6d4",
  OTRO: "#8b5cf6",
};

export const ESTADO_BADGE_CLASSES: Record<Estado, string> = {
  SI: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  NO: "bg-red-500/15 text-red-700 dark:text-red-400",
  PARCIAL: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  PENDIENTE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "NO APLICA": "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  "NEG. NUEVA": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  OTRO: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
};

// Columnas H y K son el mismo patrón Sí/No/Pendiente (vacío = pendiente),
// a diferencia de Estado (columna C) que tiene más categorías — se
// reutilizan los mismos componentes de gráfica para ambas parametrizando
// labels/colores en vez de duplicar EstadoDonut/EstadoBarChart.
export type SiNoPendiente = "SI" | "NO" | "PENDIENTE";

export const SI_NO_PENDIENTE_ORDER: SiNoPendiente[] = ["SI", "NO", "PENDIENTE"];

export const SI_NO_PENDIENTE_LABELS: Record<SiNoPendiente, string> = {
  SI: "Sí",
  NO: "No",
  PENDIENTE: "Pendiente",
};

export const SI_NO_PENDIENTE_COLORS: Record<SiNoPendiente, string> = {
  SI: "#22c55e",
  NO: "#ef4444",
  PENDIENTE: "#eab308",
};

export const SI_NO_PENDIENTE_BADGE_CLASSES: Record<SiNoPendiente, string> = {
  SI: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  NO: "bg-red-500/15 text-red-700 dark:text-red-400",
  PENDIENTE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export type SiNoPendienteCount = { estado: SiNoPendiente; count: number };

export type ProrrogaRow = {
  proveedor: string;
  nit: string;
  aceptaRaw: string;
  estado: Estado;
  excepcion: string;
  observacion: string;
  anexo: string;
  // Columna G ("Número de artículos"): un VLOOKUP en la hoja que falla con
  // #N/A para varios proveedores cuyo nombre no matchea exacto en la tabla
  // de origen — null en esos casos, no un dato nuestro que se pueda arreglar.
  numeroArticulos: number | null;
  // Columnas H, I, J, K agregadas por Camila (2026-08-04) para trazabilidad
  // de Control Directo: si ya enviaron el documento, cuántos códigos tienen
  // en control directo, desde cuándo, y si ya quedó registrado en el
  // sistema.
  controlDirectoEnviadoRaw: string;
  controlDirectoEnviado: SiNoPendiente;
  articulosControlDirecto: number | null;
  fechaInicialControlDirecto: string;
  sistemaRealizadoRaw: string;
  sistemaRealizado: SiNoPendiente;
};

// Misma normalización del script original: sin tildes, mayúsculas, trim.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizar(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toUpperCase()
    .trim();
}

export function normalizarEstado(raw: string): Estado {
  const v = normalizar(raw);
  if (v === "SI" || v === "S") return "SI";
  if (v === "NO") return "NO";
  if (v === "PARCIAL") return "PARCIAL";
  if (v.includes("PENDIENTE")) return "PENDIENTE";
  if (v.includes("NO APLICA")) return "NO APLICA";
  if (v.includes("NEGOCIACION")) return "NEG. NUEVA";
  return "OTRO";
}

// Estados que el dashboard original agrupa como "sin respuesta"/pendientes.
export function esPendiente(estado: Estado): boolean {
  return estado === "PENDIENTE" || estado === "OTRO" || estado === "NEG. NUEVA";
}

export type EstadoCount = { estado: Estado; count: number };

export function normalizarSiNoPendiente(raw: string): SiNoPendiente {
  const v = normalizar(raw);
  if (v === "SI" || v === "S") return "SI";
  if (v === "NO" || v === "N") return "NO";
  return "PENDIENTE";
}
