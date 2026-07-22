import { Card, CardContent } from "@/components/ui/card";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView, canInteract } from "@/lib/permissions";
import { getResumenActual, getUltimaSincronizacion } from "@/lib/descuentos-proveedores";
import { fmtNum } from "@/lib/cambios-precios-constants";
import { SyncForm } from "./_components/sync-form";
import { DescuentosSubNav } from "./_components/sub-nav";

// Página de verificación (fase 1 del plan): solo confirma que los conteos
// reales cargados desde Drive coinciden con lo esperado, antes de construir
// el motor de cálculo y las dos vistas (por compra / por artículo).
export default async function DescuentosProveedoresPage() {
  const profile = await requireModuleView("descuentos-proveedores");
  const moduleDef = MODULES.find((m) => m.slug === "descuentos-proveedores")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const [resumen, ultimaSync] = await Promise.all([
    getResumenActual(),
    getUltimaSincronizacion(),
  ]);

  const items = [
    { label: "Líneas de compra", value: resumen.compras },
    { label: "Líneas de predevolución", value: resumen.predevoluciones },
    { label: "Ofertas (proveedor+concepto)", value: resumen.ofertas },
    { label: "Productos con % pactado", value: resumen.productos },
    { label: "Cortes de liquidación", value: resumen.cortes },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <Icon className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Descuentos y Rebates</h1>
          <p className="text-muted-foreground">
            {ultimaSync
              ? `Última sincronización: ${ultimaSync.importedAt.toLocaleString("es-CO")} por ${ultimaSync.importedBy}`
              : "Todavía no se ha sincronizado ningún dato."}
          </p>
        </div>
      </div>

      <DescuentosSubNav />

      {canInteract(profile, "descuentos-proveedores") && <SyncForm />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
              <span className="text-2xl font-bold">{fmtNum.format(item.value)}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Esta es una vista de verificación temporal — el paso siguiente es construir el motor de
        cálculo (oferta vigente + tramo mensual + neteo de devoluciones) y validar 2-3 casos
        puntuales antes de armar las vistas &quot;Por artículo&quot; y &quot;Detalle por compra&quot;.
      </p>
    </div>
  );
}
