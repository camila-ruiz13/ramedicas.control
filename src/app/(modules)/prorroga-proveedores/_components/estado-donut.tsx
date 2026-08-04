"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
type Item = { estado: string; count: number };

// Parametrizado por labels/colores (en vez de importar ESTADO_LABELS
// directo) para poder reutilizarlo también con SI_NO_PENDIENTE_LABELS en
// las gráficas de Control Directo, sin duplicar este componente.
export function EstadoDonut({
  counts,
  labels,
  colors,
}: {
  counts: Item[];
  labels: Record<string, string>;
  colors: Record<string, string>;
}) {
  if (counts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  const data = counts.map((c) => ({ label: labels[c.estado], value: c.count, fill: colors[c.estado] }));
  const config: ChartConfig = Object.fromEntries(
    counts.map((c) => [labels[c.estado], { label: labels[c.estado], color: colors[c.estado] }]),
  );
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <div className="h-[180px] w-[180px]">
        <ChartContainer config={config} className="aspect-square h-[180px] w-[180px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80}>
              {data.map((d) => (
                <Cell key={d.label} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <div className="flex flex-col gap-1.5">
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
