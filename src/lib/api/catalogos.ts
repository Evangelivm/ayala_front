import { decode } from "he";
import { api } from "./client";

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
  create: async (data: EmpresaData): Promise<EmpresaData> => {
    try {
      const payload = {
        C_digo: data.codigo,
        Raz_n_social: data.razon_social,
        N__documento: data.nro_documento,
        Tipo: data.tipo,
        Direcci_n: data.direccion,
      };
      const response = await api.post("/empresas", payload);
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
      const payload: Record<string, string | null | undefined> = {};
      if (data.razon_social !== undefined) payload.Raz_n_social = data.razon_social;
      if (data.nro_documento !== undefined) payload.N__documento = data.nro_documento;
      if (data.tipo !== undefined) payload.Tipo = data.tipo;
      if (data.direccion !== undefined) payload.Direcci_n = data.direccion;
      const response = await api.put(`/empresas/${codigo}`, payload);
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

  // Crear nuevo proveedor
  create: async (data: Partial<ProveedorData>): Promise<ProveedorData> => {
    const response = await api.post("/proveedores", data);
    return decodeProveedorData(response.data);
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



// ============ REPORTE CENTRO DE COSTOS API ============
export interface CentroCostoRow {
  tipo_orden: "compra" | "servicio";
  id_orden: number;
  numero_orden: string;
  fecha_orden: string | null;
  nro_factura: string | null;
  url: string | null;
  centro_costo_nivel1: string | null;
  centro_costo_nivel2: string | null;
  centro_costo_nivel3: string | null;
  id_detalle: number;
  codigo_item: string;
  descripcion_item: string;
  centro_costo_item: string | null;
}

export const reporteCentroCostosApi = {
  getAll: async (
    q: string,
    page: number,
    limit: number,
    tipoOrden?: "compra" | "servicio"
  ): Promise<{ data: CentroCostoRow[]; total: number }> => {
    const params = new URLSearchParams({
      q,
      page: page.toString(),
      limit: limit.toString(),
      ...(tipoOrden ? { tipo_orden: tipoOrden } : {}),
    });
    const response = await api.get(`/reporte-centro-costos?${params}`);
    return response.data;
  },
};
