// Plain data + parsing helpers shared by server queries AND client
// components — no "server-only" here, unlike src/lib/precios-regulados.ts
// (does Sheets API access). Sigue el mismo patrón que
// prorroga-proveedores-constants.ts.
export type CambioRegulacion = "NUEVO" | "SUBIO" | "BAJO" | "IGUAL";

export const CAMBIO_ORDER: CambioRegulacion[] = ["NUEVO", "SUBIO", "BAJO", "IGUAL"];

export const CAMBIO_LABELS: Record<CambioRegulacion, string> = {
  NUEVO: "Nuevo regulado",
  SUBIO: "Subió de regulación",
  BAJO: "Bajó de regulación",
  IGUAL: "Sin cambio (19 = 22)",
};

export const CAMBIO_COLORS: Record<CambioRegulacion, string> = {
  NUEVO: "#2563eb",
  SUBIO: "#f97316",
  BAJO: "#059669",
  IGUAL: "#94a3b8",
};

export const CAMBIO_BADGE_CLASSES: Record<CambioRegulacion, string> = {
  NUEVO: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  SUBIO: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  BAJO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  IGUAL: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
};

export type PortafolioVsCircular = "POR_ENCIMA" | "POR_DEBAJO" | "IGUAL";

export const PORTAFOLIO_ORDER: PortafolioVsCircular[] = ["POR_DEBAJO", "POR_ENCIMA", "IGUAL"];

export const PORTAFOLIO_LABELS: Record<PortafolioVsCircular, string> = {
  POR_DEBAJO: "Por debajo del precio regulado",
  POR_ENCIMA: "Por encima del precio regulado",
  IGUAL: "Igual al precio regulado",
};

// Rojo para "por encima": es el caso que requiere ajustar el precio del
// proveedor porque supera el techo regulado. Verde para "por debajo": ya
// cumple. Mismos criterios de color que ESTADO_COLORS en prorroga-proveedores.
export const PORTAFOLIO_COLORS: Record<PortafolioVsCircular, string> = {
  POR_DEBAJO: "#22c55e",
  POR_ENCIMA: "#ef4444",
  IGUAL: "#94a3b8",
};

export const PORTAFOLIO_BADGE_CLASSES: Record<PortafolioVsCircular, string> = {
  POR_DEBAJO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  POR_ENCIMA: "bg-red-500/15 text-red-700 dark:text-red-400",
  IGUAL: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
};

export type PrecioReguladoRow = {
  codigo: string;
  proveedor: string;
  nombreComercial: string;
  principioActivo: string;
  laboratorio: string;
  costo: number | null;
  precioCircular22: number | null;
  // Cuando la columna "CIRCULAR 22" no trae un precio sino un comentario de
  // la hoja (ej. "CONTINUA CON EL MISMO VALOR DE LA 19"), precioCircular22
  // queda null y el texto original se conserva acá para mostrarlo tal cual
  // en vez de un precio mal interpretado.
  circular22Comentario: string | null;
  // costo - precioCircular22: positivo = por encima del techo regulado.
  diferencia: number | null;
  cambioRegulacion: CambioRegulacion;
  portafolioVsCircular: PortafolioVsCircular;
};

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizar(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toUpperCase()
    .trim();
}

// Valores de la columna Z ("Cambio regulación 19 vs 22"): "NUEVO REGULADO",
// "SUBIÓ DE REGULACIÓN", "BAJO REGULACIÓN", "CONTINUA CON EL MISMO VALOR DE LA 19".
export function normalizarCambio(raw: string): CambioRegulacion {
  const v = normalizar(raw);
  if (v.includes("NUEVO")) return "NUEVO";
  if (v.includes("SUBIO")) return "SUBIO";
  if (v.includes("BAJO")) return "BAJO";
  return "IGUAL";
}

// Valores de la columna AA ("Portafolio vs circular 22"): "ESTÁ POR ENCIMA
// DEL PRECIO DE REGULACIÓN", "ESTÁ POR DEBAJO DEL PRECIO DE REGULACIÓN",
// "TIENE EL MISMO PRECIO DE REGULACIÓN".
export function normalizarPortafolio(raw: string): PortafolioVsCircular {
  const v = normalizar(raw);
  if (v.includes("ENCIMA")) return "POR_ENCIMA";
  if (v.includes("DEBAJO")) return "POR_DEBAJO";
  return "IGUAL";
}

export type CambioCount = { cambio: CambioRegulacion; count: number };
export type PortafolioCount = { portafolio: PortafolioVsCircular; count: number };
