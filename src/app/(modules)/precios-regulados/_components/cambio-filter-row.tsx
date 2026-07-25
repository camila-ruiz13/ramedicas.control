"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";
import { CAMBIO_LABELS, CAMBIO_COLORS, type CambioCount } from "@/lib/precios-regulados-constants";

export function CambioFilterRow({ counts, cambio }: { counts: CambioCount[]; cambio: string }) {
  const { update } = useQueryParams();

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => update({ cambio: null, page: null })}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          cambio === "" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        Todos
      </button>
      {counts.map((c) => {
        const active = cambio === c.cambio;
        return (
          <button
            key={c.cambio}
            type="button"
            onClick={() => update({ cambio: active ? null : c.cambio, page: null })}
            className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            style={
              active
                ? { borderColor: CAMBIO_COLORS[c.cambio], backgroundColor: CAMBIO_COLORS[c.cambio], color: "white" }
                : { borderColor: "var(--border)" }
            }
          >
            {CAMBIO_LABELS[c.cambio]} ({c.count})
          </button>
        );
      })}
    </div>
  );
}
