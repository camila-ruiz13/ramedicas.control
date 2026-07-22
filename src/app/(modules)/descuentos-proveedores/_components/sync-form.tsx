"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndeterminateProgress } from "@/components/indeterminate-progress";
import { actualizarDescuentos } from "../actions";

type SyncResult = Awaited<ReturnType<typeof actualizarDescuentos>>;
type State =
  | { status: "idle" }
  | { status: "success"; resumen: SyncResult }
  | { status: "error"; message: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runSync(_prev: State, _formData: FormData): Promise<State> {
  try {
    const resumen = await actualizarDescuentos();
    return { status: "success", resumen };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo sincronizar",
    };
  }
}

export function SyncForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(runSync, {
    status: "idle",
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      {pending ? (
        <IndeterminateProgress
          messages={[
            "Leyendo archivos de Compras...",
            "Leyendo Predevoluciones...",
            "Leyendo la paramétrica de Ofertas...",
            "Reconstruyendo la base de datos...",
            "¡Ya casi! 😅",
          ]}
        />
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="outline" className="gap-2">
              <RefreshCw className="size-4" />
              Actualizar desde Drive
            </Button>
          </div>
          {state.status === "success" && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Sincronizado: {state.resumen.compras} compras · {state.resumen.predevoluciones}{" "}
              predevoluciones · {state.resumen.ofertas} ofertas · {state.resumen.productos}{" "}
              productos · {state.resumen.cortes} cortes
            </p>
          )}
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
        </form>
      )}
    </div>
  );
}
