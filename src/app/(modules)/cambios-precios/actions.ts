"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireModuleView } from "@/lib/permissions";
import {
  CAMBIOS_PRECIOS_CACHE_TAG,
  getCambiosPrecios,
  applyBaseFilters,
  applyCondicionFilter,
  buildCsv,
  type CambiosPreciosFilters,
} from "@/lib/cambios-precios";

// Mirrors the "Actualizar" button on the other Sheets-backed modules —
// forces a fresh pull instead of waiting for the 5 min cache to expire.
export async function actualizarCambiosPrecios() {
  await requireModuleView("cambios-precios");
  revalidateTag(CAMBIOS_PRECIOS_CACHE_TAG, { expire: 0 });
  revalidatePath("/cambios-precios");
}

// CSV export needs the full filtered set, not just the current table page —
// recomputes the same two-stage filter the page itself uses and returns the
// resulting CSV text for the client to download as a Blob.
export async function exportarCambiosPreciosCSV(filters: CambiosPreciosFilters) {
  await requireModuleView("cambios-precios");
  const all = await getCambiosPrecios();
  const base = applyBaseFilters(all, filters);
  const filtered = applyCondicionFilter(base, filters.condicion);
  return buildCsv(filtered);
}
