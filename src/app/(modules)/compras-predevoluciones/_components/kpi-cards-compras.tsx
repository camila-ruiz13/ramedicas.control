import { Card, CardContent } from "@/components/ui/card";
import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import { fmtNum } from "@/lib/cambios-precios-constants";

export function KpiCardsCompras({
  compraTotal,
  unidades,
  facturas,
  proveedoresActivos,
  registros,
}: {
  compraTotal: number;
  unidades: number;
  facturas: number;
  proveedoresActivos: number;
  registros: number;
}) {
  const items = [
    { label: "Compra total", value: fmtCOP.format(compraTotal) },
    { label: "Unidades", value: fmtNum.format(unidades) },
    { label: "Facturas", value: fmtNum.format(facturas) },
    { label: "Proveedores activos", value: fmtNum.format(proveedoresActivos) },
    { label: "Líneas de compra", value: fmtNum.format(registros) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl font-bold">{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
