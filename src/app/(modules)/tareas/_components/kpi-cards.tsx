import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TareasKpiCards({
  vencidas,
  enTiempo,
  cumplimientoPct,
}: {
  vencidas: number;
  enTiempo: number;
  cumplimientoPct: number | null;
}) {
  const items = [
    {
      label: "Vencidas",
      value: vencidas,
      className: vencidas > 0 ? "text-red-600 dark:text-red-400" : undefined,
    },
    {
      label: "En tiempo",
      value: enTiempo,
      className: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "% cerradas a tiempo",
      value: cumplimientoPct === null ? "—" : `${cumplimientoPct}%`,
      className:
        cumplimientoPct !== null && cumplimientoPct < 60
          ? "text-red-600 dark:text-red-400"
          : "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
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
