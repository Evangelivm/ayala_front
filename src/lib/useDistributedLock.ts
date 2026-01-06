import { useCallback, useEffect, useRef, useState } from "react";
import { DistributedLock, type LockOptions, type LockResult } from "./distributed-lock";

export interface UseLockOptions extends Omit<LockOptions, "resource"> {
  /**
   * Si es true, libera automáticamente el lock cuando el componente se desmonta
   */
  autoRelease?: boolean;
}

export interface UseLockResult {
  /**
   * Adquiere un lock para el recurso especificado
   */
  acquire: (resource: string) => Promise<LockResult>;

  /**
   * Libera el lock actual
   */
  release: () => Promise<boolean>;

  /**
   * Ejecuta una función con un lock activo
   */
  withLock: <T>(resource: string, fn: () => Promise<T>) => Promise<T>;

  /**
   * Indica si actualmente hay un lock activo
   */
  isLocked: boolean;

  /**
   * Recurso actual bloqueado (si hay alguno)
   */
  currentResource: string | null;

  /**
   * Token del lock actual
   */
  currentToken: string | null;
}

/**
 * Hook personalizado para gestión de locks distribuidos en componentes React
 *
 * @example
 * ```tsx
 * const { withLock, isLocked } = useDistributedLock({ autoRelease: true });
 *
 * const crearFactura = async (data) => {
 *   await withLock(`factura:create:${data.serie}`, async () => {
 *     // Operación crítica protegida por lock
 *     await facturaApi.create(data);
 *   });
 * };
 * ```
 */
export function useDistributedLock(options: UseLockOptions = {}): UseLockResult {
  const { autoRelease = true, ...lockOptions } = options;

  const [isLocked, setIsLocked] = useState(false);
  const [currentResource, setCurrentResource] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Refs para cleanup
  const mountedRef = useRef(true);
  const lockStateRef = useRef({ resource: null as string | null, token: null as string | null });

  // Actualizar ref cuando cambia el estado
  useEffect(() => {
    lockStateRef.current = { resource: currentResource, token: currentToken };
  }, [currentResource, currentToken]);

  /**
   * Adquiere un lock
   */
  const acquire = useCallback(
    async (resource: string): Promise<LockResult> => {
      if (!mountedRef.current) {
        return { acquired: false, error: "Componente desmontado" };
      }

      try {
        const result = await DistributedLock.acquire({
          ...lockOptions,
          resource,
        });

        if (result.acquired && mountedRef.current) {
          setIsLocked(true);
          setCurrentResource(resource);
          setCurrentToken(result.token || null);
        }

        return result;
      } catch (error: unknown) {
        console.error("Error al adquirir lock:", error);
        return {
          acquired: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      }
    },
    [lockOptions]
  );

  /**
   * Libera el lock actual
   */
  const release = useCallback(async (): Promise<boolean> => {
    const { resource, token } = lockStateRef.current;

    if (!resource) {
      console.warn("No hay lock para liberar");
      return false;
    }

    try {
      const released = await DistributedLock.release(resource, token || undefined);

      if (released && mountedRef.current) {
        setIsLocked(false);
        setCurrentResource(null);
        setCurrentToken(null);
      }

      return released;
    } catch (error: unknown) {
      console.error("Error al liberar lock:", error);
      return false;
    }
  }, []);

  /**
   * Ejecuta una función con un lock activo
   */
  const withLock = useCallback(
    async <T,>(resource: string, fn: () => Promise<T>): Promise<T> => {
      if (!mountedRef.current) {
        throw new Error("Componente desmontado");
      }

      // Adquirir el lock
      const lockResult = await acquire(resource);

      if (!lockResult.acquired) {
        throw new Error(lockResult.error || "No se pudo adquirir el lock");
      }

      try {
        // Ejecutar la función protegida
        const result = await fn();
        return result;
      } finally {
        // Siempre liberar el lock
        await release();
      }
    },
    [acquire, release]
  );

  // Cleanup: liberar locks cuando el componente se desmonta
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (autoRelease) {
        const { resource, token } = lockStateRef.current;
        if (resource) {
          // Liberar de forma asíncrona pero no esperar
          DistributedLock.release(resource, token || undefined).catch((error) => {
            console.error("Error al liberar lock en cleanup:", error);
          });
        }
      }
    };
  }, [autoRelease]);

  return {
    acquire,
    release,
    withLock,
    isLocked,
    currentResource,
    currentToken,
  };
}

/**
 * Hook simplificado para ejecutar una operación con lock
 *
 * @example
 * ```tsx
 * const ejecutarConLock = useLockOperation();
 *
 * await ejecutarConLock('factura:create:FFF1', async () => {
 *   await facturaApi.create(data);
 * });
 * ```
 */
export function useLockOperation(options: UseLockOptions = {}) {
  return useCallback(
    async <T,>(resource: string, fn: () => Promise<T>): Promise<T> => {
      return DistributedLock.withLock({ ...options, resource }, fn);
    },
    [options]
  );
}
