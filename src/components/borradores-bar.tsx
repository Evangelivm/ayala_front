"use client";

import { useEffect, useMemo } from "react";
import { FileText, X } from "lucide-react";
import { useBorradoresStore } from "@/stores/borradores-store";

// Lee los borradores de IndexedDB una vez en el cliente (el store usa skipHydration)
export function useHidratarBorradores() {
  useEffect(() => {
    void useBorradoresStore.persist.rehydrate();
  }, []);
}

interface BorradoresBarProps {
  ambito: string;
  /** Borrador que está abierto ahora en el diálogo (se resalta) */
  activoId: string | null;
  onAbrir: (id: string) => void;
  onDescartar: (id: string) => void;
}

// Burbujas fijas abajo a la derecha, como los chats de Facebook: una por
// formulario a medio llenar. Clic la abre; la X la descarta.
export function BorradoresBar({ ambito, activoId, onAbrir, onDescartar }: BorradoresBarProps) {
  const borradores = useBorradoresStore((s) => s.borradores);
  const lista = useMemo(
    () =>
      Object.values(borradores)
        .filter((b) => b.ambito === ambito)
        .sort((a, b) => a.actualizado - b.actualizado),
    [borradores, ambito]
  );

  if (lista.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-row-reverse items-end gap-2 overflow-x-auto">
      {[...lista].reverse().map((b) => {
        const activo = b.id === activoId;
        return (
          <div
            key={b.id}
            className={`flex w-52 shrink-0 items-center rounded-t-lg border border-b-0 shadow-lg ${
              activo ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"
            }`}
          >
            <button
              type="button"
              onClick={() => onAbrir(b.id)}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
              title={`${b.titulo}${b.subtitulo ? ` — ${b.subtitulo}` : ""}`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{b.titulo}</span>
                {b.subtitulo && (
                  <span className={`block truncate text-[10px] ${activo ? "text-blue-100" : "text-gray-500"}`}>
                    {b.subtitulo}
                  </span>
                )}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Descartar borrador ${b.titulo}`}
              onClick={() => onDescartar(b.id)}
              className="px-2 py-2 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
