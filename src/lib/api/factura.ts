import { api } from "./client";

// ============================================================================
// API DE FACTURAS ELECTRÓNICAS
// ============================================================================

export interface FacturaData {
  id_factura: number;
  estado_factura: string | null;
  tipo_de_comprobante: number;
  serie: string;
  numero: number;
  id_proveedor: number;
  cliente_tipo_documento: number;
  cliente_numero_documento: string;
  cliente_denominacion: string;
  fecha_emision: string;
  moneda: number;
  total: number;
  enlace?: string | null;
  enlace_del_pdf?: string | null;
  enlace_del_xml?: string | null;
  enlace_del_cdr?: string | null;
  aceptada_por_sunat?: boolean | null;
  sunat_description?: string | null;
  sunat_note?: string | null;
  sunat_soap_error?: string | null;
  created_at?: string;
  updated_at?: string;
  backend_logs?: string | null;
  proveedores?: {
    nombre_proveedor: string;
    ruc: string;
  };
}

export interface FacturaStats {
  totalFacturas: number;
  porEstado: {
    NULL: number;
    PENDIENTE: number;
    PROCESANDO: number;
    COMPLETADO: number;
    FALLADO: number;
  };
}

export interface FacturaPollingStatus {
  isActive: boolean;
  attempts: number;
  dbRecord: {
    estado_factura: string;
    [key: string]: unknown;
  };
}

export interface FacturaUnidadMedida {
  codigo: string;
  descripcion: string;
}

export const facturaApi = {
  // Listar todas las facturas
  getAll: async (): Promise<FacturaData[]> => {
    const response = await api.get("/facturas");
    return response.data.data; // Backend devuelve {data: [...], pagination: {...}}
  },

  // Obtener una factura por ID
  getById: async (id: number): Promise<FacturaData> => {
    const response = await api.get(`/facturas/${id}`);
    return response.data;
  },

  // Catálogo de unidades de medida seleccionables para items de factura
  getUnidadesMedida: async (): Promise<FacturaUnidadMedida[]> => {
    const response = await api.get("/facturas/unidades-medida");
    return response.data;
  },

  // Agregar una nueva unidad de medida al catálogo
  createUnidadMedida: async (
    data: FacturaUnidadMedida
  ): Promise<FacturaUnidadMedida> => {
    const response = await api.post("/facturas/unidades-medida", data);
    return response.data;
  },

  // Crear nueva factura
  create: async (data: Partial<FacturaData>): Promise<FacturaData> => {
    const response = await api.post("/facturas", data);
    return response.data.data; // Backend devuelve {success: true, message: '...', data: {...}}
  },

  // Actualizar factura
  update: async (id: number, data: Partial<FacturaData>): Promise<FacturaData> => {
    const response = await api.put(`/facturas/${id}`, data);
    return response.data.data; // Backend devuelve {success: true, message: '...', data: {...}}
  },

  // Eliminar factura
  delete: async (id: number): Promise<void> => {
    await api.delete(`/facturas/${id}`);
  },

  // Obtener estadísticas del sistema
  getStats: async (): Promise<FacturaStats> => {
    const response = await api.get("/factura/stats");
    return response.data;
  },

  // Obtener estado de una factura (con polling info)
  getStatus: async (id: number): Promise<FacturaPollingStatus> => {
    const response = await api.get(`/factura/polling/${id}`);
    return response.data;
  },

  // Forzar detección de una factura
  forceDetection: async (id: number): Promise<unknown> => {
    const response = await api.post(`/factura/detector/force/${id}`);
    return response.data;
  },

  // Resetear factura fallida
  reset: async (id: number): Promise<unknown> => {
    const response = await api.post(`/factura/reset/${id}`);
    return response.data;
  },

  // Reintentar todas las facturas fallidas
  retryFailed: async (): Promise<unknown> => {
    const response = await api.post("/factura/retry-failed");
    return response.data;
  },

  // Consultar factura en NubeFact (operación: consultar)
  consultarNubefact: async (id: number): Promise<unknown> => {
    const response = await api.post(`/facturas/${id}/consultar`);
    return response.data;
  },

  saveBackendLogs: async (id: number, logs: string): Promise<void> => {
    await api.patch(`/facturas/${id}/backend-logs`, { logs });
  },
};
