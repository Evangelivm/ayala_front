import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tipos de datos
export interface PersonalData {
  id: number;
  nombre: string;
  cargo: string;
  activo: boolean;
  dni?: string;
  telefono?: string;
  correo?: string;
  fecha_ingreso?: Date;
}

// Nueva estructura de personal (tabla personal normalizada sin campo cargo)
export interface PersonalNuevoData {
  id_personal: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  correo?: string;
  fecha_ingreso: string;
  activo?: boolean;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  // Campo computado para compatibilidad
  nombre_completo?: string;
}

export interface ProyectoData {
  id: number;
  nombre: string;
  cliente: string;
  ubicacion: string;
  activo: boolean;
  etapas: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
    sectores: Array<{
      id_sector: number;
      nombre: string;
      descripcion?: string;
      ubicacion?: string;
      frentes: Array<{
        id_frente: number;
        nombre: string;
        descripcion?: string;
        responsable?: string;
      }>;
    }>;
  }>;
}

export interface MaquinariaData {
  id: number;
  nombre: string;
  tipo: string;
  modelo: string;
  codigo?: string;
  año?: number;
  activo: boolean;
}

export interface ReporteOperadoresData {
  id?: number;
  codigo: string;
  fecha: string;
  id_operador?: number | null;
  id_proyecto?: number | null;
  id_etapa?: number | null;
  id_equipo?: number | null;
  id_vigia1?: number | null;
  id_vigia2?: number | null;
  id_vigia3?: number | null;
  horario1?: string;
  horario2?: string;
  horario3?: string;
  horometro_inicial?: number | null;
  horometro_final?: number | null;
  id_maquinaria?: number | null;
  detalle_produccion?: DetalleProduccionData[];
  fechaRegistro?: Date;
}

export interface ReportePlantillerosData {
  id?: number;
  codigo_reporte: string;
  proyecto?: string;
  cliente?: string;
  ubicacion?: string;
  etapa?: string;
  nombre?: string;
  fecha: string;
  cargo?: string;
  sector?: string;
  frente?: string;
  horaInicio?: string;
  horaFin?: string;
  material?: string;
  partida?: string;
  maquinaria?: string;
  estado?: string;
  modelo?: string;
  codigoMaquinaria?: string;
  comentarios?: string;
  fechaRegistro?: Date;
}

// ============ PERSONAL API ============
export const personalApi = {
  // Obtener todo el personal o filtrado por cargo
  getAll: async (cargo?: string): Promise<PersonalData[]> => {
    try {
      const response = await api.get("/personal", {
        params: cargo ? { cargo } : undefined,
      });

      // Verificar que la respuesta sea válida
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Si viene envuelto en { data: [...] }
        return Array.isArray(response.data.data) ? response.data.data : [];
      } else {
        console.warn("Personal API returned unexpected format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Personal API error:", error);
      // Fallback a datos mockeados temporalmente
      return getMockedPersonal(cargo);
    }
  },

  // Obtener personal por cargo específico
  getByCargo: async (cargo: string): Promise<PersonalData[]> => {
    try {
      const response = await api.get("/personal", { params: { cargo } });

      // Verificar que la respuesta sea válida
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Si viene envuelto en { data: [...] }
        return Array.isArray(response.data.data) ? response.data.data : [];
      } else {
        console.warn("Personal API returned unexpected format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Personal API error:", error);
      // Fallback a datos mockeados temporalmente
      return getMockedPersonal(cargo);
    }
  },

  // Obtener personal por ID
  getById: async (id: number): Promise<PersonalData> => {
    try {
      const response = await api.get(`/personal/${id}`);
      return response.data;
    } catch (error) {
      console.error("Personal API error:", error);
      throw new Error("Personal no encontrado");
    }
  },

  // Crear nuevo personal
  create: async (data: Omit<PersonalData, "id">): Promise<PersonalData> => {
    try {
      const response = await api.post("/personal", data);
      return response.data;
    } catch (error) {
      console.error("Personal API error:", error);
      throw new Error("Error al crear personal");
    }
  },

  // Actualizar personal
  update: async (
    id: number,
    data: Partial<PersonalData>
  ): Promise<PersonalData> => {
    try {
      const response = await api.put(`/personal/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Personal API error:", error);
      throw new Error("Error al actualizar personal");
    }
  },

  // Eliminar personal
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/personal/${id}`);
      return response.data;
    } catch (error) {
      console.error("Personal API error:", error);
      throw new Error("Error al eliminar personal");
    }
  },
};

// ============ PROYECTOS API ============
export const proyectosApi = {
  // Obtener todos los proyectos
  getAll: async (): Promise<ProyectoData[]> => {
    const response = await api.get("/proyectos");
    return response.data;
  },

  // Obtener proyecto por ID
  getById: async (id: number): Promise<ProyectoData> => {
    const response = await api.get(`/proyectos/${id}`);
    return response.data;
  },

  // Obtener proyecto por nombre
  getByNombre: async (nombre: string): Promise<ProyectoData[]> => {
    const response = await api.get("/proyectos", { params: { nombre } });
    return response.data;
  },

  // Crear nuevo proyecto
  create: async (data: Omit<ProyectoData, "id">): Promise<ProyectoData> => {
    const response = await api.post("/proyectos", data);
    return response.data;
  },

  // Actualizar proyecto
  update: async (
    id: number,
    data: Partial<ProyectoData>
  ): Promise<ProyectoData> => {
    const response = await api.put(`/proyectos/${id}`, data);
    return response.data;
  },

  // Eliminar proyecto
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/proyectos/${id}`);
    return response.data;
  },
};

// ============ MAQUINARIA API ============
export const maquinariaApi = {
  // Obtener toda la maquinaria
  getAll: async (): Promise<MaquinariaData[]> => {
    const response = await api.get("/maquinaria");
    return response.data;
  },

  // Obtener maquinaria por ID
  getById: async (id: number): Promise<MaquinariaData> => {
    const response = await api.get(`/maquinaria/${id}`);
    return response.data;
  },

  // Obtener maquinaria por nombre
  getByNombre: async (nombre: string): Promise<MaquinariaData[]> => {
    const response = await api.get("/maquinaria", { params: { nombre } });
    return response.data;
  },

  // Crear nueva maquinaria
  create: async (data: Omit<MaquinariaData, "id">): Promise<MaquinariaData> => {
    const response = await api.post("/maquinaria", data);
    return response.data;
  },

  // Actualizar maquinaria
  update: async (
    id: number,
    data: Partial<MaquinariaData>
  ): Promise<MaquinariaData> => {
    const response = await api.put(`/maquinaria/${id}`, data);
    return response.data;
  },

  // Eliminar maquinaria
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/maquinaria/${id}`);
    return response.data;
  },
};

// ============ REPORTES OPERADORES API ============
export const reportesOperadoresApi = {
  // Obtener todos los reportes
  getAll: async (fecha?: string): Promise<ReporteOperadoresData[]> => {
    const response = await api.get("/reportes-operadores", {
      params: fecha ? { fecha } : undefined,
    });
    return response.data;
  },

  // Obtener reporte por ID
  getById: async (id: number): Promise<ReporteOperadoresData> => {
    const response = await api.get(`/reportes-operadores/${id}`);
    return response.data;
  },

  // Obtener reportes por fecha
  getByFecha: async (fecha: string): Promise<ReporteOperadoresData[]> => {
    const response = await api.get("/reportes-operadores", {
      params: { fecha },
    });
    return response.data;
  },

  // Crear nuevo reporte
  create: async (
    data: Omit<ReporteOperadoresData, "id" | "fechaRegistro">
  ): Promise<ReporteOperadoresData> => {
    const response = await api.post("/reportes-operadores", data);
    return response.data;
  },

  // Actualizar reporte
  update: async (
    id: number,
    data: Partial<ReporteOperadoresData>
  ): Promise<ReporteOperadoresData> => {
    const response = await api.put(`/reportes-operadores/${id}`, data);
    return response.data;
  },

  // Eliminar reporte
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/reportes-operadores/${id}`);
    return response.data;
  },
};

// ============ REPORTES PLANTILLEROS API ============
export const reportesPlantillerosApi = {
  // Obtener todos los reportes
  getAll: async (
    fecha?: string,
    proyecto?: string
  ): Promise<ReportePlantillerosData[]> => {
    const params: Record<string, string> = {};
    if (fecha) params.fecha = fecha;
    if (proyecto) params.proyecto = proyecto;

    const response = await api.get("/reportes-plantilleros", { params });
    return response.data;
  },

  // Obtener reporte por ID
  getById: async (id: number): Promise<ReportePlantillerosData> => {
    const response = await api.get(`/reportes-plantilleros/${id}`);
    return response.data;
  },

  // Obtener reportes por fecha
  getByFecha: async (fecha: string): Promise<ReportePlantillerosData[]> => {
    const response = await api.get("/reportes-plantilleros", {
      params: { fecha },
    });
    return response.data;
  },

  // Obtener reportes por proyecto
  getByProyecto: async (
    proyecto: string
  ): Promise<ReportePlantillerosData[]> => {
    const response = await api.get("/reportes-plantilleros", {
      params: { proyecto },
    });
    return response.data;
  },

  // Crear nuevo reporte
  create: async (
    data: Omit<ReportePlantillerosData, "id" | "fechaRegistro">
  ): Promise<ReportePlantillerosData> => {
    const response = await api.post("/reportes-plantilleros", data);
    return response.data;
  },

  // Actualizar reporte
  update: async (
    id: number,
    data: Partial<ReportePlantillerosData>
  ): Promise<ReportePlantillerosData> => {
    const response = await api.put(`/reportes-plantilleros/${id}`, data);
    return response.data;
  },

  // Eliminar reporte
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/reportes-plantilleros/${id}`);
    return response.data;
  },
};

// ============ NUEVOS TIPOS PARA TABLAS MASTER-DETAIL ============

export interface DetalleHorarioData {
  id_horario?: number;
  numero_entrada: number;
  hora_inicio?: string;
  hora_salida?: string;
}

export interface DetalleViajeData {
  id_detalle?: number;
  item: number;
  conductor: string;
  placa: string;
  viajes: number;
  m3_tolva?: number;
  horarios: DetalleHorarioData[];
}

export interface ViajesEliminacionData {
  id_viaje?: number;
  codigo_reporte: string;
  id_proyecto?: number;
  fecha: string;
  // IDs de personal (foreign keys)
  id_responsable?: number;
  id_operador?: number;
  id_vigia?: number;
  id_mantero?: number;
  id_controlador?: number;
  id_capataz?: number;
  id_supervisor?: number;
  // Campos legacy (para compatibilidad y display)
  nombre_responsable?: string;
  operador?: string;
  maquinaria_pesada?: string;
  vigia?: string;
  mantero?: string;
  controlador?: string;
  capataz?: string;
  supervisor?: string;
  comentarios?: string;
  detalle_viajes: DetalleViajeData[];
  proyecto?: {
    id_proyecto: number;
    nombre: string;
  };
  // Referencias de personal completas
  responsable?: {
    id_personal: number;
    nombres: string;
    apellidos: string;
  };
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleProduccionData {
  id_detalle?: number;
  item: number;
  frente?: string;
  actividad?: string;
  equipo_maquinaria?: string;
  horas_trabajadas?: number;
  observaciones?: string;
  m3?: number;
  viajes?: number;
}

export interface DetalleViajesData {
  id_detalle?: number;
  item: number;
  conductor?: string;
  placa?: string;
  viajes?: number;
  m3_tolva?: number;
}

export interface ReporteOperadorWithDetails {
  id?: number;
  fecha?: string;
  detalle_produccion?: DetalleProduccionData[];
}

export interface ReporteViajeWithDetails {
  id?: number;
  fecha?: string;
  detalle_viajes?: DetalleViajesData[];
}

export interface ReportePlantilleroWithDetails {
  id?: number;
  fecha?: string;
}

export interface ReportesOperadoresNuevoData {
  id_reporte?: number;
  codigo_reporte: string;
  id_proyecto?: number;
  fecha: string;
  // IDs de personal (foreign keys)
  id_operador?: number;
  id_vigia?: number;
  id_mantero?: number;
  id_controlador?: number;
  id_capataz?: number;
  id_supervisor?: number;
  // Campos legacy (para compatibilidad y display)
  operador?: string;
  maquinaria_pesada?: string;
  vigia?: string;
  mantero?: string;
  controlador?: string;
  capataz?: string;
  supervisor?: string;
  comentarios?: string;
  detalle_produccion: DetalleProduccionData[];
  proyecto?: {
    id_proyecto: number;
    nombre: string;
  };
  // Referencias de personal completas
  personal_operador?: {
    id_personal: number;
    nombres: string;
    apellidos: string;
  };
  personal_vigia?: {
    id_personal: number;
    nombres: string;
    apellidos: string;
  };
  personal_mantero?: {
    id_personal: number;
    nombres: string;
    apellidos: string;
  };
  personal_controlador?: {
    id_personal: number;
    nombres: string;
    apellidos: string;
  };
  personal_capataz?: {
    id_personal: number;
    nombres: string;
    apellidos: string;
  };
  personal_supervisor?: {
    id_personal: number;
    nombres: string;
    apellidos: string;
  };
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReportesPlantillerosNuevoData {
  id_reporte?: number;
  codigo_reporte: string;
  id_proyecto?: number;
  fecha: string;
  responsable?: string;
  comentarios?: string;
  proyecto?: {
    id_proyecto: number;
    nombre: string;
  };
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ VIAJES ELIMINACIÓN API ============
export const viajesEliminacionApi = {
  // Obtener todos los viajes con filtros
  getAll: async (filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    id_proyecto?: number;
    codigo_reporte?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/viajes-eliminacion", { params: filters });
    return response.data;
  },

  // Obtener viaje por ID
  getById: async (id: number): Promise<ViajesEliminacionData> => {
    const response = await api.get(`/viajes-eliminacion/${id}`);
    return response.data;
  },

  // Crear nuevo viaje
  create: async (
    data: Omit<
      ViajesEliminacionData,
      | "id_viaje"
      | "created_at"
      | "updated_at"
      | "proyecto"
      | "activo"
      | "responsable"
    >
  ): Promise<ViajesEliminacionData> => {
    const response = await api.post("/viajes-eliminacion", data);
    return response.data;
  },

  // Actualizar viaje
  update: async (
    id: number,
    data: Partial<ViajesEliminacionData>
  ): Promise<ViajesEliminacionData> => {
    const response = await api.patch(`/viajes-eliminacion/${id}`, {
      ...data,
      id_viaje: id,
    });
    return response.data;
  },

  // Eliminar viaje (soft delete)
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/viajes-eliminacion/${id}`);
    return response.data;
  },

  // Eliminar viaje permanentemente
  hardDelete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/viajes-eliminacion/${id}/hard`);
    return response.data;
  },
};

// ============ REPORTES OPERADORES NUEVO API ============
export const reportesOperadoresNuevoApi = {
  // Obtener todos los reportes con filtros
  getAll: async (filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    id_proyecto?: number;
    codigo_reporte?: string;
    operador?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/reportes-operadores", { params: filters });
    return response.data;
  },

  // Obtener reporte por ID
  getById: async (id: number): Promise<ReportesOperadoresNuevoData> => {
    const response = await api.get(`/reportes-operadores/${id}`);
    return response.data;
  },

  // Crear nuevo reporte
  create: async (
    data: Omit<
      ReportesOperadoresNuevoData,
      | "id_reporte"
      | "created_at"
      | "updated_at"
      | "proyecto"
      | "activo"
      | "personal_operador"
      | "personal_vigia"
      | "personal_mantero"
      | "personal_controlador"
      | "personal_capataz"
      | "personal_supervisor"
    >
  ): Promise<ReportesOperadoresNuevoData> => {
    const response = await api.post("/reportes-operadores", data);
    return response.data;
  },

  // Actualizar reporte
  update: async (
    id: number,
    data: Partial<ReportesOperadoresNuevoData>
  ): Promise<ReportesOperadoresNuevoData> => {
    const response = await api.patch(`/reportes-operadores/${id}`, {
      ...data,
      id_reporte: id,
    });
    return response.data;
  },

  // Eliminar reporte (soft delete)
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/reportes-operadores/${id}`);
    return response.data;
  },

  // Eliminar reporte permanentemente
  hardDelete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/reportes-operadores/${id}/hard`);
    return response.data;
  },
};

// ============ REPORTES PLANTILLEROS NUEVO API ============
export const reportesPlantillerosNuevoApi = {
  // Obtener todos los reportes con filtros
  getAll: async (filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    id_proyecto?: number;
    codigo_reporte?: string;
    responsable?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/reportes-plantilleros", {
      params: filters,
    });
    return response.data;
  },

  // Obtener reporte por ID
  getById: async (id: number): Promise<ReportesPlantillerosNuevoData> => {
    const response = await api.get(`/reportes-plantilleros/${id}`);
    return response.data;
  },

  // Crear nuevo reporte
  create: async (
    data: Omit<
      ReportesPlantillerosNuevoData,
      "id_reporte" | "created_at" | "updated_at" | "proyecto" | "activo"
    >
  ): Promise<ReportesPlantillerosNuevoData> => {
    const response = await api.post("/reportes-plantilleros", data);
    return response.data;
  },

  // Actualizar reporte
  update: async (
    id: number,
    data: Partial<ReportesPlantillerosNuevoData>
  ): Promise<ReportesPlantillerosNuevoData> => {
    const response = await api.patch(`/reportes-plantilleros/${id}`, {
      ...data,
      id_reporte: id,
    });
    return response.data;
  },

  // Eliminar reporte (soft delete)
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/reportes-plantilleros/${id}`);
    return response.data;
  },

  // Eliminar reporte permanentemente
  hardDelete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/reportes-plantilleros/${id}/hard`);
    return response.data;
  },
};

// ============ PERSONAL NUEVO API (Tabla personal normalizada) ============
export const personalNuevoApi = {
  // Obtener todo el personal activo (sin filtro por cargo)
  getAll: async (): Promise<PersonalNuevoData[]> => {
    try {
      const response = await api.get("/personal");

      // Verificar si la respuesta tiene estructura paginada
      let personalData: PersonalNuevoData[];
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Respuesta paginada: { data: [...], pagination: {...} }
        personalData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
      } else if (Array.isArray(response.data)) {
        // Respuesta directa: [...]
        personalData = response.data;
      } else {
        console.warn("Personal API returned unexpected format:", response.data);
        return [];
      }

      return personalData.map((p: PersonalNuevoData) => ({
        ...p,
        nombre_completo: `${p.nombres} ${p.apellidos}`,
      }));
    } catch (error) {
      console.error("Personal API error:", error);
      return [];
    }
  },

  // Obtener personal activo (mantener método por compatibilidad pero ya no filtra por cargo)
  getByCargo: async (cargo?: string): Promise<PersonalNuevoData[]> => {
    try {
      const response = await api.get("/personal", {
        params: cargo ? { cargo } : undefined,
      });

      // Verificar si la respuesta tiene estructura paginada
      let personalData: PersonalNuevoData[];
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Respuesta paginada: { data: [...], pagination: {...} }
        personalData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
      } else if (Array.isArray(response.data)) {
        // Respuesta directa: [...]
        personalData = response.data;
      } else {
        console.warn("Personal API returned unexpected format:", response.data);
        return [];
      }

      return personalData.map((p: PersonalNuevoData) => ({
        ...p,
        nombre_completo: `${p.nombres} ${p.apellidos}`,
      }));
    } catch (error) {
      console.error("Personal API error:", error);
      return [];
    }
  },

  // Obtener personal por ID
  getById: async (id: number): Promise<PersonalNuevoData> => {
    const response = await api.get(`/personal/${id}`);
    const p = response.data;
    return {
      ...p,
      nombre_completo: `${p.nombres} ${p.apellidos}`,
    };
  },

  // Crear nuevo personal
  create: async (
    data: Omit<
      PersonalNuevoData,
      "id_personal" | "created_at" | "updated_at" | "nombre_completo"
    >
  ): Promise<PersonalNuevoData> => {
    const response = await api.post("/personal", data);
    const p = response.data;
    return {
      ...p,
      nombre_completo: `${p.nombres} ${p.apellidos}`,
    };
  },

  // Actualizar personal
  update: async (
    id: number,
    data: Partial<PersonalNuevoData>
  ): Promise<PersonalNuevoData> => {
    const response = await api.put(`/personal/${id}`, data);
    const p = response.data;
    return {
      ...p,
      nombre_completo: `${p.nombres} ${p.apellidos}`,
    };
  },

  // Eliminar personal
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/personal/${id}`);
    return response.data;
  },
};

// ============ API DE SALUD ============
export const healthApi = {
  // Verificar estado del API
  checkHealth: async () => {
    const response = await api.get("/health");
    return response.data;
  },

  // Obtener información del API
  getInfo: async () => {
    const response = await api.get("/");
    return response.data;
  },
};

// ============ DATOS MOCKEADOS TEMPORALES ============
const getMockedPersonal = (cargo?: string): PersonalData[] => {
  const allPersonal: PersonalData[] = [
    {
      id: 1,
      nombre: "Juan Pérez",
      cargo: "Operador",
      activo: true,
      dni: "12345678",
    },
    {
      id: 2,
      nombre: "María García",
      cargo: "Supervisor",
      activo: true,
      dni: "23456789",
    },
    {
      id: 3,
      nombre: "Carlos López",
      cargo: "Vigía",
      activo: true,
      dni: "34567890",
    },
    {
      id: 4,
      nombre: "Ana Rodríguez",
      cargo: "Mantero",
      activo: true,
      dni: "45678901",
    },
    {
      id: 5,
      nombre: "Luis Martín",
      cargo: "Controlador",
      activo: true,
      dni: "56789012",
    },
    {
      id: 6,
      nombre: "Carmen Torres",
      cargo: "Capataz",
      activo: true,
      dni: "67890123",
    },
    {
      id: 7,
      nombre: "Roberto Silva",
      cargo: "Operador",
      activo: true,
      dni: "78901234",
    },
    {
      id: 8,
      nombre: "Elena Morales",
      cargo: "Supervisor",
      activo: true,
      dni: "89012345",
    },
    {
      id: 9,
      nombre: "José Ruiz",
      cargo: "Vigía",
      activo: true,
      dni: "90123456",
    },
    {
      id: 10,
      nombre: "Patricia Díaz",
      cargo: "Mantero",
      activo: true,
      dni: "01234567",
    },
  ];

  if (cargo) {
    return allPersonal.filter(
      (p) => p.cargo.toLowerCase() === cargo.toLowerCase()
    );
  }

  return allPersonal;
};

// Exportar la instancia de axios para uso directo si es necesario
// ============ EQUIPOS API ============
export interface EquipoData {
  id_equipo: number;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  descripcion?: string;
  unidad: string;
  precio_referencial: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  nombre_completo?: string;
}

export const equiposApi = {
  // Obtener todos los equipos o filtrados por tipo
  getAll: async (tipo_equipo?: string): Promise<EquipoData[]> => {
    try {
      const response = await api.get("/equipos", {
        params: tipo_equipo ? { tipo_equipo } : undefined,
      });

      // Verificar si la respuesta tiene estructura paginada
      let equiposData: EquipoData[];
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Respuesta paginada: { data: [...], pagination: {...} }
        equiposData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
      } else if (Array.isArray(response.data)) {
        // Respuesta directa: [...]
        equiposData = response.data;
      } else {
        console.warn("Equipos API returned unexpected format:", response.data);
        return [];
      }

      return equiposData.map((e: EquipoData) => ({
        ...e,
        nombre_completo: `${e.marca} ${e.modelo}`,
      }));
    } catch (error) {
      console.error("Equipos API error:", error);
      return [];
    }
  },

  // Obtener equipos por tipo específico
  getByTipo: async (tipo_equipo: string): Promise<EquipoData[]> => {
    try {
      const response = await api.get("/equipos", { params: { tipo_equipo } });

      // Verificar si la respuesta tiene estructura paginada
      let equiposData: EquipoData[];
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        equiposData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
      } else if (Array.isArray(response.data)) {
        equiposData = response.data;
      } else {
        console.warn("Equipos API returned unexpected format:", response.data);
        return [];
      }

      return equiposData.map((e: EquipoData) => ({
        ...e,
        nombre_completo: `${e.marca} ${e.modelo}`,
      }));
    } catch (error) {
      console.error("Equipos API error:", error);
      return [];
    }
  },

  // Obtener equipo por ID
  getById: async (id: number): Promise<EquipoData> => {
    try {
      const response = await api.get(`/equipos/${id}`);
      const e = response.data;
      return {
        ...e,
        nombre_completo: `${e.marca} ${e.modelo}`,
      };
    } catch (error) {
      console.error("Equipos API error:", error);
      throw new Error("Equipo no encontrado");
    }
  },

  // Crear nuevo equipo
  create: async (
    data: Omit<
      EquipoData,
      "id_equipo" | "created_at" | "updated_at" | "nombre_completo"
    >
  ): Promise<EquipoData> => {
    try {
      const response = await api.post("/equipos", data);
      const e = response.data;
      return {
        ...e,
        nombre_completo: `${e.marca} ${e.modelo}`,
      };
    } catch (error) {
      console.error("Equipos API error:", error);
      throw new Error("Error al crear equipo");
    }
  },

  // Actualizar equipo
  update: async (
    id: number,
    data: Partial<EquipoData>
  ): Promise<EquipoData> => {
    try {
      const response = await api.put(`/equipos/${id}`, data);
      const e = response.data;
      return {
        ...e,
        nombre_completo: `${e.marca} ${e.modelo}`,
      };
    } catch (error) {
      console.error("Equipos API error:", error);
      throw new Error("Error al actualizar equipo");
    }
  },

  // Eliminar equipo
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/equipos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Equipos API error:", error);
      throw new Error("Error al eliminar equipo");
    }
  },
};

// ============ DASHBOARD STATS API ============
export interface DashboardStats {
  reportesViajes: {
    total: number;
    hoy: number;
    ultimaSemana: number;
    ultimoMes: number;
  };
  reportesPlantilleros: {
    total: number;
    hoy: number;
    ultimaSemana: number;
    ultimoMes: number;
  };
  reportesOperadores: {
    total: number;
    hoy: number;
    ultimaSemana: number;
    ultimoMes: number;
  };
  proyectosActivos: number;
  personalActivo: number;
  equiposDisponibles: number;
  totalHorasOperacion: number;
  totalViajes: number;
  totalM3: number;
}

export const dashboardApi = {
  // Obtener estadísticas generales del dashboard
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      console.error("Dashboard Stats API error:", error);
      // Fallback con datos calculados localmente
      return calculateStatsLocally();
    }
  },

  // Obtener reportes recientes de todos los tipos
  getRecentReports: async (limit: number = 10) => {
    try {
      const response = await api.get("/dashboard/recent-reports", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Recent Reports API error:", error);
      return [];
    }
  },

  // Obtener actividad por período
  getActivityByPeriod: async (period: "day" | "week" | "month" = "week") => {
    try {
      const response = await api.get("/dashboard/activity", {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error("Activity API error:", error);
      return [];
    }
  },

  // Obtener resumen de proyectos activos
  getActiveProjects: async () => {
    try {
      const response = await api.get("/dashboard/active-projects");
      return response.data;
    } catch (error) {
      console.error("Active Projects API error:", error);
      return [];
    }
  },
};

// Función auxiliar para calcular estadísticas localmente como fallback
async function calculateStatsLocally(): Promise<DashboardStats> {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const ultimaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const ultimoMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Cargar todos los datos en paralelo
    const [
      viajesData,
      plantillerosData,
      operadoresData,
      proyectos,
      personal,
      equipos,
    ] = await Promise.allSettled([
      viajesEliminacionApi.getAll().catch(() => ({ data: [] })),
      reportesPlantillerosApi.getAll().catch(() => []),
      reportesOperadoresApi.getAll().catch(() => []),
      proyectosApi.getAll().catch(() => []),
      personalNuevoApi.getAll().catch(() => []),
      equiposApi.getAll().catch(() => []),
    ]);

    // Procesar viajes
    const viajes =
      viajesData.status === "fulfilled"
        ? Array.isArray(viajesData.value?.data)
          ? viajesData.value.data
          : viajesData.value || []
        : [];
    const viajesHoy = viajes.filter((r: ReporteViajeWithDetails) =>
      r.fecha?.startsWith(hoy)
    );
    const viajesSemana = viajes.filter(
      (r: ReporteViajeWithDetails) => r.fecha && r.fecha >= ultimaSemana
    );
    const viajesMes = viajes.filter(
      (r: ReporteViajeWithDetails) => r.fecha && r.fecha >= ultimoMes
    );

    // Procesar plantilleros
    const plantilleros =
      plantillerosData.status === "fulfilled"
        ? Array.isArray(plantillerosData.value)
          ? plantillerosData.value
          : []
        : [];
    const plantillerosHoy = plantilleros.filter(
      (r: ReportePlantilleroWithDetails) => r.fecha?.startsWith(hoy)
    );
    const plantillerosSemana = plantilleros.filter(
      (r: ReportePlantilleroWithDetails) => r.fecha && r.fecha >= ultimaSemana
    );
    const plantillerosMes = plantilleros.filter(
      (r: ReportePlantilleroWithDetails) => r.fecha && r.fecha >= ultimoMes
    );

    // Procesar operadores
    const operadores =
      operadoresData.status === "fulfilled"
        ? Array.isArray(operadoresData.value)
          ? operadoresData.value
          : []
        : [];
    const operadoresHoy = operadores.filter((r: ReporteOperadorWithDetails) =>
      r.fecha?.startsWith(hoy)
    );
    const operadoresSemana = operadores.filter(
      (r: ReporteOperadorWithDetails) => r.fecha && r.fecha >= ultimaSemana
    );
    const operadoresMes = operadores.filter(
      (r: ReporteOperadorWithDetails) => r.fecha && r.fecha >= ultimoMes
    );

    // Procesar datos maestros
    const proyectosArray =
      proyectos.status === "fulfilled"
        ? Array.isArray(proyectos.value)
          ? proyectos.value
          : []
        : [];
    const personalArray =
      personal.status === "fulfilled"
        ? Array.isArray(personal.value)
          ? personal.value
          : []
        : [];
    const equiposArray =
      equipos.status === "fulfilled"
        ? Array.isArray(equipos.value)
          ? equipos.value
          : []
        : [];

    const proyectosActivos = proyectosArray.filter(
      (p: ProyectoData) => p.activo !== false
    ).length;
    const personalActivo = personalArray.filter(
      (p: PersonalNuevoData) => p.activo !== false
    ).length;
    const equiposDisponibles = equiposArray.filter(
      (e: EquipoData) => e.activo !== false
    ).length;

    // Calcular totales adicionales
    const totalViajes = viajes.reduce(
      (sum: number, r: ReporteViajeWithDetails) => {
        if (r.detalle_viajes && Array.isArray(r.detalle_viajes)) {
          return (
            sum +
            r.detalle_viajes.reduce(
              (detSum: number, det: DetalleViajesData) =>
                detSum + (det.viajes || 0),
              0
            )
          );
        }
        return sum;
      },
      0
    );

    const totalM3 = operadores.reduce(
      (sum: number, r: ReporteOperadorWithDetails) => {
        if (r.detalle_produccion && Array.isArray(r.detalle_produccion)) {
          return (
            sum +
            r.detalle_produccion.reduce(
              (detSum: number, det: DetalleProduccionData) =>
                detSum + (det.m3 || 0),
              0
            )
          );
        }
        return sum;
      },
      0
    );

    const totalHorasOperacion = operadores.reduce(
      (sum: number, r: ReporteOperadorWithDetails) => {
        if (r.detalle_produccion && Array.isArray(r.detalle_produccion)) {
          return (
            sum +
            r.detalle_produccion.reduce(
              (detSum: number, det: DetalleProduccionData) =>
                detSum + (det.horas_trabajadas || 0),
              0
            )
          );
        }
        return sum;
      },
      0
    );

    return {
      reportesViajes: {
        total: viajes.length,
        hoy: viajesHoy.length,
        ultimaSemana: viajesSemana.length,
        ultimoMes: viajesMes.length,
      },
      reportesPlantilleros: {
        total: plantilleros.length,
        hoy: plantillerosHoy.length,
        ultimaSemana: plantillerosSemana.length,
        ultimoMes: plantillerosMes.length,
      },
      reportesOperadores: {
        total: operadores.length,
        hoy: operadoresHoy.length,
        ultimaSemana: operadoresSemana.length,
        ultimoMes: operadoresMes.length,
      },
      proyectosActivos,
      personalActivo,
      equiposDisponibles,
      totalHorasOperacion: Math.round(totalHorasOperacion * 10) / 10,
      totalViajes,
      totalM3: Math.round(totalM3 * 10) / 10,
    };
  } catch (error) {
    console.error("Error calculating stats locally:", error);
    // Retornar estadísticas vacías en caso de error
    return {
      reportesViajes: { total: 0, hoy: 0, ultimaSemana: 0, ultimoMes: 0 },
      reportesPlantilleros: { total: 0, hoy: 0, ultimaSemana: 0, ultimoMes: 0 },
      reportesOperadores: { total: 0, hoy: 0, ultimaSemana: 0, ultimoMes: 0 },
      proyectosActivos: 0,
      personalActivo: 0,
      equiposDisponibles: 0,
      totalHorasOperacion: 0,
      totalViajes: 0,
      totalM3: 0,
    };
  }
}

// ============ INFORME CONSUMO COMBUSTIBLE API ============
export interface InformeConsumoCombustibleFilter {
  fecha_desde?: string;
  fecha_hasta?: string;
  id_equipo?: number;
}

export interface InformeConsumoCombustibleResponse {
  fecha_emision: Date;
  almacenes: string;
  numero_factura: string;
  nombre: string;
  glosa: string;
  guia_remision: string;
  codigo_vale: string;
  placa: string;
  cantidad: number;
  descripcion: string;
  km: number;
  odometro: number;
  val_unit: number;
  total: number;
}

export const informeConsumoCombustibleApi = {
  // Obtener informe de consumo de combustible con filtros
  getAll: async (filters?: InformeConsumoCombustibleFilter): Promise<InformeConsumoCombustibleResponse[]> => {
    try {
      const response = await api.get("/informe-consumo-combustible", {
        params: filters
      });
      
      // Verificar que la respuesta sea válida
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Si viene envuelto en { data: [...] }
        return Array.isArray(response.data.data) ? response.data.data : [];
      } else {
        console.warn("Informe Consumo Combustible API returned unexpected format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Informe Consumo Combustible API error:", error);
      return [];
    }
  },

  // Obtener informe filtrado por fechas
  getByFechas: async (fecha_desde: string, fecha_hasta: string): Promise<InformeConsumoCombustibleResponse[]> => {
    return await informeConsumoCombustibleApi.getAll({ fecha_desde, fecha_hasta });
  },

  // Obtener informe filtrado por equipo
  getByEquipo: async (id_equipo: number): Promise<InformeConsumoCombustibleResponse[]> => {
    return await informeConsumoCombustibleApi.getAll({ id_equipo });
  },
};

// Exportar la instancia de axios para uso directo si es necesario
export { api };
