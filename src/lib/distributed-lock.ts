import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Crear instancia de axios para locks
const lockApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para operaciones de lock
  headers: {
    "Content-Type": "application/json",
  },
});

export interface LockOptions {
  /**
   * Recurso a bloquear (ej: "factura:create", "factura:123:update")
   */
  resource: string;

  /**
   * Tiempo de expiración del lock en milisegundos (default: 30000 - 30 segundos)
   */
  ttl?: number;

  /**
   * Tiempo máximo de espera para adquirir el lock en milisegundos (default: 10000 - 10 segundos)
   */
  timeout?: number;

  /**
   * Identificador único del cliente que solicita el lock
   */
  clientId?: string;
}

export interface LockResult {
  /**
   * Indica si el lock fue adquirido exitosamente
   */
  acquired: boolean;

  /**
   * Token del lock para liberarlo posteriormente
   */
  token?: string;

  /**
   * Mensaje de error si no se pudo adquirir
   */
  error?: string;

  /**
   * Tiempo restante antes de que expire el lock (en ms)
   */
  expiresIn?: number;
}

/**
 * Sistema de locks distribuidos para evitar condiciones de carrera
 */
export class DistributedLock {
  private static locks = new Map<string, { token: string; timeout: NodeJS.Timeout }>();
  private static clientId = `client-${Math.random().toString(36).substring(7)}-${Date.now()}`;

  /**
   * Adquiere un lock para un recurso específico
   */
  static async acquire(options: LockOptions): Promise<LockResult> {
    const {
      resource,
      ttl = 30000, // 30 segundos por defecto
      timeout = 10000, // 10 segundos de espera por defecto
      clientId = this.clientId,
    } = options;

    const startTime = Date.now();

    try {
      // Intentar adquirir el lock del backend
      const response = await lockApi.post("/locks/acquire", {
        resource,
        ttl,
        clientId,
      });

      if (response.data.acquired) {
        const { token, expiresIn } = response.data;

        // Configurar auto-liberación local como respaldo
        const autoReleaseTimeout = setTimeout(() => {
          console.warn(`⚠️ Lock auto-liberado localmente: ${resource}`);
          this.locks.delete(resource);
        }, ttl);

        // Guardar referencia local
        this.locks.set(resource, { token, timeout: autoReleaseTimeout });

        console.log(`✅ Lock adquirido: ${resource} (token: ${token.substring(0, 8)}...)`);

        return {
          acquired: true,
          token,
          expiresIn,
        };
      } else {
        // Lock no disponible, intentar reintentar hasta timeout
        const elapsed = Date.now() - startTime;
        if (elapsed < timeout) {
          // Esperar 200ms y reintentar
          await new Promise((resolve) => setTimeout(resolve, 200));
          return this.acquire(options);
        }

        return {
          acquired: false,
          error: "No se pudo adquirir el lock: recurso bloqueado por otro proceso",
        };
      }
    } catch (error: unknown) {
      console.error("❌ Error al adquirir lock:", error);

      // Si el backend no tiene el endpoint, usar fallback local (solo para desarrollo)
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn("⚠️ Endpoint de locks no disponible, usando fallback local");
        return this.acquireLocal(options);
      }

      return {
        acquired: false,
        error: error instanceof Error ? error.message : "Error desconocido al adquirir lock",
      };
    }
  }

  /**
   * Libera un lock previamente adquirido
   */
  static async release(resource: string, token?: string): Promise<boolean> {
    try {
      const localLock = this.locks.get(resource);

      // Limpiar timeout local
      if (localLock) {
        clearTimeout(localLock.timeout);
        this.locks.delete(resource);
      }

      const lockToken = token || localLock?.token;

      if (!lockToken) {
        console.warn(`⚠️ No se encontró token para liberar: ${resource}`);
        return false;
      }

      // Liberar en el backend
      const response = await lockApi.post("/locks/release", {
        resource,
        token: lockToken,
      });

      if (response.data.released) {
        console.log(`✅ Lock liberado: ${resource}`);
        return true;
      }

      return false;
    } catch (error: unknown) {
      console.error("❌ Error al liberar lock:", error);

      // Si el backend no tiene el endpoint, limpiar solo localmente
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const localLock = this.locks.get(resource);
        if (localLock) {
          clearTimeout(localLock.timeout);
          this.locks.delete(resource);
        }
        return true;
      }

      return false;
    }
  }

  /**
   * Ejecuta una función con un lock activo
   */
  static async withLock<T>(
    options: LockOptions,
    fn: () => Promise<T>
  ): Promise<T> {
    const lockResult = await this.acquire(options);

    if (!lockResult.acquired) {
      throw new Error(lockResult.error || "No se pudo adquirir el lock");
    }

    try {
      // Ejecutar la función protegida
      const result = await fn();
      return result;
    } finally {
      // Siempre liberar el lock
      await this.release(options.resource, lockResult.token);
    }
  }

  /**
   * Fallback local para desarrollo (cuando el backend no está disponible)
   * ADVERTENCIA: Este método NO es distribuido y solo funciona en un único cliente
   */
  private static acquireLocal(options: LockOptions): LockResult {
    const { resource, ttl = 30000 } = options;

    if (this.locks.has(resource)) {
      return {
        acquired: false,
        error: "Lock ya adquirido localmente",
      };
    }

    const token = `local-${Math.random().toString(36).substring(7)}`;
    const timeout = setTimeout(() => {
      this.locks.delete(resource);
    }, ttl);

    this.locks.set(resource, { token, timeout });

    return {
      acquired: true,
      token,
      expiresIn: ttl,
    };
  }

  /**
   * Limpia todos los locks locales (útil para cleanup)
   */
  static clearAll(): void {
    for (const [resource, { timeout }] of this.locks.entries()) {
      clearTimeout(timeout);
    }
    this.locks.clear();
    console.log("🧹 Todos los locks locales han sido limpiados");
  }
}

/**
 * Generador de nombres de recursos para locks
 */
export const LockResource = {
  /**
   * Lock para creación de facturas (evita duplicados de número)
   */
  facturaCreate: (serie: string) => `factura:create:${serie}`,

  /**
   * Lock para actualización de factura específica
   */
  facturaUpdate: (facturaId: number) => `factura:${facturaId}:update`,

  /**
   * Lock para envío a SUNAT de factura específica
   */
  facturaSunat: (facturaId: number) => `factura:${facturaId}:sunat`,

  /**
   * Lock para procesamiento de lote de facturas
   */
  facturaBatch: (batchId: string) => `factura:batch:${batchId}`,
};
