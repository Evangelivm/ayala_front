"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  FileText,
  ExternalLink,
  Folder,
  GitBranch,
  Search,
  Calendar as CalendarIcon,
  Truck,
  MapPin,
  Download,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import {
  programacionApi,
  type ProgramacionTecnicaData,
} from "@/lib/connections";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";

export default function ProgramacionAdminPage() {
  const router = useRouter();
  const [data, setData] = useState<ProgramacionTecnicaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [identificadoresConGuia, setIdentificadoresConGuia] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tecnicaData, idsConGuia] = await Promise.all([
        programacionApi.getAllTecnica(),
        programacionApi.getIdentificadoresConGuia(),
      ]);

      const idsVistos = new Set();
      const dataSinDuplicados = tecnicaData
        .filter((item) => {
          if (idsVistos.has(item.id)) {
            return false;
          }
          idsVistos.add(item.id);
          return true;
        })
        .sort((a, b) => b.id - a.id);

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

  // Polling cada 10 segundos para verificar registros recién completados
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const recienCompletados = await programacionApi.getRecienCompletados(30);

        if (recienCompletados.length > 0) {
          setData((prevData) => {
            const newData = [...prevData];
            let updated = false;

            recienCompletados.forEach((completado) => {
              const index = newData.findIndex((item) => item.id === completado.id);
              if (index !== -1) {
                newData[index] = completado;
                updated = true;
                toast.success(`Guía completada: ${completado.identificador_unico}`);
              } else {
                newData.unshift(completado);
                updated = true;
                toast.success(`Nueva guía completada: ${completado.identificador_unico}`);
              }

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

            return updated ? newData.sort((a, b) => b.id - a.id) : prevData;
          });
        }
      } catch (error) {
        console.error("Error en polling de registros completados:", error);
      }
    }, 10000);

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
        const updatedData = result.data;

        setData((prevData) =>
          prevData.map((record) =>
            record.id === item.id
              ? {
                  ...record,
                  enlace_del_pdf: updatedData.enlace_del_pdf,
                  enlace_del_xml: updatedData.enlace_del_xml,
                  enlace_del_cdr: updatedData.enlace_del_cdr,
                  estado_gre: updatedData.estado_gre,
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

  const handleEliminarRegistro = async (item: ProgramacionTecnicaData) => {
    const label = item.identificador_unico ?? `ID ${item.id}`;
    if (
      !confirm(
        `¿Está seguro de ELIMINAR el registro "${label}"?\n\nEsta acción eliminará el registro de las tablas programacion_tecnica y programacion. No se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      toast.info(`Eliminando registro ${label}...`);
      await programacionApi.deleteTecnica(item.id);
      toast.success(`Registro "${label}" eliminado exitosamente`);
      setData((prev) => prev.filter((r) => r.id !== item.id));
    } catch (error) {
      console.error("Error eliminando registro:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar el registro"
      );
    }
  };

  const hasArchivosGenerados = (item: ProgramacionTecnicaData): boolean => {
    return !!(item.enlace_del_pdf && item.enlace_del_xml && item.enlace_del_cdr);
  };

  const hasGuiaEnProceso = (item: ProgramacionTecnicaData): boolean => {
    return !!(
      item.identificador_unico &&
      identificadoresConGuia.includes(item.identificador_unico)
    );
  };

  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.proveedor?.toLowerCase().includes(term) ||
      item.apellidos_nombres?.toLowerCase().includes(term) ||
      item.proyectos?.toLowerCase().includes(term) ||
      item.id.toString().includes(term) ||
      item.identificador_unico?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-700 to-red-500 text-white shadow-lg">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Administración de Programación
              </h1>
              <p className="text-sm text-slate-600">
                Gestión y eliminación de registros de programación técnica
              </p>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por proveedor, conductor, proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Registros de Programación Técnica</span>
              <Badge variant="secondary" className="text-sm">
                {filteredData.length}{" "}
                {filteredData.length === 1 ? "registro" : "registros"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {searchTerm
                    ? "No se encontraron registros con ese criterio"
                    : "No hay registros disponibles"}
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {filteredData.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={`item-${item.id}`}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      hasArchivosGenerados(item)
                        ? "border-l-4 border-green-500 bg-green-50/50"
                        : hasGuiaEnProceso(item)
                        ? "border-l-4 border-cyan-500 bg-cyan-50/30"
                        : "border-slate-200"
                    }`}
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-slate-50">
                      <div className="flex items-center justify-between w-full gap-4 pr-4">
                        <div className="flex items-center gap-4 flex-wrap flex-1">
                          <div className="flex flex-col items-start min-w-[80px]">
                            <span className="text-xs text-slate-500 font-medium">ID</span>
                            <span className="text-sm font-mono font-bold text-red-700">
                              #{item.id}
                            </span>
                          </div>

                          <div className="flex flex-col items-start min-w-[100px]">
                            <span className="text-xs text-slate-500 font-medium">Fecha</span>
                            <span className="text-sm font-medium">
                              {formatDatePeru(item.fecha)}
                            </span>
                          </div>

                          <div className="flex flex-col items-start min-w-[100px]">
                            <span className="text-xs text-slate-500 font-medium">Hora</span>
                            <span className="text-sm font-mono text-blue-600 font-medium">
                              {formatTimePeru(item.hora_partida)}
                            </span>
                          </div>

                          <div className="flex flex-col items-start flex-1 min-w-[200px]">
                            <span className="text-xs text-slate-500 font-medium">Proveedor</span>
                            <span className="text-sm font-medium truncate max-w-full">
                              {item.proveedor || (
                                <span className="text-slate-400 italic">-</span>
                              )}
                            </span>
                          </div>

                          <div className="flex flex-col items-start flex-1 min-w-[180px]">
                            <span className="text-xs text-slate-500 font-medium">Conductor</span>
                            <span className="text-sm font-medium truncate max-w-full">
                              {item.apellidos_nombres || (
                                <span className="text-slate-400 italic">-</span>
                              )}
                            </span>
                          </div>

                          <div className="flex flex-col items-start min-w-[120px]">
                            <span className="text-xs text-slate-500 font-medium">Estado</span>
                            <Badge
                              className={
                                item.estado_programacion === "OK"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : item.estado_programacion === "NO EJECUTADO"
                                  ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                              }
                            >
                              {item.estado_programacion || "-"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 pt-2">
                        {/* Primera Fila: Transporte + Proyecto */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {/* Información del Transporte */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              Información del Transporte
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-slate-500">Unidad</p>
                                <p className="text-sm font-semibold">{item.unidad || "-"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Proveedor</p>
                                <p className="text-sm font-semibold truncate">{item.proveedor || "-"}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs text-slate-500">Conductor</p>
                                <p className="text-sm font-semibold">{item.apellidos_nombres || "-"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Proyecto */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Proyecto
                            </h4>
                            <div className="space-y-2">
                              {item.proyectos ? (
                                <div className="flex items-center gap-2">
                                  {item.tipo_proyecto === "proyecto" ? (
                                    <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  ) : (
                                    <GitBranch className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                  )}
                                  <div>
                                    <p className="text-xs text-slate-500">
                                      {item.tipo_proyecto === "proyecto" ? "Proyecto" : "Subproyecto"}
                                    </p>
                                    <p className="text-sm font-semibold">{item.proyectos}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 italic">Sin proyecto asignado</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Segunda Fila: Detalles + Archivos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {/* Detalles de Programación */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Detalles de Programación
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-slate-500">Programación</p>
                                <Badge
                                  variant="outline"
                                  className={
                                    item.programacion === "AFIRMADO"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : item.programacion === "ELIMINACION"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }
                                >
                                  {item.programacion || "-"}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Estado</p>
                                <Badge
                                  variant="outline"
                                  className={
                                    item.estado_programacion === "OK"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : item.estado_programacion === "NO EJECUTADO"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }
                                >
                                  {item.estado_programacion || "-"}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">M3</p>
                                <p className="text-sm font-bold font-mono">{item.m3 || "-"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Cant. Viajes</p>
                                <p className="text-sm font-bold font-mono">{item.cantidad_viaje || "-"}</p>
                              </div>
                              {item.identificador_unico && (
                                <div className="col-span-2">
                                  <p className="text-xs text-slate-500">Identificador Único</p>
                                  <p className="text-xs font-mono text-slate-600 break-all">
                                    {item.identificador_unico}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Archivos */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Archivos de Guía
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {item.enlace_del_pdf ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(item.enlace_del_pdf!, "_blank")}
                                  className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  PDF
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400 px-2">Sin PDF</span>
                              )}
                              {item.enlace_del_xml ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(item.enlace_del_xml!, "_blank")}
                                  className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  XML
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400 px-2">Sin XML</span>
                              )}
                              {item.enlace_del_cdr ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(item.enlace_del_cdr!, "_blank")}
                                  className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  CDR
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400 px-2">Sin CDR</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                          <Button
                            size="sm"
                            onClick={() => handleGenerarGuia(item.id)}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEliminarRegistro(item)}
                            className="bg-white hover:bg-red-50 text-red-700 border-red-300 ml-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Registro
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
