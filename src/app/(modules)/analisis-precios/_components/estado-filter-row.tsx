"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParams } from "@/components/use-query-params";

// Antes eran chips (Todos/Activos/Descontinuados) — Camila pidió pasarlo a
// desplegable con las mismas etiquetas que usa el dato crudo (Sí/No/Todos)
// (2026-09-24). Reutilizado para las dos columnas de descontinuado
// (compra/venta), que se filtran por separado.
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

  const items: Record<string, string> = {
    "": `Todos (${total})`,
    NO: `No (${no})`,
    SI: `Sí (${si})`,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <Select items={items} value={value} onValueChange={(next) => update({ [queryParam]: (next as string) || null, page: null })}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(items).map(([v, itemLabel]) => (
            <SelectItem key={v || "all"} value={v}>
              {itemLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
