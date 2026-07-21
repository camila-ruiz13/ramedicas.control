import { Users as UsersIcon, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MODULE_COLOR_CLASSES } from "@/lib/modules";
import { UsuariosSubNav } from "./_components/sub-nav";
import { createUser, updateUserRole, deleteUser } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function UsuariosPage() {
  const currentAdmin = await requireAdmin();
  const colors = MODULE_COLOR_CLASSES.sky;

  const [users, roles] = await Promise.all([
    prisma.profile.findMany({
      include: { role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Base UI's <Select.Value> shows the raw value unless given a value->label
  // map via `items` (a plain object crosses the server/client boundary fine,
  // unlike passing a render function, which would not).
  const roleItems: Record<string, string> = { none: "Sin rol" };
  for (const role of roles) roleItems[role.id] = role.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <UsersIcon className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestioná quién puede entrar y con qué rol.
          </p>
        </div>
      </div>

      <UsuariosSubNav />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUser} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="roleId">Rol</Label>
              <Select name="roleId" defaultValue="none" items={roleItems}>
                <SelectTrigger id="roleId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin rol</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isAdmin" name="isAdmin" />
              <Label htmlFor="isAdmin" className="font-normal">
                Es administrador (acceso total, sin restricciones)
              </Label>
            </div>
            <SubmitButton className="w-fit" pendingText="Creando...">
              Crear usuario
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.email}
                  {user.isAdmin && (
                    <Badge className="ml-2" variant="secondary">
                      Admin
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <Select
                      name="roleId"
                      defaultValue={user.roleId ?? "none"}
                      items={roleItems}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin rol</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
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
                  {user.id !== currentAdmin.id && (
                    <form action={deleteUser}>
                      <input type="hidden" name="userId" value={user.id} />
                      <SubmitButton size="sm" variant="ghost">
                        <Trash2 className="size-4 text-destructive" />
                      </SubmitButton>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
