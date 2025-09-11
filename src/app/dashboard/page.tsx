"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Users,
  Clock,
  Truck,
  MapPin,
  BarChart3,
  Settings,
  Plus,
  Eye,
  TrendingUp,
  Activity,
  Building2,
  UserCheck,
  Package,
  Gauge,
  Download,
  Edit,
  RefreshCw,
  FileText,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  viajesEliminacionApi,
  reportesPlantillerosApi,
  reportesOperadoresApi,
  dashboardApi,
  type DashboardStats,
} from "@/lib/connections";
import dayjs from "dayjs";
import "dayjs/locale/es";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Configurar plugins de dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Configurar dayjs para usar español y timezone de Perú
dayjs.locale("es");
dayjs.tz.setDefault("America/Lima");

// Cargar el componente PDF de forma dinámica para evitar problemas de SSR
const OrdenCompraPDF = dynamic(
  () => import("@/components/OrdenCompraPDF"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generando orden de compra PDF...</p>
        </div>
      </div>
    ),
  }
);

// Importar la función de descarga dinámicamente
const descargarOrdenCompraPDF = async () => {
  const { descargarOrdenCompraPDF } = await import(
    "@/components/OrdenCompraPDF"
  );
  return descargarOrdenCompraPDF();
};


interface RecentReport {
  id: number;
  codigo: string;
  tipo: "viajes" | "plantilleros" | "operadores";
  fecha: string;
  proyecto?: string;
  responsable?: string;
}

interface ViajeReporte {
  id_viaje?: number;
  id?: number;
  codigo_reporte: string;
  fecha: string;
  proyecto?: { nombre: string };
  responsable?: { nombres: string; apellidos?: string };
  nombre_responsable?: string;
  detalle_viajes?: Array<{ viajes: number }>;
}

interface PlantilleroReporte {
  id_reporte?: number;
  id?: number;
  codigo_reporte?: string;
  codigo?: string;
  fecha: string;
  proyecto?: string | { nombre: string };
  cliente?: string;
  ubicacion?: string;
  etapa?: string;
  nombre?: string;
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

interface OperadorReporte {
  id_reporte?: number;
  id?: number;
  codigo_reporte?: string;
  codigo?: string;
  fecha: string;
  proyecto?: { nombre: string };
  operador?: string | { nombres: string; apellidos?: string };
  codigoEquipo?: string;
  detalle_produccion?: Array<{ m3?: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    reportesViajes: { total: 0, hoy: 0, ultimaSemana: 0, ultimoMes: 0 },
    reportesPlantilleros: { total: 0, hoy: 0, ultimaSemana: 0, ultimoMes: 0 },
    reportesOperadores: { total: 0, hoy: 0, ultimaSemana: 0, ultimoMes: 0 },
    proyectosActivos: 0,
    personalActivo: 0,
    equiposDisponibles: 0,
    totalHorasOperacion: 0,
    totalViajes: 0,
    totalM3: 0,
  });

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrdenCompraPDF, setShowOrdenCompraPDF] = useState(false);

  // Estados para las tablas de reportes
  const [viajesReports, setViajesReports] = useState<ViajeReporte[]>([]);
  const [plantillerosReports, setPlantillerosReports] = useState<
    PlantilleroReporte[]
  >([]);
  const [operadoresReports, setOperadoresReports] = useState<OperadorReporte[]>(
    []
  );
  const [loadingTables, setLoadingTables] = useState(false);


  useEffect(() => {
    // Inicializar el tiempo en el cliente con zona horaria de Perú
    setCurrentTime(dayjs().tz("America/Lima").toDate());

    const timer = setInterval(() => {
      setCurrentTime(dayjs().tz("America/Lima").toDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadReportsTables();
  }, []);

  const loadReportsTables = async () => {
    try {
      setLoadingTables(true);

      // Cargar todos los reportes en paralelo
      const [viajesData, plantillerosData, operadoresData] =
        await Promise.allSettled([
          viajesEliminacionApi.getAll().catch(() => ({ data: [] })),
          reportesPlantillerosApi.getAll().catch(() => ({ data: [] })),
          reportesOperadoresApi.getAll().catch(() => ({ data: [] })),
        ]);

      // Procesar reportes de viajes
      const viajes =
        viajesData.status === "fulfilled"
          ? Array.isArray(viajesData.value?.data)
            ? viajesData.value.data
            : []
          : [];
      setViajesReports(viajes.slice(0, 10)); // Mostrar solo los primeros 10

      // Procesar reportes de plantilleros
      const plantilleros =
        plantillerosData.status === "fulfilled"
          ? Array.isArray(plantillerosData.value)
            ? plantillerosData.value
            : plantillerosData.value?.data || []
          : [];
      setPlantillerosReports(plantilleros.slice(0, 10));

      // Procesar reportes de operadores
      const operadores =
        operadoresData.status === "fulfilled"
          ? Array.isArray(operadoresData.value)
            ? operadoresData.value
            : operadoresData.value?.data || []
          : [];
      setOperadoresReports(operadores.slice(0, 10));
    } catch (error) {
      console.error("Error loading reports tables:", error);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Usar la nueva API de dashboard para obtener estadísticas
      const dashboardStats = await dashboardApi.getStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (
    reporte: ViajeReporte | PlantilleroReporte | OperadorReporte,
    tipo: string
  ) => {
    // TODO: Implementar modal de detalles o navegar a página de detalles
    const codigo =
      "codigo_reporte" in reporte
        ? reporte.codigo_reporte
        : "codigo" in reporte
        ? reporte.codigo
        : "";
    console.log("Ver detalles del reporte:", codigo, "tipo:", tipo);
    // Aquí se podría abrir un modal o navegar a una página de detalles
  };


  const handleDownloadReport = async (
    reporte: ViajeReporte | PlantilleroReporte | OperadorReporte,
    tipo: string
  ) => {
    try {
      // Generar nombre del archivo
      const fechaFormateada = dayjs(reporte.fecha).tz("America/Lima").format("YYYY-MM-DD");
      const codigo =
        "codigo_reporte" in reporte
          ? reporte.codigo_reporte
          : "codigo" in reporte
          ? reporte.codigo
          : "";
      const fileName = `${tipo}-${codigo}-${fechaFormateada}.json`;

      // Crear objeto con datos del reporte para exportar
      const reportData = {
        tipo,
        codigo,
        fecha: reporte.fecha,
        proyecto: reporte.proyecto,
        datos: reporte,
      };

      // Crear blob y descargar
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Descarga iniciada:", fileName);
    } catch (error) {
      console.error("Error al descargar reporte:", error);
    }
  };

  const handleVerOrdenCompra = () => {
    setShowOrdenCompraPDF(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Principal */}
      <div className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <span className="text-sm font-bold">MA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-700">
                  Maquinarias Ayala
                </h1>
                <p className="text-sm text-slate-600">Sistema de Reportes</p>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <Badge
                variant="outline"
                className="px-3 py-2 border-slate-300 text-slate-600 text-sm font-bold"
              >
                {currentTime ? (
                  <>
                    {dayjs(currentTime).format("dddd, D [de] MMMM [de] YYYY").charAt(0).toUpperCase() +
                      dayjs(currentTime).format("dddd, D [de] MMMM [de] YYYY").slice(1)}
                    ,{" "}
                    {dayjs(currentTime).format("h:mm:ss A")}
                  </>
                ) : (
                  "Cargando..."
                )}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/combustible">
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Combustible
                </Button>
              </Link>
              
              <Button
                onClick={handleVerOrdenCompra}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Orden de Compra
              </Button>

              <Badge className="text-sm px-3 py-1 bg-blue-600 text-white font-mono">
                <Activity className="h-4 w-4 mr-1" />
                DASHBOARD
              </Badge>
            </div>
          </div>

          <div className="pb-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-700">
                PANEL DE CONTROL
              </h2>
              <p className="text-slate-600 mt-1">
                Resumen general del sistema de reportes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-slate-100 p-1 rounded-lg shadow-sm mb-6">
            <TabsTrigger
              value="overview"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Resumen General
            </TabsTrigger>
            <TabsTrigger
              value="viajes"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <Truck className="h-5 w-5 mr-2" />
              Viajes
            </TabsTrigger>
            <TabsTrigger
              value="plantilleros"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <Users className="h-5 w-5 mr-2" />
              Plantilleros
            </TabsTrigger>
            <TabsTrigger
              value="operadores"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <Settings className="h-5 w-5 mr-2" />
              Operadores
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Estadísticas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Viajes Eliminación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.reportesViajes.total}
                  </div>
                  <div className="text-blue-100 text-sm">
                    Hoy: {stats.reportesViajes.hoy} | Semana:{" "}
                    {stats.reportesViajes.ultimaSemana}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Plantilleros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.reportesPlantilleros.total}
                  </div>
                  <div className="text-green-100 text-sm">
                    Hoy: {stats.reportesPlantilleros.hoy} | Semana:{" "}
                    {stats.reportesPlantilleros.ultimaSemana}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Operadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.reportesOperadores.total}
                  </div>
                  <div className="text-purple-100 text-sm">
                    Hoy: {stats.reportesOperadores.hoy} | Semana:{" "}
                    {stats.reportesOperadores.ultimaSemana}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Proyectos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.proyectosActivos}
                  </div>
                  <div className="text-orange-100 text-sm">
                    Proyectos activos
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.personalActivo}
                  </div>
                  <div className="text-teal-100 text-sm">Personal activo</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Equipos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.equiposDisponibles}
                  </div>
                  <div className="text-indigo-100 text-sm">
                    Equipos disponibles
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Actividad Semanal */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-slate-800 text-white">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Actividad del Sistema
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Resumen de reportes generados en la última semana
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {stats.reportesViajes.ultimaSemana}
                    </div>
                    <div className="text-sm text-slate-600">
                      Reportes de Viajes
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (stats.reportesViajes.ultimaSemana /
                              Math.max(stats.reportesViajes.total, 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {stats.reportesPlantilleros.ultimaSemana}
                    </div>
                    <div className="text-sm text-slate-600">
                      Reportes Plantilleros
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (stats.reportesPlantilleros.ultimaSemana /
                              Math.max(stats.reportesPlantilleros.total, 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {stats.reportesOperadores.ultimaSemana}
                    </div>
                    <div className="text-sm text-slate-600">
                      Reportes Operadores
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (stats.reportesOperadores.ultimaSemana /
                              Math.max(stats.reportesOperadores.total, 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reporte de Viajes de Eliminación */}
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Truck className="h-6 w-6" />
                    Viajes de Eliminación
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Registro de viajes de eliminación de material
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      <span>Control de ubicaciones y rutas</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span>Registro de tiempos de operación</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      <span>Asignación de personal especializado</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link href="/reporte-viajes" className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Reporte
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reporte de Plantilleros */}
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Users className="h-6 w-6" />
                    Trabajo de Plantilleros
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Control de actividades del personal plantillero
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <CalendarDays className="h-4 w-4" />
                      <span>Registro diario de actividades</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Package className="h-4 w-4" />
                      <span>Control de materiales utilizados</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Settings className="h-4 w-4" />
                      <span>Asignación de maquinaria</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link href="/reporte-plantilleros" className="flex-1">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Reporte
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reporte de Operadores */}
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Settings className="h-6 w-6" />
                    Reporte de Operadores
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Seguimiento de operaciones y equipos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Gauge className="h-4 w-4" />
                      <span>Control de horómetros</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <BarChart3 className="h-4 w-4" />
                      <span>Registro de producción</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Activity className="h-4 w-4" />
                      <span>Monitoreo de performance</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link href="/reporte-operadores" className="flex-1">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Reporte
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="viajes">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Reportes de Viajes de Eliminación
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={loadReportsTables}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                    <Link href="/reporte-viajes">
                      <Button size="sm" variant="secondary">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo
                      </Button>
                    </Link>
                  </div>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Últimos 10 reportes de viajes de eliminación
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingTables ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando reportes...</p>
                  </div>
                ) : viajesReports.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay reportes de viajes disponibles</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">
                          Proyecto
                        </TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">
                          Responsable
                        </TableHead>
                        <TableHead className="font-semibold">
                          Total Viajes
                        </TableHead>
                        <TableHead className="font-semibold">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viajesReports.map((reporte) => {
                        const totalViajes =
                          reporte.detalle_viajes?.reduce(
                            (sum: number, detalle) =>
                              sum + (detalle.viajes || 0),
                            0
                          ) || 0;

                        return (
                          <TableRow
                            key={reporte.id_viaje || reporte.id}
                            className="hover:bg-slate-50"
                          >
                            <TableCell className="font-medium">
                              <Badge
                                variant="outline"
                                className="text-blue-600"
                              >
                                {reporte.codigo_reporte}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {reporte.proyecto?.nombre || "N/A"}
                            </TableCell>
                            <TableCell>
                              {dayjs(reporte.fecha).tz("America/Lima").format("DD/MM/YYYY")}
                            </TableCell>
                            <TableCell>
                              {reporte.responsable?.nombres
                                ? `${reporte.responsable.nombres} ${
                                    reporte.responsable.apellidos || ""
                                  }`.trim()
                                : reporte.nombre_responsable || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">
                                {totalViajes} viajes
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleViewDetails(reporte, "viajes")
                                  }
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Link
                                  href={`/reporte-viajes?edit=${
                                    reporte.id_viaje || reporte.id
                                  }`}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Editar reporte"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDownloadReport(reporte, "viajes")
                                  }
                                  title="Descargar reporte"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plantilleros">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-green-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Reportes de Plantilleros
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={loadReportsTables}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                    <Link href="/reporte-plantilleros">
                      <Button size="sm" variant="secondary">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo
                      </Button>
                    </Link>
                  </div>
                </CardTitle>
                <CardDescription className="text-green-100">
                  Últimos 10 reportes de trabajo de plantilleros
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingTables ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando reportes...</p>
                  </div>
                ) : plantillerosReports.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay reportes de plantilleros disponibles</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">
                          Proyecto
                        </TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">
                          Plantillero
                        </TableHead>
                        <TableHead className="font-semibold">Cargo</TableHead>
                        <TableHead className="font-semibold">Frente</TableHead>
                        <TableHead className="font-semibold">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plantillerosReports.map((reporte) => (
                        <TableRow
                          key={reporte.id_reporte || reporte.id}
                          className="hover:bg-slate-50"
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="text-green-600">
                              {reporte.codigo_reporte || reporte.codigo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {typeof reporte.proyecto === "object" &&
                            reporte.proyecto?.nombre
                              ? reporte.proyecto.nombre
                              : typeof reporte.proyecto === "string"
                              ? reporte.proyecto
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {new Date(reporte.fecha).toLocaleDateString(
                              "es-PE"
                            )}
                          </TableCell>
                          <TableCell>{reporte.nombre || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {reporte.cargo || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>{reporte.frente || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleViewDetails(reporte, "plantilleros")
                                }
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Link
                                href={`/reporte-plantilleros?edit=${
                                  reporte.id_reporte || reporte.id
                                }`}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Editar reporte"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDownloadReport(reporte, "plantilleros")
                                }
                                title="Descargar reporte"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operadores">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-purple-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Reportes de Operadores
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={loadReportsTables}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                    <Link href="/reporte-operadores">
                      <Button size="sm" variant="secondary">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo
                      </Button>
                    </Link>
                  </div>
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Últimos 10 reportes de operadores de maquinaria
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingTables ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando reportes...</p>
                  </div>
                ) : operadoresReports.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay reportes de operadores disponibles</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">
                          Proyecto
                        </TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">
                          Operador
                        </TableHead>
                        <TableHead className="font-semibold">Equipo</TableHead>
                        <TableHead className="font-semibold">
                          Total M3
                        </TableHead>
                        <TableHead className="font-semibold">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operadoresReports.map((reporte) => {
                        const totalM3 = Number(
                          reporte.detalle_produccion?.reduce(
                            (sum: number, detalle) =>
                              sum + (Number(detalle.m3) || 0),
                            0
                          ) || 0
                        );

                        return (
                          <TableRow
                            key={reporte.id_reporte || reporte.id}
                            className="hover:bg-slate-50"
                          >
                            <TableCell className="font-medium">
                              <Badge
                                variant="outline"
                                className="text-purple-600"
                              >
                                {reporte.codigo_reporte || reporte.codigo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {reporte.proyecto?.nombre || "N/A"}
                            </TableCell>
                            <TableCell>
                              {dayjs(reporte.fecha).tz("America/Lima").format("DD/MM/YYYY")}
                            </TableCell>
                            <TableCell>
                              {reporte.operador
                                ? typeof reporte.operador === "string"
                                  ? reporte.operador
                                  : `${reporte.operador.nombres} ${
                                      reporte.operador.apellidos || ""
                                    }`.trim()
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {reporte.codigoEquipo || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-purple-100 text-purple-800">
                                {(totalM3 || 0).toFixed(1)} m³
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleViewDetails(reporte, "operadores")
                                  }
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Link
                                  href={`/reporte-operadores?edit=${
                                    reporte.id_reporte || reporte.id
                                  }`}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Editar reporte"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDownloadReport(reporte, "operadores")
                                  }
                                  title="Descargar reporte"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal para Orden de Compra PDF */}
      {showOrdenCompraPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6" />
                <div>
                  <h2 className="text-lg font-bold">
                    Orden de Compra
                  </h2>
                  <p className="text-sm text-green-100">
                    Vista previa del documento PDF
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowOrdenCompraPDF(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-600 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full h-full overflow-hidden">
                <OrdenCompraPDF className="w-full h-full" />
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-sm text-gray-600">
                Documento generado automáticamente
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowOrdenCompraPDF(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      const exito = await descargarOrdenCompraPDF();
                      if (!exito) {
                        alert("Error al descargar el PDF. Intente nuevamente.");
                      }
                    } catch (error) {
                      console.error("Error al descargar PDF:", error);
                      alert("Error al descargar el PDF. Intente nuevamente.");
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
