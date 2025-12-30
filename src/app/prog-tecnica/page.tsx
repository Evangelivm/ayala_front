"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, ExternalLink, Folder, GitBranch } from "lucide-react";
import {
  programacionApi,
  type ProgramacionTecnicaData,
} from "@/lib/connections";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";

export default function ProgTecnicaPage() {
  const router = useRouter();
  const [data, setData] = useState<ProgramacionTecnicaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [identificadoresConGuia, setIdentificadoresConGuia] = useState<string[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tecnicaData, idsConGuia] = await Promise.all([
        programacionApi.getAllTecnica(),
        programacionApi.getIdentificadoresConGuia(),
      ]);

      // Eliminar duplicados por ID (por si acaso)
      const idsVistos = new Set();
      const dataSinDuplicados = tecnicaData.filter((item) => {
        if (idsVistos.has(item.id)) {
          console.warn(`Duplicado encontrado en datos iniciales: ID ${item.id}`);
          return false;
        }
        idsVistos.add(item.id);
        return true;
      });

      setData(dataSinDuplicados);
      setIdentificadoresConGuia(idsConGuia);
    } catch (error) {
      toast.error("Error al cargar los datos");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔄 Polling cada 10 segundos para verificar registros recién completados
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        // Obtener registros completados en los últimos 30 segundos
        const recienCompletados = await programacionApi.getRecienCompletados(30);

        if (recienCompletados.length > 0) {
          console.log(`✅ Encontrados ${recienCompletados.length} registros recién completados`);

          // Actualizar los registros en la tabla
          setData((prevData) => {
            const newData = [...prevData];
            let updated = false;

            recienCompletados.forEach((completado) => {
              const index = newData.findIndex((item) => item.id === completado.id);
              if (index !== -1) {
                // Actualizar registro existente
                newData[index] = completado;
                updated = true;
                console.log(`🔄 Registro ${completado.id} actualizado con archivos completos`);

                // Mostrar notificación
                toast.success(`Guía completada: ${completado.identificador_unico}`);
              } else {
                // Agregar nuevo registro al inicio
                newData.unshift(completado);
                updated = true;
                console.log(`➕ Nuevo registro ${completado.id} agregado`);

                // Mostrar notificación
                toast.success(`Nueva guía completada: ${completado.identificador_unico}`);
              }

              // Actualizar lista de identificadores con guía
              if (completado.identificador_unico) {
                const identificador = completado.identificador_unico;
                setIdentificadoresConGuia((prev) => {
                  if (!prev.includes(identificador)) {
                    return [...prev, identificador];
                  }
                  return prev;
                });
              }
            });

            return updated ? newData : prevData;
          });
        }
      } catch (error) {
        console.error('Error en polling de registros completados:', error);
      }
    }, 10000); // Cada 10 segundos

    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalId);
  }, []);

  const handleGenerarGuia = (id: number) => {
    router.push(`/guia-remision?id=${id}`);
  };

  const handleRecuperarArchivos = async (item: ProgramacionTecnicaData) => {
    try {
      toast.info("Consultando archivos en SUNAT...");

      const result = await programacionApi.recuperarArchivosGuia(item.id);

      if (result.success && result.data) {
        toast.success(result.message);

        // Extraer los datos para que TypeScript los reconozca
        const updatedData = result.data;

        // Actualizar el registro en la tabla con los nuevos enlaces
        setData((prevData) =>
          prevData.map((record) =>
            record.id === item.id
              ? {
                  ...record,
                  enlace_del_pdf: updatedData.enlace_del_pdf,
                  enlace_del_xml: updatedData.enlace_del_xml,
                  enlace_del_cdr: updatedData.enlace_del_cdr,
                  estado_gre: updatedData.estado_gre
                }
              : record
          )
        );
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      console.error("Error recuperando archivos:", error);

      let errorMessage = "Error al recuperar archivos";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Mostrar mensaje de error apropiado
      if (errorMessage.includes("NO EXISTE en Nubefact")) {
        toast.error(
          `⚠️ DOCUMENTO NO EXISTE: La guía no se encuentra en Nubefact. Debe generarla nuevamente.`,
          { duration: 8000 }
        );
      } else if (errorMessage.includes("no ha sido generada")) {
        toast.warning(errorMessage, { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Función para verificar si tiene los archivos generados
  const hasArchivosGenerados = (item: ProgramacionTecnicaData): boolean => {
    return !!(
      item.enlace_del_pdf &&
      item.enlace_del_xml &&
      item.enlace_del_cdr
    );
  };

  // Función para verificar si tiene guía generada (en proceso)
  const hasGuiaEnProceso = (item: ProgramacionTecnicaData): boolean => {
    return !!(
      item.identificador_unico &&
      identificadoresConGuia.includes(item.identificador_unico)
    );
  };

  // Las funciones de formateo ahora usan dayjs con timezone de Perú
  // Ver: @/lib/date-utils.ts

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-orange-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-700">
                  Gestión de Guias de Remisión
                </h1>
                <p className="text-sm text-slate-600">
                  Listado de Guias de Remisión
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="w-full px-4 sm:px-6 pb-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {data.length > 0
                ? `${data.length} registros encontrados`
                : "Programación Técnica"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay registros disponibles
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead className="w-[100px]">Fecha</TableHead>
                      <TableHead className="min-w-[120px]">Unidad</TableHead>
                      <TableHead className="min-w-[150px]">Proveedor</TableHead>
                      <TableHead className="min-w-[180px]">
                        Apellidos y Nombres
                      </TableHead>
                      <TableHead className="min-w-[150px]">Proyectos</TableHead>
                      <TableHead className="w-[120px]">Programación</TableHead>
                      <TableHead className="w-[80px]">H.P</TableHead>
                      <TableHead className="w-[120px]">Estado</TableHead>
                      <TableHead className="w-[80px]">M3</TableHead>
                      <TableHead className="w-[100px]">Cant. Viaje</TableHead>
                      <TableHead className="w-[180px] text-center">
                        Archivos
                      </TableHead>
                      <TableHead className="w-[150px] text-center">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow
                        key={item.id}
                        className={
                          hasArchivosGenerados(item)
                            ? "bg-green-100 hover:bg-green-200 border-l-4 border-green-500"
                            : hasGuiaEnProceso(item)
                            ? "bg-cyan-100 hover:bg-cyan-200 border-l-4 border-cyan-500"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>
                          {formatDatePeru(item.fecha)}
                        </TableCell>
                        <TableCell className="min-w-24">
                          <div
                            className={
                              (item.unidad?.length || 0) > 30
                                ? "whitespace-normal break-words"
                                : "whitespace-nowrap"
                            }
                          >
                            {item.unidad || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-32">
                          <div
                            className={
                              (item.proveedor?.length || 0) > 30
                                ? "whitespace-normal break-words"
                                : "whitespace-nowrap"
                            }
                          >
                            {item.proveedor || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={
                              (item.apellidos_nombres?.length || 0) > 30
                                ? "whitespace-normal break-words"
                                : "whitespace-nowrap"
                            }
                          >
                            {item.apellidos_nombres || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={
                              (item.proyectos?.length || 0) > 30
                                ? "whitespace-normal break-words"
                                : "whitespace-nowrap"
                            }
                          >
                            {item.proyectos ? (
                              <div className="flex items-center gap-2">
                                {item.tipo_proyecto === "proyecto" ? (
                                  <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                ) : item.tipo_proyecto === "subproyecto" ? (
                                  <GitBranch className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                ) : null}
                                <span>{item.proyectos}</span>
                              </div>
                            ) : (
                              "-"
                            )}
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
                            {item.programacion || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm font-medium text-blue-700">
                            {formatTimePeru(item.hora_partida)}
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
                            {item.estado_programacion || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{item.m3 || "-"}</TableCell>
                        <TableCell>{item.cantidad_viaje || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center items-center">
                            {item.enlace_del_pdf ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(item.enlace_del_pdf!, "_blank")
                                }
                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 px-2 py-1 h-7 text-xs"
                              >
                                PDF
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                            {item.enlace_del_xml ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(item.enlace_del_xml!, "_blank")
                                }
                                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 px-2 py-1 h-7 text-xs"
                              >
                                XML
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                            {item.enlace_del_cdr ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(item.enlace_del_cdr!, "_blank")
                                }
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 px-2 py-1 h-7 text-xs"
                              >
                                CDR
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerarGuia(item.id)}
                              className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Generar Guía
                            </Button>
                            {hasGuiaEnProceso(item) && !hasArchivosGenerados(item) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecuperarArchivos(item)}
                                className="bg-white hover:bg-orange-50 text-orange-700 border-orange-300"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Recuperar Archivos
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
