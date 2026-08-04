import { Card, CardContent } from "@/components/ui/card";
import { fmtNum } from "@/lib/cambios-precios-constants";
import type { SiNoPendiente } from "@/lib/prorroga-proveedores-constants";

export function ControlDirectoKpiCards({
  enviado,
  sistema,
  totalArticulos,
}: {
  enviado: Record<SiNoPendiente, number>;
  sistema: Record<SiNoPendiente, number>;
  totalArticulos: number;
}) {
  const items = [
    { label: "Ya enviaron documento CD", value: enviado.SI, color: "#22c55e" },
    { label: "Pendientes por enviar", value: enviado.NO + enviado.PENDIENTE, color: "#eab308" },
    { label: "Códigos en Control Directo", value: totalArticulos, color: "#0ea5e9" },
    { label: "Ya realizado en el sistema", value: sistema.SI, color: "#22c55e" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} style={{ borderTopColor: item.color, borderTopWidth: 3 }}>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl font-bold">{fmtNum.format(item.value)}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
