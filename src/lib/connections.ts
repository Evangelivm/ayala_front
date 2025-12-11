import axios from "axios";
import { decode } from "he";

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
  descripcion?: string;
  cliente?: string; // FK hacia empresas_2025.codigo
  empresas_2025?: {
    codigo: string;
    razon_social?: string | null;
    nro_documento?: string | null;
    tipo?: string | null;
    direccion?: string | null;
  }; // Relación con empresas_2025
  ubicacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: string;
  activo: boolean;
  etapas: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
    orden?: number;
    sectores: Array<{
      id: number;
      nombre: string;
      descripcion?: string;
      ubicacion?: string;
      orden?: number;
      frentes: Array<{
        id: number;
        nombre: string;
        descripcion?: string;
        responsable?: string;
        orden?: number;
        partidas?: Array<{
          id: number;
          codigo: string;
          descripcion: string;
          unidad_medida?: string;
          cantidad: number;
          precio_unitario?: number;
          total?: number;
          orden?: number;
        }>;
      }>;
    }>;
  }>;
  created_at?: string;
  updated_at?: string;
}

// Interfaces para operaciones individuales
export interface EtapaData {
  id_etapa?: number;
  id_proyecto: number;
  nombre: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SectorData {
  id_sector?: number;
  id_etapa: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FrenteData {
  id_frente?: number;
  id_sector: number;
  nombre: string;
  descripcion?: string;
  responsable?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PartidaData {
  id_partida?: number;
  id_frente: number;
  codigo: string;
  descripcion: string;
  unidad_medida?: string;
  cantidad: number;
  precio_unitario?: number;
  total?: number;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
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
    try {
      const response = await api.get("/proyectos");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Proyectos API error:", error);
      return [];
    }
  },

  // Obtener proyecto por ID
  getById: async (id: number): Promise<ProyectoData> => {
    try {
      const response = await api.get(`/proyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Proyectos API error:", error);
      throw new Error("Proyecto no encontrado");
    }
  },

  // Obtener proyecto por nombre
  getByNombre: async (nombre: string): Promise<ProyectoData[]> => {
    try {
      const response = await api.get("/proyectos", { params: { nombre } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Proyectos API error:", error);
      return [];
    }
  },

  // Crear nuevo proyecto
  create: async (data: Omit<ProyectoData, "id" | "created_at" | "updated_at" | "etapas">): Promise<ProyectoData> => {
    try {
      const response = await api.post("/proyectos", data);
      return response.data;
    } catch (error) {
      console.error("Proyectos API error:", error);
      throw new Error("Error al crear proyecto");
    }
  },

  // Actualizar proyecto
  update: async (
    id: number,
    data: Partial<Omit<ProyectoData, "id" | "created_at" | "updated_at" | "etapas">>
  ): Promise<ProyectoData> => {
    try {
      const response = await api.put(`/proyectos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Proyectos API error:", error);
      throw new Error("Error al actualizar proyecto");
    }
  },

  // Eliminar proyecto (hard delete)
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/proyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Proyectos API error:", error);
      throw new Error("Error al eliminar proyecto");
    }
  },
};

// ============ ETAPAS API ============
// NOTA: Estas funciones requieren que se implementen los endpoints en el backend
export const etapasApi = {
  // Obtener todas las etapas de un proyecto
  getByProyecto: async (idProyecto: number): Promise<EtapaData[]> => {
    try {
      // Por ahora, obtenemos las etapas del proyecto completo
      const proyecto = await proyectosApi.getById(idProyecto);
      return proyecto.etapas.map(etapa => ({
        id_etapa: etapa.id,
        id_proyecto: idProyecto,
        nombre: etapa.nombre,
        descripcion: etapa.descripcion,
        orden: etapa.orden,
        activo: true,
      }));
    } catch (error) {
      console.error("Etapas API error:", error);
      return [];
    }
  },

  // Crear nueva etapa
  create: async (data: Omit<EtapaData, "id_etapa" | "created_at" | "updated_at">): Promise<EtapaData> => {
    try {
      const response = await api.post("/etapas", data);
      return response.data;
    } catch (error) {
      console.error("Etapas API error:", error);
      throw new Error("Error al crear etapa");
    }
  },

  // Actualizar etapa
  update: async (
    id: number,
    data: Partial<Omit<EtapaData, "id_etapa" | "created_at" | "updated_at">>
  ): Promise<EtapaData> => {
    try {
      const response = await api.patch(`/etapas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Etapas API error:", error);
      throw new Error("Error al actualizar etapa");
    }
  },

  // Eliminar etapa
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/etapas/${id}`);
      return response.data;
    } catch (error) {
      console.error("Etapas API error:", error);
      throw new Error("Error al eliminar etapa");
    }
  },
};

// ============ SECTORES API ============
export const sectoresApi = {
  // Obtener todos los sectores de una etapa
  getByEtapa: async (idEtapa: number): Promise<SectorData[]> => {
    try {
      const response = await api.get("/sectores", { params: { id_etapa: idEtapa } });
      return response.data;
    } catch (error) {
      console.error("Sectores API error:", error);
      return [];
    }
  },

  // Crear nuevo sector
  create: async (data: Omit<SectorData, "id_sector" | "created_at" | "updated_at">): Promise<SectorData> => {
    try {
      const response = await api.post("/sectores", data);
      return response.data;
    } catch (error) {
      console.error("Sectores API error:", error);
      throw new Error("Error al crear sector");
    }
  },

  // Actualizar sector
  update: async (
    id: number,
    data: Partial<Omit<SectorData, "id_sector" | "created_at" | "updated_at">>
  ): Promise<SectorData> => {
    try {
      const response = await api.patch(`/sectores/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Sectores API error:", error);
      throw new Error("Error al actualizar sector");
    }
  },

  // Eliminar sector
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/sectores/${id}`);
      return response.data;
    } catch (error) {
      console.error("Sectores API error:", error);
      throw new Error("Error al eliminar sector");
    }
  },
};

// ============ FRENTES API ============
export const frentesApi = {
  // Obtener todos los frentes de un sector
  getBySector: async (idSector: number): Promise<FrenteData[]> => {
    try {
      const response = await api.get("/frentes", { params: { id_sector: idSector } });
      return response.data;
    } catch (error) {
      console.error("Frentes API error:", error);
      return [];
    }
  },

  // Crear nuevo frente
  create: async (data: Omit<FrenteData, "id_frente" | "created_at" | "updated_at">): Promise<FrenteData> => {
    try {
      const response = await api.post("/frentes", data);
      return response.data;
    } catch (error) {
      console.error("Frentes API error:", error);
      throw new Error("Error al crear frente");
    }
  },

  // Actualizar frente
  update: async (
    id: number,
    data: Partial<Omit<FrenteData, "id_frente" | "created_at" | "updated_at">>
  ): Promise<FrenteData> => {
    try {
      const response = await api.patch(`/frentes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Frentes API error:", error);
      throw new Error("Error al actualizar frente");
    }
  },

  // Eliminar frente
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/frentes/${id}`);
      return response.data;
    } catch (error) {
      console.error("Frentes API error:", error);
      throw new Error("Error al eliminar frente");
    }
  },
};

// ============ PARTIDAS API ============
export const partidasApi = {
  // Obtener todas las partidas de un frente
  getByFrente: async (idFrente: number): Promise<PartidaData[]> => {
    try {
      const response = await api.get("/partidas", { params: { id_frente: idFrente } });
      return response.data;
    } catch (error) {
      console.error("Partidas API error:", error);
      return [];
    }
  },

  // Crear nueva partida
  create: async (data: Omit<PartidaData, "id_partida" | "created_at" | "updated_at">): Promise<PartidaData> => {
    try {
      const response = await api.post("/partidas", data);
      return response.data;
    } catch (error) {
      console.error("Partidas API error:", error);
      throw new Error("Error al crear partida");
    }
  },

  // Actualizar partida
  update: async (
    id: number,
    data: Partial<Omit<PartidaData, "id_partida" | "created_at" | "updated_at">>
  ): Promise<PartidaData> => {
    try {
      const response = await api.patch(`/partidas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Partidas API error:", error);
      throw new Error("Error al actualizar partida");
    }
  },

  // Eliminar partida
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/partidas/${id}`);
      return response.data;
    } catch (error) {
      console.error("Partidas API error:", error);
      throw new Error("Error al eliminar partida");
    }
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

export interface InformeConsumoCombustibleDetalle {
  codigo_vale: string;
  placa: string;
  cantidad: number;
  descripcion: string;
  km: number;
  odometro: number;
  val_unit: number;
  total: number;
}

export interface InformeConsumoCombustibleResponse {
  fecha_emision: Date;
  almacenes: string;
  numero_factura: string;
  nombre: string;
  glosa: string;
  guia_remision: string;
  alfanum: string;
  detalles: InformeConsumoCombustibleDetalle[];
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

// ============ PROGRAMACIÓN API ============
export interface ProgramacionData {
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
  id_proyecto?: number; // ID del proyecto (solo se guarda en programacion_tecnica)
  id_subproyecto?: number; // ID del subproyecto (solo se guarda en programacion_tecnica)
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
  getTecnicaById: async (id: number): Promise<{
    id: number;
    identificador_unico: string | null;
    guia_numero_documento: string | null;
    guia_destinatario_denominacion: string | null;
    guia_destinatario_direccion: string | null;
    guia_traslado_peso_bruto: string | null;
    guia_traslado_vehiculo_placa: string | null;
    guia_conductor_dni_numero: string | null;
    guia_conductor_nombres: string | null;
    guia_conductor_apellidos: string | null;
    guia_conductor_num_licencia: string | null;
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
  }> => {
    try {
      const response = await api.get(`/programacion/tecnica/${id}`);
      return response.data;
    } catch (error) {
      console.error("Programación Técnica API error:", error);
      throw new Error("Programación técnica no encontrada");
    }
  },

  // Actualizar programación técnica con IDs de proyecto
  updateTecnica: async (
    id: number,
    data: {
      id_proyecto?: number;
      id_etapa?: number;
      id_sector?: number;
      id_frente?: number;
      id_partida?: number;
      id_subproyecto?: number;
      id_subetapa?: number;
      id_subsector?: number;
      id_subfrente?: number;
      id_subpartida?: number;
      m3?: string;
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

// ============ SUBPROYECTOS INTERFACES ============
export interface SubproyectoData {
  id_subproyecto?: number;
  id_proyecto: number;
  nombre: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  sub_etapas?: SubEtapaData[];
}

export interface SubEtapaData {
  id_sub_etapa?: number;
  id_subproyecto: number;
  nombre: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  subsector?: SubsectorData[];
}

export interface SubsectorData {
  id_subsector?: number;
  id_sub_etapa: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  subfrente?: SubfrenteData[];
}

export interface SubfrenteData {
  id_subfrente?: number;
  id_subsector: number;
  nombre: string;
  descripcion?: string;
  responsable?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  subpartida?: SubpartidaData[];
}

export interface SubpartidaData {
  id_subpartida?: number;
  id_subfrente: number;
  codigo: string;
  descripcion: string;
  unidad_medida?: string;
  cantidad: number;
  precio_unitario?: number;
  total?: number;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ SUBPROYECTOS API ============
export const subproyectosApi = {
  // Obtener todos los subproyectos
  getAll: async (): Promise<SubproyectoData[]> => {
    try {
      const response = await api.get("/subproyectos");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subproyectos API error:", error);
      return [];
    }
  },

  // Obtener subproyectos por proyecto
  getByProyecto: async (idProyecto: number): Promise<SubproyectoData[]> => {
    try {
      const response = await api.get("/subproyectos", { params: { id_proyecto: idProyecto } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subproyectos API error:", error);
      return [];
    }
  },

  // Obtener subproyecto por ID
  getById: async (id: number): Promise<SubproyectoData> => {
    try {
      const response = await api.get(`/subproyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Subproyectos API error:", error);
      throw new Error("Subproyecto no encontrado");
    }
  },

  // Crear nuevo subproyecto
  create: async (data: Omit<SubproyectoData, "id_subproyecto" | "created_at" | "updated_at" | "sub_etapas">): Promise<SubproyectoData> => {
    try {
      const response = await api.post("/subproyectos", data);
      return response.data;
    } catch (error) {
      console.error("Subproyectos API error:", error);
      throw new Error("Error al crear subproyecto");
    }
  },

  // Actualizar subproyecto
  update: async (
    id: number,
    data: Partial<Omit<SubproyectoData, "id_subproyecto" | "created_at" | "updated_at" | "sub_etapas">>
  ): Promise<SubproyectoData> => {
    try {
      const response = await api.patch(`/subproyectos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Subproyectos API error:", error);
      throw new Error("Error al actualizar subproyecto");
    }
  },

  // Eliminar subproyecto (soft delete)
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/subproyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Subproyectos API error:", error);
      throw new Error("Error al eliminar subproyecto");
    }
  },
};

// ============ SUB-ETAPAS API ============
export const subEtapasApi = {
  // Obtener todas las sub-etapas
  getAll: async (): Promise<SubEtapaData[]> => {
    try {
      const response = await api.get("/sub-etapas");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Sub-etapas API error:", error);
      return [];
    }
  },

  // Obtener sub-etapas por subproyecto
  getBySubproyecto: async (idSubproyecto: number): Promise<SubEtapaData[]> => {
    try {
      const response = await api.get("/sub-etapas", { params: { id_subproyecto: idSubproyecto } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Sub-etapas API error:", error);
      return [];
    }
  },

  // Crear nueva sub-etapa
  create: async (data: Omit<SubEtapaData, "id_sub_etapa" | "created_at" | "updated_at" | "subsector">): Promise<SubEtapaData> => {
    try {
      const response = await api.post("/sub-etapas", data);
      return response.data;
    } catch (error) {
      console.error("Sub-etapas API error:", error);
      throw new Error("Error al crear sub-etapa");
    }
  },

  // Actualizar sub-etapa
  update: async (
    id: number,
    data: Partial<Omit<SubEtapaData, "id_sub_etapa" | "created_at" | "updated_at" | "subsector">>
  ): Promise<SubEtapaData> => {
    try {
      const response = await api.patch(`/sub-etapas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Sub-etapas API error:", error);
      throw new Error("Error al actualizar sub-etapa");
    }
  },

  // Eliminar sub-etapa
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/sub-etapas/${id}`);
      return response.data;
    } catch (error) {
      console.error("Sub-etapas API error:", error);
      throw new Error("Error al eliminar sub-etapa");
    }
  },
};

// ============ SUBSECTORES API ============
export const subsectoresApi = {
  // Obtener todos los subsectores
  getAll: async (): Promise<SubsectorData[]> => {
    try {
      const response = await api.get("/subsectores");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subsectores API error:", error);
      return [];
    }
  },

  // Obtener subsectores por sub-etapa
  getBySubEtapa: async (idSubEtapa: number): Promise<SubsectorData[]> => {
    try {
      const response = await api.get("/subsectores", { params: { id_sub_etapa: idSubEtapa } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subsectores API error:", error);
      return [];
    }
  },

  // Crear nuevo subsector
  create: async (data: Omit<SubsectorData, "id_subsector" | "created_at" | "updated_at" | "subfrente">): Promise<SubsectorData> => {
    try {
      const response = await api.post("/subsectores", data);
      return response.data;
    } catch (error) {
      console.error("Subsectores API error:", error);
      throw new Error("Error al crear subsector");
    }
  },

  // Actualizar subsector
  update: async (
    id: number,
    data: Partial<Omit<SubsectorData, "id_subsector" | "created_at" | "updated_at" | "subfrente">>
  ): Promise<SubsectorData> => {
    try {
      const response = await api.patch(`/subsectores/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Subsectores API error:", error);
      throw new Error("Error al actualizar subsector");
    }
  },

  // Eliminar subsector
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/subsectores/${id}`);
      return response.data;
    } catch (error) {
      console.error("Subsectores API error:", error);
      throw new Error("Error al eliminar subsector");
    }
  },
};

// ============ SUBFRENTES API ============
export const subfrentesApi = {
  // Obtener todos los subfrentes
  getAll: async (): Promise<SubfrenteData[]> => {
    try {
      const response = await api.get("/subfrentes");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subfrentes API error:", error);
      return [];
    }
  },

  // Obtener subfrentes por subsector
  getBySubsector: async (idSubsector: number): Promise<SubfrenteData[]> => {
    try {
      const response = await api.get("/subfrentes", { params: { id_subsector: idSubsector } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subfrentes API error:", error);
      return [];
    }
  },

  // Crear nuevo subfrente
  create: async (data: Omit<SubfrenteData, "id_subfrente" | "created_at" | "updated_at" | "subpartida">): Promise<SubfrenteData> => {
    try {
      const response = await api.post("/subfrentes", data);
      return response.data;
    } catch (error) {
      console.error("Subfrentes API error:", error);
      throw new Error("Error al crear subfrente");
    }
  },

  // Actualizar subfrente
  update: async (
    id: number,
    data: Partial<Omit<SubfrenteData, "id_subfrente" | "created_at" | "updated_at" | "subpartida">>
  ): Promise<SubfrenteData> => {
    try {
      const response = await api.patch(`/subfrentes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Subfrentes API error:", error);
      throw new Error("Error al actualizar subfrente");
    }
  },

  // Eliminar subfrente
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/subfrentes/${id}`);
      return response.data;
    } catch (error) {
      console.error("Subfrentes API error:", error);
      throw new Error("Error al eliminar subfrente");
    }
  },
};

// ============ SUBPARTIDAS API ============
export const subpartidasApi = {
  // Obtener todas las subpartidas
  getAll: async (): Promise<SubpartidaData[]> => {
    try {
      const response = await api.get("/subpartidas");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subpartidas API error:", error);
      return [];
    }
  },

  // Obtener subpartidas por subfrente
  getBySubfrente: async (idSubfrente: number): Promise<SubpartidaData[]> => {
    try {
      const response = await api.get("/subpartidas", { params: { id_subfrente: idSubfrente } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Subpartidas API error:", error);
      return [];
    }
  },

  // Crear nueva subpartida
  create: async (data: Omit<SubpartidaData, "id_subpartida" | "created_at" | "updated_at">): Promise<SubpartidaData> => {
    try {
      const response = await api.post("/subpartidas", data);
      return response.data;
    } catch (error) {
      console.error("Subpartidas API error:", error);
      throw new Error("Error al crear subpartida");
    }
  },

  // Actualizar subpartida
  update: async (
    id: number,
    data: Partial<Omit<SubpartidaData, "id_subpartida" | "created_at" | "updated_at">>
  ): Promise<SubpartidaData> => {
    try {
      const response = await api.patch(`/subpartidas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Subpartidas API error:", error);
      throw new Error("Error al actualizar subpartida");
    }
  },

  // Eliminar subpartida
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/subpartidas/${id}`);
      return response.data;
    } catch (error) {
      console.error("Subpartidas API error:", error);
      throw new Error("Error al eliminar subpartida");
    }
  },
};

// ============ EMPRESAS API ============
export interface EmpresaData {
  codigo: string;
  razon_social?: string | null;
  nro_documento?: string | null;
  tipo?: string | null;
  direccion?: string | null;
}

export const empresasApi = {
  // Obtener todas las empresas
  getAll: async (): Promise<EmpresaData[]> => {
    try {
      const response = await api.get("/empresas");

      // Verificar si la respuesta tiene estructura paginada
      let empresasData: EmpresaData[];
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Respuesta paginada: { data: [...], pagination: {...} }
        empresasData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
      } else if (Array.isArray(response.data)) {
        // Respuesta directa: [...]
        empresasData = response.data;
      } else {
        console.warn("Empresas API returned unexpected format:", response.data);
        return [];
      }

      return empresasData;
    } catch (error) {
      console.error("Empresas API error:", error);
      return [];
    }
  },

  // Obtener empresa por código
  getByCodigo: async (codigo: string): Promise<EmpresaData> => {
    try {
      const response = await api.get(`/empresas/${codigo}`);
      return response.data;
    } catch (error) {
      console.error("Empresas API error:", error);
      throw new Error("Empresa no encontrada");
    }
  },

  // Crear nueva empresa
  create: async (
    data: Omit<EmpresaData, "codigo">
  ): Promise<EmpresaData> => {
    try {
      const response = await api.post("/empresas", data);
      return response.data;
    } catch (error) {
      console.error("Empresas API error:", error);
      throw new Error("Error al crear empresa");
    }
  },

  // Actualizar empresa
  update: async (
    codigo: string,
    data: Partial<EmpresaData>
  ): Promise<EmpresaData> => {
    try {
      const response = await api.put(`/empresas/${codigo}`, data);
      return response.data;
    } catch (error) {
      console.error("Empresas API error:", error);
      throw new Error("Error al actualizar empresa");
    }
  },

  // Eliminar empresa
  delete: async (codigo: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/empresas/${codigo}`);
      return response.data;
    } catch (error) {
      console.error("Empresas API error:", error);
      throw new Error("Error al eliminar empresa");
    }
  },
};

// ============ CAMIONES API ============
export interface CamionData {
  id_camion: number;
  placa: string;
  marca?: string;
  modelo?: string;
  año?: number;
  capacidad_tanque?: number;
  id_tipo_combustible_preferido?: number;
  activo?: boolean;
  fecha_registro?: string;
  dni?: string;
  nombre_chofer?: string;
  apellido_chofer?: string;
  numero_licencia?: string;
  empresa?: string; // Código de empresa (FK a empresas_2025.codigo)
  razon_social_empresa?: string | null; // Razón social de la empresa
  tipo?: 'CAMION' | 'MAQUINARIA'; // Tipo de vehículo
}

export const camionesApi = {
  // Obtener todos los camiones
  getAll: async (): Promise<CamionData[]> => {
    try {
      const response = await api.get("/camiones");

      // Verificar si la respuesta tiene estructura paginada
      let camionesData: CamionData[];
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Respuesta paginada: { data: [...], pagination: {...} }
        camionesData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
      } else if (Array.isArray(response.data)) {
        // Respuesta directa: [...]
        camionesData = response.data;
      } else {
        console.warn("Camiones API returned unexpected format:", response.data);
        return [];
      }

      return camionesData;
    } catch (error) {
      console.error("Camiones API error:", error);
      return [];
    }
  },

  // Obtener camión por ID
  getById: async (id: number): Promise<CamionData> => {
    try {
      const response = await api.get(`/camiones/${id}`);
      return response.data;
    } catch (error) {
      console.error("Camiones API error:", error);
      throw new Error("Camión no encontrado");
    }
  },

  // Crear nuevo camión
  create: async (
    data: Omit<CamionData, "id_camion" | "fecha_registro">
  ): Promise<CamionData> => {
    try {
      const response = await api.post("/camiones", data);
      return response.data;
    } catch (error) {
      console.error("Camiones API error:", error);
      throw new Error("Error al crear camión");
    }
  },

  // Actualizar camión
  update: async (
    id: number,
    data: Partial<CamionData>
  ): Promise<CamionData> => {
    try {
      const response = await api.put(`/camiones/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Camiones API error:", error);
      throw new Error("Error al actualizar camión");
    }
  },

  // Eliminar camión
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/camiones/${id}`);
      return response.data;
    } catch (error) {
      console.error("Camiones API error:", error);
      throw new Error("Error al eliminar camión");
    }
  },
};

// ============ KARDEX PDF API ============
export const kardexPdfApi = {
  // Generar PDF del Kardex
  generate: async (kardexData: { kardexLAR: unknown; metodoPromedioLAR: unknown }): Promise<Blob> => {
    try {
      const response = await api.post("/kardex-pdf/generate", kardexData, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error("Kardex PDF API error:", error);
      throw new Error("Error al generar el PDF del Kardex");
    }
  },
};

// ============ PROVEEDORES API ============
export interface ProveedorData {
  id_proveedor: number;
  codigo_proveedor: string;
  nombre_proveedor: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ruc: string | null;
  retencion: "Si" | "No" | null;
  activo: boolean | null;
  fecha_registro: Date | null;
  fecha_actualizacion: Date | null;
}

// Helper para decodificar HTML entities en proveedores
const decodeProveedorData = (proveedor: ProveedorData): ProveedorData => ({
  ...proveedor,
  nombre_proveedor: proveedor.nombre_proveedor ? decode(proveedor.nombre_proveedor) : proveedor.nombre_proveedor,
  contacto: proveedor.contacto ? decode(proveedor.contacto) : proveedor.contacto,
  direccion: proveedor.direccion ? decode(proveedor.direccion) : proveedor.direccion,
});

export const proveedoresApi = {
  // Obtener todos los proveedores
  getAll: async (): Promise<ProveedorData[]> => {
    try {
      const response = await api.get("/proveedores");

      // Verificar que la respuesta sea válida
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(decodeProveedorData);
      } else if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        // Si viene envuelto en { data: [...] }
        return Array.isArray(response.data.data) ? response.data.data.map(decodeProveedorData) : [];
      } else {
        console.warn("Proveedores API returned unexpected format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Proveedores API error:", error);
      return [];
    }
  },

  // Obtener proveedor por ID
  getById: async (id: number): Promise<ProveedorData | null> => {
    try {
      const response = await api.get(`/proveedores/${id}`);
      return response.data ? decodeProveedorData(response.data) : null;
    } catch (error) {
      console.error("Proveedores API error:", error);
      return null;
    }
  },

  // Obtener proveedor por número de documento
  getByDocumento: async (nro_documento: string): Promise<ProveedorData | null> => {
    try {
      const response = await api.get(`/proveedores/documento/${nro_documento}`);
      return response.data ? decodeProveedorData(response.data) : null;
    } catch (error) {
      console.error("Proveedores API error:", error);
      return null;
    }
  },
};

// ============ ITEMS API ============
export interface ItemData {
  codigo: string;
  descripcion: string;
  precio_unitario: number | null;
  u_m: string | null;
  stock_minimo: number | null;
  stock_maximo: number | null;
  marca: string | null;
  modelo: string | null;
}

// Helper para decodificar HTML entities en items
const decodeItemData = (item: ItemData): ItemData => ({
  ...item,
  descripcion: item.descripcion ? decode(item.descripcion) : item.descripcion,
  marca: item.marca ? decode(item.marca) : item.marca,
  modelo: item.modelo ? decode(item.modelo) : item.modelo,
});

export const itemsApi = {
  // Obtener todos los items
  getAll: async (): Promise<ItemData[]> => {
    try {
      const response = await api.get("/items");

      if (response.data && Array.isArray(response.data)) {
        return response.data.map(decodeItemData);
      } else if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        return Array.isArray(response.data.data) ? response.data.data.map(decodeItemData) : [];
      } else {
        console.warn("Items API returned unexpected format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Items API error:", error);
      return [];
    }
  },

  // Buscar items
  search: async (query: string): Promise<ItemData[]> => {
    try {
      const response = await api.get(`/items?search=${encodeURIComponent(query)}`);

      if (response.data && Array.isArray(response.data)) {
        return response.data.map(decodeItemData);
      } else if (
        response.data &&
        typeof response.data === "object" &&
        response.data.data
      ) {
        return Array.isArray(response.data.data) ? response.data.data.map(decodeItemData) : [];
      } else {
        console.warn("Items API returned unexpected format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Items API error:", error);
      return [];
    }
  },

  // Obtener item por código
  getByCodigo: async (codigo: string): Promise<ItemData | null> => {
    try {
      const response = await api.get(`/items/${codigo}`);
      return response.data ? decodeItemData(response.data) : null;
    } catch (error) {
      console.error("Items API error:", error);
      return null;
    }
  },
};

// ============ CENTROS DE COSTO API ============
export interface CentroCostoData {
  id: number;
  CecoCodi: string;
  Centro_de_costo: string | null;
}

export const centrosCostoApi = {
  // Obtener centros de costo nivel 1
  getNivel1: async (): Promise<CentroCostoData[]> => {
    try {
      const response = await api.get("/centros-costo/nivel1");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Centros Costo API error:", error);
      return [];
    }
  },

  // Obtener centros de costo nivel 2 por código padre
  getNivel2: async (codigoPadre: string): Promise<CentroCostoData[]> => {
    try {
      const response = await api.get(`/centros-costo/nivel2/${codigoPadre}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Centros Costo API error:", error);
      return [];
    }
  },

  // Obtener centros de costo nivel 3 por código padre
  getNivel3: async (codigoPadre: string): Promise<CentroCostoData[]> => {
    try {
      const response = await api.get(`/centros-costo/nivel3/${codigoPadre}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Centros Costo API error:", error);
      return [];
    }
  },

  // Obtener todos los centros de costo
  getAll: async (): Promise<CentroCostoData[]> => {
    try {
      const response = await api.get("/centros-costo/all");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Centros Costo API error:", error);
      return [];
    }
  },

  // Buscar por código
  findByCodigo: async (codigo: string): Promise<CentroCostoData | null> => {
    try {
      const response = await api.get(`/centros-costo/${codigo}`);
      return response.data;
    } catch (error) {
      console.error("Centros Costo API error:", error);
      return null;
    }
  },
};

// Tipos para Centro de Costos - Nueva Orden de Compra
export interface CentroProyectoData {
  id: number;
  codigo: string;
  proyecto: string;
}

export interface FaseControlData {
  id: number;
  codigo: string | null;
  descripcion: string | null;
}

export interface RubroData {
  id: number;
  codigo: string;
  descripcion: string;
}

// API para Centro Proyecto
export const centroProyectoApi = {
  getAll: async (): Promise<CentroProyectoData[]> => {
    try {
      const response = await api.get("/centroproyecto");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Centro Proyecto API error:", error);
      return [];
    }
  },
};

// API para Fase Control
export const faseControlApi = {
  getAll: async (): Promise<FaseControlData[]> => {
    try {
      const response = await api.get("/fasecontrol");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Fase Control API error:", error);
      return [];
    }
  },
};

// API para Rubro
export const rubroApi = {
  getAll: async (): Promise<RubroData[]> => {
    try {
      const response = await api.get("/rubro");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Rubro API error:", error);
      return [];
    }
  },
};

// ============ ORDENES COMPRA API ============
export interface OrdenCompraData {
  id_orden_compra?: number; // Primary key returned from backend
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
  has_anticipo?: number;
  nombre_proveedor?: string; // Nombre del proveedor desde la relación
  ruc_proveedor?: string; // RUC del proveedor desde la relación
  retencion?: string; // Indica si aplica retención ("SI" o "NO")
  porcentaje_valor_retencion?: string; // Porcentaje de la retención (ej: "3", "10")
  almacen_central?: string; // Indica si es almacén central ("SI" o "NO")
  tipo_cambio?: number | string; // Tipo de cambio para la orden
  valor_retencion?: number | string; // Valor/monto de la retención
  items: Array<{
    codigo_item: string;
    descripcion_item: string;
    cantidad_solicitada: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  subtotal: number;
  igv: number;
  total: number;
  observaciones?: string;
  url?: string | null;
  url_cotizacion?: string | null;
  url_factura?: string | null;
}

// Helper para decodificar HTML entities en órdenes de compra
const decodeOrdenCompraData = (orden: OrdenCompraData): OrdenCompraData => ({
  ...orden,
  observaciones: orden.observaciones ? decode(orden.observaciones) : orden.observaciones,
  nombre_proveedor: orden.nombre_proveedor ? decode(orden.nombre_proveedor) : orden.nombre_proveedor,
  items: orden.items ? orden.items.map(item => ({
    ...item,
    descripcion_item: item.descripcion_item ? decode(item.descripcion_item) : item.descripcion_item,
  })) : [],
});

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
};

// ============ ORDENES SERVICIO API ============
export interface OrdenServicioData {
  id_orden_servicio?: number; // Primary key returned from backend
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
  retencion?: string;
  tiene_anticipo?: string | number;
  procede_pago?: string | number;
  auto_administrador?: boolean;
  auto_contabilidad?: boolean;
  jefe_proyecto?: boolean;
  has_anticipo?: number;
  nombre_proveedor?: string; // Nombre del proveedor desde la relación
  ruc_proveedor?: string; // RUC del proveedor desde la relación
  detraccion?: string; // Indica si aplica detracción ("SI" o "NO")
  porcentaje_valor_detraccion?: string; // Porcentaje de la detracción (ej: "3", "10")
  almacen_central?: string; // Indica si es almacén central ("SI" o "NO")
  tipo_cambio?: number | string; // Tipo de cambio para la orden
  valor_detraccion?: number | string; // Valor/monto de la detracción
  items: Array<{
    codigo_item: string;
    descripcion_item: string;
    cantidad_solicitada: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  subtotal: number;
  igv: number;
  total: number;
  observaciones?: string;
  url?: string | null;
  url_cotizacion?: string | null;
  url_factura?: string | null;
}

// Helper para decodificar HTML entities en órdenes de servicio
const decodeOrdenServicioData = (orden: OrdenServicioData): OrdenServicioData => ({
  ...orden,
  observaciones: orden.observaciones ? decode(orden.observaciones) : orden.observaciones,
  nombre_proveedor: orden.nombre_proveedor ? decode(orden.nombre_proveedor) : orden.nombre_proveedor,
  items: orden.items ? orden.items.map(item => ({
    ...item,
    descripcion_item: item.descripcion_item ? decode(item.descripcion_item) : item.descripcion_item,
  })) : [],
});

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
};

// ============ URL HELPERS ============
// Funciones helper para generar URLs que necesitan acceso directo a archivos (PDFs, etc.)
export const urlHelpers = {
  // Obtener URL del PDF de orden de compra
  getOrdenCompraPdfUrl: (idOrdenCompra: number): string => {
    return `${API_BASE_URL}/ordenes-compra/pdf/${idOrdenCompra}`;
  },

  // Obtener URL del PDF de orden de servicio
  getOrdenServicioPdfUrl: (idOrdenServicio: number): string => {
    return `${API_BASE_URL}/ordenes-servicio/pdf/${idOrdenServicio}`;
  },
};

// Exportar la instancia de axios para uso directo si es necesario
export { api };
