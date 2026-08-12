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
// NO_REGULADO_C22 usaba teal, muy parecido al verde de POR_DEBAJO (emerald)
// — a pedido de Camila (2026-08-12) se cambió a violeta para que se
// distinga de un vistazo, ya que no tiene relación de "bueno/malo" con los
// demás (solo indica que ese producto no aplica a la circular 22).
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
  NO_REGULADO_C22: "#8b5cf6",
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
  NO_REGULADO_C22: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  OTRO: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
};

export type PrecioReguladoRow = {
  codigo: string;
  proveedor: string;
  nombreComercial: string;
  principioActivo: string;
  laboratorio: string;
  costo: number | null;
  // Columna Q de VALIDACIÓN: "S" = descontinuado. A pedido de Camila
  // (2026-08-12), para mostrarlo en el detalle de productos por proveedor —
  // es un dato aparte de portafolioVsCircular (esa se arma con texto libre
  // de otra columna, ej. DESCONTINUADO_COMPRA/VENTA).
  descontinuado: boolean;
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
  // (precioCircular22 - costo) / costo * 100 — % de cambio de ir del costo
  // de portafolio al precio de la circular 22. Negativo = el precio TIENE
  // que bajar (circular por debajo del costo, o sea por encima del techo
  // regulado); positivo = el costo ya está por debajo de la circular (hay
  // margen). A pedido de Camila (2026-08-12): "si bajó en la circular no
  // puede ser positivo" — signo opuesto al de `diferencia` a propósito.
  pctCambio: number | null;
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
// "CONTINUA CON EL MISMO VALOR DE LA 19". Camila hizo un reemplazo de
// "REGULADO" por "CONTROLADO" en la hoja (2026-08-11) — normalizamos
// CONTROLADO de vuelta a REGULADO antes de los includes() de abajo para no
// depender de cuál de las dos palabras esté usando la hoja en un momento
// dado. Cualquier otro texto (no debería pasar, pero por si la hoja agrega
// una categoría nueva) cae en OTRO en vez de forzarse a una de estas — ver
// cambioRegulacionRaw.
export function normalizarCambio(raw: string): CambioRegulacion {
  const v = normalizar(raw).replace(/CONTROLADO/g, "REGULADO");
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
// Mismo reemplazo CONTROLADO -> REGULADO que en normalizarCambio, por el
// mismo cambio de palabra que hizo Camila en la hoja (incluye variantes como
// "CONTROLADO DESCONTINUADO TOTAL", que cae en el mismo caso base que antes
// "REGULADO DESCONTINUADO" porque el match es por includes(), no exacto).
export function normalizarPortafolio(raw: string): PortafolioVsCircular {
  const v = normalizar(raw).replace(/CONTROLADO/g, "REGULADO");
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

// Formato compartido para los % con signo de este módulo (pctCambio,
// pctBajo de la hoja proveedores, etc.) — un solo decimal y "+" explícito
// cuando es positivo (fmtCOP/Intl ya antepone "-" solo, no hace falta acá).
export function fmtPctSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

// Hoja "proveedores" (pestaña aparte del mismo spreadsheet, mantenida a mano
// por Camila): seguimiento código por código de los precios que se le pidió
// bajar a cada proveedor y si ya se le avisó o no. No tiene relación con las
// columnas de VALIDACIÓN — se cruza por código a nivel de despliegue en la UI.
export type ProveedorEnvioRow = {
  codigo: string;
  // NIT del proveedor (columna E) — a pedido de Camila (2026-08-11), es la
  // llave que se usa para saber si YA se avisó a un proveedor, en vez del
  // nombre (variantes de escritura) o del código puntual (no todos los
  // códigos de un proveedor quedan listados acá, solo los que tenían precio
  // por ajustar) — ver computeEnviadoPorNit en precios-regulados.ts.
  nit: string;
  proveedor: string;
  precioAnterior: number | null;
  precioNuevo: number | null;
  // (precioAnterior - precioNuevo) / precioAnterior * 100 — positivo = el
  // precio bajó, negativo = subió (pasa en algunas filas de la hoja, ej.
  // NK0025) — no se fuerza a valor absoluto para no ocultar esos casos.
  pctBajo: number | null;
  // Columna "SISTEMA?" de la hoja: "Enviado" vs. cualquier otra cosa (hoy
  // solo "No").
  enviado: boolean;
};

// Info de envío resuelta para un código de producto de Control Directo,
// combinando las 3 hojas: NIT del proveedor (cruzado por código vía la
// pestaña "PORTAFOLIO ..."), si a ese NIT ya se le avisó (hoja
// "proveedores"), y precio anterior/nuevo/% si ese código puntual está
// listado en "proveedores". `enviado` es null cuando no se pudo resolver el
// NIT del código o el NIT no aparece todavía en la hoja "proveedores".
export type CodigoEnvioInfo = {
  nit: string | null;
  enviado: boolean | null;
  precioAnterior: number | null;
  precioNuevo: number | null;
  pctBajo: number | null;
};

export type EnvioEstadoProveedor = {
  bucket: "ENVIADO" | "NO_ENVIADO" | "PARCIAL" | "SIN_DATO";
  enviados: number;
  // Cantidad de códigos del proveedor con dato de envío conocido (nit
  // resuelto Y presente en la hoja "proveedores") — puede ser menor que el
  // total de códigos del proveedor.
  conDato: number;
};

// Resuelve el estado de envío de UN proveedor a partir de sus códigos — a
// pedido de Camila (2026-08-12), tanto la lista de proveedores como la
// torta de "Aviso a proveedores" cuentan por proveedor, no por código, así
// que ambas usan esta misma función para no divergir en el criterio.
export function computeEnvioEstadoProveedor(
  codigos: string[],
  codigoEnvioInfo: Record<string, CodigoEnvioInfo>,
): EnvioEstadoProveedor {
  const conocidos = codigos
    .map((c) => codigoEnvioInfo[c]?.enviado)
    .filter((e): e is boolean => e !== null && e !== undefined);

  if (conocidos.length === 0) return { bucket: "SIN_DATO", enviados: 0, conDato: 0 };

  const enviados = conocidos.filter(Boolean).length;
  const bucket = enviados === conocidos.length ? "ENVIADO" : enviados === 0 ? "NO_ENVIADO" : "PARCIAL";
  return { bucket, enviados, conDato: conocidos.length };
}
