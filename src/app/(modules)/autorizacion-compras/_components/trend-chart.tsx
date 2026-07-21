"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { displayFecha, fmtCOP } from "@/lib/autorizacion-compras-constants";
import type { TrendPoint } from "@/lib/autorizacion-compras";

const config: ChartConfig = {
  count: { label: "Autorizaciones / día", color: "var(--chart-1)" },
};

export function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Sin datos para este filtro
      </div>
    );
  }

  const data = points.map((p) => ({ ...p, fechaLabel: displayFecha(p.fecha) }));

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="fechaLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelKey="fechaLabel"
              formatter={(value, name) =>
                name === "count" ? [`${value} autorizaciones`, ""] : [fmtCOP.format(Number(value)), ""]
              }
            />
          }
        />
        <Area
          dataKey="count"
          type="monotone"
          fill="var(--color-count)"
          fillOpacity={0.15}
          stroke="var(--color-count)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
