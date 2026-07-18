"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODULES } from "@/lib/modules";

export async function createUser(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleId = String(formData.get("roleId") ?? "none");
  // The Checkbox component submits its own `name` as the value when checked
  // (not the native "on" default) and nothing at all when unchecked.
  const isAdmin = Boolean(formData.get("isAdmin"));

  if (!email || !password) {
    throw new Error("Correo y contraseña son obligatorios");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "No se pudo crear el usuario");
  }

  await prisma.profile.create({
    data: {
      id: data.user.id,
      email,
      isAdmin,
      roleId: roleId === "none" ? null : roleId,
    },
  });

  revalidatePath("/usuarios");
}

export async function updateUserRole(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const roleId = String(formData.get("roleId") ?? "none");

  await prisma.profile.update({
    where: { id: userId },
    data: { roleId: roleId === "none" ? null : roleId },
  });

  revalidatePath("/usuarios");
}

export async function deleteUser(formData: FormData) {
  const currentAdmin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (userId === currentAdmin.id) {
    throw new Error("No podés eliminar tu propio usuario");
  }

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  await prisma.profile.delete({ where: { id: userId } }).catch(() => {});

  revalidatePath("/usuarios");
}

export async function createRole(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("El nombre del rol es obligatorio");
  }

  await prisma.role.create({ data: { name } });

  revalidatePath("/usuarios/roles");
}

export async function deleteRole(formData: FormData) {
  await requireAdmin();

  const roleId = String(formData.get("roleId") ?? "");
  await prisma.role.delete({ where: { id: roleId } });

  revalidatePath("/usuarios/roles");
  revalidatePath("/usuarios");
}

export async function updateRolePermissions(formData: FormData) {
  await requireAdmin();

  const roleId = String(formData.get("roleId") ?? "");
  const assignableModules = MODULES.filter((m) => !m.adminOnly);

  await prisma.$transaction(
    assignableModules.map((moduleDef) =>
      prisma.roleModulePermission.upsert({
        where: {
          roleId_moduleSlug: { roleId, moduleSlug: moduleDef.slug },
        },
        create: {
          roleId,
          moduleSlug: moduleDef.slug,
          canView: Boolean(formData.get(`view__${moduleDef.slug}`)),
          canInteract: Boolean(formData.get(`interact__${moduleDef.slug}`)),
        },
        update: {
          canView: Boolean(formData.get(`view__${moduleDef.slug}`)),
          canInteract: Boolean(formData.get(`interact__${moduleDef.slug}`)),
        },
      }),
    ),
  );

  revalidatePath("/usuarios/roles");
}
