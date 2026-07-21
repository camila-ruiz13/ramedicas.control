"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireModuleView } from "@/lib/permissions";
import { AUTORIZACIONES_CACHE_TAG } from "@/lib/autorizacion-compras";

// Mirrors the old Apps Script menu's "Actualizar Compras (manual)" — forces
// a fresh pull from the sheet instead of waiting for the 5 min cache to expire.
export async function actualizarAutorizaciones() {
  await requireModuleView("autorizacion-compras");
  revalidateTag(AUTORIZACIONES_CACHE_TAG, { expire: 0 });
  revalidatePath("/autorizacion-compras");
}
