import { Card, CardContent } from "@/components/ui/card";
import { pctTextClass } from "@/lib/proveedores-constants";
import { cn } from "@/lib/utils";

export function KpiCards({
  totalProveedores,
  avgPct,
  completos,
  criticos,
}: {
  totalProveedores: number;
  avgPct: number;
  completos: number;
  criticos: number;
}) {
  const items = [
    { label: "Total proveedores", value: totalProveedores },
    { label: "Promedio de cumplimiento", value: `${avgPct}%`, className: pctTextClass(avgPct) },
    { label: "Proveedores al 100%", value: completos, className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Proveedores < 60% (críticos)", value: criticos, className: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className={cn("text-3xl font-bold", item.className)}>{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
