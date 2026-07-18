import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Placeholder module: replace with a real query (e.g. via Prisma) once
// the `tareas` table exists. This shows the expected page shape for new modules.
export default function TareasPage() {
  const tareas: { id: string; titulo: string; estado: string }[] = [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tareas</h1>
        <p className="text-muted-foreground">
          Ejemplo de módulo — reemplazar con datos reales.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tareas.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                Sin tareas todavía.
              </TableCell>
            </TableRow>
          )}
          {tareas.map((tarea) => (
            <TableRow key={tarea.id}>
              <TableCell>{tarea.titulo}</TableCell>
              <TableCell>{tarea.estado}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
