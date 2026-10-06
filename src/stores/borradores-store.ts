"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

// Borrador de un formulario a medio llenar. `datos` es el estado propio del
// formulario (cada pantalla lo define); IndexedDB lo guarda tal cual con el
// algoritmo de clonado estructurado, así que las fechas (Date) sobreviven.
export interface Borrador<T = unknown> {
  id: string;
  /** Pantalla dueña del borrador: cada una solo ve los suyos */
  ambito: string;
  titulo: string;
  subtitulo?: string;
  datos: T;
  actualizado: number;
}

interface BorradoresState {
  borradores: Record<string, Borrador>;
  guardar: (b: Borrador) => void;
  eliminar: (id: string) => void;
}

// Ámbito de los borradores de las pantallas de edición de programacion-admin
export const AMBITO_PROGRAMACION_ADMIN = "programacion-admin";

// Los borradores sin tocar en este tiempo se descartan al cargar
const CADUCIDAD_MS = 30 * 24 * 60 * 60 * 1000;

const storageIndexedDB: PersistStorage<Pick<BorradoresState, "borradores">> = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async (name) => {
    await idbDel(name);
  },
};

export const useBorradoresStore = create<BorradoresState>()(
  persist(
    (set) => ({
      borradores: {},
      guardar: (b) => set((s) => ({ borradores: { ...s.borradores, [b.id]: b } })),
      eliminar: (id) =>
        set((s) => {
          if (!(id in s.borradores)) return s;
          const resto = { ...s.borradores };
          delete resto[id];
          return { borradores: resto };
        }),
    }),
    {
      name: "ayala-borradores",
      version: 1,
      storage: storageIndexedDB,
      partialize: (s) => ({ borradores: s.borradores }),
      // Next renderiza en el servidor, donde no hay IndexedDB: se hidrata a mano
      // desde el cliente (ver useHidratarBorradores)
      skipHydration: true,
      merge: (persisted, actual) => {
        const guardados = (persisted as Partial<BorradoresState> | undefined)?.borradores ?? {};
        const limite = Date.now() - CADUCIDAD_MS;
        const vigentes = Object.fromEntries(
          Object.entries(guardados).filter(([, b]) => b.actualizado >= limite)
        );
        // Lo que ya se escribió antes de terminar de hidratar tiene prioridad
        return { ...actual, borradores: { ...vigentes, ...actual.borradores } };
      },
    }
  )
);
