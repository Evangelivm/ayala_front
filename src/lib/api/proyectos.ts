import { api } from "./client";

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
    activo?: boolean;
    sectores: Array<{
      id: number;
      nombre: string;
      descripcion?: string;
      ubicacion?: string;
      orden?: number;
      activo?: boolean;
      frentes: Array<{
        id: number;
        nombre: string;
        descripcion?: string;
        responsable?: string;
        orden?: number;
        activo?: boolean;
        partidas?: Array<{
          id: number;
          activo?: boolean;
          codigo: string;
          descripcion: string;
          unidad_medida?: string;
          cantidad: number;
          precio_unitario?: number;
          total?: number;
          centro_costos?: string;
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
  centro_costos?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}


// ============ PROYECTOS API ============
export const proyectosApi = {
  // Obtener todos los proyectos. Por defecto solo los activos (para selects);
  // la página de proyectos pasa incluirInactivos para poder reactivarlos.
  getAll: async (incluirInactivos = false): Promise<ProyectoData[]> => {
    try {
      const response = await api.get("/proyectos", {
        params: incluirInactivos ? { incluir_inactivos: true } : undefined,
      });
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
  centro_costos?: string;
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
  getByProyecto: async (idProyecto: number, incluirInactivos = false): Promise<SubproyectoData[]> => {
    try {
      const response = await api.get("/subproyectos", {
        params: { id_proyecto: idProyecto, ...(incluirInactivos && { incluir_inactivos: true }) },
      });
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
