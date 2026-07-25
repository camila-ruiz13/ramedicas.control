"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ESTADO_LABELS, ESTADO_COLORS, type EstadoCount } from "@/lib/prorroga-proveedores-constants";

export function EstadoDonut({ counts }: { counts: EstadoCount[] }) {
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
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={config} className="h-[180px] w-[180px] shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-1 flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.fill }} />
              {d.label}
            </span>
            <span className="font-medium tabular-nums">
              {d.value.toLocaleString("es-CO")}{" "}
              <span className="text-muted-foreground">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
