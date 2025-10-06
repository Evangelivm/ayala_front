"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  FileText,
  Users,
  Clock,
  Truck,
  MapPin,
  Settings,
  Package,
  Hourglass,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { PersonalSelect } from "@/components/personal-select";
import { ProyectoSelect } from "@/components/proyecto-select";
import { EtapaSelect } from "@/components/etapa-select";
import { FrenteSelect } from "@/components/frente-select";
import { MaquinariaSelect } from "@/components/maquinaria-select";
import * as XLSX from "xlsx";
import { type ProyectoData, reportesPlantillerosApi } from "@/lib/connections";

interface PersonalData {
  id_personal: number;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
}

interface EtapaData {
  id: number;
  nombre: string;
  descripcion?: string;
  sectores?: SectorData[];
}

interface SectorData {
  id_sector: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  frentes?: Array<{
    id_frente?: number;
    id?: number;
    nombre: string;
    descripcion?: string;
    responsable?: string;
  }>;
}

interface FrenteData {
  id: number;
  nombre: string;
  descripcion?: string;
  responsable?: string;
}

interface MaquinariaData {
  id: number;
  nombre_completo?: string;
}

// Función auxiliar para formatear la duración total en HH:MM:SS
function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function ReporteDiarioPlantilleros() {
  const [masterData, setMasterData] = useState({
    proyecto: "",
    cliente: "",
    ubicacion: "",
    etapa: "",
    nombre: "",
    fecha: "",
    cargo: "",
    sector: "",
    frente: "",
    horaInicio: "",
    horaFin: "",
    material: "",
    partida: "",
    maquinaria: "",
    comentarios: "",
  });

  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoData | null>(
    null
  );
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaData | null>(null);
  const [selectedFrente, setSelectedFrente] = useState<FrenteData | null>(null);
  const [selectedPersonal, setSelectedPersonal] = useState<PersonalData | null>(
    null
  );
  const [selectedMaquinaria, setSelectedMaquinaria] =
    useState<MaquinariaData | null>(null);
  const [availableFrente, setAvailableFrente] = useState<FrenteData[]>([]);
  const [reportCode, setReportCode] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);

  useEffect(() => {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(100 + Math.random() * 900);
    setReportCode(`RPP${randomNumber}-${year}`);
  }, []);

  useEffect(() => {
    // Inicializar el tiempo en el cliente
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // useEffect para manejar cambios en la etapa seleccionada
  useEffect(() => {
    if (selectedEtapa && selectedProyecto) {
      // Obtener frentes de la etapa seleccionada (a través de sectores)
      console.log("🔍 DEBUG selectedEtapa.sectores:", selectedEtapa.sectores);
      const frentes: FrenteData[] = [];
      if (selectedEtapa.sectores) {
        selectedEtapa.sectores.forEach((sector, sectorIndex) => {
          console.log(`🔍 DEBUG sector ${sectorIndex}:`, sector);
          if (sector.frentes) {
            console.log(`🔍 DEBUG sector.frentes:`, sector.frentes);
            // Convert from id_frente to id for component compatibility
            const convertedFrentes = sector.frentes.map((frente) => {
              console.log(`🔍 DEBUG original frente:`, frente);
              console.log(`🔍 DEBUG frente keys:`, Object.keys(frente));
              const converted = {
                id: frente.id_frente || frente.id || 0,
                nombre: frente.nombre,
                descripcion: frente.descripcion,
                responsable: frente.responsable,
              };
              console.log(`🔍 DEBUG converted frente:`, converted);
              return converted;
            });
            frentes.push(...convertedFrentes);
          }
        });
      }
      console.log("🔍 DEBUG final frentes array:", frentes);
      setAvailableFrente(frentes);

      // Limpiar frente seleccionado si ya no está disponible
      if (!frentes.some((frente) => frente.nombre === masterData.frente)) {
        setMasterData((prevData) => ({
          ...prevData,
          frente: "",
        }));
        setSelectedFrente(null);
      }
    } else {
      // Si no hay etapa seleccionada, limpiar frentes
      setAvailableFrente([]);
      setSelectedFrente(null);
      setMasterData((prevData) => ({
        ...prevData,
        frente: "",
      }));
    }
  }, [selectedEtapa, selectedProyecto, masterData.frente]);

  const handleMasterInputChange = (
    field: keyof typeof masterData,
    value: string
  ) => {
    setMasterData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validar campos requeridos

      if (
        !selectedProyecto?.id ||
        !selectedPersonal?.id_personal ||
        !masterData.fecha
      ) {
        alert(
          "Por favor complete los campos obligatorios: Proyecto, Personal y Fecha"
        );
        return;
      }

      if (!masterData.fecha) {
        alert("La fecha es obligatoria");
        return;
      }

      const reporteData = {
        codigo_reporte: reportCode,
        id_proyecto: selectedProyecto?.id || null,
        id_etapa: selectedEtapa?.id || null,
        id_personal: selectedPersonal?.id_personal || null,
        fecha: new Date(masterData.fecha).toISOString(),
        cargo: masterData.cargo,
        sector: masterData.sector,
        id_frente: selectedFrente?.id || null,
        hora_inicio: masterData.horaInicio,
        hora_fin: masterData.horaFin,
        material: masterData.material,
        partida: masterData.partida,
        id_maquinaria: selectedMaquinaria?.id || null,
        comentarios: masterData.comentarios,
      };

      console.log("🔍 DEBUG - Estado actual:");
      console.log("- selectedProyecto:", selectedProyecto);
      console.log("- selectedEtapa:", selectedEtapa);
      console.log("- selectedEtapa?.id:", selectedEtapa?.id);
      console.log("- selectedFrente:", selectedFrente);
      console.log("- selectedFrente?.id:", selectedFrente?.id);
      console.log("- masterData.etapa:", masterData.etapa);
      console.log("- masterData.frente:", masterData.frente);
      console.log("- availableFrente:", availableFrente);
      console.log(
        "Datos enviados al backend:",
        JSON.stringify(reporteData, null, 2)
      );

      let response;
      if (reportId) {
        // Actualizar reporte existente
        response = await reportesPlantillerosApi.update(reportId, reporteData);
        alert("Reporte actualizado exitosamente");
      } else {
        // Crear nuevo reporte
        response = await reportesPlantillerosApi.create(reporteData);
        setReportId(response.id || null);
        alert("Reporte guardado exitosamente");
      }
    } catch (error) {
      console.error("Error al guardar reporte:", error);
      alert("Error al guardar el reporte. Por favor intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!reportId) {
      alert("No hay reporte para eliminar");
      return;
    }

    if (!confirm("¿Está seguro de que desea eliminar este reporte?")) {
      return;
    }

    try {
      await reportesPlantillerosApi.delete(reportId);
      alert("Reporte eliminado exitosamente");

      // Resetear el formulario
      setReportId(null);
      setMasterData({
        proyecto: "",
        cliente: "",
        ubicacion: "",
        etapa: "",
        nombre: "",
        fecha: "",
        cargo: "",
        sector: "",
        frente: "",
        horaInicio: "",
        horaFin: "",
        material: "",
        partida: "",
        maquinaria: "",
        comentarios: "",
      });
      setSelectedProyecto(null);

      // Generar nuevo código
      const year = new Date().getFullYear();
      const randomNumber = Math.floor(100 + Math.random() * 900);
      setReportCode(`RPP${randomNumber}-${year}`);
    } catch (error) {
      console.error("Error al eliminar reporte:", error);
      alert("Error al eliminar el reporte. Por favor intente nuevamente.");
    }
  };

  const handleExportToExcel = () => {
    const ws: XLSX.WorkSheet = {};
    ws["!merges"] = [];

    const blueColor = "FF00B0F0"; // ARGB for bright blue
    const whiteColor = "FFFFFFFF"; // ARGB for white
    const blackColor = "FF000000"; // ARGB for black

    const borderStyle = {
      top: { style: "thin", color: { auto: 1 } },
      bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } },
      right: { style: "thin", color: { auto: 1 } },
    };

    const blueHeaderStyle = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: whiteColor } },
      fill: { fgColor: { rgb: blueColor } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderStyle,
    };

    const blueLabelStyle = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: whiteColor } },
      fill: { fgColor: { rgb: blueColor } },
      alignment: { horizontal: "left", vertical: "center" },
      border: borderStyle,
    };

    const defaultCellStyle = {
      font: {
        name: "Calibri",
        sz: 11,
        bold: false,
        color: { rgb: blackColor },
      },
      fill: { fgColor: { rgb: whiteColor } },
      alignment: { horizontal: "left", vertical: "center" },
      border: borderStyle,
    };

    const createCell = (
      value: string | number,
      style: object = defaultCellStyle
    ) => ({
      v: value,
      t: typeof value === "number" ? "n" : "s", // Type: 'n' for number, 's' for string
      s: style,
    });

    let rowIdx = 0;

    // Row 1 (index 0): Main Title and Report Code
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "REPORTE DIARIO DE TRABAJO PLANTILLEROS",
      blueHeaderStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 9 })] = createCell(
      reportCode,
      blueHeaderStyle
    ); // Report Code in J1
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 8 } }); // Merge A1:I1 for main title
    rowIdx++;

    // Row 2 (index 1): Empty
    rowIdx++;

    // Master Data Section (Rows 3-X)
    // Row 3 (index 2): PROYECTO, NOMBRE, FECHA
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "PROYECTO:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.proyecto,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "NOMBRE:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.nombre,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 6 })] = createCell(
      "FECHA:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 8 })] = createCell(
      masterData.fecha,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 6 }, e: { r: rowIdx, c: 7 } });
    rowIdx++;

    // Row 4 (index 3): CLIENTE, UBICACIÓN, ETAPA
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "CLIENTE:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.cliente,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "UBICACIÓN:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.ubicacion,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 6 })] = createCell(
      "ETAPA:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 8 })] = createCell(
      masterData.etapa,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 6 }, e: { r: rowIdx, c: 7 } });
    rowIdx++;

    // Row 5 (index 4): CARGO, SECTOR, FRENTE
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "CARGO:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.cargo,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "SECTOR:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.sector,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 6 })] = createCell(
      "FRENTE:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 8 })] = createCell(
      masterData.frente,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 6 }, e: { r: rowIdx, c: 7 } });
    rowIdx++;

    // Row 6 (index 5): HORA DE INICIO, HORA DE FIN, MATERIAL
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "HORA DE INICIO:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.horaInicio,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "HORA DE FIN:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.horaFin,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 6 })] = createCell(
      "MATERIAL:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 8 })] = createCell(
      masterData.material,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 6 }, e: { r: rowIdx, c: 7 } });
    rowIdx++;

    // Row 7 (index 6): PARTIDA, MAQUINARIA, ESTADO
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "PARTIDA:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.partida,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "MAQUINARIA:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.maquinaria,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } });
    rowIdx++;

    // Row 8 (index 7): COMENTARIOS
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "COMENTARIOS:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.comentarios,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } });
    ws["!merges"].push({ s: { r: rowIdx, c: 2 }, e: { r: rowIdx, c: 8 } }); // Merge comments across more columns
    rowIdx++;

    // Set column widths
    ws["!cols"] = [
      { wch: 15 }, // A
      { wch: 5 }, // B (for merging)
      { wch: 25 }, // C
      { wch: 15 }, // D
      { wch: 5 }, // E (for merging)
      { wch: 25 }, // F
      { wch: 15 }, // G
      { wch: 5 }, // H (for merging)
      { wch: 25 }, // I
      { wch: 15 }, // J (for report code)
    ];

    // Set the worksheet range
    const range = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rowIdx, c: 9 },
    });
    ws["!ref"] = range;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Plantilleros");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Reporte_Diario_Plantilleros.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate total working hours
  const totalWorkingTimeMs = (() => {
    if (masterData.horaInicio && masterData.horaFin) {
      const dummyDate = "2000-01-01T";
      const start = new Date(dummyDate + masterData.horaInicio + ":00");
      let end = new Date(dummyDate + masterData.horaFin + ":00");

      if (end.getTime() < start.getTime()) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }
      return end.getTime() - start.getTime();
    }
    return 0;
  })();

  const formattedTotalWorkingHours = formatDuration(totalWorkingTimeMs);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Principal */}
      <div className="bg-white shadow-md border-b border-slate-200 flex-shrink-0">
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
                    {currentTime
                      .toLocaleDateString("es-PE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      .charAt(0)
                      .toUpperCase() +
                      currentTime
                        .toLocaleDateString("es-PE", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                        .slice(1)}
                    ,{" "}
                    {currentTime.toLocaleTimeString("es-PE", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </>
                ) : (
                  "Cargando..."
                )}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="mr-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">
                Código de Reporte
              </span>
              <Badge className="text-sm px-3 py-1 bg-blue-600 text-white font-mono">
                {reportCode}
              </Badge>
            </div>
          </div>

          <div className="pb-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-700">
                REPORTE DIARIO DE TRABAJO PLANTILLEROS
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor principal de contenido */}
      <div className="px-4 sm:px-6 py-8 w-full flex-1 flex flex-col">
        {/* Sección de Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Hourglass className="h-5 w-5" />
              </div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                Horas Trabajadas
              </p>
              <p className="text-2xl font-bold mt-1">
                {formattedTotalWorkingHours}
              </p>
            </CardContent>
          </Card>

          {/* Placeholder cards for consistency */}
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Package className="h-5 w-5 text-white" />
              </div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">
                Material
              </p>
              <p className="text-2xl font-bold mt-1">
                {masterData.material || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Truck className="h-5 w-5" />
              </div>
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">
                Maquinaria
              </p>
              <p className="text-lg font-bold mt-1">
                {masterData.maquinaria || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Datos Maestros */}
        <Card className="mb-6 shadow-lg border-0 flex-1">
          <CardHeader className="bg-blue-800 border-b py-4">
            <CardTitle className="flex items-center gap-3 text-lg text-white font-bold">
              <Settings className="h-5 w-5 text-white" />
              Información General del Plantillero
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Grupo 1: PROYECTO, NOMBRE, CLIENTE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PROYECTO
                  </label>
                  <ProyectoSelect
                    value={masterData.proyecto ? Number(masterData.proyecto) : undefined}
                    onChange={(value) =>
                      handleMasterInputChange("proyecto", value?.toString() ?? "")
                    }
                    onProyectoChange={(proyecto) => {
                      setSelectedProyecto(proyecto);
                    }}
                    placeholder="Seleccionar proyecto..."
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    NOMBRE
                  </label>
                  <PersonalSelect
                    value={masterData.nombre}
                    onValueChange={(value) =>
                      handleMasterInputChange("nombre", value)
                    }
                    onPersonSelected={(person) => {
                      setSelectedPersonal(person);
                    }}
                    placeholder="Seleccionar plantillero..."
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    CLIENTE
                  </label>
                  <Input
                    type="text"
                    value={selectedProyecto?.cliente || masterData.cliente}
                    onChange={(e) =>
                      handleMasterInputChange("cliente", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    placeholder="Cliente del Proyecto"
                    readOnly
                  />
                </div>
              </div>

              {/* Grupo 2: FECHA, CARGO, ETAPA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    FECHA
                  </label>
                  <Input
                    type="date"
                    value={masterData.fecha}
                    onChange={(e) =>
                      handleMasterInputChange("fecha", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    CARGO
                  </label>
                  <Input
                    type="text"
                    value={masterData.cargo}
                    onChange={(e) =>
                      handleMasterInputChange("cargo", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Cargo del Plantillero"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ETAPA
                  </label>
                  <EtapaSelect
                    value={masterData.etapa ? Number(masterData.etapa) : undefined}
                    onChange={(value) => {
                      handleMasterInputChange("etapa", value?.toString() ?? "");
                      if (value && selectedProyecto?.etapas) {
                        const etapa = selectedProyecto.etapas.find(e => e.id === value);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if (etapa) setSelectedEtapa(etapa as any);
                      }
                    }}
                    idProyecto={masterData.proyecto ? Number(masterData.proyecto) : undefined}
                    placeholder="Seleccionar etapa..."
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={!selectedProyecto}
                  />
                </div>
              </div>

              {/* Grupo 3: SECTOR, FRENTE, PARTIDA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    SECTOR
                  </label>
                  <Input
                    type="text"
                    value={masterData.sector}
                    onChange={(e) =>
                      handleMasterInputChange("sector", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Sector de Trabajo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    FRENTE
                  </label>
                  <FrenteSelect
                    value={masterData.frente}
                    onValueChange={(value) =>
                      handleMasterInputChange("frente", value)
                    }
                    onFrenteChange={(frente) => setSelectedFrente(frente)}
                    frentes={availableFrente}
                    placeholder="Seleccionar frente..."
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={!selectedEtapa || availableFrente.length === 0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PARTIDA
                  </label>
                  <Input
                    type="text"
                    value={masterData.partida}
                    onChange={(e) =>
                      handleMasterInputChange("partida", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Número de Partida"
                  />
                </div>
              </div>

              {/* Grupo 4: HORA DE INICIO, HORA DE FIN, UBICACIÓN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    HORA DE INICIO
                  </label>
                  <Input
                    type="time"
                    value={masterData.horaInicio}
                    onChange={(e) =>
                      handleMasterInputChange("horaInicio", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    HORA DE FIN
                  </label>
                  <Input
                    type="time"
                    value={masterData.horaFin}
                    onChange={(e) =>
                      handleMasterInputChange("horaFin", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    UBICACIÓN
                  </label>
                  <Input
                    type="text"
                    value={selectedProyecto?.ubicacion || masterData.ubicacion}
                    onChange={(e) =>
                      handleMasterInputChange("ubicacion", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    placeholder="Ubicación del Proyecto"
                    readOnly
                  />
                </div>
              </div>

              {/* Grupo 5: MATERIAL, MAQUINARIA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    MATERIAL
                  </label>
                  <Input
                    type="text"
                    value={masterData.material}
                    onChange={(e) =>
                      handleMasterInputChange("material", e.target.value)
                    }
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Tipo de Material"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    MAQUINARIA
                  </label>
                  <MaquinariaSelect
                    value={masterData.maquinaria}
                    onValueChange={(value) =>
                      handleMasterInputChange("maquinaria", value)
                    }
                    onMaquinariaSelected={(maquinaria) => {
                      setSelectedMaquinaria(maquinaria);
                    }}
                    placeholder="Seleccionar maquinaria..."
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div></div>
              </div>

              {/* Comentarios - Span completo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  COMENTARIOS
                </label>
                <Textarea
                  value={masterData.comentarios}
                  onChange={(e) =>
                    handleMasterInputChange("comentarios", e.target.value)
                  }
                  className="min-h-[80px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  placeholder="Añade comentarios adicionales aquí..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 flex-shrink-0">
          <Button
            onClick={handleExportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-6 h-10"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="shadow-lg px-6 h-10"
            disabled={!reportId}
          >
            Eliminar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 h-10"
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : reportId
              ? "Actualizar Reporte"
              : "Grabar Reporte"}
          </Button>
        </div>
      </div>
    </div>
  );
}
