"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Upload, Trash2, Save } from "lucide-react";
import { programacionApi, type ProgramacionData } from "@/lib/connections";

export default function ProgramacionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ProgramacionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
                estado_programacion: String(row[7] || ""),
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
                estado_programacion: String(row[7] || ""),
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
                  Importar datos desde Excel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-6">
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
                      <TableHead>Proyectos</TableHead>
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
                          <div className={item.proyectos.length > 30 ? "whitespace-normal break-words" : "whitespace-nowrap"}>
                            {item.proyectos}
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
      </div>
    </div>
  );
}
