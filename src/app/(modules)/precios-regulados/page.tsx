import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { SubmitButton } from "@/components/submit-button";
import { getInfoGeneral } from "@/lib/info-general";
import { actualizarPreciosRegulados } from "./actions";
import { PreciosReguladosSubNav } from "./_components/sub-nav";
import { InfoGeneralBarChart, type InfoGeneralBar } from "./_components/info-general-bar-chart";

// Pestaña principal de Astapor: resumen del portafolio completo de
// artículos (hoja "BASE MANTIS ARTÍCULOS"), sin cruzarlo con la circular de
// regulación como las otras dos pestañas. A pedido de Camila (2026-07-31),
// es la primera que se abre al entrar al módulo — antes era "Circular 19 vs
// 22" (ahora en /precios-regulados/circular-19-vs-22).
export default async function InfoGeneralPage() {
  await requireModuleView("precios-regulados");

  const moduleDef = MODULES.find((m) => m.slug === "precios-regulados")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const counts = await getInfoGeneral();

  const data: InfoGeneralBar[] = [
    { label: "Total", value: counts.total, fill: "#1e3a8a" },
    { label: "Descontinuados", value: counts.descontinuados, fill: "#f97316" },
    { label: "Activos", value: counts.activos, fill: "#6b7280" },
    { label: "Control directo", value: counts.controlDirecto, fill: "#ec4899" },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
            <Icon className={`size-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Control Directo</h1>
            <p className="text-muted-foreground">
              Info General — {counts.total} artículos en BASE MANTIS ARTÍCULOS
            </p>
          </div>
        </div>
        <form action={actualizarPreciosRegulados}>
          <SubmitButton variant="outline" size="sm" pendingText="Actualizando...">
            <RefreshCw className="size-4" />
            Actualizar
          </SubmitButton>
        </form>
      </div>

      <PreciosReguladosSubNav />

      <div className="min-w-0 rounded-xl border bg-card p-4 lg:w-1/2">
        <h3 className="mb-3 text-sm font-semibold">Info General</h3>
        <InfoGeneralBarChart data={data} />
      </div>
    </div>
  );
}
