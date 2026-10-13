import { api } from "./client";

// ============ GUÍAS DE REMISIÓN ELECTRÓNICA (GRE) API ============
export interface GuiaRemisionData {
  id_guia?: number;
  operacion: string;
  tipo_de_comprobante: number; // 7 = Remitente, 8 = Transportista
  serie: string;
  numero: number;

  // Cliente/Destinatario
  cliente_tipo_de_documento: number;
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion: string;
  cliente_email?: string;

  // Fechas
  fecha_de_emision: string;
  fecha_de_inicio_de_traslado: string;

  // Peso y bultos
  peso_bruto_total: number;
  peso_bruto_unidad_de_medida: string;
  numero_de_bultos?: number;

  // Traslado (GRE Remitente)
  motivo_de_traslado?: string;
  tipo_de_transporte?: string;

  // Transporte
  transportista_placa_numero: string;
  transportista_documento_tipo?: number;
  transportista_documento_numero?: string;
  transportista_denominacion?: string;

  // Conductor
  conductor_documento_tipo?: number;
  conductor_documento_numero?: string;
  conductor_denominacion?: string;
  conductor_nombre?: string;
  conductor_apellidos?: string;
  conductor_numero_licencia?: string;

  // Destinatario (GRE Transportista)
  destinatario_documento_tipo?: number;
  destinatario_documento_numero?: string;
  destinatario_denominacion?: string;

  // Ubicaciones
  punto_de_partida_ubigeo: string;
  punto_de_partida_direccion: string;
  punto_de_llegada_ubigeo: string;
  punto_de_llegada_direccion: string;

  // Proyecto (opcional)
  id_proyecto?: number;
  id_etapa?: number;
  id_sector?: number;
  id_frente?: number;
  id_partida?: number;

  observaciones?: string;

  // Items
  items: Array<{
    unidad_de_medida: string;
    codigo?: string;
    descripcion: string;
    cantidad: number;
  }>;

  // Documentos relacionados
  documento_relacionado?: Array<{
    tipo: string;
    serie: string;
    numero: number;
  }>;

  // Estado
  estado_gre?: string;
  ultimo_error?: string | null;
  enlace_del_pdf?: string;
  enlace_del_xml?: string;
  enlace_del_cdr?: string;

  // Identificador único de la programación técnica
  identificador_unico?: string;

  created_at?: string;
  updated_at?: string;
}

export const guiasRemisionApi = {
  // Obtener todas las guías con filtros
  getAll: async (filters?: {
    page?: number;
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    id_proyecto?: number;
    estado_gre?: string;
    serie?: string;
  }) => {
    try {
      const response = await api.get("/guias-remision", { params: filters });
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión API error:", error);
      return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  // Obtener guía por ID
  getById: async (id: number): Promise<GuiaRemisionData> => {
    try {
      const response = await api.get(`/guias-remision/${id}`);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión API error:", error);
      throw new Error("Guía de remisión no encontrada");
    }
  },

  // Crear nueva guía
  create: async (data: Omit<GuiaRemisionData, "id_guia" | "created_at" | "updated_at" | "estado_gre" | "enlace_del_pdf" | "enlace_del_xml" | "enlace_del_cdr">): Promise<GuiaRemisionData> => {
    try {
      const response = await api.post("/guias-remision", data);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión API error:", error);
      throw new Error("Error al crear guía de remisión");
    }
  },

  // Actualizar guía
  update: async (id: number, data: Partial<GuiaRemisionData>): Promise<GuiaRemisionData> => {
    try {
      const response = await api.put(`/guias-remision/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión API error:", error);
      throw new Error("Error al actualizar guía de remisión");
    }
  },

  // Eliminar guía
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/guias-remision/${id}`);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión API error:", error);
      throw new Error("Error al eliminar guía de remisión");
    }
  },

  // Obtener el último número de guía
  getLastNumber: async (): Promise<number> => {
    try {
      const response = await api.get("/guias-remision/ultimo-numero");
      return response.data.numero || 0;
    } catch (error) {
      console.error("Guías de Remisión API error:", error);
      return 0;
    }
  },

  // Obtener identificadores que ya tienen guías en la tabla regular
  getIdentificadoresExistentes: async (): Promise<string[]> => {
    try {
      const response = await api.get("/guias-remision/identificadores-existentes");
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo identificadores existentes:", error);
      return [];
    }
  },
};

// ============ GUIAS REMISION EXTENDIDO API (TTT2) ============
export const guiasRemisionExtendidoApi = {
  // Obtener todas las guías extendidas con filtros
  getAll: async (filters?: {
    page?: number;
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    id_proyecto?: number;
    estado_gre?: string;
    serie?: string;
  }) => {
    try {
      const response = await api.get("/guias-remision-extendido", { params: filters });
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión Extendido API error:", error);
      return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  // Obtener guía extendida por ID
  getById: async (id: number): Promise<GuiaRemisionData> => {
    try {
      const response = await api.get(`/guias-remision-extendido/${id}`);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión Extendido API error:", error);
      throw new Error("Guía de remisión extendida no encontrada");
    }
  },

  // Crear nueva guía extendida
  create: async (data: Omit<GuiaRemisionData, "id_guia" | "created_at" | "updated_at" | "estado_gre" | "enlace_del_pdf" | "enlace_del_xml" | "enlace_del_cdr">): Promise<GuiaRemisionData> => {
    try {
      const response = await api.post("/guias-remision-extendido", data);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión Extendido API error:", error);
      throw new Error("Error al crear guía de remisión extendida");
    }
  },

  // Actualizar guía extendida
  update: async (id: number, data: Partial<GuiaRemisionData>): Promise<GuiaRemisionData> => {
    try {
      const response = await api.put(`/guias-remision-extendido/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión Extendido API error:", error);
      throw new Error("Error al actualizar guía de remisión extendida");
    }
  },

  // Eliminar guía extendida
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/guias-remision-extendido/${id}`);
      return response.data;
    } catch (error) {
      console.error("Guías de Remisión Extendido API error:", error);
      throw new Error("Error al eliminar guía de remisión extendida");
    }
  },

  // Obtener el último número de guía extendida
  getLastNumber: async (): Promise<number> => {
    try {
      const response = await api.get("/guias-remision-extendido/ultimo-numero");
      return response.data.numero || 0;
    } catch (error) {
      console.error("Guías de Remisión Extendido API error:", error);
      return 0;
    }
  },

  // Obtener guías por identificador único (para mostrar duplicaciones)
  getByIdentificador: async (identificador: string): Promise<GuiaRemisionData[]> => {
    try {
      const response = await api.get(`/guias-remision-extendido/by-identificador/${identificador}`);
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo guías por identificador:", error);
      return [];
    }
  },

  // Obtener guías para múltiples identificadores en una sola petición
  // (usar siempre que se necesiten guías de una tabla/listado completo, en vez de N llamadas a getByIdentificador)
  getByIdentificadores: async (identificadores: string[]): Promise<Record<string, GuiaRemisionData[]>> => {
    if (identificadores.length === 0) return {};
    try {
      const response = await api.post("/guias-remision-extendido/by-identificadores", {
        identificadores,
      });
      return response.data || {};
    } catch (error) {
      console.error("Error obteniendo guías por identificadores:", error);
      return {};
    }
  },

  // Obtener identificadores que ya tienen guías en la tabla extendida
  getIdentificadoresExistentes: async (): Promise<string[]> => {
    try {
      const response = await api.get("/guias-remision-extendido/identificadores-existentes");
      return response.data || [];
    } catch (error) {
      console.error("Error obteniendo identificadores existentes:", error);
      return [];
    }
  },

  // Recuperar archivos de una guía extendida específica desde SUNAT
  recuperarArchivosGuia: async (idGuia: number): Promise<{
    success: boolean;
    message: string;
    data?: {
      id_guia: number;
      serie: string;
      numero: number;
      estado_gre: string | null;
      enlace_del_pdf: string;
      enlace_del_xml: string;
      enlace_del_cdr: string;
    }
  }> => {
    try {
      const response = await api.post(`/guias-remision-extendido/manual-consulta/${idGuia}`);
      return response.data;
    } catch (error) {
      console.error("Recuperar Archivos Guía Extendida API error:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("Error al recuperar archivos de la guía extendida");
    }
  },

  // Descargar todos los archivos de un identificador como ZIP (proxy para evitar CORS)
  descargarZip: async (identificador: string): Promise<ArrayBuffer> => {
    try {
      const response = await api.post(`/guias-remision-extendido/descargar-zip/${identificador}`, {}, {
        responseType: 'arraybuffer',
        timeout: 120000, // 2 minutos de timeout para dar tiempo a descargar todos los archivos
      });
      return response.data;
    } catch (error) {
      console.error("Descargar ZIP API error:", error);
      throw new Error("Error al descargar el archivo ZIP");
    }
  },

  // Descargar PDF + XML + CDR de una guía puntual como ZIP (proxy para evitar CORS)
  descargarZipGuia: async (idGuia: number): Promise<ArrayBuffer> => {
    try {
      const response = await api.post(`/guias-remision-extendido/descargar-zip-guia/${idGuia}`, {}, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      return response.data;
    } catch (error) {
      console.error("Descargar ZIP de guía API error:", error);
      throw new Error("Error al descargar el archivo ZIP de la guía");
    }
  },

  exportarExcel: async (proveedores?: string[]): Promise<ArrayBuffer> => {
    try {
      const response = await api.post(
        "/guias-remision-extendido/exportar-excel",
        { proveedores: proveedores && proveedores.length > 0 ? proveedores : undefined },
        { responseType: "arraybuffer", timeout: 60000 },
      );
      return response.data;
    } catch (error) {
      console.error("Exportar Excel API error:", error);
      throw new Error("Error al exportar el archivo Excel");
    }
  },
};

// Exportar la instancia de axios para uso directo si es necesario
