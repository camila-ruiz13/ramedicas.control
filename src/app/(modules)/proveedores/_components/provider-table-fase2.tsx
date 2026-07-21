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
import { fetchSupplierProductsFase2 } from "../actions";
import type { ProviderRowFase2, ProductEntry } from "@/lib/proveedores";

export function ProviderTableFase2({
  providers,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
  filterValue,
}: {
  providers: ProviderRowFase2[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
  filterValue: string;
}) {
  const [selected, setSelected] = useState<ProviderRowFase2 | null>(null);
  const [productos, setProductos] = useState<ProductEntry[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function openDetail(provider: ProviderRowFase2) {
    setSelected(provider);
    setProductos(null);
    startTransition(async () => {
      const result = await fetchSupplierProductsFase2(provider.id);
      setProductos(result);
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
              <SortableHead field="articulos" initialField={sortField} initialDir={sortDir}>
                Artículos
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}
            {providers.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                <TableCell className="font-medium">{p.proveedor}</TableCell>
                <TableCell>{p.articulos}</TableCell>
                <TableCell>{p.total}</TableCell>
                <TableCell>{p.pendientes}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={p.pct} className="h-2 w-28" />
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
        <DialogContent className="max-w-5xl sm:max-w-5xl">
          {selected && (
            <>
              <DialogHeader className="-mx-4 -mt-4 border-b px-5 pt-4 pb-3">
                <DialogTitle>{selected.proveedor}</DialogTitle>
                <DialogDescription>
                  {selected.articulos} artículo(s) — {selected.pct}% de cumplimiento (sin
                  &quot;No Aplica&quot;)
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                {isPending || productos === null ? (
                  <p className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Cargando artículos...
                  </p>
                ) : (
                  productos.map((prod) => (
                    <div key={`${prod.codigo}-${prod.articulo}`} className="rounded-lg border">
                      <div className="border-b bg-muted/50 px-3 py-2 text-sm font-medium">
                        {prod.articulo}{" "}
                        <span className="font-normal text-muted-foreground">({prod.codigo})</span>
                      </div>
                      {prod.docs.map((d) => (
                        <div
                          key={d.doc}
                          className="flex items-center justify-between gap-3 border-t p-2 text-sm first:border-t-0"
                        >
                          <span>{d.doc}</span>
                          <StatusBadge status={d.status} />
                        </div>
                      ))}
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
