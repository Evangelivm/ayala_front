import { api } from "./client";

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
