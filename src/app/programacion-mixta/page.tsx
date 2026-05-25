"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  FileText, ExternalLink, Folder, GitBranch, Search, Filter, Clock,
  Truck, User, Download, Archive, Loader2, FileDown, MapPin, Package, Trash2,
} from "lucide-react";
import {
  programacionApi, guiasRemisionExtendidoApi, guiasRemisionApi,
  type ProgramacionTecnicaData, type GuiaRemisionData,
} from "@/lib/connections";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";
import { GuiaRemisionExtendidoModal } from "@/components/guia-remision-extendido-modal";

const PER_PAGE = 25;

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

// ── Paginación ────────────────────────────────────────────────────────────────
function PaginationBar({
  page, total, onChange,
}: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4 mt-2 border-t border-gray-100">
      <Button
        size="sm" variant="outline" onClick={() => onChange(page - 1)}
        disabled={page === 1} className="h-8 px-3 text-xs"
      >← Ant.</Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`d${i}`} className="px-1 text-gray-400 text-xs">…</span>
        ) : (
          <Button
            key={p} size="sm"
            variant={p === page ? "default" : "outline"}
            onClick={() => onChange(p as number)}
            className="h-8 w-8 p-0 text-xs"
          >{p}</Button>
        )
      )}
      <Button
        size="sm" variant="outline" onClick={() => onChange(page + 1)}
        disabled={page === total} className="h-8 px-3 text-xs"
      >Sig. →</Button>
    </div>
  );
}

// ── Pestaña Técnica (recibe datos del padre, sin fetch propio) ────────────────
interface TecnicaProps {
  data: ProgramacionTecnicaData[];
  isLoading: boolean;
  identificadoresConGuia: string[];
  onUpdate: (id: number, patch: Partial<ProgramacionTecnicaData>) => void;
}

function PestanaTecnica({ data, isLoading, identificadoresConGuia, onUpdate }: TecnicaProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const [filtroProg, setFiltroProg] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [page, setPage] = useState(1);

  // Volver a página 1 cuando cambian los filtros
  useEffect(() => setPage(1), [searchQuery, filtroProg, filtroEstado]);

  const valoresProg = useMemo(
    () => Array.from(new Set(data.map((d) => d.programacion).filter(Boolean))) as string[],
    [data]
  );
  const valoresEstado = useMemo(
    () => Array.from(new Set(data.map((d) => d.estado_programacion).filter(Boolean))) as string[],
    [data]
  );

  const dataFiltrada = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.filter((item) => {
      if (q &&
          !(item.unidad ?? "").toLowerCase().includes(q) &&
          !(item.proveedor ?? "").toLowerCase().includes(q) &&
          !(item.apellidos_nombres ?? "").toLowerCase().includes(q)) return false;
      if (filtroProg !== "TODOS" && item.programacion !== filtroProg) return false;
      if (filtroEstado !== "TODOS" && item.estado_programacion !== filtroEstado) return false;
      return true;
    });
  }, [data, searchQuery, filtroProg, filtroEstado]);

  const totalPages = Math.max(1, Math.ceil(dataFiltrada.length / PER_PAGE));
  const pageData = useMemo(
    () => dataFiltrada.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [dataFiltrada, page]
  );

  const hasArchivos = (item: ProgramacionTecnicaData) =>
    !!(item.enlace_del_pdf && item.enlace_del_xml && item.enlace_del_cdr);
  const hasEnProceso = (item: ProgramacionTecnicaData) =>
    !!(item.identificador_unico && identificadoresConGuia.includes(item.identificador_unico));

  const handleRecuperar = async (item: ProgramacionTecnicaData) => {
    toast.info("Consultando archivos en SUNAT...");
    try {
      const result = await programacionApi.recuperarArchivosGuia(item.id);
      if (result.success && result.data) {
        toast.success(result.message);
        onUpdate(item.id, {
          enlace_del_pdf: result.data.enlace_del_pdf,
          enlace_del_xml: result.data.enlace_del_xml,
          enlace_del_cdr: result.data.enlace_del_cdr,
          estado_gre: result.data.estado_gre,
        });
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error";
      if (msg.includes("NO EXISTE en Nubefact")) {
        toast.error("⚠️ DOCUMENTO NO EXISTE en Nubefact", { duration: 8000 });
      } else {
        toast.error(msg);
      }
    }
  };

  const goPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-semibold mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Unidad, proveedor o conductor..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Programación</Label>
              <Select value={filtroProg} onValueChange={setFiltroProg}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  {valoresProg.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {valoresEstado.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            {dataFiltrada.length} de {data.length} registros · Página {page}/{totalPages}
          </div>
        </CardContent>
      </Card>

      {/* Lista paginada */}
      <Card>
        <CardHeader><CardTitle>Registros</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : pageData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <FileText className="h-12 w-12 opacity-50" />
              <p className="text-sm">No hay registros disponibles</p>
            </div>
          ) : (
            <>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {pageData.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={`tec-${item.id}`}
                    className={`border rounded-lg shadow-sm ${
                      hasArchivos(item) ? "bg-green-50 border-green-300"
                        : hasEnProceso(item) ? "bg-cyan-50 border-cyan-300"
                        : "bg-white"
                    }`}
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                      <div className="flex items-center justify-between w-full gap-4 pr-4">
                        <div className="flex items-center gap-4 flex-wrap flex-1">
                          <div className="flex flex-col items-start min-w-[50px]">
                            <span className="text-xs text-gray-500 font-medium">ID</span>
                            <span className="text-sm font-mono font-bold text-blue-600">{item.id}</span>
                          </div>
                          <div className="flex flex-col items-start min-w-[90px]">
                            <span className="text-xs text-gray-500 font-medium">Fecha</span>
                            <span className="text-sm font-medium">{formatDatePeru(item.fecha)}</span>
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
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.estado_programacion === "OK" ? "bg-emerald-100 text-emerald-700"
                                : item.estado_programacion === "NO EJECUTADO" ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {item.estado_programacion || "—"}
                            </span>
                          </div>
                          {hasArchivos(item) && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800">Guía completa</span>
                          )}
                          {hasEnProceso(item) && !hasArchivos(item) && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-200 text-cyan-800">En proceso</span>
                          )}
                          {item.numero_orden && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800 flex items-center gap-1">
                              <Truck className="h-3 w-3" /> Viaje activo
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2">
                        {/* Conductor / Proyecto */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <User className="h-3.5 w-3.5" /> Conductor / Proyecto
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs text-gray-500 block">Apellidos y Nombres</span>
                              <span className="text-sm font-medium">{item.apellidos_nombres || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Proyecto</span>
                              <div className="flex items-center gap-1 text-sm font-medium">
                                {item.tipo_proyecto === "proyecto" ? <Folder className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                  : item.tipo_proyecto === "subproyecto" ? <GitBranch className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                                  : null}
                                <span>{item.proyectos || "—"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Viaje */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Truck className="h-3.5 w-3.5" /> Datos del Viaje
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500 block">Programación</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                item.programacion === "AFIRMADO" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : item.programacion === "ELIMINACION" ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-50 text-slate-700 border border-slate-200"
                              }`}>{item.programacion || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 flex items-center gap-1 block">
                                <Clock className="h-3 w-3" /> H. Partida
                              </span>
                              <span className="text-sm font-mono font-medium text-blue-700">{formatTimePeru(item.hora_partida)}</span>
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
                        {/* Archivos */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" /> Archivos GRE
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.enlace_del_pdf
                              ? <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_pdf!, "_blank")} className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 h-7 text-xs px-2">PDF</Button>
                              : <span className="text-xs text-gray-400">Sin PDF</span>}
                            {item.enlace_del_xml
                              ? <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_xml!, "_blank")} className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 h-7 text-xs px-2">XML</Button>
                              : <span className="text-xs text-gray-400">Sin XML</span>}
                            {item.enlace_del_cdr
                              ? <Button size="sm" variant="outline" onClick={() => window.open(item.enlace_del_cdr!, "_blank")} className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 h-7 text-xs px-2">CDR</Button>
                              : <span className="text-xs text-gray-400">Sin CDR</span>}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                            <Button size="sm" variant="outline"
                              onClick={() => router.push(`/guia-remision?id=${item.id}`)}
                              className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300 h-7 text-xs">
                              <FileText className="h-3.5 w-3.5 mr-1" /> Generar Guía
                            </Button>
                            {hasEnProceso(item) && !hasArchivos(item) && (
                              <Button size="sm" variant="outline" onClick={() => handleRecuperar(item)}
                                className="bg-white hover:bg-orange-50 text-orange-700 border-orange-300 h-7 text-xs">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Recuperar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <PaginationBar page={page} total={totalPages} onChange={goPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Pestaña Extendida ─────────────────────────────────────────────────────────
// Carga lazy: solo fetchea guías extendidas para ítems de la página actual.
// Solo hace polling de guías que estén pendientes en la página actual.
interface ExtendidaProps {
  data: ProgramacionTecnicaData[];
  isLoading: boolean;
  identificadoresEnTablaRegular: string[];
  guiasExtendidas: Record<string, GuiaRemisionData[]>;
  onFetchGuias: (identificador: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

function PestanaExtendida({
  data, isLoading, identificadoresEnTablaRegular,
  guiasExtendidas, onFetchGuias, onRefreshData,
}: ExtendidaProps) {
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [descargandoZip, setDescargandoZip] = useState<string | null>(null);

  useEffect(() => setPage(1), [searchQuery]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.filter((item) => {
      if (q &&
          !item.proveedor?.toLowerCase().includes(q) &&
          !item.apellidos_nombres?.toLowerCase().includes(q) &&
          !item.proyectos?.toLowerCase().includes(q) &&
          !item.id.toString().includes(searchQuery)) return false;
      if (item.identificador_unico && identificadoresEnTablaRegular.includes(item.identificador_unico)) return false;
      return true;
    });
  }, [data, searchQuery, identificadoresEnTablaRegular]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const pageData = useMemo(
    () => filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filteredData, page]
  );

  // Lazy load: fetch guías solo para la página actual que aún no están en caché
  useEffect(() => {
    pageData.forEach((item) => {
      if (item.identificador_unico && !(item.identificador_unico in guiasExtendidas)) {
        onFetchGuias(item.identificador_unico);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData]);

  // Polling solo para ítems de la página actual con guías pendientes
  useEffect(() => {
    const intervalId = setInterval(() => {
      pageData.forEach((item) => {
        if (!item.identificador_unico) return;
        const guias = guiasExtendidas[item.identificador_unico];
        const hasPending = guias?.some((g) => !g.enlace_del_pdf || !g.enlace_del_xml || !g.enlace_del_cdr);
        if (hasPending) onFetchGuias(item.identificador_unico);
      });
    }, 15000);
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData, guiasExtendidas]);

  const hasGuiasCompletadas = (item: ProgramacionTecnicaData) => {
    if (!item.identificador_unico) return false;
    return guiasExtendidas[item.identificador_unico]?.some(
      (g) => g.enlace_del_pdf && g.enlace_del_xml && g.enlace_del_cdr
    ) ?? false;
  };
  const hasGuiaEnProceso = (item: ProgramacionTecnicaData) => {
    if (!item.identificador_unico) return false;
    return guiasExtendidas[item.identificador_unico]?.some(
      (g) => g.estado_gre === "PENDIENTE" || g.estado_gre === "PROCESANDO" || !g.estado_gre
    ) ?? false;
  };

  const handleRecuperarGuia = async (guia: GuiaRemisionData, identificador: string) => {
    if (!guia.id_guia) { toast.error("ID de guía no encontrado"); return; }
    toast.info(`Consultando guía ${guia.serie}-${String(guia.numero).padStart(4, "0")}...`);
    try {
      const result = await guiasRemisionExtendidoApi.recuperarArchivosGuia(guia.id_guia);
      if (result.success) { toast.success(result.message); await onFetchGuias(identificador); }
      else toast.warning(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al recuperar");
    }
  };

  const handleEliminarGuia = async (guia: GuiaRemisionData, identificador: string) => {
    if (!guia.id_guia) { toast.error("ID de guía no encontrado"); return; }
    if (!confirm(`¿Eliminar guía ${guia.serie}-${String(guia.numero).padStart(4, "0")}?`)) return;
    try {
      const result = await guiasRemisionExtendidoApi.delete(guia.id_guia);
      toast.success(result.message || "Guía eliminada");
      await onFetchGuias(identificador);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleDescargarZip = async (identificador: string) => {
    const completas = (guiasExtendidas[identificador] ?? []).filter(
      (g) => g.enlace_del_pdf && g.enlace_del_xml && g.enlace_del_cdr
    );
    if (completas.length === 0) { toast.error("No hay guías con archivos completos"); return; }
    setDescargandoZip(identificador);
    toast.info(`Descargando ${completas.length * 3} archivos...`, { duration: 5000 });
    try {
      const response = await guiasRemisionExtendidoApi.descargarZip(identificador);
      const blob = new Blob([response], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `guias_${identificador}.zip`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
      toast.success("✅ Descarga completada");
    } catch { toast.error("Error al descargar el ZIP"); }
    finally { setDescargandoZip(null); }
  };

  const goPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por proveedor, conductor o proyecto..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="mt-3 text-sm text-gray-500">
            {filteredData.length} de {data.length} registros · Página {page}/{totalPages}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registros Extendidos</span>
            <Badge variant="secondary">
              {filteredData.length} {filteredData.length === 1 ? "registro" : "registros"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
            </div>
          ) : pageData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{searchQuery ? "Sin resultados" : "No hay registros"}</p>
            </div>
          ) : (
            <>
              <Accordion type="single" collapsible className="space-y-2">
                {pageData.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={`ext-${item.id}`}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      hasGuiasCompletadas(item) ? "border-l-4 border-green-500 bg-green-50/50"
                        : hasGuiaEnProceso(item) ? "border-l-4 border-cyan-500 bg-cyan-50/30"
                        : "border-slate-200"
                    }`}
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-slate-50">
                      <div className="flex items-center justify-between w-full gap-4 pr-4">
                        <div className="flex items-center gap-4 flex-wrap flex-1">
                          <div className="flex flex-col items-start min-w-[80px]">
                            <span className="text-xs text-slate-500 font-medium">ID</span>
                            <span className="text-sm font-mono font-bold text-orange-600">#{item.id}</span>
                          </div>
                          <div className="flex flex-col items-start min-w-[100px]">
                            <span className="text-xs text-slate-500 font-medium">Fecha</span>
                            <span className="text-sm font-medium">{formatDatePeru(item.fecha)}</span>
                          </div>
                          <div className="flex flex-col items-start min-w-[100px]">
                            <span className="text-xs text-slate-500 font-medium">Hora</span>
                            <span className="text-sm font-mono text-blue-600 font-medium">{formatTimePeru(item.hora_partida)}</span>
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
                            <Badge className={
                              item.estado_programacion === "OK"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : item.estado_programacion === "NO EJECUTADO"
                                ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                            }>
                              {item.estado_programacion || "-"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                              <Truck className="h-3 w-3" /> Transporte
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div><p className="text-xs text-slate-500">Unidad</p><p className="text-sm font-semibold">{item.unidad || "-"}</p></div>
                              <div><p className="text-xs text-slate-500">Proveedor</p><p className="text-sm font-semibold truncate">{item.proveedor || "-"}</p></div>
                              <div className="col-span-2"><p className="text-xs text-slate-500">Conductor</p><p className="text-sm font-semibold">{item.apellidos_nombres || "-"}</p></div>
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Proyecto
                            </h4>
                            {item.proyectos ? (
                              <div className="flex items-center gap-2">
                                {item.tipo_proyecto === "proyecto"
                                  ? <Folder className="h-4 w-4 text-blue-600" />
                                  : <GitBranch className="h-4 w-4 text-purple-600" />}
                                <div>
                                  <p className="text-xs text-slate-500">
                                    {item.tipo_proyecto === "proyecto" ? "Proyecto" : "Subproyecto"}
                                  </p>
                                  <p className="text-sm font-semibold">{item.proyectos}</p>
                                </div>
                              </div>
                            ) : <p className="text-sm text-slate-400 italic">Sin proyecto asignado</p>}
                          </div>
                        </div>

                        {/* Guías generadas */}
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Guías Generadas ({(item.identificador_unico && guiasExtendidas[item.identificador_unico]?.length) ?? 0})
                            </h4>
                            {item.identificador_unico &&
                              (guiasExtendidas[item.identificador_unico] ?? []).some(
                                (g) => g.enlace_del_pdf && g.enlace_del_xml && g.enlace_del_cdr
                              ) && (
                              <Button
                                size="sm" variant="outline"
                                onClick={() => handleDescargarZip(item.identificador_unico!)}
                                disabled={descargandoZip === item.identificador_unico}
                                className="h-6 px-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 disabled:opacity-60"
                              >
                                {descargandoZip === item.identificador_unico
                                  ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Descargando...</>
                                  : <><Archive className="h-3 w-3 mr-1" />Descargar Todo</>}
                              </Button>
                            )}
                          </div>

                          {/* Estado de carga lazy */}
                          {item.identificador_unico && !(item.identificador_unico in guiasExtendidas) ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Loader2 className="h-3 w-3 animate-spin" /> Cargando guías...
                            </div>
                          ) : (guiasExtendidas[item.identificador_unico ?? ""] ?? []).length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {(guiasExtendidas[item.identificador_unico!] ?? []).map((guia, idx) => {
                                const hasLinks = guia.enlace_del_pdf && guia.enlace_del_xml && guia.enlace_del_cdr;
                                const isPending = guia.estado_gre === "PENDIENTE" || guia.estado_gre === "PROCESANDO" || !guia.estado_gre;
                                const isFailed = guia.estado_gre === "FALLADO";
                                return (
                                  <div key={guia.id_guia} className={`bg-white rounded border p-2 ${
                                    hasLinks ? "border-green-200" : isPending ? "border-cyan-200" : isFailed ? "border-red-200" : "border-slate-200"
                                  }`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold text-slate-600">
                                        Guía #{idx + 1}: {guia.serie}-{String(guia.numero).padStart(4, "0")}
                                      </span>
                                      <Badge variant="outline" className={`text-xs ${
                                        hasLinks ? "bg-green-50 text-green-700 border-green-200"
                                          : isPending ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                          : isFailed ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-slate-50 text-slate-700 border-slate-200"
                                      }`}>
                                        {hasLinks ? "Completada" : isPending ? "Procesando" : isFailed ? "Fallida" : "Pendiente"}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1 items-center">
                                      {guia.enlace_del_pdf
                                        ? <Button size="sm" variant="outline" onClick={() => window.open(guia.enlace_del_pdf, "_blank")} className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"><Download className="h-3 w-3 mr-1" />PDF</Button>
                                        : <span className="text-xs text-slate-400 px-2">-</span>}
                                      {guia.enlace_del_xml
                                        ? <Button size="sm" variant="outline" onClick={() => window.open(guia.enlace_del_xml, "_blank")} className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"><Download className="h-3 w-3 mr-1" />XML</Button>
                                        : <span className="text-xs text-slate-400 px-2">-</span>}
                                      {guia.enlace_del_cdr
                                        ? <Button size="sm" variant="outline" onClick={() => window.open(guia.enlace_del_cdr, "_blank")} className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"><Download className="h-3 w-3 mr-1" />CDR</Button>
                                        : <span className="text-xs text-slate-400 px-2">-</span>}
                                      {!hasLinks && (
                                        <Button size="sm" variant="outline"
                                          onClick={() => handleRecuperarGuia(guia, item.identificador_unico!)}
                                          className="h-6 px-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200">
                                          <ExternalLink className="h-3 w-3 mr-1" />Recuperar
                                        </Button>
                                      )}
                                      <Button size="sm" variant="outline"
                                        onClick={() => handleEliminarGuia(guia, item.identificador_unico!)}
                                        className="h-6 px-2 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200">
                                        <Trash2 className="h-3 w-3 mr-1" />Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No hay guías generadas aún</p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          <Button
                            size="sm"
                            onClick={() => { setSelectedItemId(item.id); setModalOpen(true); }}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                          >
                            <FileText className="h-4 w-4 mr-2" /> Generar Guía
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <PaginationBar page={page} total={totalPages} onChange={goPage} />
            </>
          )}
        </CardContent>
      </Card>

      {selectedItemId && (
        <GuiaRemisionExtendidoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          programacionId={selectedItemId}
          onSuccess={async () => {
            const reg = data.find((i) => i.id === selectedItemId);
            if (reg?.identificador_unico) await onFetchGuias(reg.identificador_unico);
            await onRefreshData();
            toast.success("Guías extendidas creadas exitosamente");
          }}
        />
      )}
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────
// Carga todos los datos UNA sola vez y los pasa a las dos pestañas.
// El export modal usa los proveedores derivados del estado ya cargado (0 fetches extra).
export default function ProgramacionMixtaPage() {
  const [data, setData] = useState<ProgramacionTecnicaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [identificadoresConGuia, setIdentificadoresConGuia] = useState<string[]>([]);
  const [identificadoresEnTablaRegular, setIdentificadoresEnTablaRegular] = useState<string[]>([]);
  const [guiasExtendidas, setGuiasExtendidas] = useState<Record<string, GuiaRemisionData[]>>({});
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedProveedores, setSelectedProveedores] = useState<Set<string>>(new Set());
  const [exportando, setExportando] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tecnicaData, idsConGuia, idsRegular] = await Promise.all([
        programacionApi.getAllTecnica(),
        programacionApi.getIdentificadoresConGuia(),
        guiasRemisionApi.getIdentificadoresExistentes(),
      ]);
      const seen = new Set<number>();
      const clean = tecnicaData.filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
      setData(clean);
      setIdentificadoresConGuia(idsConGuia);
      setIdentificadoresEnTablaRegular(idsRegular);
    } catch {
      toast.error("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Polling de registros recién completados (compartido entre pestañas, un solo intervalo)
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const recientes = await programacionApi.getRecienCompletados(30);
        if (!recientes.length) return;
        setData((prev) => {
          const next = [...prev];
          let changed = false;
          recientes.forEach((c) => {
            const idx = next.findIndex((i) => i.id === c.id);
            if (idx !== -1) { next[idx] = c; changed = true; }
            else { next.unshift(c); changed = true; }
            if (c.identificador_unico) {
              setIdentificadoresConGuia((p) =>
                p.includes(c.identificador_unico!) ? p : [...p, c.identificador_unico!]
              );
            }
          });
          return changed ? next : prev;
        });
      } catch { /* silenciar */ }
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // fetchGuiasExtendidas con caché: no vuelve a pedir si ya está cargado y hay datos
  const fetchGuiasExtendidas = useCallback(async (identificador: string) => {
    try {
      const guias = await guiasRemisionExtendidoApi.getByIdentificador(identificador);
      setGuiasExtendidas((prev) => ({ ...prev, [identificador]: guias }));
    } catch { /* silenciar */ }
  }, []);

  const handleUpdateItem = useCallback((id: number, patch: Partial<ProgramacionTecnicaData>) => {
    setData((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }, []);

  // Proveedores derivados del estado ya cargado — cero llamadas extra al exportar
  const proveedores = useMemo(
    () => Array.from(new Set(data.map((d) => d.proveedor).filter(Boolean) as string[])).sort(),
    [data]
  );

  const handleAbrirExportModal = () => {
    setSelectedProveedores(new Set(proveedores));
    setExportModalOpen(true);
  };

  const handleExportExcel = async () => {
    setExportando(true);
    try {
      const filtro = selectedProveedores.size === proveedores.length
        ? undefined
        : Array.from(selectedProveedores);
      const buffer = await programacionApi.exportarExcelMixto({ proveedores: filtro });
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `programacion_mixta_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Excel exportado correctamente");
      setExportModalOpen(false);
    } catch {
      toast.error("Error al exportar el archivo Excel");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
        <div className="mx-auto w-full">

          {/* Encabezado */}
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Programación Mixta</h1>
              <p className="text-muted-foreground">
                Programación Técnica + Programación Extendida
                {!isLoading && data.length > 0 && (
                  <span className="ml-2 text-xs font-medium text-blue-600">
                    ({data.length} registros cargados)
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleAbrirExportModal}
              disabled={isLoading || data.length === 0}
              className="bg-white hover:bg-green-50 text-green-700 border-green-300 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Excel (Mixto)
            </Button>
          </div>

          {/* Pestañas */}
          <Tabs defaultValue="tecnica" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tecnica" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Programación Técnica
              </TabsTrigger>
              <TabsTrigger value="extendida" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Programación Extendida
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tecnica">
              <PestanaTecnica
                data={data}
                isLoading={isLoading}
                identificadoresConGuia={identificadoresConGuia}
                onUpdate={handleUpdateItem}
              />
            </TabsContent>

            <TabsContent value="extendida">
              <PestanaExtendida
                data={data}
                isLoading={isLoading}
                identificadoresEnTablaRegular={identificadoresEnTablaRegular}
                guiasExtendidas={guiasExtendidas}
                onFetchGuias={fetchGuiasExtendidas}
                onRefreshData={fetchData}
              />
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Modal exportar Excel */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-green-600" />
              Exportar Excel Mixto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              El archivo tendrá <strong>1 hoja</strong> con todos los registros de
              Programación Técnica y Extendida combinados.
              Selecciona las empresas a incluir:
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedProveedores(new Set(proveedores))}>Todas</Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedProveedores(new Set())}>Ninguna</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3 bg-slate-50">
              {proveedores.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-2">No hay empresas cargadas</p>
              ) : proveedores.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <Checkbox
                    id={`ep-${p}`}
                    checked={selectedProveedores.has(p)}
                    onCheckedChange={(checked) => {
                      setSelectedProveedores((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(p); else next.delete(p);
                        return next;
                      });
                    }}
                  />
                  <label htmlFor={`ep-${p}`} className="text-sm cursor-pointer flex-1 leading-tight">{p}</label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {selectedProveedores.size === 0
                ? "⚠️ No hay empresas seleccionadas"
                : selectedProveedores.size === proveedores.length
                ? "Se exportarán todas las empresas"
                : `${selectedProveedores.size} de ${proveedores.length} empresa(s) seleccionada(s)`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModalOpen(false)} disabled={exportando}>Cancelar</Button>
            <Button
              onClick={handleExportExcel}
              disabled={exportando || selectedProveedores.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {exportando
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</>
                : <><FileDown className="h-4 w-4 mr-2" />Exportar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
