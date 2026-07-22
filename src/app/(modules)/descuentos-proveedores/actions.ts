"use server";

import { revalidatePath } from "next/cache";
import { requireModuleInteract } from "@/lib/permissions";
import { sincronizarDescuentos } from "@/lib/descuentos-proveedores";

// Relee las 3 carpetas (COMPRA, PREDEVOLUCIONES, OFERTAS) y reemplaza los
// datos por completo — ver src/lib/descuentos-proveedores.ts para el porqué
// de la estrategia de reemplazo total en vez de incremental por mes.
export async function actualizarDescuentos() {
  const profile = await requireModuleInteract("descuentos-proveedores");
  const resumen = await sincronizarDescuentos(profile.email);
  revalidatePath("/descuentos-proveedores");
  return resumen;
}
