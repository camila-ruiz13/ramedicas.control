import { FlaskConical } from "lucide-react";
import { requireModuleView, canInteract } from "@/lib/permissions";
import { getFase2AllProviders, summarizeStatus, applyStatusFilter } from "@/lib/proveedores";
import { parsePageParams, paginate } from "@/lib/pagination";
import { MODULE_COLOR_CLASSES } from "@/lib/modules";
import { ProveedoresSubNav } from "./_components/sub-nav";
import { SyncForm } from "./_components/sync-form";
import { KpiCards } from "./_components/kpi-cards";
import { StatusDonut } from "./_components/status-donut";
import { ProviderTableFase2 } from "./_components/provider-table-fase2";
import { ValidacionTecnicaTable } from "./_components/validacion-tecnica-table";

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireModuleView("proveedores");
  const sp = await searchParams;

  const mainParams = parsePageParams(sp, { defaultSort: "pct", pageSize: 20 });
  const tecnicaParams = parsePageParams(sp, {
    prefix: "t",
    defaultSort: "sinValidar",
    defaultDir: "desc",
    pageSize: 15,
  });

  const filterValue = (Array.isArray(sp.filter) ? sp.filter[0] : sp.filter) ?? "all";

  const all = await getFase2AllProviders();
  const main = paginate(applyStatusFilter(all, filterValue), mainParams, ["proveedor"]);
  const tecnica = paginate(
    all.filter((p) => p.subidoParaValidar > 0),
    tecnicaParams,
    ["proveedor"],
  );
  const summary = summarizeStatus(all);
  const colors = MODULE_COLOR_CLASSES.amber;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <FlaskConical className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Cumplimiento Documental — Segunda Fase
          </h1>
          <p className="text-muted-foreground">
            Documentación técnica/regulatoria por producto, agrupada por proveedor.
          </p>
        </div>
      </div>

      <ProveedoresSubNav />

      {canInteract(profile, "proveedores") && <SyncForm />}

      <KpiCards
        totalProveedores={summary.totalProveedores}
        avgPct={summary.avgPct}
        completos={summary.completos}
        criticos={summary.criticos}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Estado global de todos los documentos</h3>
          <StatusDonut counts={summary.overall} />
        </div>
        <ProviderTableFase2
          providers={main.rows}
          page={main.page}
          totalPages={main.totalPages}
          totalCount={main.totalCount}
          search={mainParams.search}
          sortField={mainParams.sortField}
          sortDir={mainParams.sortDir}
          filterValue={filterValue}
        />
      </div>

      <ValidacionTecnicaTable
        providers={tecnica.rows}
        page={tecnica.page}
        totalPages={tecnica.totalPages}
        totalCount={tecnica.totalCount}
        sortField={tecnicaParams.sortField}
        sortDir={tecnicaParams.sortDir}
      />
    </div>
  );
}
