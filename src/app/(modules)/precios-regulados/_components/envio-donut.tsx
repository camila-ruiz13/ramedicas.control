"use client";

import { useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type EnvioDonutSlice = { label: string; value: number; fill: string; bucket: string };
export type ProveedorEnvioResumen = { proveedor: string; count: number };

// Mismo patrón visual que PortafolioDonut, pero para la torta de
// Enviado/No enviado/Sin dato que pidió Camila (2026-08-12) al lado de la
// de Portafolio vs. circular 22 — se separa en su propio componente en vez
// de generalizar PortafolioDonut porque este no tiene el tipo
// PortafolioVsCircular detrás, son solo 3 categorías fijas.
//
// Clic en una porción o en su fila de la leyenda (a pedido de Camila,
// 2026-08-12) abre el listado de proveedores de esa categoría — mismo
// patrón de Dialog que ProveedoresPorEncimaList.
export function EnvioDonut({
  data,
  proveedoresPorBucket,
}: {
  data: EnvioDonutSlice[];
  proveedoresPorBucket: Record<string, ProveedorEnvioResumen[]>;
}) {
  const [selected, setSelected] = useState<EnvioDonutSlice | null>(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  const config: ChartConfig = Object.fromEntries(data.map((d) => [d.label, { label: d.label, color: d.fill }]));
  const seleccionados = selected ? (proveedoresPorBucket[selected.bucket] ?? []) : [];

  return (
    <>
      <div className="grid grid-cols-[140px_1fr] items-center gap-3">
        <div className="h-[140px] w-[140px]">
          <ChartContainer config={config} className="aspect-square h-[140px] w-[140px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={38} outerRadius={62}>
                {data.map((d) => (
                  <Cell key={d.label} fill={d.fill} className="cursor-pointer" onClick={() => setSelected(d)} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        <div className="flex flex-col gap-1.5">
          {data.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setSelected(d)}
              className="flex items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-muted/60"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.label}
              </span>
              <span className="font-medium tabular-nums">
                {d.value.toLocaleString("es-CO")}{" "}
                <span className="text-muted-foreground">({Math.round((d.value / total) * 100)}%)</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md sm:max-w-md">
          {selected && (
            <>
              <DialogHeader className="-mx-4 -mt-4 border-b px-5 pt-4 pb-3">
                <DialogTitle className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.fill }} />
                  {selected.label}
                </DialogTitle>
                <DialogDescription>{seleccionados.length} proveedores</DialogDescription>
              </DialogHeader>
              <div className="max-h-[24rem] overflow-y-auto">
                {seleccionados.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Sin proveedores en esta categoría.</p>
                ) : (
                  <ul className="divide-y">
                    {seleccionados.map((p) => (
                      <li key={p.proveedor} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <span className="min-w-0 truncate">{p.proveedor}</span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{p.count} prod.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cerrar</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
