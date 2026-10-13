import { api } from "./client";

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
