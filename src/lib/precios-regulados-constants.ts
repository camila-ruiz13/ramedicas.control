// Plain data + parsing helpers shared by server queries AND client
// components — no "server-only" here, unlike src/lib/precios-regulados.ts
// (does Sheets API access). Sigue el mismo patrón que
// prorroga-proveedores-constants.ts.
//
// Listas de valores tomadas directamente de la validación de datos de la
// hoja "Validación" (columnas "Cambio regulación 19 vs 22" y "Portafolio vs
// circular 22"), tal como las pasó Camila el 2026-07-29. OTRO es un catch-all
// defensivo para texto que no calce con ninguno — nunca se debe
// inferir/forzar una de las categorías de abajo cuando el texto no dice eso
// (ver cambioRegulacionRaw / portafolioVsCircularRaw).
export type CambioRegulacion =
  | "NUEVO"
  | "SUBIO"
  | "BAJO"
  | "SALE"
  | "IGUAL"
  | "VALIDAR"
  | "NO_REGULADO_C22"
  | "NO_REGULADO_C19"
  | "OTRO";

export const CAMBIO_ORDER: CambioRegulacion[] = [
  "NUEVO",
  "SUBIO",
  "BAJO",
  "SALE",
  "IGUAL",
  "VALIDAR",
  "NO_REGULADO_C22",
  "NO_REGULADO_C19",
  "OTRO",
];

export const CAMBIO_LABELS: Record<CambioRegulacion, string> = {
  NUEVO: "Nuevo control directo",
  SUBIO: "Subió de regulación",
  BAJO: "Bajó de regulación",
  SALE: "Sale de control directo",
  IGUAL: "Continúa con el mismo valor de la 19",
  VALIDAR: "Validar",
  NO_REGULADO_C22: "No es control directo en la circular 22",
  NO_REGULADO_C19: "No es control directo en la circular 19",
  OTRO: "Otro",
};

export const CAMBIO_COLORS: Record<CambioRegulacion, string> = {
  NUEVO: "#2563eb",
  SUBIO: "#f97316",
  BAJO: "#059669",
  SALE: "#a855f7",
  IGUAL: "#94a3b8",
  VALIDAR: "#f59e0b",
  NO_REGULADO_C22: "#0ea5e9",
  NO_REGULADO_C19: "#14b8a6",
  OTRO: "#d1d5db",
};

export const CAMBIO_BADGE_CLASSES: Record<CambioRegulacion, string> = {
  NUEVO: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  SUBIO: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  BAJO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  SALE: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  IGUAL: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  VALIDAR: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  NO_REGULADO_C22: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  NO_REGULADO_C19: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  OTRO: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
};

// Cuando la columna "Portafolio vs circular 22" viene vacía,
// precios-regulados.ts usa el texto de "Cambio regulación 19 vs 22" en su
// lugar (a pedido de Camila) — eso normalmente cae en OTRO acá, y se muestra
// el texto original tal cual vía portafolioVsCircularRaw.
export type PortafolioVsCircular =
  | "POR_ENCIMA"
  | "POR_DEBAJO"
  | "LIMITE_REGULADO"
  | "NO_DESCONTINUADO"
  | "DESCONTINUADO"
  | "DESCONTINUADO_COMPRA"
  | "DESCONTINUADO_VENTA"
  | "REGULADO_DESCONTINUADO"
  | "REGULADO_DESCONTINUADO_COMPRA"
  | "REGULADO_DESCONTINUADO_VENTA"
  | "NO_REGULADO_C22"
  | "OTRO";

export const PORTAFOLIO_ORDER: PortafolioVsCircular[] = [
  "POR_DEBAJO",
  "POR_ENCIMA",
  "LIMITE_REGULADO",
  "NO_DESCONTINUADO",
  "DESCONTINUADO",
  "DESCONTINUADO_COMPRA",
  "DESCONTINUADO_VENTA",
  "REGULADO_DESCONTINUADO",
  "REGULADO_DESCONTINUADO_COMPRA",
  "REGULADO_DESCONTINUADO_VENTA",
  "NO_REGULADO_C22",
  "OTRO",
];

export const PORTAFOLIO_LABELS: Record<PortafolioVsCircular, string> = {
  POR_DEBAJO: "Por debajo de la circular",
  POR_ENCIMA: "Por encima de la circular",
  LIMITE_REGULADO: "Límite de control directo",
  NO_DESCONTINUADO: "No descontinuado",
  DESCONTINUADO: "Descontinuado",
  DESCONTINUADO_COMPRA: "Descontinuado para la compra",
  DESCONTINUADO_VENTA: "Descontinuado para la venta",
  REGULADO_DESCONTINUADO: "Control directo descontinuado",
  REGULADO_DESCONTINUADO_COMPRA: "Control directo descontinuado para la compra",
  REGULADO_DESCONTINUADO_VENTA: "Control directo descontinuado para la venta",
  NO_REGULADO_C22: "No es control directo en la circular 22",
  OTRO: "Otro",
};

// Rojo para "por encima": es el caso que requiere ajustar el precio del
// proveedor porque supera el techo regulado. Verde para "por debajo": ya
// cumple. Mismos criterios de color que ESTADO_COLORS en prorroga-proveedores.
// Los "regulado descontinuado*" son un matiz distinto de los "descontinuado*"
// planos (la hoja los distingue como valores separados) — se les da una
// familia de color aparte (rosa/fucsia) para no mezclarlos visualmente.
export const PORTAFOLIO_COLORS: Record<PortafolioVsCircular, string> = {
  POR_DEBAJO: "#22c55e",
  POR_ENCIMA: "#ef4444",
  LIMITE_REGULADO: "#94a3b8",
  NO_DESCONTINUADO: "#0ea5e9",
  DESCONTINUADO: "#f59e0b",
  DESCONTINUADO_COMPRA: "#fb923c",
  DESCONTINUADO_VENTA: "#fbbf24",
  REGULADO_DESCONTINUADO: "#ec4899",
  REGULADO_DESCONTINUADO_COMPRA: "#f472b6",
  REGULADO_DESCONTINUADO_VENTA: "#db2777",
  NO_REGULADO_C22: "#14b8a6",
  OTRO: "#d1d5db",
};

export const PORTAFOLIO_BADGE_CLASSES: Record<PortafolioVsCircular, string> = {
  POR_DEBAJO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  POR_ENCIMA: "bg-red-500/15 text-red-700 dark:text-red-400",
  LIMITE_REGULADO: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  NO_DESCONTINUADO: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  DESCONTINUADO: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  DESCONTINUADO_COMPRA: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  DESCONTINUADO_VENTA: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  REGULADO_DESCONTINUADO: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  REGULADO_DESCONTINUADO_COMPRA: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400",
  REGULADO_DESCONTINUADO_VENTA: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  NO_REGULADO_C22: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  OTRO: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
};

export type PrecioReguladoRow = {
  codigo: string;
  proveedor: string;
  nombreComercial: string;
  principioActivo: string;
  laboratorio: string;
  costo: number | null;
  // A pedido de Camila (2026-07-29): la hoja ya no trae un precio de
  // circular 19 separado, así que este campo se llena con "PRECIO MÁX EMB"
  // como el precio a mostrar en esa columna de la pestaña Circular 19 vs 22.
  precioCircular19: number | null;
  circular19Comentario: string | null;
  precioCircular22: number | null;
  // Cuando la columna "Circular 22 emb" no trae un precio sino un comentario
  // de la hoja, precioCircular22 queda null y el texto original se conserva
  // acá para mostrarlo tal cual en vez de un precio mal interpretado.
  circular22Comentario: string | null;
  // costo - precioCircular22: positivo = por encima del techo regulado.
  diferencia: number | null;
  // precioCircular22 - precioCircular19: positivo = subió de la 19 a la 22.
  diferenciaCircular: number | null;
  cambioRegulacion: CambioRegulacion;
  // Texto original de la columna "Cambio regulación 19 vs 22", tal como está
  // en la hoja — se muestra en vez de la etiqueta genérica cuando
  // cambioRegulacion === "OTRO".
  cambioRegulacionRaw: string;
  portafolioVsCircular: PortafolioVsCircular;
  // Texto original de la columna "Portafolio vs circular 22" (o del cambio
  // de regulación si esa venía vacía) — se muestra en vez de la etiqueta
  // genérica cuando portafolioVsCircular es "OTRO", para no inventar una
  // categoría que la hoja no dice.
  portafolioVsCircularRaw: string;
};

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function normalizar(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toUpperCase()
    .trim();
}

// Valores de la columna "Cambio regulación 19 vs 22": "NO ES REGULADO EN LA
// CIRCULAR 22", "NO ES REGULADO EN LA CIRCULAR 19", "VALIDAR", "NUEVO
// REGULADO", "SALE DE REGULADO", "SUBIÓ REGULACIÓN", "BAJÓ REGULACIÓN",
// "CONTINUA CON EL MISMO VALOR DE LA 19". Cualquier otro texto (no debería
// pasar, pero por si la hoja agrega una categoría nueva) cae en OTRO en vez
// de forzarse a una de estas — ver cambioRegulacionRaw.
export function normalizarCambio(raw: string): CambioRegulacion {
  const v = normalizar(raw);
  if (v.includes("NO ES REGULADO")) {
    if (v.includes("22")) return "NO_REGULADO_C22";
    if (v.includes("19")) return "NO_REGULADO_C19";
  }
  if (v.includes("VALIDAR")) return "VALIDAR";
  if (v.includes("NUEVO")) return "NUEVO";
  if (v.includes("SALE")) return "SALE";
  if (v.includes("SUBIO")) return "SUBIO";
  if (v.includes("BAJO")) return "BAJO";
  if (v.includes("CONTINUA")) return "IGUAL";
  return "OTRO";
}

// Valores de la columna "Portafolio vs circular 22": "NO ES REGULADO EN LA
// CIRCULAR 22", "REGULADO DESCONTINUADO", "REGULADO DESCONTINUADO PARA LA
// COMPRA", "REGULADO DESCONTINUADO PARA LA VENTA", "DESCONTINUADO",
// "DESCONTINUADO PARA LA COMPRA", "DESCONTINUADO PARA LA VENTA", "NO
// DESCONTINUADO", "POR ENCIMA DE LA CIRCULAR", "POR DEBAJO DE LA CIRCULAR",
// "LÍMITE REGULADO". Los "REGULADO DESCONTINUADO*" son un valor distinto de
// los "DESCONTINUADO*" planos en la hoja, así que se revisan primero para no
// mezclarlos. Cualquier otro texto cae en OTRO — ver portafolioVsCircularRaw
// (incluye el caso de venir vacía, que usa el texto de cambio regulación).
export function normalizarPortafolio(raw: string): PortafolioVsCircular {
  const v = normalizar(raw);
  if (v.includes("NO ES REGULADO")) return "NO_REGULADO_C22";
  if (v.includes("NO DESCONTINUADO")) return "NO_DESCONTINUADO";
  if (v.includes("REGULADO") && v.includes("DESCONTINUADO")) {
    if (v.includes("COMPRA")) return "REGULADO_DESCONTINUADO_COMPRA";
    if (v.includes("VENTA")) return "REGULADO_DESCONTINUADO_VENTA";
    return "REGULADO_DESCONTINUADO";
  }
  if (v.includes("DESCONTINUADO")) {
    if (v.includes("COMPRA")) return "DESCONTINUADO_COMPRA";
    if (v.includes("VENTA")) return "DESCONTINUADO_VENTA";
    return "DESCONTINUADO";
  }
  if (v.includes("LIMITE")) return "LIMITE_REGULADO";
  if (v.includes("ENCIMA")) return "POR_ENCIMA";
  if (v.includes("DEBAJO")) return "POR_DEBAJO";
  return "OTRO";
}

export type CambioCount = { cambio: CambioRegulacion; count: number };
export type PortafolioCount = { portafolio: PortafolioVsCircular; count: number };
