"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryParams } from "@/components/use-query-params";

const MESES = [
  ["01", "Enero"], ["02", "Febrero"], ["03", "Marzo"], ["04", "Abril"],
  ["05", "Mayo"], ["06", "Junio"], ["07", "Julio"], ["08", "Agosto"],
  ["09", "Septiembre"], ["10", "Octubre"], ["11", "Noviembre"], ["12", "Diciembre"],
] as const;

export function FiltrosBar({
  anios,
  anio,
  mes,
  proveedores,
  nit,
}: {
  anios: string[];
  anio: string;
  mes: string;
  proveedores: { nit: string; nombre: string }[];
  nit: string;
}) {
  const { update, isPending } = useQueryParams();

  const anioItems: Record<string, string> = {
    "": "Todos los años",
    ...Object.fromEntries(anios.map((a) => [a, a])),
  };
  const mesItems: Record<string, string> = {
    "": "Todos los meses",
    ...Object.fromEntries(MESES),
  };
  const proveedorItems: Record<string, string> = {
    "": "Todos los proveedores",
    ...Object.fromEntries(proveedores.map((p) => [p.nit, p.nombre])),
  };

  function restablecer() {
    update({ anio: null, mes: null, nit: null, q: null, page: null });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Año
        </label>
        <Select items={anioItems} value={anio} onValueChange={(next) => update({ anio: (next as string) || null, page: null })}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(anioItems).map(([value, label]) => (
              <SelectItem key={value || "all"} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Mes
        </label>
        <Select items={mesItems} value={mes} onValueChange={(next) => update({ mes: (next as string) || null, page: null })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(mesItems).map(([value, label]) => (
              <SelectItem key={value || "all"} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Proveedor
        </label>
        <Select items={proveedorItems} value={nit} onValueChange={(next) => update({ nit: (next as string) || null, page: null })}>
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
