"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";

// Mismo patrón que ReguladoFilterRow (precios-regulados) — reutilizado acá
// para las dos columnas de descontinuado (compra/venta), que se filtran por
// separado a pedido de Camila (2026-09-23).
export function EstadoFilterRow({
  label,
  queryParam,
  total,
  si,
  no,
  value,
}: {
  label: string;
  queryParam: string;
  total: number;
  si: number;
  no: number;
  value: string;
}) {
  const { update } = useQueryParams();

  const options: { key: string; label: string; count: number }[] = [
    { key: "", label: "Todos", count: total },
    { key: "NO", label: "Activos", count: no },
    { key: "SI", label: "Descontinuados", count: si },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key || "todos"}
            type="button"
            onClick={() => update({ [queryParam]: opt.key || null, page: null })}
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
