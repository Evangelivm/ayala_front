import { decode } from "he";
import { api, API_BASE_URL, uploadFileWithRetry } from "./client";

// ============ MULTIFACTURAS ============
export interface MultifacturaDetalle {
  id_detalle?: number;
  id_orden_compra?: number | null;
  id_orden_servicio?: number | null;
  nro_serie?: string | null;
  nro_factura?: string | null;
  galones?: string | null;
  proyecto?: string | null;
  url_factura?: string | null;
  url_guia?: string | null;
  fecha_registro?: string | null;
}

// Campos comunes de órdenes de compra y de servicio (solo difieren en el id)
export interface OrdenBaseData {
  id_proveedor: number;
  numero_orden: string;
  fecha_orden: string;
  moneda: string;
  fecha_registro: string;
  estado: string;
  estado_firma?: string; // Estado de firma
  centro_costo_nivel1?: string;
  centro_costo_nivel2?: string;
  centro_costo_nivel3?: string;
  unidad_id?: number | null;
  tiene_anticipo?: string | number;
  procede_pago?: string | number;
  auto_administrador?: boolean;
  auto_contabilidad?: boolean;
  jefe_proyecto?: boolean;
  fecha_auto_administrador?: string | null; // Fecha de autorización administrador
  fecha_auto_contabilidad?: string | null; // Fecha de autorización contabilidad
  fecha_jefe_proyecto?: string | null; // Fecha de autorización jefe de proyecto
  has_anticipo?: number;
  nombre_proveedor?: string; // Nombre del proveedor desde la relación
  ruc_proveedor?: string; // RUC del proveedor desde la relación
  retencion?: string; // Indica si aplica retención ("SI" o "NO")
  porcentaje_valor_retencion?: string; // Porcentaje de la retención (ej: "3", "10")
  valor_retencion?: number | string; // Valor/monto de la retención
  detraccion?: string; // Indica si aplica detracción ("SI" o "NO")
  porcentaje_valor_detraccion?: string; // Porcentaje de la detracción (ej: "3", "10")
  valor_detraccion?: number | string; // Valor/monto de la detracción
  tipo_detraccion?: string; // Código del tipo de detracción
  almacen_central?: string; // Indica si es almacén central ("SI" o "NO")
  condicion?: string; // Condición de pago (CONTADO / CRÉDITO 50/50)
  tipo_cambio?: number | string; // Tipo de cambio para la orden
  items: Array<{
    codigo_item: string;
    descripcion_item: string;
    cantidad_solicitada: number;
    precio_unitario: number;
    subtotal: number;
    centro_costo?: string | null;
    prorrateo?: number | null;
    unidad_id?: number | null;
    id_camion?: number | null;
    placa_vehiculo?: string | null;
  }>;
  subtotal: number;
  igv: number;
  total: number;
  observaciones?: string;
  url?: string | null;
  url_cotizacion?: string | null;
  url_factura?: string | null;
  nro_factura?: string | null; // Número de factura
  tipo_comprobante?: string | null; // "FACTURA" o "RH"
  nro_rh?: string | null; // Número de recibo por honorarios
  multifacturas_nros?: string | null; // Números de factura de multifacturas (comma-separated)
  url_comprobante_retencion?: string | null; // URL del comprobante de retención
  nro_serie?: string | null; // Número de serie del comprobante de retención
  placa_unidad?: string | null; // Placa del camión/unidad asignada
  tipo_unidad?: string | null; // Tipo de unidad (CAMION o MAQUINARIA)
  nombre_chofer?: string | null; // Nombre del chofer
  apellido_chofer?: string | null; // Apellido del chofer
  nombre_registrador?: string | null; // Nombre del usuario que registró la orden
  registrado_por?: number; // ID del usuario que registró
  deleted_at?: string | null; // Soft delete
  backend_logs?: string | null; // Logs del backend persistidos
  grupo_id?: string | null; // Grupo de multifactura (órdenes creadas juntas)
  grupo_codigo?: string | null; // Código legible del grupo (MF-000045)
  reserva_owner?: string; // Clave de reserva del número (solo al crear)
}

export interface OrdenCompraData extends OrdenBaseData {
  id_orden_compra?: number; // Primary key returned from backend
}

// Helper para decodificar HTML entities en órdenes (compra y servicio)
const decodeOrdenData = <T extends OrdenBaseData>(orden: T): T => ({
  ...orden,
  observaciones: orden.observaciones ? decode(orden.observaciones) : orden.observaciones,
  nombre_proveedor: orden.nombre_proveedor ? decode(orden.nombre_proveedor) : orden.nombre_proveedor,
  items: orden.items ? orden.items.map(item => ({
    ...item,
    descripcion_item: item.descripcion_item ? decode(item.descripcion_item) : item.descripcion_item,
  })) : [],
});

const decodeOrdenCompraData = (orden: OrdenCompraData): OrdenCompraData =>
  decodeOrdenData(orden);

// ── Reserva de números de orden (compra / servicio) ─────────────────────────
export type NumeroOrdenReservado = {
  serie: string;
  nroDoc: string;
  numero_orden_completo: string;
};

export type NumeroOrdenRenovado = NumeroOrdenReservado & {
  anterior: string;
  cambiado: boolean;
};

export type ResultadoBatchOrdenes = {
  success: boolean;
  message: string;
  grupo_id: string;
  ordenes: Array<{
    id_orden_compra?: number;
    id_orden_servicio?: number;
    numero_orden: string;
    numero_solicitado: string;
    numero_reasignado: boolean;
    total: number | string | null;
  }>;
};

export type ResultadoAgrupar = {
  success: boolean;
  grupo_id: string;
  ordenes: Array<{
    id_orden_compra?: number;
    id_orden_servicio?: number;
    numero_orden: string;
  }>;
  // Números de órdenes que tenían otra cotización y ahora usan la del grupo
  cotizacion_reemplazada: string[];
};

export type ResultadoAgregarOrdenNueva = {
  success: boolean;
  message: string;
  grupo_id: string;
  numero_orden: string;
  numero_reasignado: boolean;
};

export const numeracionOrdenApi = {
  // Reserva el menor número libre para este propietario (un número nuevo por llamada)
  reservar: async (
    tipo: "compra" | "servicio",
    propietario: string
  ): Promise<NumeroOrdenReservado> => {
    const response = await api.post(`/numeracion-orden/${tipo}/reservar`, {
      propietario,
    });
    return response.data;
  },

  // Latido: extiende las reservas; devuelve el número vigente de cada una
  renovar: async (
    tipo: "compra" | "servicio",
    propietario: string,
    numeros: string[]
  ): Promise<NumeroOrdenRenovado[]> => {
    const response = await api.post(`/numeracion-orden/${tipo}/renovar`, {
      propietario,
      numeros,
    });
    return response.data?.numeros ?? [];
  },

  // Libera números concretos, o todos los del propietario si no se indican
  liberar: async (
    tipo: "compra" | "servicio",
    propietario: string,
    numeros?: string[]
  ): Promise<void> => {
    await api.post(`/numeracion-orden/${tipo}/liberar`, { propietario, numeros });
  },

  // Igual que liberar, pero sobrevive al cierre de la pestaña (keepalive)
  liberarAlSalir: (tipo: "compra" | "servicio", propietario: string) => {
    try {
      fetch(`${API_BASE_URL}/numeracion-orden/${tipo}/liberar`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propietario }),
      }).catch(() => {});
    } catch {
      // Si falla, la reserva vence sola en unos minutos
    }
  },
};

export const ordenesCompraApi = {
  // Obtener todas las órdenes de compra
  getAll: async (): Promise<OrdenCompraData[]> => {
    try {
      const response = await api.get("/ordenes-compra");
      return Array.isArray(response.data) ? response.data.map(decodeOrdenCompraData) : [];
    } catch (error) {
      console.error("Ordenes Compra API error:", error);
      throw error;
    }
  },

  // Obtener el siguiente número de orden
  getSiguienteNumero: async (): Promise<{
    serie: string;
    nroDoc: string;
    numero_orden_completo: string;
  }> => {
    try {
      const response = await api.get("/ordenes-compra/siguiente-numero");
      return response.data;
    } catch (error) {
      console.error("Ordenes Compra API error:", error);
      // Retornar valores por defecto en caso de error
      return {
        serie: "0001",
        nroDoc: "000001",
        numero_orden_completo: "0001-000001",
      };
    }
  },

  // Crear orden de compra
  create: async (ordenData: OrdenCompraData): Promise<OrdenCompraData> => {
    try {
      const response = await api.post("/ordenes-compra", ordenData);
      // La respuesta del backend viene como { success, message, data }
      // donde data contiene la orden con detalles
      if (response.data && response.data.data) {
        const orden = response.data.data;
        // Mapear detalles a items para compatibilidad
        const ordenConItems = {
          ...orden,
          items: orden.detalles || [],
        };
        return decodeOrdenCompraData(ordenConItems);
      }
      return response.data;
    } catch (error) {
      console.error("Ordenes Compra API error:", error);
      throw error;
    }
  },

  // Crear varias órdenes de compra a la vez (multifactura, un solo grupo)
  createBatch: async (
    ordenes: OrdenCompraData[],
    reservaOwner: string
  ): Promise<ResultadoBatchOrdenes> => {
    try {
      const response = await api.post(
        "/ordenes-compra/batch",
        { ordenes, reserva_owner: reservaOwner },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error("Ordenes Compra API error:", error);
      throw error;
    }
  },

  // Copia la cotización de una orden a las demás órdenes de su grupo
  propagarCotizacion: async (id: number): Promise<{ actualizadas: number }> => {
    const response = await api.post(`/ordenes-compra/${id}/propagar-cotizacion`);
    return response.data;
  },

  // Convierte órdenes existentes en multifactura (grupo nuevo, o suma a uno existente)
  agrupar: async (ids: number[], grupoId?: string): Promise<ResultadoAgrupar> => {
    const response = await api.post("/ordenes-compra/agrupar", {
      ids,
      ...(grupoId ? { grupo_id: grupoId } : {}),
    });
    return response.data;
  },

  // Saca una orden de su multifactura
  desagrupar: async (id: number): Promise<void> => {
    await api.post(`/ordenes-compra/${id}/desagrupar`);
  },

  // Crea una orden nueva dentro de la multifactura de una orden existente
  agregarOrdenNueva: async (
    baseId: number,
    orden: OrdenCompraData,
    reservaOwner: string
  ): Promise<ResultadoAgregarOrdenNueva> => {
    const response = await api.post(
      `/ordenes-compra/${baseId}/agregar-orden`,
      { orden, reserva_owner: reservaOwner },
      { timeout: 30000 }
    );
    return response.data;
  },

  // Actualizar orden de compra
  update: async (id: number, ordenData: OrdenCompraData): Promise<OrdenCompraData> => {
    try {
      const response = await api.put(`/ordenes-compra/${id}`, ordenData);
      return response.data ? decodeOrdenCompraData(response.data) : response.data;
    } catch (error) {
      console.error("Ordenes Compra API error:", error);
      throw error;
    }
  },

  // Obtener tipo de cambio de SUNAT
  getTipoCambio: async (): Promise<{
    success: boolean;
    tipo_cambio: number;
    fecha: string;
  }> => {
    try {
      const response = await api.get("/ordenes-compra/tipo-cambio");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo tipo de cambio:", error);
      // Retornar valor por defecto en caso de error
      return {
        success: false,
        tipo_cambio: 0,
        fecha: new Date().toISOString().split("T")[0],
      };
    }
  },

  // Eliminar una orden de compra
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/ordenes-compra/${id}`);
    } catch (error) {
      console.error("Error eliminando orden de compra:", error);
      throw error;
    }
  },

  // Aprobar orden de compra para contabilidad
  aprobarContabilidad: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/aprobar-contabilidad`);
    } catch (error) {
      console.error("Error aprobando orden de compra para contabilidad:", error);
      throw error;
    }
  },

  // Aprobar orden de compra para administración
  aprobarAdministrador: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/aprobar-administrador`);
    } catch (error) {
      console.error("Error aprobando orden de compra para administración:", error);
      throw error;
    }
  },

  // Aprobar orden de compra para jefe de proyecto
  aprobarJefeProyecto: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/aprobar-jefe-proyecto`);
    } catch (error) {
      console.error("Error aprobando orden de compra para jefe de proyecto:", error);
      throw error;
    }
  },

  // Transferir orden de compra (Gerencia)
  transferir: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/transferir`);
    } catch (error) {
      console.error("Error transfiriendo orden de compra:", error);
      throw error;
    }
  },

  // Pagar orden de compra
  pagar: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/pagar`);
    } catch (error) {
      console.error("Error pagando orden de compra:", error);
      throw error;
    }
  },

  // Actualizar número de factura
  actualizarNumeroFactura: async (id: number, nroFactura: string): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/numero-factura`, { nro_factura: nroFactura });
    } catch (error) {
      console.error("Error actualizando número de factura:", error);
      throw error;
    }
  },

  // Actualizar número de recibo por honorarios
  actualizarNumeroRH: async (id: number, nroRH: string): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/numero-rh`, { nro_rh: nroRH });
    } catch (error) {
      console.error("Error actualizando número de RH:", error);
      throw error;
    }
  },

  // Subir archivo para orden de compra
  uploadFile: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-compra/${id}/upload`, {
        method: 'POST',
        body: formData,
        // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir archivo');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo archivo de orden de compra:", error);
      throw error;
    }
  },

  // Subir cotización para orden de compra
  uploadCotizacion: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-compra/${id}/upload-cotizacion`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir cotización');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo cotización de orden de compra:", error);
      throw error;
    }
  },

  // Subir factura para orden de compra
  uploadFactura: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-compra/${id}/upload-factura`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir factura');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo factura de orden de compra:", error);
      throw error;
    }
  },

  // Subir comprobante de retención para orden de compra
  uploadComprobanteRetencion: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await uploadFileWithRetry(
        `${API_BASE_URL}/ordenes-compra/${id}/upload-comprobante-retencion`,
        formData,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir comprobante de retención');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo comprobante de retención de orden de compra:", error);
      throw error;
    }
  },

  // Multifacturas
  getMultifacturas: async (id: number) => {
    try {
      const response = await api.get(`/ordenes-compra/${id}/multifacturas`);
      return response.data as MultifacturaDetalle[];
    } catch (error) {
      console.error("Error obteniendo multifacturas de orden de compra:", error);
      throw error;
    }
  },

  saveMultifacturas: async (id: number, rows: Partial<MultifacturaDetalle>[]) => {
    try {
      const response = await api.post(`/ordenes-compra/${id}/multifacturas`, { rows });
      return response.data as MultifacturaDetalle[];
    } catch (error) {
      console.error("Error guardando multifacturas de orden de compra:", error);
      throw error;
    }
  },

  uploadMultifacturaFactura: async (id: number, detalleId: number, formData: FormData): Promise<{ message: string; fileUrl: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-compra/${id}/multifacturas/${detalleId}/upload-factura`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir factura');
      }
      return response.json();
    } catch (error) {
      console.error("Error subiendo factura de multifactura:", error);
      throw error;
    }
  },

  // Obtener todas las órdenes de compra (admin, incluye eliminadas)
  getAllAdmin: async (): Promise<OrdenCompraData[]> => {
    try {
      const response = await api.get("/ordenes-compra/admin");
      return Array.isArray(response.data) ? response.data.map(decodeOrdenCompraData) : [];
    } catch (error) {
      console.error("Ordenes Compra Admin API error:", error);
      return [];
    }
  },

  // Restaurar una orden de compra eliminada
  restore: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/restore`);
    } catch (error) {
      console.error("Error restaurando orden de compra:", error);
      throw error;
    }
  },

  saveBackendLogs: async (id: number, logs: string): Promise<void> => {
    await api.patch(`/ordenes-compra/${id}/backend-logs`, { logs });
  },

  uploadMultifacturaGuia: async (id: number, detalleId: number, formData: FormData): Promise<{ message: string; fileUrl: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-compra/${id}/multifacturas/${detalleId}/upload-guia`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir guía');
      }
      return response.json();
    } catch (error) {
      console.error("Error subiendo guía de multifactura:", error);
      throw error;
    }
  },

  removeOperacion: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/remove-operacion`);
    } catch (error) {
      console.error("Error eliminando operación de orden de compra:", error);
      throw error;
    }
  },

  removeCotizacion: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/remove-cotizacion`);
    } catch (error) {
      console.error("Error eliminando cotización de orden de compra:", error);
      throw error;
    }
  },

  removeFactura: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/remove-factura`);
    } catch (error) {
      console.error("Error eliminando factura de orden de compra:", error);
      throw error;
    }
  },

  removeRetencion: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-compra/${id}/remove-retencion`);
    } catch (error) {
      console.error("Error eliminando comprobante de retención de orden de compra:", error);
      throw error;
    }
  },
};

// ============ ORDENES SERVICIO API ============
export interface OrdenServicioData extends OrdenBaseData {
  id_orden_servicio?: number; // Primary key returned from backend
}

const decodeOrdenServicioData = (orden: OrdenServicioData): OrdenServicioData =>
  decodeOrdenData(orden);

export const ordenesServicioApi = {
  // Obtener todas las órdenes de servicio
  getAll: async (): Promise<OrdenServicioData[]> => {
    try {
      const response = await api.get("/ordenes-servicio");
      return Array.isArray(response.data) ? response.data.map(decodeOrdenServicioData) : [];
    } catch (error) {
      console.error("Ordenes Servicio API error:", error);
      throw error;
    }
  },

  // Obtener el siguiente número de orden
  getSiguienteNumero: async (): Promise<{
    serie: string;
    nroDoc: string;
    numero_orden_completo: string;
  }> => {
    try {
      const response = await api.get("/ordenes-servicio/siguiente-numero");
      return response.data;
    } catch (error) {
      console.error("Ordenes Servicio API error:", error);
      // Retornar valores por defecto en caso de error
      return {
        serie: "0001",
        nroDoc: "000001",
        numero_orden_completo: "0001-000001",
      };
    }
  },

  // Crear orden de servicio
  create: async (ordenData: OrdenServicioData): Promise<OrdenServicioData> => {
    try {
      const response = await api.post("/ordenes-servicio", ordenData);
      // La respuesta del backend viene como { success, message, data }
      // donde data contiene la orden con detalles
      if (response.data && response.data.data) {
        const orden = response.data.data;
        // Mapear detalles a items para compatibilidad
        const ordenConItems = {
          ...orden,
          items: orden.detalles || [],
        };
        return decodeOrdenServicioData(ordenConItems);
      }
      return response.data;
    } catch (error) {
      console.error("Ordenes Servicio API error:", error);
      throw error;
    }
  },

  // Crear varias órdenes de servicio a la vez (multifactura, un solo grupo)
  createBatch: async (
    ordenes: OrdenServicioData[],
    reservaOwner: string
  ): Promise<ResultadoBatchOrdenes> => {
    try {
      const response = await api.post(
        "/ordenes-servicio/batch",
        { ordenes, reserva_owner: reservaOwner },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error("Ordenes Servicio API error:", error);
      throw error;
    }
  },

  // Copia la cotización de una orden a las demás órdenes de su grupo
  propagarCotizacion: async (id: number): Promise<{ actualizadas: number }> => {
    const response = await api.post(`/ordenes-servicio/${id}/propagar-cotizacion`);
    return response.data;
  },

  // Convierte órdenes existentes en multifactura (grupo nuevo, o suma a uno existente)
  agrupar: async (ids: number[], grupoId?: string): Promise<ResultadoAgrupar> => {
    const response = await api.post("/ordenes-servicio/agrupar", {
      ids,
      ...(grupoId ? { grupo_id: grupoId } : {}),
    });
    return response.data;
  },

  // Saca una orden de su multifactura
  desagrupar: async (id: number): Promise<void> => {
    await api.post(`/ordenes-servicio/${id}/desagrupar`);
  },

  // Crea una orden nueva dentro de la multifactura de una orden existente
  agregarOrdenNueva: async (
    baseId: number,
    orden: OrdenServicioData,
    reservaOwner: string
  ): Promise<ResultadoAgregarOrdenNueva> => {
    const response = await api.post(
      `/ordenes-servicio/${baseId}/agregar-orden`,
      { orden, reserva_owner: reservaOwner },
      { timeout: 30000 }
    );
    return response.data;
  },

  // Actualizar orden de servicio
  update: async (id: number, ordenData: OrdenServicioData): Promise<OrdenServicioData> => {
    try {
      const response = await api.put(`/ordenes-servicio/${id}`, ordenData);
      return response.data ? decodeOrdenServicioData(response.data) : response.data;
    } catch (error) {
      console.error("Ordenes Servicio API error:", error);
      throw error;
    }
  },

  // Obtener tipo de cambio de SUNAT
  getTipoCambio: async (): Promise<{
    success: boolean;
    tipo_cambio: number;
    fecha: string;
  }> => {
    try {
      const response = await api.get("/ordenes-servicio/tipo-cambio");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo tipo de cambio:", error);
      // Retornar valor por defecto en caso de error
      return {
        success: false,
        tipo_cambio: 0,
        fecha: new Date().toISOString().split("T")[0],
      };
    }
  },

  // Eliminar una orden de servicio
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/ordenes-servicio/${id}`);
    } catch (error) {
      console.error("Error eliminando orden de servicio:", error);
      throw error;
    }
  },

  // Aprobar orden de servicio para contabilidad
  aprobarContabilidad: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/aprobar-contabilidad`);
    } catch (error) {
      console.error("Error aprobando orden de servicio para contabilidad:", error);
      throw error;
    }
  },

  // Aprobar orden de servicio para administración
  aprobarAdministrador: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/aprobar-administrador`);
    } catch (error) {
      console.error("Error aprobando orden de servicio para administración:", error);
      throw error;
    }
  },

  // Aprobar orden de servicio para jefe de proyecto
  aprobarJefeProyecto: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/aprobar-jefe-proyecto`);
    } catch (error) {
      console.error("Error aprobando orden de servicio para jefe de proyecto:", error);
      throw error;
    }
  },

  // Transferir orden de servicio (Gerencia)
  transferir: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/transferir`);
    } catch (error) {
      console.error("Error transfiriendo orden de servicio:", error);
      throw error;
    }
  },

  // Pagar orden de servicio
  pagar: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/pagar`);
    } catch (error) {
      console.error("Error pagando orden de servicio:", error);
      throw error;
    }
  },

  // Actualizar número de factura
  actualizarNumeroFactura: async (id: number, nroFactura: string): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/numero-factura`, { nro_factura: nroFactura });
    } catch (error) {
      console.error("Error actualizando número de factura:", error);
      throw error;
    }
  },

  // Actualizar número de recibo por honorarios
  actualizarNumeroRH: async (id: number, nroRH: string): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/numero-rh`, { nro_rh: nroRH });
    } catch (error) {
      console.error("Error actualizando número de RH:", error);
      throw error;
    }
  },

  // Subir archivo para orden de servicio
  uploadFile: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-servicio/${id}/upload`, {
        method: 'POST',
        body: formData,
        // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir archivo');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo archivo de orden de servicio:", error);
      throw error;
    }
  },

  // Subir cotización para orden de servicio
  uploadCotizacion: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-servicio/${id}/upload-cotizacion`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir cotización');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo cotización de orden de servicio:", error);
      throw error;
    }
  },

  // Subir factura para orden de servicio
  uploadFactura: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-servicio/${id}/upload-factura`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir factura');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo factura de orden de servicio:", error);
      throw error;
    }
  },

  // Subir comprobante de retención para orden de servicio
  uploadComprobanteRetencion: async (id: number, formData: FormData): Promise<{
    success: boolean;
    message: string;
    fileUrl: string;
    filePath: string;
    fileId: string;
  }> => {
    try {
      const response = await uploadFileWithRetry(
        `${API_BASE_URL}/ordenes-servicio/${id}/upload-comprobante-retencion`,
        formData,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir comprobante de retención');
      }

      return response.json();
    } catch (error) {
      console.error("Error subiendo comprobante de retención de orden de servicio:", error);
      throw error;
    }
  },

  // Multifacturas
  getMultifacturas: async (id: number) => {
    try {
      const response = await api.get(`/ordenes-servicio/${id}/multifacturas`);
      return response.data as MultifacturaDetalle[];
    } catch (error) {
      console.error("Error obteniendo multifacturas de orden de servicio:", error);
      throw error;
    }
  },

  saveMultifacturas: async (id: number, rows: Partial<MultifacturaDetalle>[]) => {
    try {
      const response = await api.post(`/ordenes-servicio/${id}/multifacturas`, { rows });
      return response.data as MultifacturaDetalle[];
    } catch (error) {
      console.error("Error guardando multifacturas de orden de servicio:", error);
      throw error;
    }
  },

  uploadMultifacturaFactura: async (id: number, detalleId: number, formData: FormData): Promise<{ message: string; fileUrl: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-servicio/${id}/multifacturas/${detalleId}/upload-factura`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir factura');
      }
      return response.json();
    } catch (error) {
      console.error("Error subiendo factura de multifactura:", error);
      throw error;
    }
  },

  uploadMultifacturaGuia: async (id: number, detalleId: number, formData: FormData): Promise<{ message: string; fileUrl: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes-servicio/${id}/multifacturas/${detalleId}/upload-guia`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir guía');
      }
      return response.json();
    } catch (error) {
      console.error("Error subiendo guía de multifactura:", error);
      throw error;
    }
  },

  // Obtener todas las órdenes de servicio (admin, incluye eliminadas)
  getAllAdmin: async (): Promise<OrdenServicioData[]> => {
    try {
      const response = await api.get("/ordenes-servicio/admin");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Ordenes Servicio Admin API error:", error);
      return [];
    }
  },

  // Restaurar una orden de servicio eliminada
  restore: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/restore`);
    } catch (error) {
      console.error("Error restaurando orden de servicio:", error);
      throw error;
    }
  },

  saveBackendLogs: async (id: number, logs: string): Promise<void> => {
    await api.patch(`/ordenes-servicio/${id}/backend-logs`, { logs });
  },

  removeOperacion: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/remove-operacion`);
    } catch (error) {
      console.error("Error eliminando operación de orden de servicio:", error);
      throw error;
    }
  },

  removeCotizacion: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/remove-cotizacion`);
    } catch (error) {
      console.error("Error eliminando cotización de orden de servicio:", error);
      throw error;
    }
  },

  removeFactura: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/remove-factura`);
    } catch (error) {
      console.error("Error eliminando factura de orden de servicio:", error);
      throw error;
    }
  },

  removeRetencion: async (id: number): Promise<void> => {
    try {
      await api.patch(`/ordenes-servicio/${id}/remove-retencion`);
    } catch (error) {
      console.error("Error eliminando comprobante de retención de orden de servicio:", error);
      throw error;
    }
  },
};
