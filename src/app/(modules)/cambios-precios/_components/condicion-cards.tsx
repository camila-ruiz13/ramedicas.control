"use client";

import { cn } from "@/lib/utils";
import { colorDeCondicion, fmtNum } from "@/lib/cambios-precios-constants";
import { useQueryParams } from "@/components/use-query-params";
import type { CondicionCount } from "@/lib/cambios-precios";

export function CondicionCards({
  counts,
  total,
  selected,
}: {
  counts: CondicionCount[];
  total: number;
  selected: string;
}) {
  const { update } = useQueryParams();

  function seleccionar(condicion: string) {
    update({ condicion: condicion || null, page: null });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <button
        type="button"
        onClick={() => seleccionar("")}
        className={cn(
          "rounded-lg border-2 p-3 text-left transition-colors",
          selected === "" ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30" : "border-border hover:border-muted-foreground/40",
        )}
      >
        <div className="text-xs font-semibold">Todas</div>
        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{fmtNum.format(total)}</div>
        <div className="text-[11px] text-muted-foreground">100% del filtro</div>
      </button>
      {counts.map((item) => {
        const col = colorDeCondicion(item.condicion);
        const pct = total ? Math.round((item.count / total) * 100) : 0;
        const isSelected = selected === item.condicion;
        return (
          <button
            key={item.condicion}
            type="button"
            onClick={() => seleccionar(item.condicion)}
            className={cn(
              "rounded-lg border-2 p-3 text-left transition-colors",
              isSelected ? "border-current" : "border-border hover:border-muted-foreground/40",
            )}
            style={isSelected ? { borderColor: col.color, backgroundColor: col.bg } : undefined}
          >
            <div className="truncate text-xs font-semibold">{item.condicion}</div>
            <div className="text-xl font-bold" style={{ color: col.color }}>
              {fmtNum.format(item.count)}
            </div>
            <div className="text-[11px] text-muted-foreground">{pct}% del filtro</div>
          </button>
        );
      })}
    </div>
  );
}
