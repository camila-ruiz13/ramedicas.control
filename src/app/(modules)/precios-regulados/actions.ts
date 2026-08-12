"use server";

import { revalidatePath } from "next/cache";
import { requireModuleView } from "@/lib/permissions";
import {
  invalidatePreciosReguladosCache,
  invalidateProveedoresEnvioCache,
  invalidateNitPorCodigoCache,
} from "@/lib/precios-regulados";
import { invalidateInfoGeneralCache } from "@/lib/info-general";

export async function actualizarPreciosRegulados() {
  await requireModuleView("precios-regulados");
  invalidatePreciosReguladosCache();
  invalidateProveedoresEnvioCache();
  invalidateNitPorCodigoCache();
  invalidateInfoGeneralCache();
  revalidatePath("/precios-regulados");
  revalidatePath("/precios-regulados/circular-19-vs-22");
  revalidatePath("/precios-regulados/portafolio-vs-circular");
}
