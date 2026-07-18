import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/proveedores-constants";
import type { DocStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<DocStatus, string> = {
  APROBADO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  RECHAZADO: "bg-red-500/15 text-red-700 dark:text-red-400",
  NO_APLICA: "bg-muted text-muted-foreground",
  SIN_VALIDAR: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  NO_SUBIDO: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
};

export function StatusBadge({ status }: { status: DocStatus }) {
  return (
    <Badge variant="outline" className={cn("border-none", STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
