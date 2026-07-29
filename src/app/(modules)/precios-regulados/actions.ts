"use server";

import { revalidatePath } from "next/cache";
import { requireModuleView } from "@/lib/permissions";
import { invalidatePreciosReguladosCache } from "@/lib/precios-regulados";

export async function actualizarPreciosRegulados() {
  await requireModuleView("precios-regulados");
  invalidatePreciosReguladosCache();
  revalidatePath("/precios-regulados");
  revalidatePath("/precios-regulados/portafolio-vs-circular");
}
