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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  FileText,
  Copy,
  Send,
  Trash2,
  Folder,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react";
import {
  programacionApi,
  type ProgramacionTecnicaData,
} from "@/lib/connections";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";

interface DuplicadoConModificaciones extends ProgramacionTecnicaData {
  _isModified?: boolean;
}

interface DuplicadosPorGuia {
  [idGuiaOriginal: number]: {
    duplicados: DuplicadoConModificaciones[];
    loteId: string;
  };
}

export default function ProgramacionExtendidaPage() {
  const router = useRouter();
  const [dataOriginales, setDataOriginales] = useState<ProgramacionTecnicaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de duplicación
  const [isDuplicarModalOpen, setIsDuplicarModalOpen] = useState(false);
  const [guiaSeleccionada, setGuiaSeleccionada] = useState<ProgramacionTecnicaData | null>(null);
  const [cantidadDuplicados, setCantidadDuplicados] = useState(1);
  const [isDuplicando, setIsDuplicando] = useState(false);

  // Duplicados organizados por guía original
  const [duplicadosPorGuia, setDuplicadosPorGuia] = useState<DuplicadosPorGuia>({});

  // Filas expandidas
  const [filasExpandidas, setFilasExpandidas] = useState<Set<number>>(new Set());

  // Envío a Kafka
  const [isEnviando, setIsEnviando] = useState(false);
  const [progresoEnvio, setProgresoEnvio] = useState(0);

  const fetchDataOriginales = async () => {
    setIsLoading(true);
    try {
      const originales = await programacionApi.getAllOriginales();
      setDataOriginales(originales);
    } catch (error) {
      toast.error("Error al cargar los datos originales");
      console.error("Error fetching originales:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataOriginales();
  }, []);

  const handleAbrirModalDuplicar = (guia: ProgramacionTecnicaData) => {
    // Validar que no tenga archivos generados
    if (guia.enlace_del_pdf || guia.enlace_del_xml || guia.enlace_del_cdr) {
      toast.error("No se puede duplicar una guía que ya tiene archivos generados");
      return;
    }

    setGuiaSeleccionada(guia);
    setCantidadDuplicados(1);
    setIsDuplicarModalOpen(true);
  };

  const handleDuplicarGuia = async () => {
    if (!guiaSeleccionada) return;

    if (cantidadDuplicados < 1 || cantidadDuplicados > 50) {
      toast.error("La cantidad de duplicados debe estar entre 1 y 50");
      return;
    }

    setIsDuplicando(true);
    try {
      const result = await programacionApi.duplicarGuia(
        guiaSeleccionada.id,
        cantidadDuplicados
      );

      if (result.success) {
        // Agregar duplicados al mapa organizados por guía original
        setDuplicadosPorGuia(prev => ({
          ...prev,
          [guiaSeleccionada.id]: {
            duplicados: result.duplicados,
            loteId: result.loteId
          }
        }));

        // Expandir automáticamente la fila
        setFilasExpandidas(prev => new Set(prev).add(guiaSeleccionada.id));

        toast.success(result.message);
        setIsDuplicarModalOpen(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al duplicar la guía";
      toast.error(errorMessage);
      console.error("Error duplicando guía:", error);
    } finally {
      setIsDuplicando(false);
    }
  };

  const toggleFilaExpandida = (idGuia: number) => {
    setFilasExpandidas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idGuia)) {
        newSet.delete(idGuia);
      } else {
        newSet.add(idGuia);
      }
      return newSet;
    });
  };

  const handleEliminarDuplicado = (idGuiaOriginal: number, index: number) => {
    setDuplicadosPorGuia(prev => {
      const guiaDuplicados = prev[idGuiaOriginal];
      if (!guiaDuplicados) return prev;

      const nuevosDuplicados = guiaDuplicados.duplicados.filter((_, i) => i !== index);

      if (nuevosDuplicados.length === 0) {
        // Eliminar completamente la entrada si no quedan duplicados
        const { [idGuiaOriginal]: removed, ...rest } = prev;
        setFilasExpandidas(prevExpanded => {
          const newSet = new Set(prevExpanded);
          newSet.delete(idGuiaOriginal);
          return newSet;
        });
        return rest;
      }

      return {
        ...prev,
        [idGuiaOriginal]: {
          ...guiaDuplicados,
          duplicados: nuevosDuplicados
        }
      };
    });

    toast.info("Duplicado eliminado");
  };

  const handleModificarDuplicado = (
    idGuiaOriginal: number,
    index: number,
    campo: string,
    valor: string
  ) => {
    setDuplicadosPorGuia(prev => {
      const guiaDuplicados = prev[idGuiaOriginal];
      if (!guiaDuplicados) return prev;

      const nuevosDuplicados = [...guiaDuplicados.duplicados];
      nuevosDuplicados[index] = {
        ...nuevosDuplicados[index],
        [campo]: valor,
        _isModified: true
      };

      return {
        ...prev,
        [idGuiaOriginal]: {
          ...guiaDuplicados,
          duplicados: nuevosDuplicados
        }
      };
    });
  };

  const handleEnviarDuplicadosDeGuia = async (idGuiaOriginal: number) => {
    const guiaDuplicados = duplicadosPorGuia[idGuiaOriginal];
    if (!guiaDuplicados || guiaDuplicados.duplicados.length === 0) {
      toast.error("No hay duplicados para enviar");
      return;
    }

    if (!confirm(`¿Está seguro de enviar ${guiaDuplicados.duplicados.length} duplicados a Kafka?`)) {
      return;
    }

    setIsEnviando(true);
    setProgresoEnvio(0);

    try {
      const idsGuias = guiaDuplicados.duplicados.map(d => d.id);
      const tamañoLote = 5;
      let procesados = 0;
      const errores: Array<{ id: number; error: string }> = [];

      // Procesar en lotes de 5
      for (let i = 0; i < idsGuias.length; i += tamañoLote) {
        const loteParcial = idsGuias.slice(i, i + tamañoLote);

        try {
          const result = await programacionApi.enviarDuplicadosKafka(
            guiaDuplicados.loteId,
            loteParcial
          );
          procesados += result.procesados;

          if (result.errores && result.errores.length > 0) {
            errores.push(...result.errores);
          }
        } catch (error) {
          console.error(`Error enviando lote ${i / tamañoLote + 1}:`, error);
          loteParcial.forEach(id => {
            errores.push({
              id,
              error: error instanceof Error ? error.message : "Error desconocido"
            });
          });
        }

        // Actualizar progreso
        const progreso = Math.round(((i + tamañoLote) / idsGuias.length) * 100);
        setProgresoEnvio(Math.min(progreso, 100));

        // Pausa de 500ms entre lotes
        if (i + tamañoLote < idsGuias.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Mostrar resultado
      if (errores.length === 0) {
        toast.success(`Todos los duplicados (${procesados}) fueron enviados exitosamente`);
      } else {
        toast.warning(`Se procesaron ${procesados} de ${idsGuias.length}. ${errores.length} tuvieron errores.`);
      }

      // Eliminar del estado
      setDuplicadosPorGuia(prev => {
        const { [idGuiaOriginal]: removed, ...rest } = prev;
        return rest;
      });

      setFilasExpandidas(prev => {
        const newSet = new Set(prev);
        newSet.delete(idGuiaOriginal);
        return newSet;
      });

      setProgresoEnvio(0);

      // Recargar datos
      await fetchDataOriginales();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al enviar duplicados";
      toast.error(errorMessage);
      console.error("Error enviando a Kafka:", error);
    } finally {
      setIsEnviando(false);
    }
  };

  const handleCancelarDuplicacion = async (idGuiaOriginal: number) => {
    const guiaDuplicados = duplicadosPorGuia[idGuiaOriginal];
    if (!guiaDuplicados) return;

    if (!confirm("¿Está seguro de cancelar? Se eliminarán todos los duplicados creados.")) {
      return;
    }

    try {
      await programacionApi.eliminarDuplicados(guiaDuplicados.loteId);

      setDuplicadosPorGuia(prev => {
        const { [idGuiaOriginal]: removed, ...rest } = prev;
        return rest;
      });

      setFilasExpandidas(prev => {
        const newSet = new Set(prev);
        newSet.delete(idGuiaOriginal);
        return newSet;
      });

      toast.info("Duplicados cancelados y eliminados");
    } catch (error) {
      toast.error("Error al cancelar duplicados");
      console.error("Error cancelando:", error);
    }
  };

  const getTotalDuplicados = () => {
    return Object.values(duplicadosPorGuia).reduce(
      (total, { duplicados }) => total + duplicados.length,
      0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Copy className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-purple-700">
                  Programación Extendida - Duplicación Masiva
                </h1>
                <p className="text-sm text-slate-600">
                  Procesamiento masivo de guías de remisión
                </p>
              </div>
            </div>
            {getTotalDuplicados() > 0 && (
              <div className="bg-purple-100 px-4 py-2 rounded-lg border border-purple-300">
                <span className="text-purple-700 font-semibold">
                  {getTotalDuplicados()} duplicados pendientes
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="w-full px-4 sm:px-6 pb-8 space-y-6">
        {/* Card de guías originales */}
        <Card>
          <CardHeader>
            <CardTitle>
              {dataOriginales.length > 0
                ? `${dataOriginales.length} guías originales disponibles`
                : "Guías Originales"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : dataOriginales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay guías originales disponibles para duplicar
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead className="w-[100px]">Fecha</TableHead>
                      <TableHead className="min-w-[120px]">Unidad</TableHead>
                      <TableHead className="min-w-[150px]">Proveedor</TableHead>
                      <TableHead className="min-w-[180px]">Apellidos y Nombres</TableHead>
                      <TableHead className="min-w-[150px]">Proyectos</TableHead>
                      <TableHead className="w-[120px]">Programación</TableHead>
                      <TableHead className="w-[80px]">H.P</TableHead>
                      <TableHead className="w-[80px]">M3</TableHead>
                      <TableHead className="w-[100px]">Cant. Viaje</TableHead>
                      <TableHead className="w-[150px] text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataOriginales.map((item) => {
                      const tieneDuplicados = !!duplicadosPorGuia[item.id];
                      const estaExpandida = filasExpandidas.has(item.id);
                      const duplicados = duplicadosPorGuia[item.id]?.duplicados || [];

                      return (
                        <>
                          {/* Fila principal */}
                          <TableRow
                            key={item.id}
                            className={tieneDuplicados ? "bg-purple-50 border-l-4 border-purple-500" : ""}
                          >
                            <TableCell>
                              {tieneDuplicados && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleFilaExpandida(item.id)}
                                >
                                  {estaExpandida ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{formatDatePeru(item.fecha)}</TableCell>
                            <TableCell className="min-w-24">
                              <div className={
                                (item.unidad?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
                                {item.unidad || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-32">
                              <div className={
                                (item.proveedor?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
                                {item.proveedor || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={
                                (item.apellidos_nombres?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
                                {item.apellidos_nombres || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={
                                (item.proyectos?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
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
                              <span className={
                                item.programacion === "AFIRMADO"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                                  : item.programacion === "ELIMINACION"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
                                  : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
                              }>
                                {item.programacion || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm font-medium text-blue-700">
                                {formatTimePeru(item.hora_partida)}
                              </span>
                            </TableCell>
                            <TableCell>{item.m3 || "-"}</TableCell>
                            <TableCell>{item.cantidad_viaje || "-"}</TableCell>
                            <TableCell className="text-center">
                              {tieneDuplicados ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                                  {duplicados.length} duplicado{duplicados.length !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleAbrirModalDuplicar(item)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                  disabled={!!(item.enlace_del_pdf || item.enlace_del_xml || item.enlace_del_cdr)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Filas de duplicados (expandibles) */}
                          {tieneDuplicados && estaExpandida && (
                            <TableRow>
                              <TableCell colSpan={12} className="bg-purple-50/50 p-0">
                                <div className="p-4 space-y-3">
                                  {/* Controles de envío */}
                                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-2">
                                      <GitBranch className="h-5 w-5 text-purple-600" />
                                      <span className="font-semibold text-purple-700">
                                        {duplicados.length} duplicado{duplicados.length !== 1 ? 's' : ''} creado{duplicados.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleCancelarDuplicacion(item.id)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                        disabled={isEnviando}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Cancelar
                                      </Button>
                                      <Button
                                        onClick={() => handleEnviarDuplicadosDeGuia(item.id)}
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        disabled={isEnviando}
                                      >
                                        {isEnviando ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Enviando...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar a Kafka
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Barra de progreso */}
                                  {isEnviando && (
                                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                                      <Label className="text-sm font-semibold mb-2 block">
                                        Progreso: {progresoEnvio}%
                                      </Label>
                                      <Progress value={progresoEnvio} className="h-2" />
                                    </div>
                                  )}

                                  {/* Lista de duplicados */}
                                  <div className="space-y-2">
                                    {duplicados.map((duplicado, index) => (
                                      <div
                                        key={index}
                                        className="bg-white p-3 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="flex-shrink-0">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                                              {index + 1}
                                            </span>
                                          </div>
                                          <div className="flex-1 grid grid-cols-4 gap-3">
                                            <div>
                                              <Label className="text-xs font-semibold text-slate-600">
                                                Hora Partida
                                              </Label>
                                              <Input
                                                type="time"
                                                value={duplicado.hora_partida || ""}
                                                onChange={(e) =>
                                                  handleModificarDuplicado(item.id, index, "hora_partida", e.target.value)
                                                }
                                                className="h-8 text-xs mt-1"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs font-semibold text-slate-600">
                                                Cantidad Viaje
                                              </Label>
                                              <Input
                                                type="text"
                                                value={duplicado.cantidad_viaje || ""}
                                                onChange={(e) =>
                                                  handleModificarDuplicado(item.id, index, "cantidad_viaje", e.target.value)
                                                }
                                                className="h-8 text-xs mt-1"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs font-semibold text-slate-600">
                                                M3
                                              </Label>
                                              <Input
                                                type="text"
                                                value={duplicado.m3 || ""}
                                                onChange={(e) =>
                                                  handleModificarDuplicado(item.id, index, "m3", e.target.value)
                                                }
                                                className="h-8 text-xs mt-1"
                                              />
                                            </div>
                                            <div className="flex items-end">
                                              <Button
                                                onClick={() => handleEliminarDuplicado(item.id, index)}
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8 border-red-300 text-red-700 hover:bg-red-50"
                                              >
                                                <X className="h-3 w-3 mr-1" />
                                                Eliminar
                                              </Button>
                                            </div>
                                          </div>
                                          {duplicado._isModified && (
                                            <div className="flex-shrink-0">
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-300">
                                                Modificado
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Duplicación */}
      <Dialog open={isDuplicarModalOpen} onOpenChange={setIsDuplicarModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicar Guía #{guiaSeleccionada?.id}</DialogTitle>
            <DialogDescription>
              Ingrese la cantidad de duplicados a crear (máximo 50)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Unidad:</strong> {guiaSeleccionada?.unidad || "N/A"}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Proveedor:</strong> {guiaSeleccionada?.proveedor || "N/A"}
              </p>
            </div>

            <div>
              <Label htmlFor="cantidad">Cantidad de duplicados</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                max="50"
                value={cantidadDuplicados}
                onChange={(e) => setCantidadDuplicados(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 1, máximo 50 duplicados
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDuplicarModalOpen(false)}
                disabled={isDuplicando}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDuplicarGuia}
                disabled={isDuplicando}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isDuplicando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Duplicando...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
