"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Cuando Jenkins redeploya, el build genera nuevos IDs para las Server Actions.
    // Si el browser tiene en caché una página del build anterior, este error aparece.
    // Solución: forzar recarga completa para que el browser tome el nuevo build.
    if (error.message?.includes("Failed to find Server Action")) {
      // Protección contra loop infinito: solo recarga una vez por sesión
      const reloadKey = "server_action_reload";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      }
      return;
    }

    console.error(error);
  }, [error]);

  // Si no es el error de Server Action, mostrar UI de error normal
  if (error.message?.includes("Failed to find Server Action")) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <button
        onClick={reset}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
