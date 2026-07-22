"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayFecha, fmtCOP } from "@/lib/autorizacion-compras-constants";
import type { PriorityGroup } from "@/lib/autorizacion-compras";

export function PriorityList({ groups }: { groups: PriorityGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>;
  }

  return (
    <div className="flex flex-col">
      {groups.map((g, i) => {
        const porEncima = g.difValor >= 0;
        const multi = g.facturas.length > 1;
        const open = openKey === g.key;
        return (
          <div key={g.key} className="border-b last:border-0">
            <div
              className={cn(
                "grid grid-cols-[24px_1fr_auto] items-center gap-3 border-l-2 py-2.5 pl-2 text-sm",
                porEncima ? "border-l-red-500" : "border-l-emerald-500",
                multi && "cursor-pointer hover:bg-muted/40",
              )}
              onClick={() => multi && setOpenKey(open ? null : g.key)}
            >
              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                {multi && (
                  <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
                )}
                {i + 1}
              </span>
              <span className="min-w-0 truncate">
                <span className="font-medium">{g.nombreArticulo}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {g.codArticulo} · {g.proveedor} ·{" "}
                  {multi ? `${g.facturas.length} facturas` : `Factura ${g.facturas[0].nroFactura}`}
                </span>
              </span>
              <span
                className={cn(
                  "font-mono text-sm font-semibold",
                  porEncima ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {fmtCOP.format(g.difValor)}
              </span>
            </div>
            {multi && open && (
              <div className="flex flex-col gap-1 py-1 pb-3 pl-9 text-xs">
                {g.facturas.map((f, fi) => (
                  <div key={fi} className="flex items-center justify-between text-muted-foreground">
                    <span>
                      Factura {f.nroFactura}{" "}
                      <span className="font-mono">({displayFecha(f.fechaFactura)})</span>
                    </span>
                    <span className="font-mono font-semibold">{fmtCOP.format(f.difValor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
