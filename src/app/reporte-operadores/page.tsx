"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  FileText,
  Users,
  Clock,
  Truck,
  Settings,
  BarChart3,
  Gauge,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalSelect } from "@/components/personal-select";
import { ProyectoSelect } from "@/components/proyecto-select";
import { EtapaSelect } from "@/components/etapa-select";
import { EquipoSelect } from "@/components/equipo-select";
import {
  type ProyectoData,
  type EquipoData,
  type PersonalNuevoData,
  reportesOperadoresApi,
} from "@/lib/connections";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Función auxiliar para formatear la duración total en HH:MM:SS
function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Función auxiliar para calcular horas trabajadas entre dos horarios
function calculateHoursWorked(
  horaInicio: string,
  horaFinal: string
): number | undefined {
  if (!horaInicio || !horaFinal) return undefined;

  try {
    const dummyDate = "2000-01-01T"; // Fecha dummy para parsing
    const start = new Date(dummyDate + horaInicio + ":00");
    let end = new Date(dummyDate + horaFinal + ":00");

    // Manejar casos donde la hora final es del día siguiente (ej: 23:00 a 01:00)
    if (end.getTime() < start.getTime()) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60); // Convertir a horas decimales

    return Number(diffHours.toFixed(2));
  } catch (error) {
    console.error("Error calculating hours worked:", error);
    return undefined;
  }
}

// Define la estructura de los datos de una fila de detalle de producción
interface ProductionDetailRow {
  id: number;
  horaInicio: string;
  horaFinal: string;
  sector: string;
  frente: string;
  descripcion: string;
  material: string;
  m3: number | "";
  viajes: number | "";
}

export default function ReporteDiarioOperadores() {
  // Genera 10 ítems de detalle de producción
  const initialProductionRows: ProductionDetailRow[] = Array.from(
    { length: 10 },
    (_, i) => ({
      id: i + 1,
      horaInicio: "",
      horaFinal: "",
      sector: "",
      frente: "",
      descripcion: "",
      material: "",
      m3: "",
      viajes: "",
    })
  );

  const [productionRowsData, setProductionRowsData] = useState<
    ProductionDetailRow[]
  >(initialProductionRows);
  const [masterData, setMasterData] = useState({
    fecha: "",
    operador: "",
    proyecto: "",
    cliente: "",
    ubicacion: "",
    etapa: "",
    vigia1: "",
    vigia2: "",
    vigia3: "",
    horario1: "",
    horario2: "",
    horario3: "",
    codigoEquipo: "",
    horometroInicial: "",
    horometroFinal: "",
  });
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoData | null>(
    null
  );
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoData | null>(null);
  const [selectedOperador, setSelectedOperador] =
    useState<PersonalNuevoData | null>(null);
  const [selectedVigia1, setSelectedVigia1] =
    useState<PersonalNuevoData | null>(null);
  const [selectedVigia2, setSelectedVigia2] =
    useState<PersonalNuevoData | null>(null);
  const [selectedVigia3, setSelectedVigia3] =
    useState<PersonalNuevoData | null>(null);
  const [selectedEtapa, setSelectedEtapa] = useState<{
    id: number;
    nombre: string;
    descripcion?: string;
  } | null>(null);
  const [reportCode, setReportCode] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);

  const memoizedEtapas = useMemo(() => {
    const etapas = selectedProyecto?.etapas || [];
    // console.log('Etapas disponibles:', etapas);
    return etapas;
  }, [selectedProyecto?.etapas]);

  useEffect(() => {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(100 + Math.random() * 900);
    setReportCode(`RO${randomNumber}-${year}`);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleProductionInputChange = (
    rowIndex: number,
    field: keyof ProductionDetailRow,
    value: string | number
  ) => {
    setProductionRowsData((prevData) => {
      const newData = [...prevData];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [field]: value,
      };
      return newData;
    });
  };

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
      if (!masterData.fecha || !masterData.operador || !masterData.proyecto) {
        toast.error(
          "Por favor complete los campos obligatorios: Fecha, Operador y Proyecto"
        );
        return;
      }

      // Validar que al menos un item de producción esté lleno
      if (!hasFilledProductionItems) {
        toast.error("Debe llenar al menos un item en el detalle de producción");
        return;
      }

      const reporteData = {
        codigo_reporte: reportCode,
        codigo: reportCode, // Add 'codigo' field
        fecha: masterData.fecha + "T00:00:00.000Z",
        // IDs principales
        id_operador: selectedOperador?.id_personal || null,
        id_proyecto: selectedProyecto?.id || null,
        id_etapa: selectedEtapa?.id || null,
        id_equipo: selectedEquipo?.id_equipo || null,
        // Personal de vigilancia (nuevos campos)
        id_vigia1: selectedVigia1?.id_personal || null,
        id_vigia2: selectedVigia2?.id_personal || null,
        id_vigia3: selectedVigia3?.id_personal || null,
        // Horarios y horómetros
        horario1: masterData.horario1 ? masterData.horario1 : undefined,
        horario2: masterData.horario2 ? masterData.horario2 : undefined,
        horario3: masterData.horario3 ? masterData.horario3 : undefined,
        horometro_inicial: masterData.horometroInicial
          ? parseFloat(masterData.horometroInicial)
          : null,
        horometro_final: masterData.horometroFinal
          ? parseFloat(masterData.horometroFinal)
          : null,
        // Mapear equipo seleccionado a maquinaria (ambos campos usan el mismo selector)
        id_maquinaria: selectedEquipo?.id_equipo || null,
        // IMPORTANTE: Cambiar nombre de campo para coincidir con backend
        // Only include filled production items
        detalle_produccion: productionRowsData
          .filter(
            (row) =>
              row.horaInicio ||
              row.horaFinal ||
              row.sector ||
              row.frente ||
              row.descripcion ||
              row.material ||
              row.m3 ||
              row.viajes
          )
          .map((row, index) => ({
            item: index + 1,
            // TODO: Implementar selectores para obtener IDs en lugar de strings
            // Actualmente enviando strings porque no hay selectores de ID disponibles
            frente: row.frente || undefined, // Debería ser id_frente
            actividad: row.descripcion || undefined,
            equipo_maquinaria: row.material || undefined, // Debería ser id_equipo_maquinaria
            m3: row.m3 ? Number(row.m3) : undefined,
            viajes: row.viajes ? Number(row.viajes) : undefined,
            horas_trabajadas:
              row.horaInicio && row.horaFinal
                ? calculateHoursWorked(row.horaInicio, row.horaFinal)
                : undefined,
          })),
      };

      console.log("selectedEtapa antes de enviar:", selectedEtapa);
      console.log("Datos enviados al backend:", reporteData);

      let response;
      if (reportId) {
        // Actualizar reporte existente
        response = await reportesOperadoresApi.update(reportId, reporteData);
        toast.success("Reporte actualizado exitosamente");
      } else {
        // Crear nuevo reporte
        response = await reportesOperadoresApi.create(reporteData);
        setReportId(response.id || null);
        toast.success("Reporte guardado exitosamente");
      }
    } catch (error) {
      console.error("Error al guardar reporte:", error);
      toast.error("Error al guardar el reporte. Por favor intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!reportId) {
      toast.error("No hay reporte para eliminar");
      return;
    }

    if (!confirm("¿Está seguro de que desea eliminar este reporte?")) {
      return;
    }

    try {
      await reportesOperadoresApi.delete(reportId);
      toast.success("Reporte eliminado exitosamente");

      // Resetear el formulario
      setReportId(null);
      setMasterData({
        fecha: "",
        operador: "",
        proyecto: "",
        cliente: "",
        ubicacion: "",
        etapa: "",
        vigia1: "",
        vigia2: "",
        vigia3: "",
        horario1: "",
        horario2: "",
        horario3: "",
        codigoEquipo: "",
        horometroInicial: "",
        horometroFinal: "",
      });
      setProductionRowsData(initialProductionRows);
      setSelectedProyecto(null);
      setSelectedEquipo(null);
      setSelectedOperador(null);
      setSelectedVigia1(null);
      setSelectedVigia2(null);
      setSelectedVigia3(null);
      setSelectedEtapa(null);

      // Generar nuevo código
      const year = new Date().getFullYear();
      const randomNumber = Math.floor(100 + Math.random() * 900);
      setReportCode(`RO${randomNumber}-${year}`);
    } catch (error) {
      console.error("Error al eliminar reporte:", error);
      toast.error(
        "Error al eliminar el reporte. Por favor intente nuevamente."
      );
    }
  };

  const handleExportToExcel = () => {
    // Filter only filled production items
    const filledProductionItems = productionRowsData.filter(
      (row) =>
        row.horaInicio ||
        row.horaFinal ||
        row.sector ||
        row.frente ||
        row.descripcion ||
        row.material ||
        row.m3 ||
        row.viajes
    );

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
      "REPORTE DIARIO OPERADORES",
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

    // Master Data Section (Rows 3-12, indices 2-11)
    // Row 3 (index 2): FECHA, OPERADOR, VIGIA 3
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "FECHA:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.fecha,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "OPERADOR:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.operador,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 6 })] = createCell(
      "VIGIA 3:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 8 })] = createCell(
      masterData.vigia3,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A3:B3
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } }); // Merge D3:E3
    ws["!merges"].push({ s: { r: rowIdx, c: 6 }, e: { r: rowIdx, c: 7 } }); // Merge G3:H3
    rowIdx++;

    // Row 4 (index 3): PROYECTO
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "PROYECTO:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.proyecto,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A4:B4
    rowIdx++;

    // Row 5 (index 4): CLIENTE
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "CLIENTE:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.cliente,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A5:B5
    rowIdx++;

    // Row 6 (index 5): UBICACIÓN
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "UBICACIÓN:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.ubicacion,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A6:B6
    rowIdx++;

    // Row 7 (index 6): ETAPA
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "ETAPA:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.etapa,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A7:B7
    rowIdx++;

    // Row 8 (index 7): VIGIA 1, VIGIA 2, HORARIO 3
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "VIGIA 1:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.vigia1,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "VIGIA 2:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.vigia2,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 6 })] = createCell(
      "HORARIO 3:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 8 })] = createCell(
      masterData.horario3,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A8:B8
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } }); // Merge D8:E8
    ws["!merges"].push({ s: { r: rowIdx, c: 6 }, e: { r: rowIdx, c: 7 } }); // Merge G8:H8
    rowIdx++;

    // Row 9 (index 8): HORARIO 1, HORARIO 2
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "HORARIO 1:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.horario1,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "HORARIO 2:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.horario2,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A9:B9
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } }); // Merge D9:E9
    rowIdx++;

    // Row 10 (index 9): CODIGO EQUIPO
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "CODIGO EQUIPO:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.codigoEquipo,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A10:B10
    rowIdx++;

    // Row 11 (index 10): HOROMETRO INICIAL, HOROMETRO FINAL
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "HOROMETRO INICIAL:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
      masterData.horometroInicial,
      defaultCellStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
      "HOROMETRO FINAL:",
      blueLabelStyle
    );
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
      masterData.horometroFinal,
      defaultCellStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 1 } }); // Merge A11:B11
    ws["!merges"].push({ s: { r: rowIdx, c: 3 }, e: { r: rowIdx, c: 4 } }); // Merge D11:E11
    rowIdx++;

    // Row 12 (index 11): Empty
    rowIdx++;

    // Row 13 (index 12): DETALLE DE PRODUCCIÓN title
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
      "DETALLE DE PRODUCCIÓN",
      blueHeaderStyle
    );
    ws["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 8 } }); // Merge A13:I13
    rowIdx++;

    // Production Headers (Row 14, index 13)
    const productionHeaders = [
      "ITEM",
      "HORA INICIO",
      "HORA FINAL",
      "SECTOR",
      "FRENTE",
      "DESCRIPCIÓN",
      "MATERIAL",
      "M3",
      "VIAJES",
    ];
    productionHeaders.forEach((header, colIndex) => {
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: colIndex })] = createCell(
        header,
        blueHeaderStyle
      );
    });
    rowIdx++;

    // Production Content (starting from Row 15, index 14)
    filledProductionItems.forEach((row) => {
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = createCell(
        row.id,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 1 })] = createCell(
        row.horaInicio,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })] = createCell(
        row.horaFinal,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })] = createCell(
        row.sector,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 4 })] = createCell(
        row.frente,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = createCell(
        row.descripcion,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 6 })] = createCell(
        row.material,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 7 })] = createCell(
        row.m3,
        defaultCellStyle
      );
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: 8 })] = createCell(
        row.viajes,
        defaultCellStyle
      );
      rowIdx++;
    });

    // Totals (last row of production + 2)
    rowIdx++; // One empty row after production data
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 7 })] = createCell(
      "TOTALES",
      blueHeaderStyle
    ); // H column for TOTALES
    ws["!merges"].push({ s: { r: rowIdx, c: 7 }, e: { r: rowIdx, c: 9 } }); // Merge H:J for TOTALES

    // Set column widths
    ws["!cols"] = [
      { wch: 8 }, // A: ITEM
      { wch: 15 }, // B: HORA INICIO
      { wch: 15 }, // C: HORA FINAL
      { wch: 15 }, // D: SECTOR
      { wch: 15 }, // E: FRENTE
      { wch: 30 }, // F: DESCRIPCIÓN
      { wch: 15 }, // G: MATERIAL
      { wch: 10 }, // H: M3
      { wch: 10 }, // I: VIAJES
      { wch: 10 }, // J: Extra column for spacing/alignment
    ];

    // Set the worksheet range
    const range = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rowIdx, c: 9 },
    });
    ws["!ref"] = range;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Operadores");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Reporte_Diario_Operadores.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calcular los totales
  const totalM3 = productionRowsData.reduce(
    (sum, row) => sum + (Number(row.m3) || 0),
    0
  );
  const totalViajes = productionRowsData.reduce(
    (sum, row) => sum + (Number(row.viajes) || 0),
    0
  );

  const totalOperationTimeMs = productionRowsData.reduce((totalMs, row) => {
    if (row.horaInicio && row.horaFinal) {
      const dummyDate = "2000-01-01T"; // Use a dummy date to parse time correctly
      const start = new Date(dummyDate + row.horaInicio + ":00");
      let end = new Date(dummyDate + row.horaFinal + ":00");

      // Handle cases where end time is on the next day (e.g., 23:00 to 01:00)
      if (end.getTime() < start.getTime()) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }
      return totalMs + (end.getTime() - start.getTime());
    }
    return totalMs;
  }, 0);

  const formattedHorasOperacion = formatDuration(totalOperationTimeMs);

  // Calculate sum of horometers
  const sumHorometros =
    (Number(masterData.horometroInicial) || 0) +
    (Number(masterData.horometroFinal) || 0);

  // Check if at least one production item is filled
  const hasFilledProductionItems = productionRowsData.some(
    (row) =>
      row.horaInicio ||
      row.horaFinal ||
      row.sector ||
      row.frente ||
      row.descripcion ||
      row.material ||
      row.m3 ||
      row.viajes
  );

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
                REPORTE DIARIO OPERADORES
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor principal de contenido */}
      <div className="px-4 sm:px-6 py-8 w-full flex-1 flex flex-col">
        {/* Sección de Totales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                Total M3
              </p>
              <p className="text-2xl font-bold mt-1">{totalM3}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Truck className="h-5 w-5" />
              </div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">
                Total Viajes
              </p>
              <p className="text-2xl font-bold mt-1">{totalViajes}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">
                Horas Operación
              </p>
              <p className="text-lg font-bold mt-1">
                {formattedHorasOperacion}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Gauge className="h-5 w-5" />
              </div>
              <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                Suma Horómetros
              </p>
              <p className="text-2xl font-bold mt-1">
                {sumHorometros.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pestañas para Datos Maestros y Detalle de Producción */}
        <Tabs defaultValue="master" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 p-1 rounded-lg shadow-sm mb-6 flex-shrink-0">
            <TabsTrigger
              value="master"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <Settings className="h-5 w-5 mr-2" />
              Datos Maestros
            </TabsTrigger>
            <TabsTrigger
              value="production"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Detalle de Producción
            </TabsTrigger>
          </TabsList>

          <TabsContent value="master" className="flex-1">
            {/* Datos Maestros */}
            <Card className="mb-6 shadow-lg border-0">
              <CardHeader className="bg-military-green border-b py-4">
                <CardTitle className="flex items-center gap-3 text-lg text-white font-bold">
                  <Settings className="h-5 w-5 text-white" />
                  Información General del Operador
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Columna 1: Información Básica */}
                  <div className="space-y-6">
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
                        OPERADOR
                      </label>
                      <PersonalSelect
                        value={masterData.operador || ""}
                        onValueChange={(value) =>
                          handleMasterInputChange("operador", value)
                        }
                        onPersonSelected={(person) =>
                          setSelectedOperador(person)
                        }
                        placeholder="Seleccionar operador..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PROYECTO
                      </label>
                      <ProyectoSelect
                        value={masterData.proyecto || ""}
                        onValueChange={(value) =>
                          handleMasterInputChange("proyecto", value)
                        }
                        onProyectoChange={(proyecto) =>
                          setSelectedProyecto(proyecto)
                        }
                        placeholder="Seleccionar proyecto..."
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

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        UBICACIÓN
                      </label>
                      <Input
                        type="text"
                        value={
                          selectedProyecto?.ubicacion || masterData.ubicacion
                        }
                        onChange={(e) =>
                          handleMasterInputChange("ubicacion", e.target.value)
                        }
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                        placeholder="Ubicación del Proyecto"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Columna 2: Personal de Vigilancia */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        VIGÍA 1
                      </label>
                      <PersonalSelect
                        value={masterData.vigia1 || ""}
                        onValueChange={(value) =>
                          handleMasterInputChange("vigia1", value)
                        }
                        onPersonSelected={(person) => setSelectedVigia1(person)}
                        placeholder="Seleccionar vigía 1..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        VIGÍA 2
                      </label>
                      <PersonalSelect
                        value={masterData.vigia2 || ""}
                        onValueChange={(value) =>
                          handleMasterInputChange("vigia2", value)
                        }
                        onPersonSelected={(person) => setSelectedVigia2(person)}
                        placeholder="Seleccionar vigía 2..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        VIGÍA 3
                      </label>
                      <PersonalSelect
                        value={masterData.vigia3 || ""}
                        onValueChange={(value) =>
                          handleMasterInputChange("vigia3", value)
                        }
                        onPersonSelected={(person) => setSelectedVigia3(person)}
                        placeholder="Seleccionar vigía 3..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        HOROMETRO INICIAL
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={masterData.horometroInicial}
                        onChange={(e) =>
                          handleMasterInputChange(
                            "horometroInicial",
                            e.target.value
                          )
                        }
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        ETAPA
                      </label>
                      <EtapaSelect
                        value={masterData.etapa || ""}
                        onValueChange={(value) =>
                          handleMasterInputChange("etapa", value)
                        }
                        onEtapaChange={(etapa) => {
                          console.log("Etapa seleccionada:", etapa);
                          setSelectedEtapa(etapa);
                        }}
                        etapas={memoizedEtapas}
                        placeholder="Seleccionar etapa..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={!selectedProyecto}
                      />
                    </div>
                  </div>

                  {/* Columna 3: Horarios y Horómetro */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        HORARIO 1
                      </label>
                      <Input
                        type="time"
                        value={masterData.horario1}
                        onChange={(e) =>
                          handleMasterInputChange("horario1", e.target.value)
                        }
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        HORARIO 2
                      </label>
                      <Input
                        type="time"
                        value={masterData.horario2}
                        onChange={(e) =>
                          handleMasterInputChange("horario2", e.target.value)
                        }
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        HORARIO 3
                      </label>
                      <Input
                        type="time"
                        value={masterData.horario3}
                        onChange={(e) =>
                          handleMasterInputChange("horario3", e.target.value)
                        }
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        HOROMETRO FINAL
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={masterData.horometroFinal}
                        onChange={(e) =>
                          handleMasterInputChange(
                            "horometroFinal",
                            e.target.value
                          )
                        }
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        EQUIPO
                      </label>
                      <EquipoSelect
                        value={masterData.codigoEquipo || ""}
                        onValueChange={(value) =>
                          handleMasterInputChange("codigoEquipo", value)
                        }
                        onEquipoSelected={(equipo) => setSelectedEquipo(equipo)}
                        placeholder="Seleccionar equipo..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="flex-1 flex flex-col">
            {/* Detalle de Producción */}
            <Card className="shadow-lg border-0 flex-1 flex flex-col">
              <CardHeader className="bg-military-green border-b py-4 flex-shrink-0">
                <CardTitle className="flex items-center gap-3 text-lg text-white font-bold">
                  <BarChart3 className="h-5 w-5 text-white" />
                  Registro de Producción
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="overflow-auto h-full">
                  <table className="w-full table-fixed">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          ITEM
                        </th>
                        <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          HORA INICIO
                        </th>
                        <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          HORA FINAL
                        </th>
                        <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          SECTOR
                        </th>
                        <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          FRENTE
                        </th>
                        <th className="w-48 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          DESCRIPCIÓN
                        </th>
                        <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          MATERIAL
                        </th>
                        <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                          M3
                        </th>
                        <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          VIAJES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {productionRowsData.map((rowData, rowIndex) => (
                        <tr
                          key={rowData.id}
                          className={
                            rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="w-16 px-4 py-3 text-sm text-slate-900 border-r border-slate-200 text-center font-bold font-sans">
                            {rowData.id}
                          </td>
                          <td className="w-32 px-4 py-3 border-r border-slate-200">
                            <Input
                              type="time"
                              value={rowData.horaInicio}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "horaInicio",
                                  e.target.value
                                )
                              }
                              className={`h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 ${
                                rowData.horaInicio ? "bg-green-50" : ""
                              }`}
                            />
                          </td>
                          <td className="w-32 px-4 py-3 border-r border-slate-200">
                            <Input
                              type="time"
                              value={rowData.horaFinal}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "horaFinal",
                                  e.target.value
                                )
                              }
                              className={`h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 ${
                                rowData.horaFinal ? "bg-red-50" : ""
                              }`}
                            />
                          </td>
                          <td className="w-32 px-4 py-3 border-r border-slate-200">
                            <Input
                              type="text"
                              value={rowData.sector}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "sector",
                                  e.target.value
                                )
                              }
                              className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 text-center"
                              placeholder="Sector"
                            />
                          </td>
                          <td className="w-32 px-4 py-3 border-r border-slate-200">
                            <Input
                              type="text"
                              value={rowData.frente}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "frente",
                                  e.target.value
                                )
                              }
                              className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 text-center"
                              placeholder="Frente"
                            />
                          </td>
                          <td className="w-48 px-4 py-3 border-r border-slate-200">
                            <Input
                              type="text"
                              value={rowData.descripcion}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "descripcion",
                                  e.target.value
                                )
                              }
                              className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 text-center"
                              placeholder="Descripción"
                            />
                          </td>
                          <td className="w-32 px-4 py-3 border-r border-slate-200">
                            <Input
                              type="text"
                              value={rowData.material}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "material",
                                  e.target.value
                                )
                              }
                              className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 text-center"
                              placeholder="Material"
                            />
                          </td>
                          <td className="w-24 px-4 py-3 border-r border-slate-200">
                            <Input
                              type="number"
                              value={rowData.m3}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "m3",
                                  e.target.value
                                )
                              }
                              className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="w-24 px-4 py-3">
                            <Input
                              type="number"
                              value={rowData.viajes}
                              onChange={(e) =>
                                handleProductionInputChange(
                                  rowIndex,
                                  "viajes",
                                  e.target.value
                                )
                              }
                              className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
            disabled={saving || !hasFilledProductionItems}
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
