"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";
import { PORTAFOLIO_LABELS, PORTAFOLIO_COLORS, type PortafolioCount } from "@/lib/precios-regulados-constants";

export function PortafolioFilterRow({ counts, portafolio }: { counts: PortafolioCount[]; portafolio: string }) {
  const { update } = useQueryParams();

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => update({ portafolio: null, page: null })}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          portafolio === "" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        Todos
      </button>
      {counts.map((c) => {
        const active = portafolio === c.portafolio;
        return (
          <button
            key={c.portafolio}
            type="button"
            onClick={() => update({ portafolio: active ? null : c.portafolio, page: null })}
            className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            style={
              active
                ? { borderColor: PORTAFOLIO_COLORS[c.portafolio], backgroundColor: PORTAFOLIO_COLORS[c.portafolio], color: "white" }
                : { borderColor: "var(--border)" }
            }
          >
            {PORTAFOLIO_LABELS[c.portafolio]} ({c.count})
          </button>
        );
      })}
    </div>
  );
}
