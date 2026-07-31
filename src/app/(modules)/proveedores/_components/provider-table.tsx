"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { pctBarClass } from "@/lib/proveedores-constants";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ServerSearchInput } from "@/components/server-search-input";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import { StatusBadge } from "./status-badge";
import { StatusFilter } from "./status-filter";
import { fetchSupplierDocsFase1 } from "../actions";
import type { ProviderRow, DocEntry } from "@/lib/proveedores";

export function ProviderTable({
  providers,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
  filterValue,
}: {
  providers: ProviderRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
  filterValue: string;
}) {
  const [selected, setSelected] = useState<ProviderRow | null>(null);
  const [docs, setDocs] = useState<DocEntry[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function openDetail(provider: ProviderRow) {
    setSelected(provider);
    setDocs(null);
    startTransition(async () => {
      const result = await fetchSupplierDocsFase1(provider.id);
      setDocs(result);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ServerSearchInput
          placeholder="Filtrar por nombre de proveedor..."
          defaultValue={search}
        />
        <StatusFilter value={filterValue} />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="proveedor" initialField={sortField} initialDir={sortDir}>
                Proveedor
              </SortableHead>
              <SortableHead field="total" initialField={sortField} initialDir={sortDir}>
                Total docs
              </SortableHead>
              <SortableHead field="pendientes" initialField={sortField} initialDir={sortDir}>
                Pendientes
              </SortableHead>
              <SortableHead field="pct" initialField={sortField} initialDir={sortDir}>
                % Cumplimiento
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}
            {providers.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                <TableCell className="font-medium">{p.proveedor}</TableCell>
                <TableCell>{p.total}</TableCell>
                <TableCell>{p.pendientes}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={p.pct} className="h-2 w-28" indicatorClassName={pctBarClass(p.pct)} />
                    <span className="w-12 text-xs font-semibold">{p.pct}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          {selected && (
            <>
              <DialogHeader className="-mx-4 -mt-4 border-b px-5 pt-4 pb-3">
                <DialogTitle>{selected.proveedor}</DialogTitle>
                <DialogDescription>
                  {selected.aprobados} de {selected.total} documentos aprobados — {selected.pct}%
                  de cumplimiento (incumplimiento = no subidos)
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[28rem] overflow-y-auto rounded-lg border">
                {isPending || docs === null ? (
                  <p className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Cargando documentos...
                  </p>
                ) : (
                  docs.map((d) => (
                    <div
                      key={d.doc}
                      className="flex items-center justify-between gap-3 border-b p-2.5 text-sm last:border-0"
                    >
                      <span>{d.doc}</span>
                      <StatusBadge status={d.status} />
                    </div>
                  ))
                )}
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cerrar</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
