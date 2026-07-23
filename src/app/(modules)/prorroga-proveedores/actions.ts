"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireModuleView } from "@/lib/permissions";
import { PRORROGA_CACHE_TAG } from "@/lib/prorroga-proveedores";

export async function actualizarProrroga() {
  await requireModuleView("prorroga-proveedores");
  revalidateTag(PRORROGA_CACHE_TAG, { expire: 0 });
  revalidatePath("/prorroga-proveedores");
}
