import { Badge } from "@/components/ui/badge";
import { fmtNum } from "@/lib/cambios-precios-constants";

export function ProgresoBar({
  realizado,
  pendiente,
  pct,
  filtrado,
}: {
  realizado: number;
  pendiente: number;
  pct: number;
  filtrado: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Avance &quot;Listas de Precios&quot;</h3>
          <Badge variant="outline" className="border-none bg-muted text-muted-foreground">
            {filtrado ? "filtrado" : "global"}
          </Badge>
        </div>
        <div className="flex gap-5 text-right">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Realizado
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {fmtNum.format(realizado)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pendiente
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {fmtNum.format(pendiente)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              % Completado
            </div>
            <div className="text-lg font-bold text-primary">{pct}%</div>
          </div>
        </div>
      </div>
      <div className="flex h-3.5 overflow-hidden rounded-full bg-muted">
        {realizado > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />}
        {pendiente > 0 && (
          <div
            className="h-full border border-dashed border-amber-500 bg-amber-500/15"
            style={{ width: `${100 - pct}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-emerald-500" /> Realizado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm border border-dashed border-amber-500 bg-amber-500/15" /> Pendiente
        </span>
      </div>
    </div>
  );
}
