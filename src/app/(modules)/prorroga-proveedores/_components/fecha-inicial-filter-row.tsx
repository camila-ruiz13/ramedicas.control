"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";
import type { FechaInicialCount } from "@/lib/prorroga-proveedores-constants";

// Un chip por cada fecha distinta que aparece en la columna J — deja ver de
// un clic cuáles proveedores van a una fecha de inicio en particular.
export function FechaInicialFilterRow({ counts, fecha }: { counts: FechaInicialCount[]; fecha: string }) {
  const { update } = useQueryParams();

  if (counts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => update({ fecha: null, page: null })}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          fecha === "" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        Todas las fechas
      </button>
      {counts.map((c) => {
        const active = fecha === c.fecha;
        return (
          <button
            key={c.fecha}
            type="button"
            onClick={() => update({ fecha: active ? null : c.fecha, page: null })}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c.fecha} ({c.count})
          </button>
        );
      })}
    </div>
  );
}
