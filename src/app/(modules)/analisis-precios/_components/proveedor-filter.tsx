"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParams } from "@/components/use-query-params";

// Mismo patrón que el filtro de proveedor en descuentos-proveedores/por-articulo
// — combo en vez de texto libre porque son 239 proveedores distintos.
export function ProveedorFilter({ proveedores, value }: { proveedores: string[]; value: string }) {
  const { update } = useQueryParams();

  const items: Record<string, string> = {
    "": "Todos los proveedores",
    ...Object.fromEntries(proveedores.map((p) => [p, p])),
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Proveedor</label>
      <Select items={items} value={value} onValueChange={(next) => update({ proveedor: (next as string) || null, page: null })}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(items).map(([v, label]) => (
            <SelectItem key={v || "all"} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
