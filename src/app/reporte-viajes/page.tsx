"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, FileText, Users, Clock, Truck, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalSelect } from "@/components/personal-select"
import { ProyectoSelect } from "@/components/proyecto-select"
import { EtapaSelect } from "@/components/etapa-select"
import { MaquinariaSelect } from "@/components/maquinaria-select"
import * as XLSX from "xlsx"
import type { ProyectoData } from "@/lib/connections"
import { viajesEliminacionApi } from "@/lib/connections"
import { toast } from "sonner"

// Define la estructura de los datos de una fila de detalle
interface DetailRow {
  id: number
  conductor: string
  placa: string
  viajes: number | ""
  m3Tolva: number | ""
  timeEntries: Array<{
    startTime: string
    endTime: string
  }>
}

// Función auxiliar para formatear la duración total en HH:MM:SS
function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (num: number) => num.toString().padStart(2, "0")

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export default function DailyWorkReportViajes() {
  // Genera 10 ítems de detalle
  const initialDetailRows: DetailRow[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    conductor: "",
    placa: "",
    viajes: "",
    m3Tolva: "",
    timeEntries: Array.from({ length: 8 }, () => ({ startTime: "", endTime: "" })),
  }))

  const [detailRowsData, setDetailRowsData] = useState<DetailRow[]>(initialDetailRows)
  const [headerData, setHeaderData] = useState({
    proyecto: "",
    cliente: "",
    ubicacion: "",
    etapa: "",
    fecha: "",
    nombre: "",
    comentarios: "",
    operador: "",
    maquinariaPesada: "",
    vigia: "",
    mantero: "",
    controlador: "",
    capataz: "",
  })

  // Estados para almacenar los IDs seleccionados del personal
  const [selectedPersonalIds, setSelectedPersonalIds] = useState({
    id_responsable: undefined as number | undefined,
    id_operador: undefined as number | undefined,
    id_vigia: undefined as number | undefined,
    id_mantero: undefined as number | undefined,
    id_controlador: undefined as number | undefined,
    id_capataz: undefined as number | undefined,
  })

  const [reportCode, setReportCode] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoData | null>(null)

  useEffect(() => {
    const year = new Date().getFullYear()
    const randomNumber = Math.floor(100 + Math.random() * 900)
    setReportCode(`RP${randomNumber}-${year}`)
  }, [])

  useEffect(() => {
    // Inicializar el tiempo en el cliente
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleTimeChange = (rowIndex: number, entryIndex: number, field: "startTime" | "endTime", value: string) => {
    setDetailRowsData((prevData) => {
      const newData = [...prevData]
      newData[rowIndex].timeEntries[entryIndex] = {
        ...newData[rowIndex].timeEntries[entryIndex],
        [field]: value,
      }
      return newData
    })
  }

  const handleDetailInputChange = (
    rowIndex: number,
    field: "conductor" | "placa" | "viajes" | "m3Tolva",
    value: string | number,
  ) => {
    setDetailRowsData((prevData) => {
      const newData = [...prevData]
      newData[rowIndex] = {
        ...newData[rowIndex],
        [field]: value,
      }
      return newData
    })
  }

  const handleHeaderInputChange = (field: keyof typeof headerData, value: string) => {
    setHeaderData((prevData) => ({
      ...prevData,
      [field]: value,
    }))
  }


  const handleSave = async () => {
    try {
      // Validar datos requeridos
      if (!headerData.fecha) {
        toast.error('La fecha es requerida');
        return;
      }
      
      // Preparar datos para la nueva API usando IDs de personal
      const viajesData = {
        codigo_reporte: reportCode,
        id_proyecto: selectedProyecto?.id,
        fecha: new Date(headerData.fecha).toISOString(),
        // Enviando IDs del personal seleccionado
        id_responsable: selectedPersonalIds.id_responsable,
        id_operador: selectedPersonalIds.id_operador,
        maquinaria_pesada: headerData.maquinariaPesada,
        id_vigia: selectedPersonalIds.id_vigia,
        id_mantero: selectedPersonalIds.id_mantero,
        id_controlador: selectedPersonalIds.id_controlador,
        id_capataz: selectedPersonalIds.id_capataz,
        comentarios: headerData.comentarios,
        detalle_viajes: detailRowsData
          .filter(row => row.conductor || row.placa || Number(row.viajes) > 0) // Solo incluir filas con datos
          .map(row => ({
            item: row.id,
            conductor: row.conductor,
            placa: row.placa,
            viajes: Number(row.viajes) || 0,
            m3_tolva: Number(row.m3Tolva) || 0,
            horarios: row.timeEntries
              .map((entry, index) => ({
                numero_entrada: index + 1,
                hora_inicio: entry.startTime || undefined,
                hora_salida: entry.endTime || undefined,
              }))
              .filter(h => h.hora_inicio || h.hora_salida) // Solo horarios con al menos un tiempo
          }))
      }
      
      // Validar que hay al menos un detalle
      if (viajesData.detalle_viajes.length === 0) {
        toast.error('Debe incluir al menos un detalle de viaje con datos válidos');
        return;
      }

      console.log("Datos que se envían al backend:", JSON.stringify(viajesData, null, 2))
      const result = await viajesEliminacionApi.create(viajesData)
      toast.success(`Reporte de viajes guardado exitosamente!`, {
        description: `ID: ${result.id_viaje} - Código: ${result.codigo_reporte}`
      })
      console.log("Respuesta del backend:", result)
      
      // Opcional: Limpiar formulario o redirigir
      // setDetailRowsData(initialDetailRows)
      // setHeaderData({ ... })
    } catch (error) {
      console.error("Error al guardar:", error)
      toast.error("Error al guardar el reporte", {
        description: "Verifica los datos e intenta nuevamente."
      })
    }
  }

  const handleDelete = () => {
    console.log("Solicitud de eliminación")
    toast.info("Funcionalidad de Eliminar (a implementar)")
  }

  const handleExportToExcel = () => {
    const headerRows = [
      ["REPORTE DIARIO DE TRABAJO", reportCode], // Row 0
      [], // Row 1 (empty for spacing)
      ["PROYECTO:", headerData.proyecto, "CLIENTE:", headerData.cliente], // Row 2
      ["UBICACIÓN:", headerData.ubicacion, "ETAPA:", headerData.etapa], // Row 3
      ["FECHA:", headerData.fecha, "NOMBRE:", headerData.nombre], // Row 4
      ["COMENTARIOS:", headerData.comentarios], // Row 5
      ["OPERADOR:", headerData.operador, "MAQUINARIA PESADA:", headerData.maquinariaPesada], // Row 6
      ["VIGÍA:", headerData.vigia, "MANTERO:", headerData.mantero], // Row 7
      ["CONTROLADOR:", headerData.controlador, "CAPATAZ:", headerData.capataz], // Row 8
      [], // Row 9 (empty for spacing)
      ["Detalle de Movimientos"], // Row 10
    ]

    // Updated order for detail headers
    const detailHeaders = ["ITEM", "PLACA", "CONDUCTOR", "VIAJES", "M3-TOLVA"]
    for (let i = 1; i <= 8; i++) {
      detailHeaders.push(`HORA INICIO ${i}`, `HORA SALIDA ${i}`)
    }

    const detailContent = detailRowsData.map((row) => {
      // Updated order for row data
      const rowArray: (string | number)[] = [row.id, row.placa, row.conductor, row.viajes, row.m3Tolva]
      row.timeEntries.forEach((entry) => {
        rowArray.push(entry.startTime, entry.endTime)
      })
      return rowArray
    })

    const dataToExport = [...headerRows, detailHeaders, ...detailContent]

    const ws = XLSX.utils.aoa_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()

    // Set column widths (adjusting for new order)
    const colWidths = [
      { wch: 8 }, // ITEM
      { wch: 15 }, // PLACA
      { wch: 25 }, // CONDUCTOR
      { wch: 10 }, // VIAJES
      { wch: 12 }, // M3-TOLVA
    ]
    // Add widths for 8 pairs of HORA INICIO/SALIDA
    for (let i = 0; i < 8; i++) {
      colWidths.push({ wch: 15 }, { wch: 15 })
    }
    ws["!cols"] = colWidths

    // Merge cells for the main title and report code
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }] // Merge "REPORTE DIARIO DE TRABAJO" across 5 columns
    ws["!merges"].push({ s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }) // Merge reportCode across 2 columns (adjust as needed)

    // Apply bold formatting to specific cells (headers and labels)
    const boldStyle = { font: { bold: true } }
    const centerStyle = { alignment: { horizontal: "center" } }

    // Main title
    if (ws["A1"]) ws["A1"].s = { ...boldStyle, ...centerStyle }
    if (ws["F1"]) ws["F1"].s = { ...boldStyle, ...centerStyle } // Report Code

    // Header section labels (e.g., "PROYECTO:", "CLIENTE:")
    const headerLabelCols = [
      { row: 2, col: 0 },
      { row: 2, col: 2 },
      { row: 3, col: 0 },
      { row: 3, col: 2 },
      { row: 4, col: 0 },
      { row: 4, col: 2 },
      { row: 5, col: 0 },
      { row: 6, col: 0 },
      { row: 6, col: 2 },
      { row: 7, col: 0 },
      { row: 7, col: 2 },
      { row: 8, col: 0 },
      { row: 8, col: 2 },
    ]
    headerLabelCols.forEach(({ row, col }) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (ws[cellAddress]) ws[cellAddress].s = boldStyle
    })

    // "Detalle de Movimientos" title
    if (ws["A11"]) ws["A11"].s = { ...boldStyle, ...centerStyle }
    ws["!merges"].push({ s: { r: 10, c: 0 }, e: { r: 10, c: 4 } }) // Merge "Detalle de Movimientos"

    // Detail table headers (row 12, assuming 0-indexed)
    const detailHeaderRowIndex = 11 // This is the row index for detailHeaders
    detailHeaders.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: detailHeaderRowIndex, c: colIndex })
      if (ws[cellAddress]) ws[cellAddress].s = { ...boldStyle, ...centerStyle }
    })

    XLSX.utils.book_append_sheet(wb, ws, "Reporte Diario")

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "Reporte_Diario_Trabajo.xlsx"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Calcular los totales
  const totalViajes = detailRowsData.reduce((sum, row) => sum + (Number(row.viajes) || 0), 0)
  const totalM3Tolva = detailRowsData.reduce((sum, row) => sum + (Number(row.m3Tolva) || 0), 0)

  const totalTimeUsedMs = detailRowsData.reduce((totalMs, row) => {
    return (
      totalMs +
      row.timeEntries.reduce((entryTotalMs, entry) => {
        if (entry.startTime && entry.endTime) {
          const dummyDate = "2000-01-01T"
          const start = new Date(dummyDate + entry.startTime + ":00")
          let end = new Date(dummyDate + entry.endTime + ":00")

          if (end.getTime() < start.getTime()) {
            end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
          }
          return entryTotalMs + (end.getTime() - start.getTime())
        }
        return entryTotalMs
      }, 0)
    )
  }, 0)

  const formattedTotalTimeUsed = formatDuration(totalTimeUsedMs)

  // Validar si el formulario está completo para habilitar el botón de guardar
  const isFormValid = () => {
    // Validar campos requeridos del header
    const requiredHeaderFields = [
      headerData.proyecto,
      headerData.fecha,
      selectedPersonalIds.id_responsable,
      selectedPersonalIds.id_operador,
      headerData.maquinariaPesada
    ]
    
    const headerValid = requiredHeaderFields.every(field => field && field !== "")
    
    // Validar que hay al menos un detalle completo
    const hasCompleteDetail = detailRowsData.some(row => {
      const hasBasicData = row.placa && 
                          row.conductor && 
                          Number(row.viajes) > 0 && 
                          Number(row.m3Tolva) > 0
      
      const hasFirstTimeEntry = row.timeEntries[0]?.startTime && 
                               row.timeEntries[0]?.endTime
      
      return hasBasicData && hasFirstTimeEntry
    })
    
    return headerValid && hasCompleteDetail
  }

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
                <h1 className="text-xl font-bold text-blue-700">Maquinarias Ayala</h1>
                <p className="text-sm text-slate-600">Sistema de Reportes</p>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <Badge variant="outline" className="px-3 py-2 border-slate-300 text-slate-600 text-sm font-bold">
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
              <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">Código de Reporte</span>
              <Badge className="text-sm px-3 py-1 bg-blue-600 text-white font-mono">{reportCode}</Badge>
            </div>
          </div>

          <div className="pb-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-700">REGISTRO DE VIAJES DE ELIMINACION</h2>
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
                <Truck className="h-5 w-5" />
              </div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Total Viajes</p>
              <p className="text-2xl font-bold mt-1">{totalViajes}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Total M3-Tolva</p>
              <p className="text-2xl font-bold mt-1">{totalM3Tolva}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Tiempo Total</p>
              <p className="text-lg font-bold mt-1">{formattedTotalTimeUsed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pestañas para Datos Generales y Detalle de Movimientos */}
        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 p-1 rounded-lg shadow-sm mb-6 flex-shrink-0">
            <TabsTrigger
              value="general"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <Users className="h-5 w-5 mr-2" />
              Datos Generales del Proyecto
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="text-base font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 rounded-md transition-all duration-200"
            >
              <Clock className="h-5 w-5 mr-2" />
              Detalle de Movimientos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="flex-1">
            {/* Datos Generales del Proyecto */}
            <Card className="mb-6 shadow-lg border-0">
              <CardHeader className="bg-blue-800 border-b py-4">
                <CardTitle className="flex items-center gap-3 text-lg text-white font-bold">
                  <Users className="h-5 w-5 text-white" />
                  Información del Proyecto y Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Columna 1: Información del Proyecto */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PROYECTO
                      </label>
                      <ProyectoSelect
                        value={headerData.proyecto}
                        onValueChange={(value) => handleHeaderInputChange("proyecto", value)}
                        onProyectoChange={setSelectedProyecto}
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
                        value={selectedProyecto?.cliente || headerData.cliente}
                        onChange={(e) => handleHeaderInputChange("cliente", e.target.value)}
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
                        value={selectedProyecto?.ubicacion || headerData.ubicacion}
                        onChange={(e) => handleHeaderInputChange("ubicacion", e.target.value)}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                        placeholder="Ubicación del Proyecto"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        ETAPA
                      </label>
                      <EtapaSelect
                        value={headerData.etapa}
                        onValueChange={(value) => handleHeaderInputChange("etapa", value)}
                        etapas={selectedProyecto?.etapas || []}
                        placeholder="Seleccionar etapa..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={!selectedProyecto}
                      />
                    </div>
                  </div>

                  {/* Columna 2: Información General */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        FECHA
                      </label>
                      <Input
                        type="date"
                        value={headerData.fecha}
                        onChange={(e) => handleHeaderInputChange("fecha", e.target.value)}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        NOMBRE RESPONSABLE
                      </label>
                      <PersonalSelect
                        value={headerData.nombre}
                        onValueChange={(value) => handleHeaderInputChange("nombre", value)}
                        onPersonSelected={(person) => 
                          setSelectedPersonalIds(prev => ({ ...prev, id_responsable: person?.id_personal || undefined }))
                        }
                        placeholder="Seleccionar responsable..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        MAQUINARIA PESADA
                      </label>
                      <MaquinariaSelect
                        value={headerData.maquinariaPesada}
                        onValueChange={(value) => handleHeaderInputChange("maquinariaPesada", value)}
                        placeholder="Seleccionar maquinaria..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        OPERADOR
                      </label>
                      <PersonalSelect
                        value={headerData.operador}
                        onValueChange={(value) => handleHeaderInputChange("operador", value)}
                        onPersonSelected={(person) => 
                          setSelectedPersonalIds(prev => ({ ...prev, id_operador: person?.id_personal || undefined }))
                        }
                        placeholder="Seleccionar operador..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Columna 3: Personal del Proyecto */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        VIGÍA
                      </label>
                      <PersonalSelect
                        value={headerData.vigia}
                        onValueChange={(value) => handleHeaderInputChange("vigia", value)}
                        onPersonSelected={(person) => 
                          setSelectedPersonalIds(prev => ({ ...prev, id_vigia: person?.id_personal || undefined }))
                        }
                        placeholder="Seleccionar vigía..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        MANTERO
                      </label>
                      <PersonalSelect
                        value={headerData.mantero}
                        onValueChange={(value) => handleHeaderInputChange("mantero", value)}
                        onPersonSelected={(person) => 
                          setSelectedPersonalIds(prev => ({ ...prev, id_mantero: person?.id_personal || undefined }))
                        }
                        placeholder="Seleccionar mantero..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        CONTROLADOR
                      </label>
                      <PersonalSelect
                        value={headerData.controlador}
                        onValueChange={(value) => handleHeaderInputChange("controlador", value)}
                        onPersonSelected={(person) => 
                          setSelectedPersonalIds(prev => ({ ...prev, id_controlador: person?.id_personal || undefined }))
                        }
                        placeholder="Seleccionar controlador..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        CAPATAZ
                      </label>
                      <PersonalSelect
                        value={headerData.capataz}
                        onValueChange={(value) => handleHeaderInputChange("capataz", value)}
                        onPersonSelected={(person) => 
                          setSelectedPersonalIds(prev => ({ ...prev, id_capataz: person?.id_personal || undefined }))
                        }
                        placeholder="Seleccionar capataz..."
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Comentarios - Span completo */}
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      COMENTARIOS
                    </label>
                    <Textarea
                      value={headerData.comentarios}
                      onChange={(e) => handleHeaderInputChange("comentarios", e.target.value)}
                      className="min-h-[80px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      placeholder="Añade comentarios adicionales aquí..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="flex-1 flex flex-col">
            {/* Detalle de Movimientos */}
            <Card className="shadow-lg border-0 flex-1 flex flex-col">
              <CardHeader className="bg-blue-800 border-b py-4 flex-shrink-0">
                <CardTitle className="flex items-center gap-3 text-lg text-white font-bold">
                  <Clock className="h-5 w-5 text-white" />
                  Registro de Tiempos y Viajes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="flex border-b border-slate-200 h-full">
                  {/* Columnas Fijas */}
                  <div className="flex-shrink-0 bg-white border-r-2 border-slate-300 shadow-sm z-10">
                    <table className="table-fixed">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                            ITEM
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200 text-center w-auto">
                            PLACA
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200 text-center w-60">
                            CONDUCTOR
                          </th>
                          <th className="w-24 px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200 text-center">
                            VIAJES
                          </th>
                          <th className="w-28 px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider text-center">
                            M3-TOLVA
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {detailRowsData.map((rowData, rowIndex) => (
                          <tr key={rowData.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="w-16 px-4 py-3 text-sm text-slate-900 border-r border-slate-200 text-center font-bold font-sans">
                              {rowData.id}
                            </td>
                            <td className="w-32 px-4 py-3 border-r border-slate-200">
                              <Input
                                type="text"
                                value={rowData.placa}
                                onChange={(e) => handleDetailInputChange(rowIndex, "placa", e.target.value)}
                                className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 text-center"
                                placeholder="ABC-123"
                              />
                            </td>
                            <td className="w-40 px-4 py-3 border-r border-slate-200">
                              <Input
                                type="text"
                                value={rowData.conductor}
                                onChange={(e) => handleDetailInputChange(rowIndex, "conductor", e.target.value)}
                                className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 text-center"
                                placeholder="Nombre"
                              />
                            </td>
                            <td className="w-24 px-4 py-3 border-r border-slate-200">
                              <Input
                                type="number"
                                value={rowData.viajes}
                                onChange={(e) => handleDetailInputChange(rowIndex, "viajes", e.target.value)}
                                className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </td>
                            <td className="w-28 px-4 py-3">
                              <Input
                                type="number"
                                value={rowData.m3Tolva}
                                onChange={(e) => handleDetailInputChange(rowIndex, "m3Tolva", e.target.value)}
                                className="h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Columnas con Scroll Horizontal */}
                  <div className="flex-1 overflow-x-auto">
                    <table className="table-fixed min-w-max">
                      <thead className="bg-slate-50">
                        <tr>
                          {Array.from({ length: 8 }).map((_, i) => (
                            <React.Fragment key={`header-${i}`}>
                              <th
                                className="w-32 px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200"
                              >
                                INICIO {i + 1}
                              </th>
                              <th
                                className="w-32 px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200"
                              >
                                SALIDA {i + 1}
                              </th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {detailRowsData.map((rowData, rowIndex) => (
                          <tr key={`time-${rowData.id}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            {rowData.timeEntries.map((entry, entryIndex) => (
                              <React.Fragment key={`time-${rowIndex}-${entryIndex}`}>
                                <td className="w-32 px-3 py-3 border-r border-slate-200">
                                  <Input
                                    type="time"
                                    value={entry.startTime}
                                    onChange={(e) =>
                                      handleTimeChange(rowIndex, entryIndex, "startTime", e.target.value)
                                    }
                                    className={`h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 ${
                                      entry.startTime ? "bg-green-50" : ""
                                    }`}
                                  />
                                </td>
                                <td className="w-32 px-3 py-3 border-r border-slate-200">
                                  <Input
                                    type="time"
                                    value={entry.endTime}
                                    onChange={(e) => handleTimeChange(rowIndex, entryIndex, "endTime", e.target.value)}
                                    className={`h-9 text-sm border-0 bg-transparent focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 ${
                                      entry.endTime ? "bg-red-50" : ""
                                    }`}
                                  />
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
          <Button onClick={handleDelete} variant="destructive" className="shadow-lg px-6 h-10">
            Eliminar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white shadow-lg px-6 h-10"
          >
            Grabar Reporte
          </Button>
        </div>
      </div>
    </div>
  )
}