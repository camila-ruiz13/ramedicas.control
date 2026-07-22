"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryParams } from "@/components/use-query-params";

export function FiltrosBar({
  meses,
  mes,
  proveedores,
  nit,
  incluirDevoluciones,
}: {
  meses: string[];
  mes: string;
  proveedores: { nit: string; nombre: string }[];
  nit: string;
  incluirDevoluciones: boolean;
}) {
  const { update, isPending } = useQueryParams();

  const mesItems = Object.fromEntries(meses.map((m) => [m, m]));
  const proveedorItems: Record<string, string> = {
    "": "Todos los proveedores",
    ...Object.fromEntries(proveedores.map((p) => [p.nit, p.nombre])),
  };

  function restablecer() {
    update({ nit: null, incluirDevoluciones: null, q: null, page: null });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Mes
        </label>
        <Select
          items={mesItems}
          value={mes}
          onValueChange={(next) => update({ mes: next as string, nit: null, page: null })}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meses.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Proveedor
        </label>
        <Select
          items={proveedorItems}
          value={nit}
          onValueChange={(next) => update({ nit: (next as string) || null, page: null })}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(proveedorItems).map(([value, label]) => (
              <SelectItem key={value || "all"} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <Checkbox
          id="incluir-devoluciones"
          checked={incluirDevoluciones}
          onCheckedChange={(checked) =>
            update({ incluirDevoluciones: checked ? null : "0", page: null })
          }
        />
        <Label htmlFor="incluir-devoluciones" className="text-sm font-normal">
          Netear predevoluciones
        </Label>
      </div>

      {isPending && <Spinner className="size-4 text-muted-foreground" />}

      <div className="ml-auto">
        <Button variant="outline" size="sm" className="gap-2" onClick={restablecer}>
          <RotateCcw className="size-4" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
