import { api, API_BASE_URL } from "./client";

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


// ============ ADMIN LOGS API ============
export interface NestLogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'debug' | 'verbose';
  context: string;
  message: string;
}

export const adminLogsApi = {
  get: async (last = 300, level = 'all'): Promise<{ logs: NestLogEntry[]; total: number }> => {
    const response = await api.get(`/admin/logs`, { params: { last, level } });
    return response.data;
  },
  clear: async (): Promise<void> => {
    await api.delete(`/admin/logs`);
  },
};


// ============ AUTH API ============
export interface AuthUsuario {
  id: number;
  nombre: string;
  rol: string;
}

export const authApi = {
  login: async (credentials: {
    usuario: string;
    password: string;
  }): Promise<AuthUsuario> => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
};

// ============ USUARIOS API ============
export interface UsuarioSistema {
  id: number;
  usuario: string;
  nombre: string;
  rol: "ADMIN" | "ALMACENERO" | "AUXILIAR" | "USER";
  activo: boolean;
  fecha_creacion?: string | null;
}

export const usuariosApi = {
  getAll: async (): Promise<UsuarioSistema[]> => {
    const response = await api.get("/usuarios");
    return Array.isArray(response.data) ? response.data : [];
  },

  create: async (data: {
    usuario: string;
    nombre: string;
    password: string;
    rol?: string;
  }): Promise<UsuarioSistema> => {
    const response = await api.post("/usuarios", data);
    return response.data;
  },

  update: async (
    id: number,
    data: {
      nombre?: string;
      password?: string;
      rol?: string;
      activo?: boolean;
    }
  ): Promise<UsuarioSistema> => {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  deactivate: async (id: number): Promise<UsuarioSistema> => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
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
