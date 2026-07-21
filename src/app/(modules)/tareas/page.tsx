import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ESTADO_LABELS, formatFecha, getIndicador } from "@/lib/tareas-constants";
import { IndicadorBadge } from "./_components/indicador-badge";
import { TareasKpiCards } from "./_components/kpi-cards";
import { createTarea, updateEstado, deleteTarea } from "./actions";

const ESTADO_ITEMS: Record<string, string> = ESTADO_LABELS;

export default async function TareasPage() {
  const profile = await requireModuleView("tareas");
  const moduleDef = MODULES.find((m) => m.slug === "tareas")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const tareas = await prisma.tarea.findMany({
    where: { profileId: profile.id },
    orderBy: { fechaObjetivo: "asc" },
  });

  const withIndicador = tareas.map((tarea) => ({
    tarea,
    indicador: getIndicador(tarea),
  }));

  const vencidas = withIndicador.filter((t) => t.indicador === "VENCIDA").length;
  const enTiempo = withIndicador.filter((t) => t.indicador === "EN_TIEMPO").length;
  const completadas = withIndicador.filter(
    (t) => t.indicador === "COMPLETADA_A_TIEMPO" || t.indicador === "COMPLETADA_TARDE",
  );
  const cumplimientoPct =
    completadas.length === 0
      ? null
      : Math.round(
          (completadas.filter((t) => t.indicador === "COMPLETADA_A_TIEMPO").length /
            completadas.length) *
            100,
        );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <Icon className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            Tus tareas, con fecha objetivo y si van a tiempo.
          </p>
        </div>
      </div>

      <TareasKpiCards vencidas={vencidas} enTiempo={enTiempo} cumplimientoPct={cumplimientoPct} />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nueva tarea</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTarea} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" name="titulo" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fechaObjetivo">Fecha objetivo de cierre</Label>
              <Input id="fechaObjetivo" name="fechaObjetivo" type="date" required />
            </div>
            <SubmitButton className="w-fit" pendingText="Creando...">
              Crear tarea
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Fecha objetivo</TableHead>
              <TableHead>Fecha real de cierre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Indicador</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withIndicador.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin tareas todavía.
                </TableCell>
              </TableRow>
            )}
            {withIndicador.map(({ tarea, indicador }) => (
              <TableRow key={tarea.id}>
                <TableCell>{tarea.titulo}</TableCell>
                <TableCell>{formatFecha(tarea.fechaObjetivo)}</TableCell>
                <TableCell>
                  {tarea.fechaCompletada ? formatFecha(tarea.fechaCompletada) : "—"}
                </TableCell>
                <TableCell>
                  <form action={updateEstado} className="flex items-center gap-2">
                    <input type="hidden" name="tareaId" value={tarea.id} />
                    <Select
                      key={tarea.estado}
                      name="estado"
                      defaultValue={tarea.estado}
                      items={ESTADO_ITEMS}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <SubmitButton size="sm" variant="outline" pendingText="Guardando...">
                      Guardar
                    </SubmitButton>
                  </form>
                </TableCell>
                <TableCell>
                  <IndicadorBadge indicador={indicador} fechaObjetivo={tarea.fechaObjetivo} />
                </TableCell>
                <TableCell>
                  <form action={deleteTarea}>
                    <input type="hidden" name="tareaId" value={tarea.id} />
                    <SubmitButton size="sm" variant="ghost">
                      <Trash2 className="size-4 text-destructive" />
                    </SubmitButton>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
