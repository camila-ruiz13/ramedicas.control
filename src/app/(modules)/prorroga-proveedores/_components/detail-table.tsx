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
import { fmtNum } from "@/lib/cambios-precios-constants";
import {
  ESTADO_LABELS,
  ESTADO_BADGE_CLASSES,
  SI_NO_PENDIENTE_LABELS,
  SI_NO_PENDIENTE_BADGE_CLASSES,
  type ProrrogaRow,
} from "@/lib/prorroga-proveedores-constants";

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
              <SortableHead field="proveedor" initialField={sortField} initialDir={sortDir} className="text-center">
                Proveedor
              </SortableHead>
              <SortableHead field="nit" initialField={sortField} initialDir={sortDir} className="text-center">
                NIT
              </SortableHead>
              <SortableHead field="estado" initialField={sortField} initialDir={sortDir} className="text-center">
                Estado
              </SortableHead>
              <SortableHead field="excepcion" initialField={sortField} initialDir={sortDir} className="text-center">
                Excepción
              </SortableHead>
              <SortableHead field="observacion" initialField={sortField} initialDir={sortDir} className="text-center">
                Observación
              </SortableHead>
              <SortableHead field="numeroArticulos" initialField={sortField} initialDir={sortDir} className="text-center">
                Códigos
              </SortableHead>
              <SortableHead field="controlDirectoEnviado" initialField={sortField} initialDir={sortDir} className="text-center">
                Control Directo
              </SortableHead>
              <SortableHead field="articulosControlDirecto" initialField={sortField} initialDir={sortDir} className="text-center">
                Códigos CD
              </SortableHead>
              <SortableHead field="fechaInicialControlDirecto" initialField={sortField} initialDir={sortDir} className="text-center">
                Fecha Inicial
              </SortableHead>
              <SortableHead field="sistemaRealizado" initialField={sortField} initialDir={sortDir} className="text-center">
                Sistema
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={`${r.nit}-${r.proveedor}`}>
                <TableCell className="max-w-64 truncate font-medium" title={r.proveedor}>
                  {r.proveedor}
                </TableCell>
                <TableCell className="text-center font-mono text-xs text-muted-foreground">{r.nit}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn("border-none", ESTADO_BADGE_CLASSES[r.estado])}>
                    {ESTADO_LABELS[r.estado]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-56 whitespace-normal break-words text-center text-muted-foreground">
                  {r.excepcion || "—"}
                </TableCell>
                <TableCell className="max-w-72 whitespace-normal break-words text-muted-foreground">
                  {r.observacion || "—"}
                </TableCell>
                <TableCell className="text-center font-mono" title={r.numeroArticulos === null ? "No disponible (VLOOKUP sin coincidencia en la hoja)" : undefined}>
                  {r.numeroArticulos === null ? "—" : fmtNum.format(r.numeroArticulos)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn("border-none", SI_NO_PENDIENTE_BADGE_CLASSES[r.controlDirectoEnviado])}>
                    {SI_NO_PENDIENTE_LABELS[r.controlDirectoEnviado]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {r.articulosControlDirecto === null ? "—" : fmtNum.format(r.articulosControlDirecto)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{r.fechaInicialControlDirecto || "—"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn("border-none", SI_NO_PENDIENTE_BADGE_CLASSES[r.sistemaRealizado])}>
                    {SI_NO_PENDIENTE_LABELS[r.sistemaRealizado]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}
