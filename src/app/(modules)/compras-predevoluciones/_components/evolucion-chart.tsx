"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import { fmtNum } from "@/lib/cambios-precios-constants";
import type { EvolucionPunto } from "@/lib/compras-predevoluciones";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// Recibe un discriminante en vez de una función formateadora: las funciones
// no se pueden pasar de un Server Component a este Client Component.
export function EvolucionChart({
  anios,
  puntos,
  unidad,
}: {
  anios: string[];
  puntos: EvolucionPunto[];
  unidad: "money" | "unidades";
}) {
  const valueFormatter = (n: number) => (unidad === "money" ? fmtCOP.format(n) : fmtNum.format(n));
  if (anios.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sin datos para este filtro
      </div>
    );
  }

  const config: ChartConfig = Object.fromEntries(
    anios.map((a, i) => [a, { label: a, color: COLORS[i % COLORS.length] }]),
  );
  const data = puntos.map((p) => ({ mesLabel: p.mesLabel, ...p.porAnio }));

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 4, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mesLabel" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => valueFormatter(Number(v))}
        />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => valueFormatter(Number(value))} />} />
        <Legend />
        {anios.map((a) => (
          <Bar key={a} dataKey={a} fill={`var(--color-${a})`} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
