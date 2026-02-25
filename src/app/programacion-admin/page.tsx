"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RotateCcw,
  ShoppingCart,
  Wrench,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  programacionApi,
  ordenesCompraApi,
  ordenesServicioApi,
  searchApi,
  type ProgramacionTecnicaData,
  type OrdenCompraData,
  type OrdenServicioData,
} from "@/lib/connections";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";

// ─── Tab: Programación Técnica ──────────────────────────────────────────────

function ProgramacionTecnicaTab() {
  const router = useRouter();
  const [data, setData] = useState<ProgramacionTecnicaData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [identificadoresConGuia, setIdentificadoresConGuia] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    programacionApi
      .getIdentificadoresConGuia()
      .then(setIdentificadoresConGuia)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true);
      searchApi
        .programacionTecnica(searchTerm, page, LIMIT)
        .then((result) => {
          const seen = new Set<number>();
          const deduped = result.data.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          setData(deduped);
          setTotal(result.total);
        })
        .catch(() => toast.error("Error al cargar los datos"))
        .finally(() => setIsLoading(false));
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  const handleGenerarGuia = (id: number) => {
    router.push(`/guia-remision?id=${id}`);
  };

  const handleRecuperarArchivos = async (item: ProgramacionTecnicaData) => {
    try {
      toast.info("Consultando archivos en SUNAT...");
      const result = await programacionApi.recuperarArchivosGuia(item.id);
      if (result.success && result.data) {
        toast.success(result.message);
        setData((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  enlace_del_pdf: result.data!.enlace_del_pdf,
                  enlace_del_xml: result.data!.enlace_del_xml,
                  enlace_del_cdr: result.data!.enlace_del_cdr,
                  estado_gre: result.data!.estado_gre,
                }
              : r
          )
        );
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al recuperar archivos";
      if (msg.includes("NO EXISTE en Nubefact")) {
        toast.error("⚠️ DOCUMENTO NO EXISTE: La guía no se encuentra en Nubefact.", { duration: 8000 });
      } else {
        toast.error(msg);
      }
    }
  };

  const handleEliminar = async (item: ProgramacionTecnicaData) => {
    const label = item.identificador_unico ?? `ID ${item.id}`;
    if (!confirm(`¿Está seguro de ELIMINAR el registro "${label}"?\n\nEl registro quedará oculto pero podrá restaurarse.`)) return;
    try {
      toast.info(`Eliminando registro ${label}...`);
      await programacionApi.deleteTecnica(item.id);
      toast.success(`Registro "${label}" marcado como eliminado`);
      setData((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, deleted_at: new Date().toISOString() } : r
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar el registro");
    }
  };

  const handleRestaurar = async (item: ProgramacionTecnicaData) => {
    const label = item.identificador_unico ?? `ID ${item.id}`;
    try {
      toast.info(`Restaurando registro ${label}...`);
      await programacionApi.restoreTecnica(item.id);
      toast.success(`Registro "${label}" restaurado exitosamente`);
      setData((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, deleted_at: null } : r))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restaurar el registro");
    }
  };

  const hasArchivosGenerados = (item: ProgramacionTecnicaData) =>
    !!(item.enlace_del_pdf && item.enlace_del_xml && item.enlace_del_cdr);

  const hasGuiaEnProceso = (item: ProgramacionTecnicaData) =>
    !!(item.identificador_unico && identificadoresConGuia.includes(item.identificador_unico));

  const activos = data.filter((i) => !i.deleted_at);
  const eliminados = data.filter((i) => i.deleted_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{activos.length} activos</Badge>
          {eliminados.length > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              {eliminados.length} eliminados
            </Badge>
          )}
          <Badge variant="outline" className="text-slate-500">{total} total</Badge>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por proveedor, conductor, proyecto..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchTerm ? "No se encontraron registros con ese criterio" : "No hay registros disponibles"}
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {data.map((item) => {
            const isDeleted = !!item.deleted_at;
            return (
              <AccordionItem
                key={item.id}
                value={`item-${item.id}`}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isDeleted
                    ? "border-l-4 border-red-500 bg-red-100 ring-1 ring-red-300"
                    : hasArchivosGenerados(item)
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
                        <span className={`text-sm font-mono font-bold ${isDeleted ? "text-red-400 line-through" : "text-red-700"}`}>
                          #{item.id}
                        </span>
                      </div>
                      <div className="flex flex-col items-start min-w-[100px]">
                        <span className="text-xs text-slate-500 font-medium">Fecha</span>
                        <span className="text-sm font-medium">{formatDatePeru(item.fecha)}</span>
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
                          {item.proveedor || <span className="text-slate-400 italic">-</span>}
                        </span>
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-[180px]">
                        <span className="text-xs text-slate-500 font-medium">Conductor</span>
                        <span className="text-sm font-medium truncate max-w-full">
                          {item.apellidos_nombres || <span className="text-slate-400 italic">-</span>}
                        </span>
                      </div>
                      <div className="flex flex-col items-start min-w-[120px]">
                        <span className="text-xs text-slate-500 font-medium">Estado</span>
                        {isDeleted ? (
                          <Badge className="bg-red-100 text-red-600 hover:bg-red-100">ELIMINADO</Badge>
                        ) : (
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
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Información del Transporte
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
                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Proyecto
                        </h4>
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Detalles de Programación
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
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
                              <p className="text-xs font-mono text-slate-600 break-all">{item.identificador_unico}</p>
                            </div>
                          )}
                          {isDeleted && item.deleted_at && (
                            <div className="col-span-2">
                              <p className="text-xs text-red-500">Eliminado el</p>
                              <p className="text-xs font-mono text-red-400">
                                {new Date(item.deleted_at).toLocaleString("es-PE")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                          <Download className="h-3 w-3" /> Archivos de Guía
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.enlace_del_pdf ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_pdf!, "_blank")} className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200">
                              <Download className="h-3 w-3 mr-1" /> PDF
                            </Button>
                          ) : <span className="text-xs text-slate-400 px-2">Sin PDF</span>}
                          {item.enlace_del_xml ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_xml!, "_blank")} className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                              <Download className="h-3 w-3 mr-1" /> XML
                            </Button>
                          ) : <span className="text-xs text-slate-400 px-2">Sin XML</span>}
                          {item.enlace_del_cdr ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_cdr!, "_blank")} className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                              <Download className="h-3 w-3 mr-1" /> CDR
                            </Button>
                          ) : <span className="text-xs text-slate-400 px-2">Sin CDR</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      {!isDeleted && (
                        <>
                          <Button size="sm" onClick={() => handleGenerarGuia(item.id)} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white">
                            <FileText className="h-4 w-4 mr-2" /> Generar Guía
                          </Button>
                          {hasGuiaEnProceso(item) && !hasArchivosGenerados(item) && (
                            <Button size="sm" variant="outline" onClick={() => handleRecuperarArchivos(item)} className="bg-white hover:bg-orange-50 text-orange-700 border-orange-300">
                              <ExternalLink className="h-4 w-4 mr-2" /> Recuperar Archivos
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleEliminar(item)} className="bg-white hover:bg-red-50 text-red-700 border-red-300 ml-auto">
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar Registro
                          </Button>
                        </>
                      )}
                      {isDeleted && (
                        <Button size="sm" variant="outline" onClick={() => handleRestaurar(item)} className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300">
                          <RotateCcw className="h-4 w-4 mr-2" /> Restaurar Registro
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Órdenes de Compra ──────────────────────────────────────────────────

function OrdenesCompraTab() {
  const [data, setData] = useState<OrdenCompraData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true);
      searchApi
        .ordenesCompra(searchTerm, page, LIMIT)
        .then((result) => {
          setData(result.data);
          setTotal(result.total);
        })
        .catch(() => toast.error("Error al cargar las órdenes de compra"))
        .finally(() => setIsLoading(false));
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  const handleEliminar = async (item: OrdenCompraData) => {
    const label = item.numero_orden;
    if (!confirm(`¿Está seguro de ELIMINAR la orden "${label}"?\n\nEl registro quedará oculto pero podrá restaurarse.`)) return;
    try {
      toast.info(`Eliminando orden ${label}...`);
      await ordenesCompraApi.delete(item.id_orden_compra!);
      toast.success(`Orden "${label}" marcada como eliminada`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_compra === item.id_orden_compra
            ? { ...r, deleted_at: new Date().toISOString() }
            : r
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleRestaurar = async (item: OrdenCompraData) => {
    const label = item.numero_orden;
    try {
      toast.info(`Restaurando orden ${label}...`);
      await ordenesCompraApi.restore(item.id_orden_compra!);
      toast.success(`Orden "${label}" restaurada exitosamente`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_compra === item.id_orden_compra ? { ...r, deleted_at: null } : r
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restaurar");
    }
  };

  const activos = data.filter((i) => !i.deleted_at);
  const eliminados = data.filter((i) => i.deleted_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{activos.length} activas</Badge>
          {eliminados.length > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              {eliminados.length} eliminadas
            </Badge>
          )}
          <Badge variant="outline" className="text-slate-500">{total} total</Badge>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por número, proveedor, estado..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchTerm ? "No se encontraron órdenes con ese criterio" : "No hay órdenes disponibles"}
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {data.map((item) => {
            const isDeleted = !!item.deleted_at;
            return (
              <AccordionItem
                key={item.id_orden_compra}
                value={`oc-${item.id_orden_compra}`}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isDeleted
                    ? "border-l-4 border-red-500 bg-red-100 ring-1 ring-red-300"
                    : "border-slate-200"
                }`}
              >
                <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center w-full gap-4 pr-4 flex-wrap">
                    <div className="flex flex-col items-start min-w-[80px]">
                      <span className="text-xs text-slate-500 font-medium">ID</span>
                      <span className={`text-sm font-mono font-bold ${isDeleted ? "text-red-400 line-through" : "text-red-700"}`}>
                        #{item.id_orden_compra}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[140px]">
                      <span className="text-xs text-slate-500 font-medium">N° Orden</span>
                      <span className="text-sm font-mono font-bold">{item.numero_orden}</span>
                    </div>
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-xs text-slate-500 font-medium">Fecha</span>
                      <span className="text-sm">{item.fecha_orden}</span>
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-[180px]">
                      <span className="text-xs text-slate-500 font-medium">Proveedor</span>
                      <span className="text-sm font-medium truncate max-w-full">
                        {item.nombre_proveedor || <span className="text-slate-400 italic">-</span>}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[80px]">
                      <span className="text-xs text-slate-500 font-medium">Total</span>
                      <span className="text-sm font-bold font-mono">
                        S/ {Number(item.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-xs text-slate-500 font-medium">Estado</span>
                      {isDeleted ? (
                        <Badge className="bg-red-100 text-red-600 hover:bg-red-100">ELIMINADA</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs">
                          {item.estado}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-slate-500">RUC Proveedor</p>
                        <p className="text-sm font-semibold">{item.ruc_proveedor || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Moneda</p>
                        <p className="text-sm font-semibold">{item.moneda || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Subtotal</p>
                        <p className="text-sm font-semibold font-mono">
                          {Number(item.subtotal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">IGV</p>
                        <p className="text-sm font-semibold font-mono">
                          {Number(item.igv).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {isDeleted && item.deleted_at && (
                        <div className="col-span-2 lg:col-span-4">
                          <p className="text-xs text-red-500">Eliminada el</p>
                          <p className="text-xs font-mono text-red-400">
                            {new Date(item.deleted_at).toLocaleString("es-PE")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      {!isDeleted ? (
                        <Button size="sm" variant="outline" onClick={() => handleEliminar(item)} className="bg-white hover:bg-red-50 text-red-700 border-red-300 ml-auto">
                          <Trash2 className="h-4 w-4 mr-2" /> Eliminar Orden
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleRestaurar(item)} className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300">
                          <RotateCcw className="h-4 w-4 mr-2" /> Restaurar Orden
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Órdenes de Servicio ────────────────────────────────────────────────

function OrdenesServicioTab() {
  const [data, setData] = useState<OrdenServicioData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true);
      searchApi
        .ordenesServicio(searchTerm, page, LIMIT)
        .then((result) => {
          setData(result.data);
          setTotal(result.total);
        })
        .catch(() => toast.error("Error al cargar las órdenes de servicio"))
        .finally(() => setIsLoading(false));
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  const handleEliminar = async (item: OrdenServicioData) => {
    const label = item.numero_orden;
    if (!confirm(`¿Está seguro de ELIMINAR la orden "${label}"?\n\nEl registro quedará oculto pero podrá restaurarse.`)) return;
    try {
      toast.info(`Eliminando orden ${label}...`);
      await ordenesServicioApi.delete(item.id_orden_servicio!);
      toast.success(`Orden "${label}" marcada como eliminada`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_servicio === item.id_orden_servicio
            ? { ...r, deleted_at: new Date().toISOString() }
            : r
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleRestaurar = async (item: OrdenServicioData) => {
    const label = item.numero_orden;
    try {
      toast.info(`Restaurando orden ${label}...`);
      await ordenesServicioApi.restore(item.id_orden_servicio!);
      toast.success(`Orden "${label}" restaurada exitosamente`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_servicio === item.id_orden_servicio ? { ...r, deleted_at: null } : r
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restaurar");
    }
  };

  const activos = data.filter((i) => !i.deleted_at);
  const eliminados = data.filter((i) => i.deleted_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{activos.length} activas</Badge>
          {eliminados.length > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              {eliminados.length} eliminadas
            </Badge>
          )}
          <Badge variant="outline" className="text-slate-500">{total} total</Badge>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por número, proveedor, estado..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchTerm ? "No se encontraron órdenes con ese criterio" : "No hay órdenes disponibles"}
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {data.map((item) => {
            const isDeleted = !!item.deleted_at;
            return (
              <AccordionItem
                key={item.id_orden_servicio}
                value={`os-${item.id_orden_servicio}`}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isDeleted
                    ? "border-l-4 border-red-500 bg-red-100 ring-1 ring-red-300"
                    : "border-slate-200"
                }`}
              >
                <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center w-full gap-4 pr-4 flex-wrap">
                    <div className="flex flex-col items-start min-w-[80px]">
                      <span className="text-xs text-slate-500 font-medium">ID</span>
                      <span className={`text-sm font-mono font-bold ${isDeleted ? "text-red-400 line-through" : "text-red-700"}`}>
                        #{item.id_orden_servicio}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[140px]">
                      <span className="text-xs text-slate-500 font-medium">N° Orden</span>
                      <span className="text-sm font-mono font-bold">{item.numero_orden}</span>
                    </div>
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-xs text-slate-500 font-medium">Fecha</span>
                      <span className="text-sm">{item.fecha_orden}</span>
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-[180px]">
                      <span className="text-xs text-slate-500 font-medium">Proveedor</span>
                      <span className="text-sm font-medium truncate max-w-full">
                        {item.nombre_proveedor || <span className="text-slate-400 italic">-</span>}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[80px]">
                      <span className="text-xs text-slate-500 font-medium">Total</span>
                      <span className="text-sm font-bold font-mono">
                        S/ {Number(item.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-xs text-slate-500 font-medium">Estado</span>
                      {isDeleted ? (
                        <Badge className="bg-red-100 text-red-600 hover:bg-red-100">ELIMINADA</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs">
                          {item.estado}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-slate-500">RUC Proveedor</p>
                        <p className="text-sm font-semibold">{item.ruc_proveedor || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Moneda</p>
                        <p className="text-sm font-semibold">{item.moneda || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Subtotal</p>
                        <p className="text-sm font-semibold font-mono">
                          {Number(item.subtotal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">IGV</p>
                        <p className="text-sm font-semibold font-mono">
                          {Number(item.igv).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {isDeleted && item.deleted_at && (
                        <div className="col-span-2 lg:col-span-4">
                          <p className="text-xs text-red-500">Eliminada el</p>
                          <p className="text-xs font-mono text-red-400">
                            {new Date(item.deleted_at).toLocaleString("es-PE")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      {!isDeleted ? (
                        <Button size="sm" variant="outline" onClick={() => handleEliminar(item)} className="bg-white hover:bg-red-50 text-red-700 border-red-300 ml-auto">
                          <Trash2 className="h-4 w-4 mr-2" /> Eliminar Orden
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleRestaurar(item)} className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300">
                          <RotateCcw className="h-4 w-4 mr-2" /> Restaurar Orden
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Configuración ──────────────────────────────────────────────────────

function ConfiguracionTab() {
  const [isReindexing, setIsReindexing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    counts: { programacion_tecnica: number; ordenes_compra: number; ordenes_servicio: number };
    at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReindex = async () => {
    if (!confirm("¿Sincronizar Elasticsearch ahora?\n\nEsto reindexará todos los registros desde la base de datos.")) return;
    setIsReindexing(true);
    setError(null);
    setLastResult(null);
    try {
      const result = await searchApi.reindex();
      setLastResult({ counts: result.counts, at: new Date().toLocaleString("es-PE") });
      toast.success(
        `Elasticsearch sincronizado: ${result.counts.programacion_tecnica} prog. técnica, ${result.counts.ordenes_compra} ó. compra, ${result.counts.ordenes_servicio} ó. servicio`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al sincronizar";
      setError(msg);
      toast.error(`Error al sincronizar: ${msg}`);
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Sincronización de Elasticsearch</h3>
        <p className="text-sm text-slate-500">
          Reindexar todos los registros desde la base de datos hacia Elasticsearch.
          Necesario la primera vez o cuando ES estuvo caído y se crearon registros nuevos.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-slate-700">Reindexar todo</p>
            <p className="text-xs text-slate-500">Programación técnica · Órdenes de compra · Órdenes de servicio</p>
          </div>
          <Button
            onClick={handleReindex}
            disabled={isReindexing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isReindexing ? "animate-spin" : ""}`} />
            {isReindexing ? "Sincronizando..." : "Sincronizar ES"}
          </Button>
        </div>

        {lastResult && (
          <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="text-xs text-green-700 space-y-0.5">
              <p className="font-medium">Sincronizado el {lastResult.at}</p>
              <p>· Programación técnica: <span className="font-mono font-bold">{lastResult.counts.programacion_tecnica}</span></p>
              <p>· Órdenes de compra: <span className="font-mono font-bold">{lastResult.counts.ordenes_compra}</span></p>
              <p>· Órdenes de servicio: <span className="font-mono font-bold">{lastResult.counts.ordenes_servicio}</span></p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="text-xs text-red-700">
              <p className="font-medium">Error al sincronizar</p>
              <p className="font-mono">{error}</p>
              <p className="mt-1 text-red-500">Verifica que Elasticsearch esté activo: <code>docker compose up -d</code> en <code>ayala_back/elasticsearch/</code></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function ProgramacionAdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-700 to-red-500 text-white shadow-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Administración General</h1>
            <p className="text-sm text-slate-600">
              Gestión y recuperación de registros eliminados
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="programacion" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="programacion" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Programación Técnica
            </TabsTrigger>
            <TabsTrigger value="compra" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Órdenes de Compra
            </TabsTrigger>
            <TabsTrigger value="servicio" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Órdenes de Servicio
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programacion">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros de Programación Técnica</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgramacionTecnicaTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compra">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Órdenes de Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <OrdenesCompraTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicio">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Órdenes de Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <OrdenesServicioTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracion">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfiguracionTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
