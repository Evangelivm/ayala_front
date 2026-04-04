"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Filter,
  Clock,
  Truck,
  User,
} from "lucide-react";
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

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroProgramacion, setFiltroProgramacion] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

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

          setData((prevData) => {
            const newData = [...prevData];
            let updated = false;

            recienCompletados.forEach((completado) => {
              const index = newData.findIndex((item) => item.id === completado.id);
              if (index !== -1) {
                newData[index] = completado;
                updated = true;
                console.log(`🔄 Registro ${completado.id} actualizado con archivos completos`);
                toast.success(`Guía completada: ${completado.identificador_unico}`);
              } else {
                newData.unshift(completado);
                updated = true;
                console.log(`➕ Nuevo registro ${completado.id} agregado`);
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

            return updated ? newData : prevData;
          });
        }
      } catch (error) {
        console.error('Error en polling de registros completados:', error);
      }
    }, 10000); // Cada 10 segundos

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

  const hasArchivosGenerados = (item: ProgramacionTecnicaData): boolean => {
    return !!(item.enlace_del_pdf && item.enlace_del_xml && item.enlace_del_cdr);
  };

  const hasGuiaEnProceso = (item: ProgramacionTecnicaData): boolean => {
    return !!(
      item.identificador_unico &&
      identificadoresConGuia.includes(item.identificador_unico)
    );
  };

  // Las funciones de formateo ahora usan dayjs con timezone de Perú
  // Ver: @/lib/date-utils.ts

  // Valores únicos para selects de filtro
  const valoresProgramacion = useMemo(() => {
    const valores = new Set(data.map((d) => d.programacion).filter(Boolean));
    return Array.from(valores) as string[];
  }, [data]);

  const valoresEstado = useMemo(() => {
    const valores = new Set(data.map((d) => d.estado_programacion).filter(Boolean));
    return Array.from(valores) as string[];
  }, [data]);

  // Datos filtrados
  const dataFiltrada = useMemo(() => {
    return data.filter((item) => {
      const q = searchQuery.toLowerCase();
      const coincideBusqueda =
        !q ||
        (item.unidad ?? "").toLowerCase().includes(q) ||
        (item.proveedor ?? "").toLowerCase().includes(q) ||
        (item.apellidos_nombres ?? "").toLowerCase().includes(q);

      const coincideProgramacion =
        filtroProgramacion === "TODOS" || item.programacion === filtroProgramacion;

      const coincideEstado =
        filtroEstado === "TODOS" || item.estado_programacion === filtroEstado;

      return coincideBusqueda && coincideProgramacion && coincideEstado;
    });
  }, [data, searchQuery, filtroProgramacion, filtroEstado]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
        <div className="mx-auto w-full">

          {/* Título */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Gestión de Guías de Remisión
            </h1>
            <p className="text-muted-foreground">Programación Técnica</p>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Buscador */}
                <div className="md:col-span-2">
                  <Label htmlFor="search" className="text-sm font-semibold mb-2 block">
                    Buscar
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Buscar por unidad, proveedor o conductor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro Programación */}
                <div>
                  <Label htmlFor="filtro-prog" className="text-sm font-semibold mb-2 block">
                    Programación
                  </Label>
                  <Select value={filtroProgramacion} onValueChange={setFiltroProgramacion}>
                    <SelectTrigger id="filtro-prog">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas</SelectItem>
                      {valoresProgramacion.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Estado */}
                <div>
                  <Label htmlFor="filtro-estado" className="text-sm font-semibold mb-2 block">
                    Estado
                  </Label>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger id="filtro-estado">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      {valoresEstado.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Indicador de resultados */}
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>
                  Mostrando {dataFiltrada.length} de {data.length} registros
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Lista accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Registros</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 opacity-50" />
                    <p className="text-sm">No hay registros disponibles</p>
                  </div>
                </div>
              ) : dataFiltrada.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-12 w-12 opacity-50" />
                    <p className="text-sm">Sin resultados para los filtros aplicados</p>
                  </div>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {dataFiltrada.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={`item-${item.id}`}
                      className={`border rounded-lg shadow-sm ${
                        hasArchivosGenerados(item)
                          ? "bg-green-50 border-green-300"
                          : hasGuiaEnProceso(item)
                          ? "bg-cyan-50 border-cyan-300"
                          : "bg-white"
                      }`}
                    >
                      {/* Header del accordion — info clave de un vistazo */}
                      <AccordionTrigger className="hover:no-underline px-4 py-3">
                        <div className="flex items-center justify-between w-full gap-4 pr-4">
                          <div className="flex items-center gap-4 flex-wrap flex-1">

                            <div className="flex flex-col items-start min-w-[50px]">
                              <span className="text-xs text-gray-500 font-medium">ID</span>
                              <span className="text-sm font-mono font-bold text-blue-600">
                                {item.id}
                              </span>
                            </div>

                            <div className="flex flex-col items-start min-w-[90px]">
                              <span className="text-xs text-gray-500 font-medium">Fecha</span>
                              <span className="text-sm font-medium">
                                {formatDatePeru(item.fecha)}
                              </span>
                            </div>

                            <div className="flex flex-col items-start min-w-[130px]">
                              <span className="text-xs text-gray-500 font-medium">Unidad</span>
                              <span className="text-sm font-medium truncate max-w-[160px]">
                                {item.unidad || <span className="text-gray-400 italic">—</span>}
                              </span>
                            </div>

                            <div className="flex flex-col items-start flex-1 min-w-[150px]">
                              <span className="text-xs text-gray-500 font-medium">Proveedor</span>
                              <span className="text-sm font-medium truncate max-w-full">
                                {item.proveedor || <span className="text-gray-400 italic">—</span>}
                              </span>
                            </div>

                            <div className="flex flex-col items-start min-w-[90px]">
                              <span className="text-xs text-gray-500 font-medium">Estado</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  item.estado_programacion === "OK"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : item.estado_programacion === "NO EJECUTADO"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {item.estado_programacion || "—"}
                              </span>
                            </div>

                            {/* Badge de guía */}
                            {hasArchivosGenerados(item) && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                                Guía completa
                              </span>
                            )}
                            {hasGuiaEnProceso(item) && !hasArchivosGenerados(item) && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-200 text-cyan-800">
                                En proceso
                              </span>
                            )}
                            {item.numero_orden && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800 flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                Viaje activo
                              </span>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>

                      {/* Detalle expandido */}
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                            {/* Conductor y Proyecto */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                Conductor / Proyecto
                              </h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs text-gray-500 block">Apellidos y Nombres</span>
                                  <span className="text-sm font-medium">
                                    {item.apellidos_nombres || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">Proyecto</span>
                                  <div className="flex items-center gap-1 text-sm font-medium">
                                    {item.tipo_proyecto === "proyecto" ? (
                                      <Folder className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                    ) : item.tipo_proyecto === "subproyecto" ? (
                                      <GitBranch className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                                    ) : null}
                                    <span>{item.proyectos || "—"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Datos del viaje */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Truck className="h-3.5 w-3.5" />
                                Datos del Viaje
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs text-gray-500 block">Programación</span>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      item.programacion === "AFIRMADO"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : item.programacion === "ELIMINACION"
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : "bg-slate-50 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {item.programacion || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block flex items-center gap-1">
                                    <Clock className="h-3 w-3 inline" /> H. Partida
                                  </span>
                                  <span className="text-sm font-mono font-medium text-blue-700">
                                    {formatTimePeru(item.hora_partida)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">M3</span>
                                  <span className="text-sm font-medium">{item.m3 || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">Cant. Viaje</span>
                                  <span className="text-sm font-medium">{item.cantidad_viaje || "—"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Archivos GRE */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                Archivos GRE
                              </h4>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {item.enlace_del_pdf ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(item.enlace_del_pdf!, "_blank")}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 h-7 text-xs px-2"
                                  >
                                    PDF
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">Sin PDF</span>
                                )}
                                {item.enlace_del_xml ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(item.enlace_del_xml!, "_blank")}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 h-7 text-xs px-2"
                                  >
                                    XML
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">Sin XML</span>
                                )}
                                {item.enlace_del_cdr ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(item.enlace_del_cdr!, "_blank")}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 h-7 text-xs px-2"
                                  >
                                    CDR
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">Sin CDR</span>
                                )}
                              </div>

                              {/* Acciones */}
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerarGuia(item.id)}
                                  className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300 h-7 text-xs"
                                >
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  Generar Guía
                                </Button>
                                {hasGuiaEnProceso(item) && !hasArchivosGenerados(item) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRecuperarArchivos(item)}
                                    className="bg-white hover:bg-orange-50 text-orange-700 border-orange-300 h-7 text-xs"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    Recuperar Archivos
                                  </Button>
                                )}
                              </div>
                            </div>
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
    </div>
  );
}
