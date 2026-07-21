"use server";

import { revalidatePath } from "next/cache";
import { requireModuleInteract } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { TareaEstado } from "@/generated/prisma/client";

const ESTADOS: TareaEstado[] = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"];

async function requireOwnTarea(profileId: string, tareaId: string) {
  const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
  if (!tarea || tarea.profileId !== profileId) {
    throw new Error("No tenés permiso sobre esta tarea");
  }
  return tarea;
}

export async function createTarea(formData: FormData) {
  const profile = await requireModuleInteract("tareas");

  const titulo = String(formData.get("titulo") ?? "").trim();
  const fechaObjetivo = String(formData.get("fechaObjetivo") ?? "");

  if (!titulo || !fechaObjetivo) {
    throw new Error("Título y fecha objetivo son obligatorios");
  }

  await prisma.tarea.create({
    data: {
      titulo,
      fechaObjetivo: new Date(fechaObjetivo),
      profileId: profile.id,
    },
  });

  revalidatePath("/tareas");
}

// A user can only ever change the estado of their own tasks — admins manage
// permissions but this module has no cross-user assignment yet.
export async function updateEstado(formData: FormData) {
  const profile = await requireModuleInteract("tareas");

  const tareaId = String(formData.get("tareaId") ?? "");
  const estado = String(formData.get("estado") ?? "") as TareaEstado;
  if (!ESTADOS.includes(estado)) {
    throw new Error("Estado inválido");
  }

  await requireOwnTarea(profile.id, tareaId);

  await prisma.tarea.update({
    where: { id: tareaId },
    data: {
      estado,
      // Stamp the real completion date the moment it becomes COMPLETADA;
      // clear it if the task is reopened into any other estado.
      fechaCompletada: estado === "COMPLETADA" ? new Date() : null,
    },
  });

  revalidatePath("/tareas");
}

export async function deleteTarea(formData: FormData) {
  const profile = await requireModuleInteract("tareas");

  const tareaId = String(formData.get("tareaId") ?? "");
  await requireOwnTarea(profile.id, tareaId);

  await prisma.tarea.delete({ where: { id: tareaId } });

  revalidatePath("/tareas");
}
