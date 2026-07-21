"use client";

import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { exportarCambiosPreciosCSV } from "../actions";
import type { CambiosPreciosFilters } from "@/lib/cambios-precios";

const LISTA_ITEMS = {
  "": "Todos (Realizado y Pendiente)",
  realizado: "Solo Realizado",
  pendiente: "Solo Pendiente",
};

export function FiltrosBar({
  allProveedores,
  proveedor,
  lista,
  desde,
  hasta,
  condicion,
}: {
  allProveedores: string[];
  proveedor: string;
  lista: string;
  desde: string;
  hasta: string;
  condicion: string;
}) {
  const { update, isPending } = useQueryParams();
  const [proveedorInput, setProveedorInput] = useState(proveedor);
  const [exporting, setExporting] = useState(false);
  const proveedorSet = new Set(allProveedores);

  function onProveedorChange(value: string) {
    setProveedorInput(value);
    const trimmed = value.trim();
    if (trimmed === "" || proveedorSet.has(trimmed)) {
      update({ proveedor: trimmed || null, page: null });
    }
  }

  function restablecer() {
    setProveedorInput("");
    update({ proveedor: null, lista: null, desde: null, hasta: null, condicion: null, page: null });
  }

  async function exportar() {
    setExporting(true);
    try {
      const filters: CambiosPreciosFilters = {
        condicion: condicion || undefined,
        proveedor: proveedor || undefined,
        lista: (lista as CambiosPreciosFilters["lista"]) || "",
        desde: desde || undefined,
        hasta: hasta || undefined,
      };
      const csv = await exportarCambiosPreciosCSV(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `desglose_${condicion || "todas"}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Proveedor
        </label>
        <Input
          list="cambios-precios-proveedores"
          placeholder="Todos los proveedores"
          value={proveedorInput}
          onChange={(e) => onProveedorChange(e.target.value)}
          className="w-56"
        />
        <datalist id="cambios-precios-proveedores">
          {allProveedores.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Lista de precios
        </label>
        <Select
          items={LISTA_ITEMS}
          value={lista}
          onValueChange={(next) => update({ lista: (next as string) || null, page: null })}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LISTA_ITEMS).map(([value, label]) => (
              <SelectItem key={value || "all"} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Rango de fecha
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            defaultValue={desde}
            onChange={(e) => update({ desde: e.target.value || null, page: null })}
            className="w-40"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            defaultValue={hasta}
            onChange={(e) => update({ hasta: e.target.value || null, page: null })}
            className="w-40"
          />
        </div>
      </div>

      {isPending && <Spinner className="size-4 text-muted-foreground" />}

      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={exportar} disabled={exporting}>
          {exporting ? <Spinner className="size-4" /> : <Download className="size-4" />}
          Exportar CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={restablecer}>
          <RotateCcw className="size-4" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
