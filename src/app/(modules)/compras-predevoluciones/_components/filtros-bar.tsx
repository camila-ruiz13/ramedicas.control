"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Con ~200 proveedores, un <Select> deja "Todos los proveedores" imposible
  // de alcanzar (el popup se abre anclado al valor seleccionado, no al
  // principio de la lista) — un input con autocompletado (igual que
  // Cambios de Precios) resuelve esto y de paso permite escribir para buscar.
  const nombrePorNit = new Map(proveedores.map((p) => [p.nit, p.nombre]));
  const nitPorNombre = new Map(proveedores.map((p) => [p.nombre, p.nit]));
  const [proveedorInput, setProveedorInput] = useState(nombrePorNit.get(nit) ?? "");

  function onProveedorChange(value: string) {
    setProveedorInput(value);
    const trimmed = value.trim();
    if (trimmed === "") {
      update({ nit: null, page: null });
    } else if (nitPorNombre.has(trimmed)) {
      update({ nit: nitPorNombre.get(trimmed)!, page: null });
    }
  }

  function restablecer() {
    setProveedorInput("");
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
        <Input
          list="compras-proveedores"
          placeholder="Todos los proveedores"
          value={proveedorInput}
          onChange={(e) => onProveedorChange(e.target.value)}
          className="w-64"
        />
        <datalist id="compras-proveedores">
          {proveedores.map((p) => (
            <option key={p.nit} value={p.nombre} />
          ))}
        </datalist>
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
