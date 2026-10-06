"use client";

import { useCallback, useEffect, useRef } from "react";
import { useBorradoresStore, type Borrador } from "@/stores/borradores-store";

// Lo que se guarda de un diálogo de edición a medio llenar
export interface DatosBorradorEdicion<V = unknown, R = unknown> {
  /** Valores del formulario en el momento de guardar */
  valores: V;
  /** Valores tal como se cargaron del registro (para saber si hubo cambios) */
  baseline: string;
  /** Registro que se estaba editando, para poder reabrir sin volver a pedirlo */
  registro: R;
  /** Datos propios de cada pantalla (p. ej. a qué pestaña pertenece) */
  [extra: string]: unknown;
}

interface Opciones<V> {
  open: boolean;
  ambito: string;
  /** Identifica el registro editado: hay un único borrador por registro */
  clave: string | null;
  titulo: string;
  subtitulo?: string;
  valores: V;
  registro: unknown;
  extra?: Record<string, unknown>;
}

// Autoguarda en IndexedDB los cambios de un diálogo de edición. El diálogo debe
// llamar a `fijarBaseline` con los valores "limpios" cada vez que carga el
// registro; mientras no lo haga no se guarda nada.
export function useBorradorFormulario<V>(opciones: Opciones<V>) {
  const baselineRef = useRef<string | null>(null);
  // Tras guardar o descartar no se debe volver a crear el borrador
  const bloqueadoRef = useRef(false);
  const actualRef = useRef(opciones);
  useEffect(() => {
    actualRef.current = opciones;
  });

  const { open } = opciones;
  useEffect(() => {
    if (open) {
      bloqueadoRef.current = false;
    } else {
      baselineRef.current = null;
    }
  }, [open]);

  const fijarBaseline = useCallback((valores: V | string) => {
    baselineRef.current = typeof valores === "string" ? valores : JSON.stringify(valores);
  }, []);

  const hayCambios = useCallback(() => {
    const o = actualRef.current;
    return baselineRef.current !== null && JSON.stringify(o.valores) !== baselineRef.current;
  }, []);

  // Copia el estado vivo al borrador. Si no hay cambios no toca nada: un
  // borrador existente solo se elimina al guardar o al descartar.
  const sincronizar = useCallback(() => {
    const o = actualRef.current;
    if (!o.open || !o.clave || bloqueadoRef.current || baselineRef.current === null) return;
    if (!hayCambios()) return;
    const datos: DatosBorradorEdicion = {
      valores: o.valores,
      baseline: baselineRef.current,
      registro: o.registro,
      ...o.extra,
    };
    const borrador: Borrador = {
      id: `${o.ambito}:${o.clave}`,
      ambito: o.ambito,
      titulo: o.titulo,
      subtitulo: o.subtitulo,
      datos,
      actualizado: Date.now(),
    };
    useBorradoresStore.getState().guardar(borrador);
  }, [hayCambios]);

  // Autoguardado con espera corta para no escribir en cada tecla
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(sincronizar, 600);
    return () => clearTimeout(t);
  });

  // Si se cierra u oculta la pestaña, guardar sin esperar
  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === "hidden") sincronizar();
    };
    window.addEventListener("pagehide", sincronizar);
    document.addEventListener("visibilitychange", alOcultar);
    return () => {
      window.removeEventListener("pagehide", sincronizar);
      document.removeEventListener("visibilitychange", alOcultar);
    };
  }, [sincronizar]);

  // Elimina el borrador del registro (al guardar con éxito o al cancelar)
  const descartar = useCallback(() => {
    bloqueadoRef.current = true;
    const o = actualRef.current;
    if (o.clave) useBorradoresStore.getState().eliminar(`${o.ambito}:${o.clave}`);
  }, []);

  return { fijarBaseline, hayCambios, minimizar: sincronizar, descartar };
}
