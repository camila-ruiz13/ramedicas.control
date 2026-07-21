import type { TareaEstado } from "@/generated/prisma/client";

// Plain data + pure date logic shared by server queries AND client components
// — no "server-only" here, unlike files that touch the DB.
export const ESTADO_LABELS: Record<TareaEstado, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

export const ESTADO_CLASSES: Record<TareaEstado, string> = {
  PENDIENTE: "bg-muted text-muted-foreground",
  EN_PROGRESO: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  COMPLETADA: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  CANCELADA: "bg-muted text-muted-foreground line-through",
};

export type Indicador =
  | "EN_TIEMPO"
  | "VENCIDA"
  | "COMPLETADA_A_TIEMPO"
  | "COMPLETADA_TARDE"
  | "SIN_INDICADOR";

export const INDICADOR_LABELS: Record<Indicador, string> = {
  EN_TIEMPO: "En tiempo",
  VENCIDA: "Vencida",
  COMPLETADA_A_TIEMPO: "Completada a tiempo",
  COMPLETADA_TARDE: "Completada tarde",
  SIN_INDICADOR: "—",
};

export const INDICADOR_CLASSES: Record<Indicador, string> = {
  EN_TIEMPO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  VENCIDA: "bg-red-500/15 text-red-700 dark:text-red-400",
  COMPLETADA_A_TIEMPO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  COMPLETADA_TARDE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  SIN_INDICADOR: "bg-muted text-muted-foreground",
};

// fechaObjetivo/fechaCompletada are @db.Date columns, which Prisma reads
// back as UTC midnight. Comparing via local getters (setHours etc.) shifts
// the calendar day backwards in any timezone behind UTC (e.g. Colombia,
// UTC-5) — so every comparison here reads the UTC calendar day instead.
function startOfDayUTC(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getIndicador(tarea: {
  estado: TareaEstado;
  fechaObjetivo: Date;
  fechaCompletada: Date | null;
}): Indicador {
  if (tarea.estado === "CANCELADA") return "SIN_INDICADOR";

  const objetivo = startOfDayUTC(tarea.fechaObjetivo);

  if (tarea.estado === "COMPLETADA") {
    if (!tarea.fechaCompletada) return "SIN_INDICADOR";
    const completada = startOfDayUTC(tarea.fechaCompletada);
    return completada <= objetivo ? "COMPLETADA_A_TIEMPO" : "COMPLETADA_TARDE";
  }

  const hoy = startOfDayUTC(new Date());
  return hoy > objetivo ? "VENCIDA" : "EN_TIEMPO";
}

export function diasDeAtraso(fechaObjetivo: Date): number {
  const objetivo = startOfDayUTC(fechaObjetivo);
  const hoy = startOfDayUTC(new Date());
  return Math.round((hoy - objetivo) / 86_400_000);
}

// Renders an @db.Date value by its stored UTC calendar day — plain
// toLocaleDateString would shift it back a day in timezones behind UTC.
export function formatFecha(date: Date): string {
  return date.toLocaleDateString("es-CO", { timeZone: "UTC" });
}
