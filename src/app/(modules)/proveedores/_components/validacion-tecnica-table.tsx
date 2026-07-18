"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import type { ProviderRowFase2 } from "@/lib/proveedores";

export function ValidacionTecnicaTable({
  providers,
  page,
  totalPages,
  totalCount,
  sortField,
  sortDir,
}: {
  providers: ProviderRowFase2[];
  page: number;
  totalPages: number;
  totalCount: number;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Pendientes de Validación — Técnica</h3>
        <p className="text-xs text-muted-foreground">
          Documentos que el proveedor ya subió (Sin Validar) esperando revisión de Técnica,
          frente a los que ya fueron revisados (Aprobado/Rechazado).
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead
              field="proveedor"
              initialField={sortField}
              initialDir={sortDir}
              sortParam="tsort"
              dirParam="tdir"
              pageParam="tpage"
            >
              Proveedor
            </SortableHead>
            <SortableHead
              field="subidoParaValidar"
              initialField={sortField}
              initialDir={sortDir}
              sortParam="tsort"
              dirParam="tdir"
              pageParam="tpage"
            >
              Docs. subidos
            </SortableHead>
            <SortableHead
              field="validados"
              initialField={sortField}
              initialDir={sortDir}
              sortParam="tsort"
              dirParam="tdir"
              pageParam="tpage"
            >
              Validados
            </SortableHead>
            <SortableHead
              field="sinValidar"
              initialField={sortField}
              initialDir={sortDir}
              sortParam="tsort"
              dirParam="tdir"
              pageParam="tpage"
            >
              Pendientes por validar
            </SortableHead>
            <SortableHead
              field="pctValidacion"
              initialField={sortField}
              initialDir={sortDir}
              sortParam="tsort"
              dirParam="tdir"
              pageParam="tpage"
            >
              % Validado
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay documentos pendientes de validación técnica.
              </TableCell>
            </TableRow>
          )}
          {providers.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.proveedor}</TableCell>
              <TableCell>{p.subidoParaValidar}</TableCell>
              <TableCell>{p.validados}</TableCell>
              <TableCell>
                <span
                  className={
                    p.sinValidar > 0
                      ? "font-semibold text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {p.sinValidar}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={p.pctValidacion} className="h-2 w-28" />
                  <span className="w-12 text-xs font-semibold">{p.pctValidacion}%</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 pb-4">
        <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} pageParam="tpage" />
      </div>
    </div>
  );
}
