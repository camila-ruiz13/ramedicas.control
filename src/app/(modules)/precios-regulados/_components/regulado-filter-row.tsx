"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";

// Filtro de primer nivel a pedido de Camila (2026-07-29): la hoja
// "VALIDACIÓN" trae el portafolio completo (~11.450 artículos) y la mayoría
// no está regulada, así que antes de elegir una categoría fina (Nuevo,
// Subió, Por encima, etc.) hace falta poder acotar de una a "solo
// regulados" o "solo no regulados".
export function ReguladoFilterRow({
  total,
  regulados,
  noRegulados,
  value,
}: {
  total: number;
  regulados: number;
  noRegulados: number;
  value: string;
}) {
  const { update } = useQueryParams();

  const options: { key: string; label: string; count: number }[] = [
    { key: "", label: "Todos", count: total },
    { key: "SI", label: "Regulados", count: regulados },
    { key: "NO", label: "No regulados", count: noRegulados },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key || "todos"}
            type="button"
            onClick={() => update({ regulado: opt.key || null, page: null })}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label} ({opt.count})
          </button>
        );
      })}
    </div>
  );
}
