import { Badge } from "@/components/ui/badge";
import {
  INDICADOR_CLASSES,
  INDICADOR_LABELS,
  diasDeAtraso,
  type Indicador,
} from "@/lib/tareas-constants";
import { cn } from "@/lib/utils";

export function IndicadorBadge({
  indicador,
  fechaObjetivo,
}: {
  indicador: Indicador;
  fechaObjetivo: Date;
}) {
  const atraso = indicador === "VENCIDA" ? diasDeAtraso(fechaObjetivo) : 0;

  return (
    <Badge variant="outline" className={cn("border-none", INDICADOR_CLASSES[indicador])}>
      {INDICADOR_LABELS[indicador]}
      {indicador === "VENCIDA" && atraso > 0 && ` (${atraso}d)`}
    </Badge>
  );
}
