"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { colorDeCondicion, fmtNum } from "@/lib/cambios-precios-constants";
import type { CondicionCount } from "@/lib/cambios-precios";

export function CondicionDonut({ rows }: { rows: CondicionCount[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);

  const data = rows.map((r) => ({
    condicion: r.condicion,
    value: r.count,
    fill: colorDeCondicion(r.condicion).color,
  }));

  const config: ChartConfig = Object.fromEntries(
    rows.map((r) => [r.condicion, { label: r.condicion, color: colorDeCondicion(r.condicion).color }]),
  );

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto aspect-square max-h-[180px] w-full">
        <ChartContainer config={config} className="aspect-square max-h-[180px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="condicion" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="condicion" innerRadius={50} outerRadius={80}>
              {data.map((entry) => (
                <Cell key={entry.condicion} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{fmtNum.format(total)}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Registros</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.condicion} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: colorDeCondicion(r.condicion).color }}
              />
              <span className="truncate">{r.condicion}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {fmtNum.format(r.count)}{" "}
              <span className="text-muted-foreground">
                ({total ? Math.round((r.count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
