"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndeterminateProgress } from "@/components/indeterminate-progress";
import { sincronizarProveedores } from "../actions";

type SyncResult = Awaited<ReturnType<typeof sincronizarProveedores>>;
type State =
  | { status: "idle" }
  | { status: "success"; resumen: SyncResult }
  | { status: "error"; message: string };

// useActionState's action always receives (prevState, formData) — this form
// has no fields, so both are unused here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runSync(_prev: State, _formData: FormData): Promise<State> {
  try {
    const resumen = await sincronizarProveedores();
    return { status: "success", resumen };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo sincronizar con la hoja",
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
            "Consultando Google Sheets...",
            "Leyendo Primera y Segunda Fase...",
            "Contando ovejitas... 1, 2, 3... 🐑",
            "Actualizando la base de datos...",
            "¡Ya casi! 😅",
          ]}
        />
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="outline" className="gap-2">
              <RefreshCw className="size-4" />
              Actualizar desde Google Sheets
            </Button>
          </div>
          {state.status === "success" && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Sincronizado: {state.resumen.fase1.proveedores} proveedores /{" "}
              {state.resumen.fase1.documentos} documentos (Primera Fase){" "}
              {state.resumen.fase2.articulos > 0 &&
                `— ${state.resumen.fase2.proveedores} proveedores / ${state.resumen.fase2.articulos} artículos / ${state.resumen.fase2.documentos} documentos (Segunda Fase)`}
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
