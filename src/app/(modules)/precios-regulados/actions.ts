"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireModuleView } from "@/lib/permissions";
import { PRECIOS_REGULADOS_CACHE_TAG } from "@/lib/precios-regulados";

export async function actualizarPreciosRegulados() {
  await requireModuleView("precios-regulados");
  revalidateTag(PRECIOS_REGULADOS_CACHE_TAG, { expire: 0 });
  revalidatePath("/precios-regulados");
}
