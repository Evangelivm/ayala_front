import { api } from "./client";

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
