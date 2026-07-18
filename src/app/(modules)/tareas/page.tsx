import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";

// Placeholder module: replace with a real query (e.g. via Prisma) once
// the `tareas` table exists. This shows the expected page shape for new modules.
export default async function TareasPage() {
  await requireModuleView("tareas");
  const tareas: { id: string; titulo: string; estado: string }[] = [];
  const moduleDef = MODULES.find((m) => m.slug === "tareas")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <Icon className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            Ejemplo de módulo — reemplazar con datos reales.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border">
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
    </div>
  );
}
