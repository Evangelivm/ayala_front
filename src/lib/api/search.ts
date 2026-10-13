import { api } from "./client";
import { ProgramacionTecnicaData } from "./programacion";
import { OrdenCompraData, OrdenServicioData } from "./ordenes";

// ============ SEARCH API (Elasticsearch + paginación) ============
export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FiltrosProgramacionTecnica {
  programacion?: string;
  estadoProgramacion?: string;
  fecha?: string;
  orden?: "asc" | "desc";
}

export interface FiltrosOrdenes {
  estado?: string;
  fecha?: string;
  placa?: string;
  tipo?: string;
  chofer?: string;
  autoAdministrador?: boolean;
  autoContabilidad?: boolean;
  jefeProyecto?: boolean;
  procedePago?: string;
  condicion?: "CREDITO" | "CONTADO";
  // Incluir las demás órdenes de cada multifactura que aparezca en el resultado
  agrupar?: boolean;
}

const filtrosAParams = <T extends object>(filtros?: T): Record<string, string> => {
  if (!filtros) return {};
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filtros)) {
    if (value === undefined || value === "") continue;
    params[key] = String(value);
  }
  return params;
};

export const searchApi = {
  programacionTecnica: async (
    q: string,
    page: number,
    limit: number,
    filtros?: FiltrosProgramacionTecnica
  ): Promise<SearchResult<ProgramacionTecnicaData>> => {
    const params = new URLSearchParams({
      q,
      page: page.toString(),
      limit: limit.toString(),
      ...filtrosAParams(filtros),
    });
    const response = await api.get(`/search/programacion-tecnica?${params}`);
    return response.data;
  },

  ordenesCompra: async (
    q: string,
    page: number,
    limit: number,
    filtros?: FiltrosOrdenes
  ): Promise<SearchResult<OrdenCompraData>> => {
    const params = new URLSearchParams({
      q,
      page: page.toString(),
      limit: limit.toString(),
      ...filtrosAParams(filtros),
    });
    const response = await api.get(`/search/ordenes-compra?${params}`);
    return response.data;
  },

  ordenesServicio: async (
    q: string,
    page: number,
    limit: number,
    filtros?: FiltrosOrdenes
  ): Promise<SearchResult<OrdenServicioData>> => {
    const params = new URLSearchParams({
      q,
      page: page.toString(),
      limit: limit.toString(),
      ...filtrosAParams(filtros),
    });
    const response = await api.get(`/search/ordenes-servicio?${params}`);
    return response.data;
  },

  reindex: async (): Promise<{
    message: string;
    counts: {
      programacion_tecnica: number;
      ordenes_compra: number;
      ordenes_servicio: number;
    };
  }> => {
    const response = await api.post("/search/reindex");
    return response.data;
  },

  // Borra y recrea los índices desde cero (corrige conflictos de mapping
  // que un reindex normal no puede resolver) y repuebla desde la BD.
  recreateIndices: async (): Promise<{
    message: string;
    counts: {
      programacion_tecnica: number;
      ordenes_compra: number;
      ordenes_servicio: number;
    };
  }> => {
    const response = await api.post("/search/recreate-indices");
    return response.data;
  },
};
