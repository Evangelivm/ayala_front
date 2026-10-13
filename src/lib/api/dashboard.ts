import { api } from "./client";
import { PersonalNuevoData, personalNuevoApi } from "./personal";
import { ProyectoData, proyectosApi } from "./proyectos";
import { reportesOperadoresApi, reportesPlantillerosApi, DetalleProduccionData, DetalleViajesData, ReporteOperadorWithDetails, ReporteViajeWithDetails, ReportePlantilleroWithDetails, viajesEliminacionApi } from "./reportes";
import { EquipoData, equiposApi } from "./flota";

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
