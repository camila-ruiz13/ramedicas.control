import { ShieldCheck, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { UsuariosSubNav } from "../_components/sub-nav";
import { createRole, deleteRole, updateRolePermissions } from "../actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { Checkbox } from "@/components/ui/checkbox";

const ASSIGNABLE_MODULES = MODULES.filter((m) => !m.adminOnly);

export default async function RolesPage() {
  await requireAdmin();

  const roles = await prisma.role.findMany({
    include: { permissions: true, _count: { select: { profiles: true } } },
    orderBy: { name: "asc" },
  });

  const colors = MODULE_COLOR_CLASSES.sky;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <ShieldCheck className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Definí roles y qué puede ver o hacer cada uno en cada módulo.
          </p>
        </div>
      </div>

      <UsuariosSubNav />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Crear rol</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRole} className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Ej. Supervisor" required />
            </div>
            <SubmitButton pendingText="Creando...">Crear</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {roles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no creaste ningún rol.
          </p>
        )}
        {roles.map((role) => {
          const permissionBySlug = new Map(
            role.permissions.map((p) => [p.moduleSlug, p]),
          );
          return (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>
                      {role._count.profiles} usuario(s) con este rol
                    </CardDescription>
                  </div>
                  <form action={deleteRole}>
                    <input type="hidden" name="roleId" value={role.id} />
                    <SubmitButton size="sm" variant="ghost">
                      <Trash2 className="size-4 text-destructive" />
                    </SubmitButton>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                <form action={updateRolePermissions} className="flex flex-col gap-4">
                  <input type="hidden" name="roleId" value={role.id} />
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Módulo</th>
                          <th className="px-3 py-2 text-left font-medium">Ver</th>
                          <th className="px-3 py-2 text-left font-medium">Interactuar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ASSIGNABLE_MODULES.map((moduleDef) => {
                          const perm = permissionBySlug.get(moduleDef.slug);
                          return (
                            <tr key={moduleDef.slug} className="border-t">
                              <td className="px-3 py-2">{moduleDef.label}</td>
                              <td className="px-3 py-2">
                                <Checkbox
                                  name={`view__${moduleDef.slug}`}
                                  defaultChecked={perm?.canView ?? false}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Checkbox
                                  name={`interact__${moduleDef.slug}`}
                                  defaultChecked={perm?.canInteract ?? false}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <SubmitButton size="sm" className="w-fit" pendingText="Guardando...">
                    Guardar permisos
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
