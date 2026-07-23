"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ESTADO_LABELS, ESTADO_COLORS, type EstadoCount } from "@/lib/prorroga-proveedores-constants";

export function EstadoBarChart({ counts }: { counts: EstadoCount[] }) {
  if (counts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  const data = counts.map((c) => ({ label: ESTADO_LABELS[c.estado], value: c.count, fill: ESTADO_COLORS[c.estado] }));
  const config: ChartConfig = Object.fromEntries(
    counts.map((c) => [ESTADO_LABELS[c.estado], { label: ESTADO_LABELS[c.estado], color: ESTADO_COLORS[c.estado] }]),
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-52 w-full">
      <BarChart data={data} margin={{ left: 4, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
