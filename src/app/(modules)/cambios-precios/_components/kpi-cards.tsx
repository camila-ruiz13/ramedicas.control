import { Card, CardContent } from "@/components/ui/card";
import { fmtNum, fmtPct } from "@/lib/cambios-precios-constants";
import { cn } from "@/lib/utils";

export function CambiosPreciosKpiCards({
  total,
  proveedores,
  aumentos,
  disminuciones,
  variacionPromedio,
}: {
  total: number;
  proveedores: number;
  aumentos: number;
  disminuciones: number;
  variacionPromedio: number | null;
}) {
  const items = [
    { label: "Total registros", value: fmtNum.format(total) },
    { label: "Proveedores", value: fmtNum.format(proveedores), className: "text-violet-600 dark:text-violet-400" },
    { label: "Aumentos", value: fmtNum.format(aumentos), className: "text-red-600 dark:text-red-400" },
    { label: "Disminuciones", value: fmtNum.format(disminuciones), className: "text-emerald-600 dark:text-emerald-400" },
    {
      label: "Variación promedio (aumento/disminución)",
      value: variacionPromedio === null ? "—" : fmtPct(variacionPromedio),
      className: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className={cn("text-2xl font-bold", item.className)}>{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
