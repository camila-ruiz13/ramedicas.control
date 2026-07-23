"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";
import type { Vista } from "@/lib/prorroga-proveedores";

const TABS: { value: Vista; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "excepcion", label: "Con excepción" },
  { value: "observacion", label: "Con observación" },
  { value: "pendientes", label: "⚠ Pendientes" },
];

export function VistaTabs({ vista }: { vista: Vista }) {
  const { update } = useQueryParams();

  return (
    <div className="flex flex-wrap gap-1.5">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => update({ vista: tab.value === "todos" ? null : tab.value, estado: null, page: null })}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            vista === tab.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
