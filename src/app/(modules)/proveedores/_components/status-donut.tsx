"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from "@/lib/proveedores-constants";
import type { DocStatus } from "@/generated/prisma/client";

export function StatusDonut({ counts }: { counts: Record<DocStatus, number> }) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    value: counts[status],
    fill: STATUS_COLORS[status],
  })).filter((d) => d.value > 0);

  const config: ChartConfig = Object.fromEntries(
    STATUS_ORDER.map((status) => [
      STATUS_LABELS[status],
      { label: STATUS_LABELS[status], color: STATUS_COLORS[status] },
    ]),
  );

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-3">
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[200px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.status} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: d.fill }}
              />
              {d.label}
            </span>
            <span className="font-medium tabular-nums">
              {d.value.toLocaleString("es-CO")}{" "}
              <span className="text-muted-foreground">
                ({Math.round((d.value / total) * 100)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
