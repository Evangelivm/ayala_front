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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  RefreshCw,
  Download,
  Activity,
} from "lucide-react";
import {
  informeConsumoCombustibleApi,
  type InformeConsumoCombustibleResponse,
} from "@/lib/connections";
import dynamic from "next/dynamic";
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
const ReporteCombustiblePDF = dynamic(
  () => import("@/components/ReporteCombustiblePDF"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generando reporte PDF...</p>
        </div>
      </div>
    ),
  }
);

// Importar la función de descarga dinámicamente
const descargarPDF = async (datos: InformeConsumoCombustibleResponse[]) => {
  const { descargarReportePDF } = await import(
    "@/components/ReporteCombustiblePDF"
  );
  return descargarReportePDF(datos);
};

export default function CombustiblePage() {
  const [combustibleReports, setCombustibleReports] = useState<InformeConsumoCombustibleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Estado para el modal del reporte PDF
  const [showReportePDF, setShowReportePDF] = useState(false);
  const [datosPDFSeleccionados, setDatosPDFSeleccionados] = useState<InformeConsumoCombustibleResponse[]>([]);

  useEffect(() => {
    // Inicializar el tiempo en el cliente con zona horaria de Perú
    setCurrentTime(dayjs().tz("America/Lima").toDate());

    const timer = setInterval(() => {
      setCurrentTime(dayjs().tz("America/Lima").toDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadCombustibleReports();
  }, []);

  const loadCombustibleReports = async () => {
    try {
      setLoading(true);
      const combustibleData = await informeConsumoCombustibleApi.getAll();
      const combustible = Array.isArray(combustibleData) ? combustibleData : [];
      setCombustibleReports(combustible);
    } catch (error) {
      console.error("Error loading combustible reports:", error);
      setCombustibleReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerReporteCombustible = (registro?: InformeConsumoCombustibleResponse) => {
    if (registro) {
      // Mostrar PDF con un registro específico
      setDatosPDFSeleccionados([registro]);
    } else {
      // Mostrar PDF con todos los registros
      setDatosPDFSeleccionados(combustibleReports);
    }
    setShowReportePDF(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      {/* Header Principal */}
      <div className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-orange-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-700">
                  Consumo de Combustible
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
              <Button
                onClick={() => handleVerReporteCombustible()}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generar Reporte PDF
              </Button>
              <Badge className="text-sm px-3 py-1 bg-orange-600 text-white font-mono">
                <Activity className="h-4 w-4 mr-1" />
                COMBUSTIBLE
              </Badge>
            </div>
          </div>

          <div className="pb-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-orange-700">
                INFORME DE CONSUMO DE COMBUSTIBLE
              </h2>
              <p className="text-slate-600 mt-1">
                Gestión y seguimiento del consumo de combustible
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-orange-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registros de Consumo de Combustible
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadCombustibleReports}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleVerReporteCombustible()}
                  disabled={combustibleReports.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Reporte PDF
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-orange-100">
              Todos los registros de consumo de combustible del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Cargando reportes...</p>
              </div>
            ) : combustibleReports.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay registros de consumo de combustible disponibles</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Fecha Emisión</TableHead>
                    <TableHead className="font-semibold">Código Vale</TableHead>
                    <TableHead className="font-semibold">Placa</TableHead>
                    <TableHead className="font-semibold">Proveedor</TableHead>
                    <TableHead className="font-semibold">Cantidad (gal)</TableHead>
                    <TableHead className="font-semibold">Valor Unit.</TableHead>
                    <TableHead className="font-semibold">Total</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combustibleReports.map((registro, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-slate-50"
                    >
                      <TableCell className="font-medium">
                        {dayjs(registro.fecha_emision).tz("America/Lima").format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-600">
                          {registro.codigo_vale}
                        </Badge>
                      </TableCell>
                      <TableCell>{registro.placa}</TableCell>
                      <TableCell>{registro.nombre}</TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">
                          {registro.cantidad.toFixed(2)} gal
                        </Badge>
                      </TableCell>
                      <TableCell>S/. {registro.val_unit.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">
                        S/. {registro.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerReporteCombustible(registro)}
                          title="Ver reporte PDF"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para Reporte de Combustible PDF */}
      {showReportePDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                <div>
                  <h2 className="text-lg font-bold">
                    Reporte de Consumo de Combustible
                  </h2>
                  <p className="text-sm text-orange-100">
                    Vista previa del documento PDF
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowReportePDF(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-orange-600 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full h-full overflow-hidden">
                <ReporteCombustiblePDF datosReporte={datosPDFSeleccionados} />
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-sm text-gray-600">
                Documento generado automáticamente • Datos de prueba
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowReportePDF(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={async () => {
                    try {
                      const exito = await descargarPDF(datosPDFSeleccionados);
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