import { api } from "./client";

// ============ PROGRAMACIÓN API ============
export interface ProgramacionData {
  fecha: Date | string;
  unidad: number; // ID del camión
  proveedor: string; // Código de empresa
  programacion: string;
  hora_partida: string;
  estado_programacion: string;
  comentarios?: string;
  punto_partida_ubigeo: string;
  punto_partida_direccion: string;
  punto_llegada_ubigeo: string;
  punto_llegada_direccion: string;
  peso?: string; // Capacidad del tanque del camión
  id_proyecto?: number; // ID del proyecto (solo se guarda en programacion_tecnica)
  id_subproyecto?: number; // ID del subproyecto (solo se guarda en programacion_tecnica)
  numero_orden?: string; // Número de orden para viaje activo
}

export interface ProgramacionTecnicaData {
  id: number;
  fecha: string | null;
  unidad: string | null;
  proveedor: string | null;
  apellidos_nombres: string | null;
  proyectos: string | null;
  tipo_proyecto: 'proyecto' | 'subproyecto' | null;
  programacion: string | null;
  hora_partida: string | null;
  hora_registro: string | null;
  estado_programacion: string | null;
  comentarios: string | null;
  validacion: string | null;
  identificador_unico: string | null;
  km_del_dia: string | null;
  mes: string | null;
  num_semana: string | null;
  m3: string | null;
  cantidad_viaje: string | null;
  // Campos de guía
  guia_numero_documento: string | null;
  guia_destinatario_denominacion: string | null;
  guia_destinatario_direccion: string | null;
  guia_traslado_motivo: string | null;
  guia_traslado_bultos: string | null;
  guia_traslado_tipo_transporte: string | null;
  guia_traslado_fecha_inicio: string | null;
  guia_traslado_peso_bruto: string | null;
  guia_traslado_unidad_medida: string | null;
  guia_traslado_vehiculo_placa: string | null;
  guia_conductor_tipo_dni: string | null;
  guia_conductor_dni_numero: string | null;
  guia_conductor_nombres: string | null;
  guia_conductor_apellidos: string | null;
  guia_conductor_num_licencia: string | null;
  guia_partida_direccion: string | null;
  guia_partida_ubigeo: string | null;
  guia_llegada_direccion: string | null;
  guia_llegada_ubigeo: string | null;
  // Enlaces de archivos de guía de remisión (desde JOIN)
  enlace_del_pdf: string | null;
  enlace_del_xml: string | null;
  enlace_del_cdr: string | null;
  estado_gre: string | null;
  // Campos de duplicación
  duplicado_origen_id: number | null;
  duplicado_fecha: string | null;
  duplicado_lote_id: string | null;
  // IDs de Proyecto (necesarios para duplicación y preselección)
  id_proyecto?: number | null;
  id_etapa?: number | null;
  id_sector?: number | null;
  id_frente?: number | null;
  id_partida?: number | null;
  // IDs de Subproyecto
  id_subproyecto?: number | null;
  id_subetapa?: number | null;
  id_subsector?: number | null;
  id_subfrente?: number | null;
  id_subpartida?: number | null;
  // Peso bruto total
  peso_bruto_total?: number | null;
  // Soft delete
  deleted_at?: string | null;
  // Logs del backend persistidos
  backend_logs?: string | null;
  // Viaje activo
  numero_orden?: string | null;
}

// Extended type for getTecnicaById response
export interface ProgramacionTecnicaDetalleData extends ProgramacionTecnicaData {
  punto_partida_ubigeo: string | null;
  punto_partida_direccion: string | null;
  punto_llegada_ubigeo: string | null;
  punto_llegada_direccion: string | null;
  camion_placa: string | null;
  camion_dni: string | null;
  camion_nombre_chofer: string | null;
  camion_apellido_chofer: string | null;
  camion_numero_licencia: string | null;
  empresa_razon_social: string | null;
  empresa_nro_documento: string | null;
  empresa_direccion: string | null;
  id_proyecto: number | null;
  id_subproyecto: number | null;
}

export interface ProgramacionResponse {
  message: string;
  totalRecords: number;
  successCount: number;
  processingTime: number;
}

export const programacionApi = {
  // Crear múltiples registros de programación
  createBatch: async (data: ProgramacionData[]): Promise<ProgramacionResponse> => {
    try {
      const response = await api.post("/programacion", { data });
      return response.data;
    } catch (error) {
      console.error("Programación API error:", error);
      
      // Extraer mensaje de error del servidor si está disponible
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      
      throw new Error("Error al guardar los registros de programación");
    }
  },

  // Obtener todos los registros de programación
  getAll: async (): Promise<ProgramacionData[]> => {
    try {
      const response = await api.get("/programacion");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Programación API error:", error);
      return [];
    }
  },

  // Obtener registro por ID
  getById: async (id: number): Promise<ProgramacionData> => {
    try {
      const response = await api.get(`/programacion/${id}`);
      return response.data;
    } catch (error) {
      console.error("Programación API error:", error);
      throw new Error("Registro de programación no encontrado");
    }
  },

  // Eliminar registro
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/programacion/${id}`);
      return response.data;
    } catch (error) {
      console.error("Programación API error:", error);
      throw new Error("Error al eliminar el registro");
    }
  },

  // Obtener programación técnica por ID
  getTecnicaById: async (id: number): Promise<ProgramacionTecnicaDetalleData | null> => {
    try {
      const response = await api.get(`/programacion/tecnica/${id}`);
      return response.data;
    } catch (error) {
      console.error("Programación Técnica getById API error:", error);
      return null;
    }
  },

  // Actualizar programación técnica con IDs de proyecto y campos editables
  updateTecnica: async (
    id: number,
    data: {
      id_proyecto?: number | null;
      id_etapa?: number | null;
      id_sector?: number | null;
      id_frente?: number | null;
      id_partida?: number | null;
      id_subproyecto?: number | null;
      id_subetapa?: number | null;
      id_subsector?: number | null;
      id_subfrente?: number | null;
      id_subpartida?: number | null;
      m3?: string | null;
      estado_programacion?: string | null;
      comentarios?: string | null;
      cantidad_viaje?: string | null;
      proveedor?: string | null;
      fecha?: string | null;
      hora_partida?: string | null;
      unidad?: number | null;
      programacion?: string | null;
    }
  ): Promise<{ message: string }> => {
    try {
      const response = await api.patch(`/programacion/tecnica/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Programación Técnica Update API error:", error);
      throw new Error("Error al actualizar programación técnica");
    }
  },

  // Obtener todos los registros de programación técnica
  getAllTecnica: async (): Promise<ProgramacionTecnicaData[]> => {
    try {
      const response = await api.get("/programacion/tecnica");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Programación Técnica API error:", error);
      return [];
    }
  },

  // Obtener identificadores únicos que tienen guía generada
  getIdentificadoresConGuia: async (): Promise<string[]> => {
    try {
      const response = await api.get("/programacion/tecnica/con-guia");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Programación Técnica Con Guía API error:", error);
      return [];
    }
  },

  // Obtener datos completos de registros recién completados (con enlaces PDF/XML/CDR)
  getRecienCompletados: async (segundos: number = 30): Promise<ProgramacionTecnicaData[]> => {
    try {
      const response = await api.get("/programacion/tecnica/recien-completados", {
        params: { segundos },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Programación Técnica Recién Completados API error:", error);
      return [];
    }
  },

  // Combinar múltiples PDFs en uno solo
  combinarPdfs: async (urls: string[]): Promise<Blob> => {
    try {
      const response = await api.post(
        "/programacion/combinar-pdfs",
        { urls },
        {
          responseType: "blob", // Importante para recibir el PDF como blob
        }
      );
      return response.data;
    } catch (error) {
      console.error("Combinar PDFs API error:", error);
      throw new Error("Error al combinar los PDFs");
    }
  },

  // Recuperar archivos de una guía que ya existe en SUNAT
  recuperarArchivosGuia: async (idGuia: number): Promise<{ success: boolean; message: string; data?: Pick<ProgramacionTecnicaData, 'estado_gre' | 'enlace_del_pdf' | 'enlace_del_xml' | 'enlace_del_cdr'> }> => {
    try {
      const response = await api.post(`/gre/manual-consulta/${idGuia}`);
      return response.data;
    } catch (error) {
      console.error("Recuperar Archivos Guía API error:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("Error al recuperar archivos de la guía");
    }
  },

  // Eliminar registro de programacion_tecnica (y también de programacion por identificador_unico)
  deleteTecnica: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/programacion/tecnica/${id}`);
      return response.data;
    } catch (error) {
      console.error("Programación Técnica Delete API error:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("Error al eliminar el registro");
    }
  },

  // Obtener todos los registros de programación técnica (admin, incluye eliminados)
  getAllTecnicaAdmin: async (): Promise<ProgramacionTecnicaData[]> => {
    try {
      const response = await api.get("/programacion/tecnica/admin");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Programación Técnica Admin API error:", error);
      return [];
    }
  },

  // Restaurar un registro de programación técnica eliminado
  restoreTecnica: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.patch(`/programacion/tecnica/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error("Programación Técnica Restore API error:", error);
      throw new Error("Error al restaurar el registro");
    }
  },

  saveBackendLogs: async (id: number, logs: string): Promise<void> => {
    await api.patch(`/programacion/tecnica/${id}/backend-logs`, { logs });
  },

  updateNumeroOrden: async (id: number, numeroOrden: string | null): Promise<void> => {
    await api.patch(`/programacion/tecnica/${id}/numero-orden`, { numero_orden: numeroOrden });
  },

  exportarExcel: async (filtros?: {
    proveedores?: string[];
    unidades?: string[];
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<ArrayBuffer> => {
    try {
      const response = await api.post(
        "/programacion/exportar-excel",
        filtros || {},
        { responseType: "arraybuffer", timeout: 60000 },
      );
      return response.data;
    } catch (error) {
      console.error("Exportar Excel Programacion API error:", error);
      throw new Error("Error al exportar el archivo Excel");
    }
  },

  exportarExcelMixto: async (filtros?: {
    proveedores?: string[];
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<ArrayBuffer> => {
    try {
      const response = await api.post(
        "/programacion/exportar-excel-mixto",
        filtros || {},
        { responseType: "arraybuffer", timeout: 60000 },
      );
      return response.data;
    } catch (error) {
      console.error("Exportar Excel Mixto API error:", error);
      throw new Error("Error al exportar el archivo Excel mixto");
    }
  },
};

// ============ ACARREO INTERFACES ============
export interface AcarreoData {
  fecha: Date;
  unidad: number; // ID del camión
  proveedor: string; // Código de empresa
  programacion: string;
  hora_partida: string;
  estado_programacion: string;
  comentarios?: string;
  punto_partida_ubigeo: string;
  punto_partida_direccion: string;
  punto_llegada_ubigeo: string;
  punto_llegada_direccion: string;
  peso?: string; // Capacidad del tanque del camión
  id_proyecto?: number; // ID del proyecto
  id_subproyecto?: number; // ID del subproyecto
}

export interface AcarreoResponse {
  successCount: number;
  failedCount: number;
  processingTime: number;
}

// ============ ACARREO API ============
export const acarreoApi = {
  // Crear múltiples registros de acarreo
  createBatch: async (data: AcarreoData[]): Promise<AcarreoResponse> => {
    try {
      const response = await api.post("/acarreo", { data });
      return response.data;
    } catch (error) {
      console.error("Acarreo API error:", error);

      // Extraer mensaje de error del servidor si está disponible
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }

      throw new Error("Error al guardar los registros de acarreo");
    }
  },

  // Obtener todos los registros de acarreo
  getAll: async (): Promise<AcarreoData[]> => {
    try {
      const response = await api.get("/acarreo");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Acarreo API error:", error);
      return [];
    }
  },

  // Obtener registro por ID
  getById: async (id: number): Promise<AcarreoData> => {
    try {
      const response = await api.get(`/acarreo/${id}`);
      return response.data;
    } catch (error) {
      console.error("Acarreo API error:", error);
      throw new Error("Registro de acarreo no encontrado");
    }
  },

  // Eliminar registro
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/acarreo/${id}`);
      return response.data;
    } catch (error) {
      console.error("Acarreo API error:", error);
      throw new Error("Error al eliminar el registro");
    }
  },
};


// ============ OPCIONES PROGRAMACION API ============
export interface OpcionProgramacion {
  id: number;
  nombre: string;
  created_at?: string;
}

export const opcionesProgramacionApi = {
  getAll: async (): Promise<OpcionProgramacion[]> => {
    try {
      const response = await api.get("/opciones-programacion");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("OpcionesProgramacion API error:", error);
      return [];
    }
  },

  create: async (nombre: string): Promise<OpcionProgramacion> => {
    const response = await api.post("/opciones-programacion", { nombre });
    return response.data;
  },

  update: async (id: number, nombre: string): Promise<OpcionProgramacion> => {
    const response = await api.put(`/opciones-programacion/${id}`, { nombre });
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/opciones-programacion/${id}`);
  },
};
