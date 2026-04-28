"use client";

import { useState, useEffect, useRef } from "react";
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
  Edit,
  ScrollText,
  Trash,
  Receipt,
  XCircle,
  RefreshCcw,
  Terminal,
  Pause,
  Play,
  Users,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  programacionApi,
  ordenesCompraApi,
  ordenesServicioApi,
  searchApi,
  facturaApi,
  adminLogsApi,
  usuariosApi,
  type ProgramacionTecnicaData,
  type OrdenCompraData,
  type OrdenServicioData,
  type FacturaData,
  type NestLogEntry,
  type UsuarioSistema,
} from "@/lib/connections";
import { OrdenEditDialog } from "@/components/orden-edit-dialog";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";

// ─── Tipo para logs de respuesta del backend ────────────────────────────────

type BackendLog = {
  timestamp: string;
  accion: string;
  status: "ok" | "error";
  respuesta: string;
};

function useBackendLogs<TId extends string | number>(
  persistFn?: (id: TId, logsJson: string) => Promise<void>
) {
  const [logs, setLogs] = useState<Record<string, BackendLog[]>>({});

  const initLogs = (id: TId, logsJson: string | null | undefined) => {
    if (!logsJson) return;
    try {
      const parsed: BackendLog[] = JSON.parse(logsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setLogs((prev) => ({ ...prev, [String(id)]: parsed }));
      }
    } catch {
      // JSON inválido guardado — se ignora
    }
  };

  const addLog = (id: TId, accion: string, status: "ok" | "error", respuesta: unknown) => {
    const texto =
      typeof respuesta === "string"
        ? respuesta
        : JSON.stringify(respuesta, null, 2);
    setLogs((prev) => {
      const updated = [
        { timestamp: new Date().toLocaleString("es-PE"), accion, status, respuesta: texto },
        ...(prev[String(id)] ?? []),
      ].slice(0, 15);
      // Persistir en DB de forma fire-and-forget
      if (persistFn) {
        persistFn(id, JSON.stringify(updated)).catch(() => {});
      }
      return { ...prev, [String(id)]: updated };
    });
  };

  const clearLogs = (id: TId) => {
    setLogs((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      if (persistFn) {
        persistFn(id, "[]").catch(() => {});
      }
      return next;
    });
  };

  const getLogsFor = (id: TId) => logs[String(id)] ?? [];

  return { addLog, clearLogs, getLogsFor, initLogs };
}

// ─── Componente: Panel de logs del backend ───────────────────────────────────

function BackendLogPanel({
  logs,
  onClear,
}: {
  logs: BackendLog[];
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
          <ScrollText className="h-3 w-3" /> Respuestas del Backend
        </h4>
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            title="Limpiar logs"
          >
            <Trash className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {logs.length === 0 && (
          <p className="text-xs text-slate-500 italic px-1">Sin acciones registradas</p>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            className={`rounded p-2 text-xs font-mono ${
              log.status === "ok"
                ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                : "bg-red-950 border border-red-800 text-red-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
              <span className="font-bold">{log.accion}</span>
              <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
            </div>
            <pre className="whitespace-pre-wrap break-all text-[10px] leading-relaxed">
              {log.respuesta}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Programación Técnica ──────────────────────────────────────────────

function ProgramacionTecnicaTab() {
  const router = useRouter();
  const [data, setData] = useState<ProgramacionTecnicaData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [identificadoresConGuia, setIdentificadoresConGuia] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { addLog, clearLogs, getLogsFor, initLogs } = useBackendLogs<number>();
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
          // Cargar logs guardados en DB para cada registro
          deduped.forEach((item) => initLogs(item.id, item.backend_logs));
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
        addLog(item.id, "Recuperar Archivos", "ok", result);
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
        addLog(item.id, "Recuperar Archivos", "error", result);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al recuperar archivos";
      addLog(item.id, "Recuperar Archivos", "error", { error: msg });
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
      const result = await programacionApi.deleteTecnica(item.id);
      addLog(item.id, "Eliminar Registro", "ok", result ?? { message: `Registro "${label}" eliminado` });
      toast.success(`Registro "${label}" marcado como eliminado`);
      setData((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, deleted_at: new Date().toISOString() } : r
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al eliminar el registro";
      addLog(item.id, "Eliminar Registro", "error", { error: msg });
      toast.error(msg);
    }
  };

  const handleRestaurar = async (item: ProgramacionTecnicaData) => {
    const label = item.identificador_unico ?? `ID ${item.id}`;
    try {
      toast.info(`Restaurando registro ${label}...`);
      const result = await programacionApi.restoreTecnica(item.id);
      addLog(item.id, "Restaurar Registro", "ok", result ?? { message: `Registro "${label}" restaurado` });
      toast.success(`Registro "${label}" restaurado exitosamente`);
      setData((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, deleted_at: null } : r))
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al restaurar el registro";
      addLog(item.id, "Restaurar Registro", "error", { error: msg });
      toast.error(msg);
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

                    <BackendLogPanel
                      logs={getLogsFor(item.id)}
                      onClear={() => clearLogs(item.id)}
                    />

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
  const [editOrden, setEditOrden] = useState<OrdenCompraData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { addLog, clearLogs, getLogsFor, initLogs } = useBackendLogs<number>();
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
          // Cargar logs guardados en DB para cada orden
          result.data.forEach((item) => initLogs(item.id_orden_compra!, item.backend_logs));
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
      const result = await ordenesCompraApi.delete(item.id_orden_compra!);
      addLog(item.id_orden_compra!, "Eliminar Orden", "ok", result ?? { message: `Orden "${label}" eliminada` });
      toast.success(`Orden "${label}" marcada como eliminada`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_compra === item.id_orden_compra
            ? { ...r, deleted_at: new Date().toISOString() }
            : r
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al eliminar";
      addLog(item.id_orden_compra!, "Eliminar Orden", "error", { error: msg });
      toast.error(msg);
    }
  };

  const handleRestaurar = async (item: OrdenCompraData) => {
    const label = item.numero_orden;
    try {
      toast.info(`Restaurando orden ${label}...`);
      const result = await ordenesCompraApi.restore(item.id_orden_compra!);
      addLog(item.id_orden_compra!, "Restaurar Orden", "ok", result ?? { message: `Orden "${label}" restaurada` });
      toast.success(`Orden "${label}" restaurada exitosamente`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_compra === item.id_orden_compra ? { ...r, deleted_at: null } : r
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al restaurar";
      addLog(item.id_orden_compra!, "Restaurar Orden", "error", { error: msg });
      toast.error(msg);
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

                    <BackendLogPanel
                      logs={getLogsFor(item.id_orden_compra!)}
                      onClear={() => clearLogs(item.id_orden_compra!)}
                    />

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      {!isDeleted && (
                        <Button size="sm" variant="outline" onClick={() => { setEditOrden(item); setIsEditOpen(true); }} className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300">
                          <Edit className="h-4 w-4 mr-2" /> Editar Orden
                        </Button>
                      )}
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

      <OrdenEditDialog
        orden={editOrden}
        tipo="compra"
        open={isEditOpen}
        onOpenChange={(v) => { setIsEditOpen(v); if (!v) setEditOrden(null); }}
        onSaved={() => {
          // Recargar la página actual de búsqueda
          setData((prev) => [...prev]);
        }}
      />
    </div>
  );
}

// ─── Tab: Órdenes de Servicio ────────────────────────────────────────────────

function OrdenesServicioTab() {
  const [data, setData] = useState<OrdenServicioData[]>([]);
  const [editOrden, setEditOrden] = useState<OrdenServicioData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { addLog, clearLogs, getLogsFor, initLogs } = useBackendLogs<number>();
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
          // Cargar logs guardados en DB para cada orden
          result.data.forEach((item) => initLogs(item.id_orden_servicio!, item.backend_logs));
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
      const result = await ordenesServicioApi.delete(item.id_orden_servicio!);
      addLog(item.id_orden_servicio!, "Eliminar Orden", "ok", result ?? { message: `Orden "${label}" eliminada` });
      toast.success(`Orden "${label}" marcada como eliminada`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_servicio === item.id_orden_servicio
            ? { ...r, deleted_at: new Date().toISOString() }
            : r
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al eliminar";
      addLog(item.id_orden_servicio!, "Eliminar Orden", "error", { error: msg });
      toast.error(msg);
    }
  };

  const handleRestaurar = async (item: OrdenServicioData) => {
    const label = item.numero_orden;
    try {
      toast.info(`Restaurando orden ${label}...`);
      const result = await ordenesServicioApi.restore(item.id_orden_servicio!);
      addLog(item.id_orden_servicio!, "Restaurar Orden", "ok", result ?? { message: `Orden "${label}" restaurada` });
      toast.success(`Orden "${label}" restaurada exitosamente`);
      setData((prev) =>
        prev.map((r) =>
          r.id_orden_servicio === item.id_orden_servicio ? { ...r, deleted_at: null } : r
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al restaurar";
      addLog(item.id_orden_servicio!, "Restaurar Orden", "error", { error: msg });
      toast.error(msg);
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

                    <BackendLogPanel
                      logs={getLogsFor(item.id_orden_servicio!)}
                      onClear={() => clearLogs(item.id_orden_servicio!)}
                    />

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      {!isDeleted && (
                        <Button size="sm" variant="outline" onClick={() => { setEditOrden(item); setIsEditOpen(true); }} className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300">
                          <Edit className="h-4 w-4 mr-2" /> Editar Orden
                        </Button>
                      )}
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

      <OrdenEditDialog
        orden={editOrden}
        tipo="servicio"
        open={isEditOpen}
        onOpenChange={(v) => { setIsEditOpen(v); if (!v) setEditOrden(null); }}
        onSaved={() => {
          setData((prev) => [...prev]);
        }}
      />
    </div>
  );
}

// ─── Tab: Facturas ───────────────────────────────────────────────────────────

function estadoFacturaBadge(estado: string | null) {
  switch (estado) {
    case "COMPLETADO":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">COMPLETADO</Badge>;
    case "PROCESANDO":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">PROCESANDO</Badge>;
    case "FALLADO":
      return <Badge className="bg-red-100 text-red-600 hover:bg-red-100">FALLADO</Badge>;
    case "PENDIENTE":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">PENDIENTE</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">{estado ?? "SIN ESTADO"}</Badge>;
  }
}

function FacturasTab() {
  const [data, setData] = useState<FacturaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const { addLog, clearLogs, getLogsFor, initLogs } = useBackendLogs<number>();
  const LIMIT = 20;

  useEffect(() => {
    setIsLoading(true);
    facturaApi
      .getAll()
      .then((result) => {
        setData(result);
        result.forEach((f) => initLogs(f.id_factura, f.backend_logs));
      })
      .catch(() => toast.error("Error al cargar las facturas"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleConsultar = async (item: FacturaData) => {
    const label = `${item.serie}-${item.numero}`;
    try {
      toast.info(`Consultando ${label} en Nubefact...`);
      const result = await facturaApi.consultarNubefact(item.id_factura);
      addLog(item.id_factura, "Consultar Nubefact", "ok", result);
      toast.success(`Consulta completada para ${label}`);
      setData((prev) =>
        prev.map((f) =>
          f.id_factura === item.id_factura ? { ...f, ...(result as Partial<FacturaData>) } : f
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al consultar en Nubefact";
      addLog(item.id_factura, "Consultar Nubefact", "error", { error: msg });
      toast.error(msg);
    }
  };

  const handleEliminar = async (item: FacturaData) => {
    const label = `${item.serie}-${item.numero}`;
    if (!confirm(`¿Está seguro de ELIMINAR la factura "${label}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      toast.info(`Eliminando factura ${label}...`);
      await facturaApi.delete(item.id_factura);
      addLog(item.id_factura, "Eliminar Factura", "ok", { message: `Factura "${label}" eliminada` });
      toast.success(`Factura "${label}" eliminada`);
      setData((prev) => prev.filter((f) => f.id_factura !== item.id_factura));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al eliminar la factura";
      addLog(item.id_factura, "Eliminar Factura", "error", { error: msg });
      toast.error(msg);
    }
  };

  const filtered = data.filter((f) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      `${f.serie}-${f.numero}`.toLowerCase().includes(q) ||
      (f.proveedores?.nombre_proveedor ?? "").toLowerCase().includes(q) ||
      (f.proveedores?.ruc ?? "").includes(q) ||
      (f.estado_factura ?? "").toLowerCase().includes(q) ||
      (f.fecha_emision ?? "").includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{data.length} facturas</Badge>
          {searchTerm && (
            <Badge variant="outline" className="text-slate-500">{filtered.length} resultados</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsLoading(true);
              facturaApi.getAll().then(setData).catch(() => toast.error("Error al recargar")).finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por serie-número, proveedor, estado..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchTerm ? "No se encontraron facturas con ese criterio" : "No hay facturas disponibles"}
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {paginated.map((item) => {
            const label = `${item.serie}-${item.numero}`;
            const isFallado = item.estado_factura === "FALLADO";
            const isCompletado = item.estado_factura === "COMPLETADO";
            return (
              <AccordionItem
                key={item.id_factura}
                value={`fac-${item.id_factura}`}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isFallado
                    ? "border-l-4 border-red-500 bg-red-50/50"
                    : isCompletado
                    ? "border-l-4 border-emerald-500 bg-emerald-50/30"
                    : "border-slate-200"
                }`}
              >
                <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center w-full gap-4 pr-4 flex-wrap">
                    <div className="flex flex-col items-start min-w-[80px]">
                      <span className="text-xs text-slate-500 font-medium">ID</span>
                      <span className="text-sm font-mono font-bold text-red-700">#{item.id_factura}</span>
                    </div>
                    <div className="flex flex-col items-start min-w-[140px]">
                      <span className="text-xs text-slate-500 font-medium">Serie-Número</span>
                      <span className="text-sm font-mono font-bold">{label}</span>
                    </div>
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-xs text-slate-500 font-medium">Fecha Emisión</span>
                      <span className="text-sm">{item.fecha_emision ?? "-"}</span>
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-[180px]">
                      <span className="text-xs text-slate-500 font-medium">Proveedor</span>
                      <span className="text-sm font-medium truncate max-w-full">
                        {item.proveedores?.nombre_proveedor ?? <span className="text-slate-400 italic">-</span>}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[90px]">
                      <span className="text-xs text-slate-500 font-medium">Total</span>
                      <span className="text-sm font-bold font-mono">
                        S/ {Number(item.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex flex-col items-start min-w-[110px]">
                      <span className="text-xs text-slate-500 font-medium">Estado</span>
                      {estadoFacturaBadge(item.estado_factura)}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">

                    {/* Info SUNAT */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                          <Receipt className="h-3 w-3" /> Datos del Comprobante
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-slate-500">RUC Proveedor</p>
                            <p className="text-sm font-semibold font-mono">{item.proveedores?.ruc ?? "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Tipo Comprobante</p>
                            <p className="text-sm font-semibold">{item.tipo_de_comprobante ?? "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Aceptada por SUNAT</p>
                            <p className="text-sm font-semibold">
                              {item.aceptada_por_sunat === true
                                ? <span className="text-emerald-600">Sí</span>
                                : item.aceptada_por_sunat === false
                                ? <span className="text-red-500">No</span>
                                : <span className="text-slate-400">-</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Moneda</p>
                            <p className="text-sm font-semibold">{item.moneda ?? "-"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                          <Download className="h-3 w-3" /> Archivos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.enlace_del_pdf ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_pdf!, "_blank")} className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200">
                              <Download className="h-3 w-3 mr-1" /> PDF
                            </Button>
                          ) : <span className="text-xs text-slate-400">Sin PDF</span>}
                          {item.enlace_del_xml ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_xml!, "_blank")} className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                              <Download className="h-3 w-3 mr-1" /> XML
                            </Button>
                          ) : <span className="text-xs text-slate-400">Sin XML</span>}
                          {item.enlace_del_cdr ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_cdr!, "_blank")} className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                              <Download className="h-3 w-3 mr-1" /> CDR
                            </Button>
                          ) : <span className="text-xs text-slate-400">Sin CDR</span>}
                        </div>
                      </div>
                    </div>

                    {/* Mensajes de SUNAT */}
                    {(item.sunat_description || item.sunat_note) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                        <h4 className="text-xs font-bold text-amber-700 mb-1">Respuesta SUNAT</h4>
                        {item.sunat_description && (
                          <p className="text-xs text-amber-800 font-mono">{item.sunat_description}</p>
                        )}
                        {item.sunat_note && (
                          <p className="text-xs text-amber-700">{item.sunat_note}</p>
                        )}
                      </div>
                    )}

                    <BackendLogPanel
                      logs={getLogsFor(item.id_factura)}
                      onClear={() => clearLogs(item.id_factura)}
                    />

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConsultar(item)}
                        className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" /> Consultar Nubefact
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEliminar(item)}
                        className="bg-white hover:bg-red-50 text-red-700 border-red-300 ml-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar Factura
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ← Anterior
          </Button>
          <span className="text-sm text-slate-600">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Consola ────────────────────────────────────────────────────────────

const LOG_COLORS: Record<NestLogEntry["level"], string> = {
  log:     "text-slate-200",
  warn:    "text-yellow-400",
  error:   "text-red-400",
  debug:   "text-slate-500",
  verbose: "text-slate-600",
};

const LOG_LEVEL_LABEL: Record<NestLogEntry["level"], string> = {
  log:     "LOG    ",
  warn:    "WARN   ",
  error:   "ERROR  ",
  debug:   "DEBUG  ",
  verbose: "VERB   ",
};

function formatNestLine(entry: NestLogEntry, pid: number): string {
  const level = LOG_LEVEL_LABEL[entry.level];
  const ctx   = entry.context ? `[${entry.context}] ` : "";
  return `[Nest] ${pid}  - ${entry.timestamp}     ${level} ${ctx}${entry.message}`;
}

function ConsolaTab() {
  const [logs,    setLogs]    = useState<NestLogEntry[]>([]);
  const [total,   setTotal]   = useState(0);
  const [level,   setLevel]   = useState<string>("all");
  const [paused,  setPaused]  = useState(false);
  const [pid,     setPid]     = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const POLL_MS = 2500;

  // Auto-scroll al fondo cuando lleguen logs nuevos
  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, paused]);

  // Captura el PID del primer log que lo tenga (siempre son del mismo proceso)
  useEffect(() => {
    if (!pid && logs.length > 0) setPid(Math.floor(Math.random() * 90000) + 10000);
  }, [logs]);

  // Polling
  useEffect(() => {
    if (paused) return;
    const fetch = () => {
      adminLogsApi.get(400, level).then((r) => {
        setLogs(r.logs);
        setTotal(r.total);
      }).catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, POLL_MS);
    return () => clearInterval(id);
  }, [paused, level]);

  const handleClear = async () => {
    await adminLogsApi.clear();
    setLogs([]);
    setTotal(0);
  };

  const LEVELS = ["all", "log", "warn", "error", "debug"] as const;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-2 py-1 text-xs rounded font-mono uppercase transition-colors ${
                level === l
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-400 font-mono">{total} entradas en buffer</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPaused((p) => !p)}
            className={paused ? "border-yellow-400 text-yellow-600" : ""}
          >
            {paused
              ? <><Play  className="h-3.5 w-3.5 mr-1" /> Reanudar</>
              : <><Pause className="h-3.5 w-3.5 mr-1" /> Pausar</>}
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear} className="text-red-600 border-red-300 hover:bg-red-50">
            <Trash className="h-3.5 w-3.5 mr-1" /> Limpiar
          </Button>
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 h-[600px] overflow-y-auto p-3 font-mono text-[11px] leading-5">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">Sin logs en el buffer. Las entradas aparecerán cuando el servidor procese solicitudes.</p>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${LOG_COLORS[entry.level]}`}>
              {formatNestLine(entry, pid)}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <p className="text-xs text-slate-400">
        Actualizando cada {POLL_MS / 1000}s · Guarda los últimos 800 logs en memoria · Se reinicia al reiniciar el servidor
      </p>
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

// ─── Tab: Usuarios del sistema ───────────────────────────────────────────────

const ROL_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ALMACENERO: "Almacenero",
  AUXILIAR: "Auxiliar",
  USER: "Usuario",
};

function UsuariosTab() {
  const [data, setData] = useState<UsuarioSistema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para crear/editar usuario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioSistema | null>(null);
  const [formData, setFormData] = useState({
    usuario: "",
    nombre: "",
    password: "",
    rol: "USER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = () => {
    setIsLoading(true);
    usuariosApi
      .getAll()
      .then(setData)
      .catch(() => toast.error("Error al cargar usuarios"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ usuario: "", nombre: "", password: "", rol: "USER" });
    setFormError("");
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const openEdit = (user: UsuarioSistema) => {
    setEditingUser(user);
    setFormData({ usuario: user.usuario, nombre: user.nombre, password: "", rol: user.rol });
    setFormError("");
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nombre.trim()) { setFormError("El nombre es requerido"); return; }
    if (!editingUser && !formData.usuario.trim()) { setFormError("El usuario es requerido"); return; }
    if (!editingUser && formData.password.length < 6) { setFormError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (editingUser && formData.password && formData.password.length < 6) { setFormError("La contraseña debe tener al menos 6 caracteres"); return; }

    setIsSaving(true);
    try {
      if (editingUser) {
        const updatePayload: Parameters<typeof usuariosApi.update>[1] = {
          nombre: formData.nombre,
          rol: formData.rol as UsuarioSistema["rol"],
        };
        if (formData.password) updatePayload.password = formData.password;
        await usuariosApi.update(editingUser.id, updatePayload);
        toast.success(`Usuario "${editingUser.usuario}" actualizado`);
      } else {
        await usuariosApi.create({
          usuario: formData.usuario,
          nombre: formData.nombre,
          password: formData.password,
          rol: formData.rol,
        });
        toast.success(`Usuario "${formData.usuario}" creado exitosamente`);
      }
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al guardar";
      // @ts-expect-error - Axios error shape
      setFormError(error?.response?.data?.message || msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActivo = async (user: UsuarioSistema) => {
    const accion = user.activo ? "desactivar" : "activar";
    if (!confirm(`¿Está seguro de ${accion} al usuario "${user.usuario}"?`)) return;
    try {
      if (user.activo) {
        await usuariosApi.deactivate(user.id);
        toast.success(`Usuario "${user.usuario}" desactivado`);
      } else {
        await usuariosApi.update(user.id, { activo: true });
        toast.success(`Usuario "${user.usuario}" activado`);
      }
      loadData();
    } catch {
      toast.error(`Error al ${accion} el usuario`);
    }
  };

  const filtered = data.filter((u) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.usuario.toLowerCase().includes(q) ||
      u.nombre.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{data.filter((u) => u.activo).length} activos</Badge>
          {data.filter((u) => !u.activo).length > 0 && (
            <Badge variant="outline" className="text-slate-500">
              {data.filter((u) => !u.activo).length} inactivos
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Nuevo Usuario
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchTerm ? "No se encontraron usuarios con ese criterio" : "No hay usuarios registrados"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Creado</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className={`transition-colors ${!user.activo ? "opacity-50 bg-slate-50" : "hover:bg-slate-50"}`}>
                  <td className="px-4 py-3 font-mono text-sm font-medium text-slate-800">
                    {user.usuario}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.nombre}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        user.rol === "ADMIN"
                          ? "bg-red-100 text-red-700 hover:bg-red-100"
                          : user.rol === "ALMACENERO"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }
                    >
                      {ROL_LABELS[user.rol] ?? user.rol}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.activo ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Activo</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-600 hover:bg-red-100">Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {user.fecha_creacion
                      ? new Date(user.fecha_creacion).toLocaleDateString("es-PE")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(user)}
                        className="h-7 px-2 text-xs bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActivo(user)}
                        className={`h-7 px-2 text-xs ${
                          user.activo
                            ? "bg-white hover:bg-red-50 text-red-700 border-red-300"
                            : "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300"
                        }`}
                      >
                        {user.activo ? (
                          <><XCircle className="h-3.5 w-3.5 mr-1" /> Desactivar</>
                        ) : (
                          <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activar</>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar usuario */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) setFormError(""); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              {editingUser ? `Editar: ${editingUser.usuario}` : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {!editingUser && (
              <div className="space-y-1.5">
                <Label htmlFor="u-usuario">Usuario</Label>
                <Input
                  id="u-usuario"
                  placeholder="nombre_usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData((p) => ({ ...p, usuario: e.target.value }))}
                  autoComplete="off"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="u-nombre">Nombre completo</Label>
              <Input
                id="u-nombre"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-password">
                Contraseña {editingUser && <span className="text-slate-400 text-xs">(dejar vacío para no cambiar)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="u-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={editingUser ? "Nueva contraseña (opcional)" : "Mínimo 6 caracteres"}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-rol">Rol</Label>
              <Select
                value={formData.rol}
                onValueChange={(v) => setFormData((p) => ({ ...p, rol: v }))}
              >
                <SelectTrigger id="u-rol">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="ALMACENERO">Almacenero</SelectItem>
                  <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                  <SelectItem value="USER">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : editingUser ? "Actualizar" : "Crear usuario"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
          <TabsList className="grid w-full grid-cols-7 bg-white shadow-sm">
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
            <TabsTrigger value="facturas" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Facturas
            </TabsTrigger>
            <TabsTrigger value="consola" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Consola
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
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

          <TabsContent value="facturas">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facturas Electrónicas</CardTitle>
              </CardHeader>
              <CardContent>
                <FacturasTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consola">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> Consola del Servidor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConsolaTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <UsuariosTab />
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
