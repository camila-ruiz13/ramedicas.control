"use server";

import { revalidatePath } from "next/cache";
import { requireModuleView } from "@/lib/permissions";
import { invalidateAnalisisPreciosCache } from "@/lib/analisis-precios";

export async function actualizarAnalisisPrecios() {
  await requireModuleView("analisis-precios");
  invalidateAnalisisPreciosCache();
  revalidatePath("/analisis-precios");
}
