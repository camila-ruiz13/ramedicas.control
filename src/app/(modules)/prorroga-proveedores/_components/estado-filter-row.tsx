"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";
import { ESTADO_LABELS, ESTADO_COLORS, type EstadoCount } from "@/lib/prorroga-proveedores-constants";

export function EstadoFilterRow({ counts, estado }: { counts: EstadoCount[]; estado: string }) {
  const { update } = useQueryParams();

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => update({ estado: null, page: null })}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          estado === "" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        Todos
      </button>
      {counts.map((c) => {
        const active = estado === c.estado;
        return (
          <button
            key={c.estado}
            type="button"
            onClick={() => update({ estado: active ? null : c.estado, page: null })}
            className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors")}
            style={
              active
                ? { borderColor: ESTADO_COLORS[c.estado], backgroundColor: ESTADO_COLORS[c.estado], color: "white" }
                : { borderColor: "var(--border)" }
            }
          >
            {ESTADO_LABELS[c.estado]} ({c.count})
          </button>
        );
      })}
    </div>
  );
}
