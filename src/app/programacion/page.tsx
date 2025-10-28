"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Trash2, Save, Plus, X, MapPin } from "lucide-react";
import { programacionApi, type ProgramacionData, camionesApi, type CamionData, empresasApi, type EmpresaData } from "@/lib/connections";
import { RutaDialog } from "@/components/ruta-dialog";
import { ubigeosLima } from "@/lib/ubigeos-lima";
import {
  getManualRows,
  saveManualRows,
  updateManualRow as updateManualRowDB,
  deleteManualRow as deleteManualRowDB,
  clearManualRows as clearManualRowsDB,
  migrateFromLocalStorage,
  type ManualRow,
} from "@/lib/indexeddb";

// Opciones para los selects
const PROGRAMACIONES = ["AFIRMADO", "ELIMINACION", "SUB BASE", "5 INTERNOS"];
const ESTADOS = ["OK", "NO EJECUTADO"];

export default function ProgramacionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ProgramacionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para entrada manual
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);

  // Estado para camiones
  const [camiones, setCamiones] = useState<CamionData[]>([]);

  // Estado para empresas (proveedores)
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);

  // Cargar datos de IndexedDB al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Intentar migrar datos de localStorage si existen
        const migratedCount = await migrateFromLocalStorage("programacion_manual_data");
        if (migratedCount > 0) {
          toast.info(`Se migraron ${migratedCount} registros de localStorage a IndexedDB`);
        }

        // Cargar datos de IndexedDB
        const rows = await getManualRows();
        if (rows.length > 0) {
          setManualRows(rows);
          toast.info(`Se recuperaron ${rows.length} registros guardados`);
        }
      } catch (error) {
        console.error("Error al cargar datos de IndexedDB:", error);
        toast.error("Error al cargar datos guardados");
      }
    };

    loadData();
  }, []);

  // Cargar camiones al montar el componente
  useEffect(() => {
    const loadCamiones = async () => {
      try {
        const camionesData = await camionesApi.getAll();
        setCamiones(camionesData);
      } catch (error) {
        console.error("Error al cargar camiones:", error);
        toast.error("Error al cargar la lista de camiones");
      }
    };

    loadCamiones();
  }, []);

  // Cargar empresas (proveedores) al montar el componente
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const empresasData = await empresasApi.getAll();
        // Filtrar solo empresas con datos completos
        const empresasCompletas = empresasData.filter(
          (e) => e.N__documento && e.Raz_n_social && e.Direcci_n
        );
        setEmpresas(empresasCompletas);
      } catch (error) {
        console.error("Error al cargar empresas:", error);
        toast.error("Error al cargar la lista de empresas");
      }
    };

    loadEmpresas();
  }, []);

  // Guardar en IndexedDB cada vez que cambien las filas manuales
  useEffect(() => {
    const saveData = async () => {
      if (manualRows.length > 0) {
        try {
          await saveManualRows(manualRows);
        } catch (error) {
          console.error("Error al guardar en IndexedDB:", error);
        }
      }
    };

    saveData();
  }, [manualRows]);

  // Funciones para entrada manual
  const addManualRow = () => {
    const newRow: ManualRow = {
      id: Date.now().toString(),
      fecha: new Date().toISOString().split("T")[0],
      unidad: "",
      proveedor: "",
      apellidos_nombres: "",
      proyectos: "",
      programacion: "",
      hora_partida: "08:00",
      estado_programacion: "",
      comentarios: "",
      punto_partida_ubigeo: "",
      punto_partida_direccion: "",
      punto_llegada_ubigeo: "",
      punto_llegada_direccion: "",
    };
    setManualRows([...manualRows, newRow]);
  };

  const removeManualRow = (id: string) => {
    setManualRows(manualRows.filter((row) => row.id !== id));
  };

  // Función helper para capitalizar texto
  const capitalizeText = (text: string) => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const updateManualRow = (id: string, field: keyof ManualRow, value: string) => {
    // Si el campo es 'unidad', buscar el camión y autocompletar apellidos_nombres
    if (field === 'unidad') {
      const camionSeleccionado = camiones.find(c => c.placa === value);
      if (camionSeleccionado && camionSeleccionado.nombre_chofer && camionSeleccionado.apellido_chofer) {
        const nombreCompleto = `${capitalizeText(camionSeleccionado.nombre_chofer)} ${capitalizeText(camionSeleccionado.apellido_chofer)}`;
        setManualRows((prevRows) =>
          prevRows.map((row) =>
            row.id === id
              ? { ...row, [field]: value, apellidos_nombres: nombreCompleto }
              : row
          )
        );
        return;
      }
    }

    setManualRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Función para actualizar múltiples campos a la vez
  const updateManualRowMultiple = (id: string, updates: Partial<ManualRow>) => {
    setManualRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  const clearManualData = async () => {
    try {
      await clearManualRowsDB();
      setManualRows([]);
      toast.success("Datos limpiados exitosamente");
    } catch (error) {
      console.error("Error al limpiar datos:", error);
      toast.error("Error al limpiar datos");
    }
  };

  // Función para verificar si una fila está completa
  const isRowComplete = (row: ManualRow) => {
    return (
      row.fecha &&
      row.unidad &&
      row.proveedor &&
      row.apellidos_nombres &&
      row.programacion &&
      row.hora_partida &&
      row.estado_programacion &&
      row.punto_partida_ubigeo &&
      row.punto_partida_direccion &&
      row.punto_llegada_ubigeo &&
      row.punto_llegada_direccion
    );
  };

  const handleSaveManualData = async () => {
    if (manualRows.length === 0) {
      toast.error("No hay datos para guardar");
      return;
    }

    // Validar que todos los campos obligatorios estén llenos
    const invalidRows = manualRows.filter((row) => !isRowComplete(row));

    if (invalidRows.length > 0) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);
    try {
      // Convertir ManualRow a ProgramacionData
      const dataToSend: ProgramacionData[] = manualRows.map((row) => ({
        fecha: new Date(row.fecha),
        unidad: row.unidad,
        proveedor: row.proveedor,
        apellidos_nombres: row.apellidos_nombres,
        proyectos: "",
        programacion: row.programacion,
        hora_partida: `${row.hora_partida}:00`,
        estado_programacion: row.estado_programacion,
        comentarios: row.comentarios,
      }));

      const result = await programacionApi.createBatch(dataToSend);

      toast.success(
        `${result.successCount} registros guardados exitosamente en ${result.processingTime}ms`
      );

      // Limpiar datos después de enviar exitosamente
      clearManualData();

      toast.success("¡Información subida exitosamente!");
    } catch (error) {
      toast.error("Error al guardar los datos");
      console.error("Error saving manual data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(xlsx|xls)$/i)
      ) {
        toast.error(
          "Por favor selecciona un archivo Excel válido (.xlsx o .xls)"
        );
        return;
      }

      // Validar tamaño del archivo (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 10MB permitido.");
        return;
      }

      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  const processExcelFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Procesar datos (saltando la primera fila de headers)
        const processedData: ProgramacionData[] = (jsonData as unknown[][])
          .slice(1)
          .filter((row: unknown[]) => row.length > 0 && row[0])
          .map((row: unknown[], index: number) => {
            try {
              // Procesar fecha - convertir a Date object
              let fechaProcessed: Date = new Date();
              if (row[0]) {
                if (typeof row[0] === "number") {
                  // Convertir fecha de Excel a Date
                  fechaProcessed = new Date((row[0] - 25569) * 86400 * 1000);
                } else {
                  // Intentar parsear string como fecha
                  const dateStr = String(row[0]);
                  const parsedDate = new Date(dateStr);
                  fechaProcessed = isNaN(parsedDate.getTime())
                    ? new Date()
                    : parsedDate;
                }
              }

              // Procesar hora_partida - convertir a formato TIME
              let horaPartidaProcessed = "00:00:00";
              if (row[6]) {
                if (typeof row[6] === "number") {
                  // Convertir decimal a tiempo (0.33333 = 8 horas)
                  const totalHours = Math.round(row[6] * 24);
                  const hours = String(totalHours).padStart(2, "0");
                  horaPartidaProcessed = `${hours}:00:00`;
                } else {
                  const timeStr = String(row[6]);
                  // Si no tiene segundos, agregarlos
                  horaPartidaProcessed = timeStr.includes(":")
                    ? timeStr.split(":").length === 2
                      ? `${timeStr}:00`
                      : timeStr
                    : `${timeStr}:00:00`;
                }
              }

              return {
                fecha: fechaProcessed,
                unidad: String(row[1] || ""),
                proveedor: String(row[2] || ""),
                apellidos_nombres: String(row[3] || ""),
                proyectos: String(row[4] || ""),
                programacion: String(row[5] || ""),
                hora_partida: horaPartidaProcessed,
                estado_programacion: String(row[7] || "").trim().toUpperCase(),
                comentarios: String(row[8] || ""),
              };
            } catch (error) {
              console.warn(`Error procesando fila ${index + 2}:`, error);
              let horaPartidaFallback = "00:00:00";
              if (row[6]) {
                if (typeof row[6] === "number") {
                  const totalHours = Math.round(row[6] * 24);
                  const hours = String(totalHours).padStart(2, "0");
                  horaPartidaFallback = `${hours}:00:00`;
                } else {
                  const timeStr = String(row[6]);
                  horaPartidaFallback = timeStr.includes(":")
                    ? timeStr.split(":").length === 2
                      ? `${timeStr}:00`
                      : timeStr
                    : `${timeStr}:00:00`;
                }
              }

              return {
                fecha: row[0] ? new Date(row[0] as string | number | Date) : new Date(),
                unidad: String(row[1] || ""),
                proveedor: String(row[2] || ""),
                apellidos_nombres: String(row[3] || ""),
                proyectos: String(row[4] || ""),
                programacion: String(row[5] || ""),
                hora_partida: horaPartidaFallback,
                estado_programacion: String(row[7] || "").trim().toUpperCase(),
                comentarios: String(row[8] || ""),
              };
            }
          });

        setData(processedData);
        toast.success(`Se procesaron ${processedData.length} registros`);
      } catch (error) {
        toast.error("Error al procesar el archivo Excel");
        console.error("Error processing Excel file:", error);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDiscard = () => {
    setFile(null);
    setData([]);
    const fileInput = document.getElementById("excel-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    toast.info("Datos descartados");
  };

  const handleSave = async () => {
    if (data.length === 0) {
      toast.error("No hay datos para guardar");
      return;
    }

    setIsLoading(true);
    try {
      // Log de la información que se enviaría al backend
      // console.log('Datos a enviar al backend:', {
      //   totalRecords: data.length,
      //   data: data,
      //   timestamp: new Date().toISOString()
      // });

      // Llamada a la API usando la función de connections.ts
      const result = await programacionApi.createBatch(data);

      toast.success(
        `${result.successCount} registros guardados exitosamente en ${result.processingTime}ms`
      );

      handleDiscard();
      
      toast.success("¡Información subida exitosamente!");
    } catch (error) {
      toast.error("Error al guardar los datos");
      console.error("Error saving data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-orange-600 text-white">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-700">
                  Programación
                </h1>
                <p className="text-sm text-slate-600">
                  Importar o ingresar datos de programación
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="mx-auto px-4 sm:px-6 pb-8 space-y-6">
        <Tabs defaultValue="excel" className="w-full">
          <div className="max-w-7xl mx-auto">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="excel">Subir Excel</TabsTrigger>
              <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
            </TabsList>
          </div>

          {/* Pestaña de Excel */}
          <TabsContent value="excel" className="space-y-6 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Subir Archivo de Programación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="excel-file">Archivo Excel</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </CardContent>
        </Card>

        {data.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>
                Vista Previa - {data.length} registros procesados
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDiscard}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Descartar
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar en BD
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-fit">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Apellidos y Nombres</TableHead>
                      <TableHead>Programación</TableHead>
                      <TableHead>H.P</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Comentario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {item.fecha.toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="min-w-24">
                          <div className={item.unidad.length > 30 ? "whitespace-normal break-words" : "whitespace-nowrap"}>
                            {item.unidad}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-32">
                          <div className={item.proveedor.length > 30 ? "whitespace-normal break-words" : "whitespace-nowrap"}>
                            {item.proveedor}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={item.apellidos_nombres.length > 30 ? "whitespace-normal break-words" : "whitespace-nowrap"}>
                            {item.apellidos_nombres}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              item.programacion === "AFIRMADO"
                                ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                                : item.programacion === "ELIMINACION"
                                ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
                                : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
                            }
                          >
                            {item.programacion
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm font-medium text-blue-700">
                            {item.hora_partida}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-32">
                          <span
                            className={
                              item.estado_programacion === "OK"
                                ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm whitespace-nowrap"
                                : item.estado_programacion === "NO EJECUTADO"
                                ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm whitespace-nowrap"
                                : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-sm whitespace-nowrap"
                            }
                          >
                            {item.estado_programacion
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-sm whitespace-normal break-words py-4">
                          <div className="py-1">{item.comentarios}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

            {isLoading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </TabsContent>

          {/* Pestaña de Entrada Manual */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>
                  <div className="flex flex-col gap-1">
                    <span>Entrada Manual de Datos</span>
                    {manualRows.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {manualRows.filter(isRowComplete).length} de {manualRows.length} filas completas
                      </span>
                    )}
                  </div>
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={addManualRow} disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Fila
                  </Button>
                  {manualRows.length > 0 && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={clearManualData}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar Todo
                      </Button>
                      <Button
                        onClick={handleSaveManualData}
                        disabled={isLoading || !manualRows.every(isRowComplete)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Guardar en BD
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {manualRows.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No hay registros. Haz clic en &quot;Agregar Fila&quot; para comenzar.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead className="w-[180px]">Fecha</TableHead>
                          <TableHead className="w-[140px]">Unidad</TableHead>
                          <TableHead className="w-[280px]">Proveedor</TableHead>
                          <TableHead className="w-[220px]">Apellidos y Nombres</TableHead>
                          <TableHead className="w-[180px]">Programación</TableHead>
                          <TableHead className="w-[140px]">H.P</TableHead>
                          <TableHead className="w-[180px]">Estado</TableHead>
                          <TableHead className="w-[240px]">Ruta (Partida - Llegada)</TableHead>
                          <TableHead className="min-w-[300px]">Comentario</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualRows.map((row) => (
                          <TableRow
                            key={row.id}
                            className={isRowComplete(row) ? "bg-green-200 hover:bg-green-300" : ""}
                          >
                            <TableCell className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeManualRow(row.id)}
                                disabled={isLoading}
                                className="h-9 w-9 p-0"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="date"
                                value={row.fecha}
                                onChange={(e) =>
                                  updateManualRow(row.id, "fecha", e.target.value)
                                }
                                disabled={isLoading}
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Select
                                value={row.unidad}
                                onValueChange={(value) =>
                                  updateManualRow(row.id, "unidad", value)
                                }
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {camiones.map((camion) => (
                                    <SelectItem key={camion.id_camion} value={camion.placa}>
                                      {camion.placa}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-2">
                              <Select
                                value={row.proveedor}
                                onValueChange={(value) =>
                                  updateManualRow(row.id, "proveedor", value)
                                }
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {empresas.map((empresa) => (
                                    <SelectItem
                                      key={empresa.C_digo}
                                      value={empresa.Raz_n_social || ""}
                                    >
                                      {`(${empresa.N__documento}) - ${empresa.Raz_n_social}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="text"
                                value={row.apellidos_nombres}
                                placeholder="Apellidos y Nombres..."
                                readOnly
                                className="bg-gray-50 cursor-not-allowed"
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Select
                                value={row.programacion}
                                onValueChange={(value) =>
                                  updateManualRow(row.id, "programacion", value)
                                }
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {PROGRAMACIONES.map((prog) => (
                                    <SelectItem key={prog} value={prog}>
                                      {prog}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="time"
                                value={row.hora_partida}
                                onChange={(e) =>
                                  updateManualRow(row.id, "hora_partida", e.target.value)
                                }
                                disabled={isLoading}
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Select
                                value={row.estado_programacion}
                                onValueChange={(value) =>
                                  updateManualRow(row.id, "estado_programacion", value)
                                }
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {ESTADOS.map((estado) => (
                                    <SelectItem key={estado} value={estado}>
                                      {estado}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-2">
                              <div className="space-y-2">
                                <RutaDialog
                                  buttonText={
                                    row.punto_partida_ubigeo && row.punto_llegada_ubigeo
                                      ? "Editar Ruta"
                                      : "Configurar Ruta"
                                  }
                                  currentPartidaUbigeo={row.punto_partida_ubigeo}
                                  currentPartidaDireccion={row.punto_partida_direccion}
                                  currentLlegadaUbigeo={row.punto_llegada_ubigeo}
                                  currentLlegadaDireccion={row.punto_llegada_direccion}
                                  onAccept={(partidaUbigeo, partidaDireccion, llegadaUbigeo, llegadaDireccion) => {
                                    updateManualRowMultiple(row.id, {
                                      punto_partida_ubigeo: partidaUbigeo,
                                      punto_partida_direccion: partidaDireccion,
                                      punto_llegada_ubigeo: llegadaUbigeo,
                                      punto_llegada_direccion: llegadaDireccion,
                                    });
                                  }}
                                />
                                {(row.punto_partida_ubigeo || row.punto_llegada_ubigeo) && (
                                  <div className="flex gap-2">
                                    {row.punto_partida_ubigeo && row.punto_partida_direccion && (
                                      <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 flex-1">
                                        <p className="font-medium text-blue-900 dark:text-blue-100">
                                          📍 Partida: {ubigeosLima.find((u) => u.codigo === row.punto_partida_ubigeo)?.distrito || row.punto_partida_ubigeo}
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300 truncate">
                                          {row.punto_partida_direccion}
                                        </p>
                                      </div>
                                    )}
                                    {row.punto_llegada_ubigeo && row.punto_llegada_direccion && (
                                      <div className="text-xs bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 flex-1">
                                        <p className="font-medium text-green-900 dark:text-green-100">
                                          🎯 Llegada: {ubigeosLima.find((u) => u.codigo === row.punto_llegada_ubigeo)?.distrito || row.punto_llegada_ubigeo}
                                        </p>
                                        <p className="text-green-700 dark:text-green-300 truncate">
                                          {row.punto_llegada_direccion}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="text"
                                value={row.comentarios}
                                onChange={(e) =>
                                  updateManualRow(row.id, "comentarios", e.target.value)
                                }
                                placeholder="Comentarios..."
                                disabled={isLoading}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {isLoading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
