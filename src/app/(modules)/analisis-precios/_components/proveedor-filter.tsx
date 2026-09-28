"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryParams } from "@/components/use-query-params";

// Antes era un <Select> con los 239 proveedores en una lista larga sin
// filtrar — Camila pidió que se pueda ir escribiendo y te muestre
// coincidencias para elegir, igual que el buscador de código del simulador
// (2026-09-28).
export function ProveedorFilter({ proveedores, value }: { proveedores: string[]; value: string }) {
  const { update } = useQueryParams();
  const [query, setQuery] = useState(value);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Si el filtro se limpia/cambia desde otro lado (ej. otro filtro en
  // cascada lo vacía), el texto del buscador debe reflejarlo.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const matches = useMemo(() => {
    const q = query.trim().toUpperCase();
    const base = q ? proveedores.filter((p) => p.toUpperCase().includes(q)) : proveedores;
    return base.slice(0, 30);
  }, [query, proveedores]);

  function seleccionar(p: string) {
    setQuery(p);
    setDropdownOpen(false);
    update({ proveedor: p, page: null });
  }

  function limpiar() {
    setQuery("");
    setDropdownOpen(false);
    update({ proveedor: null, page: null });
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Proveedor</label>
      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          placeholder="Todos los proveedores"
          className="pl-7 pr-7"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={limpiar}
            aria-label="Quitar filtro de proveedor"
            className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {dropdownOpen && (
        <div className="absolute top-full z-30 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border bg-card shadow-md">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={limpiar}
            className="block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            Todos los proveedores
          </button>
          {matches.map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => seleccionar(p)}
              className="block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-muted"
              title={p}
            >
              {p}
            </button>
          ))}
          {matches.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados.</p>}
        </div>
      )}
    </div>
  );
}
