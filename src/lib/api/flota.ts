import { api } from "./client";

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
