import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServerSearchInput } from "@/components/server-search-input";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import { cn } from "@/lib/utils";
import { ESTADO_LABELS, ESTADO_BADGE_CLASSES, type ProrrogaRow } from "@/lib/prorroga-proveedores-constants";

export function DetailTable({
  rows,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
}: {
  rows: ProrrogaRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ServerSearchInput placeholder="Buscar proveedor o NIT..." defaultValue={search} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="proveedor" initialField={sortField} initialDir={sortDir}>
                Proveedor
              </SortableHead>
              <SortableHead field="nit" initialField={sortField} initialDir={sortDir}>
                NIT
              </SortableHead>
              <SortableHead field="estado" initialField={sortField} initialDir={sortDir}>
                Estado
              </SortableHead>
              <SortableHead field="excepcion" initialField={sortField} initialDir={sortDir}>
                Excepción
              </SortableHead>
              <SortableHead field="observacion" initialField={sortField} initialDir={sortDir}>
                Observación
              </SortableHead>
              <SortableHead field="anexo" initialField={sortField} initialDir={sortDir}>
                Anexo en Drive
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={`${r.nit}-${r.proveedor}`}>
                <TableCell className="max-w-64 truncate font-medium" title={r.proveedor}>
                  {r.proveedor}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.nit}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border-none", ESTADO_BADGE_CLASSES[r.estado])}>
                    {ESTADO_LABELS[r.estado]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-56 whitespace-normal break-words text-muted-foreground">
                  {r.excepcion || "—"}
                </TableCell>
                <TableCell className="max-w-72 whitespace-normal break-words text-muted-foreground">
                  {r.observacion || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.anexo || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}
