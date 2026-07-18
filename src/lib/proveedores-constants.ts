import type { DocStatus } from "@/generated/prisma/client";

// Plain data shared by server queries AND client components — no
// "server-only" here (unlike src/lib/proveedores.ts, which does DB access).
export const STATUS_LABELS: Record<DocStatus, string> = {
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  NO_APLICA: "No Aplica",
  SIN_VALIDAR: "Sin Validar",
  NO_SUBIDO: "No subido",
};

export const STATUS_COLORS: Record<DocStatus, string> = {
  APROBADO: "#10b981",
  RECHAZADO: "#ef4444",
  NO_APLICA: "#9ca3af",
  SIN_VALIDAR: "#f59e0b",
  NO_SUBIDO: "#8b5cf6",
};

export const STATUS_ORDER: DocStatus[] = [
  "APROBADO",
  "RECHAZADO",
  "SIN_VALIDAR",
  "NO_SUBIDO",
  "NO_APLICA",
];
