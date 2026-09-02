"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Users, Search, Loader2, FileText, ExternalLink, CalendarIcon, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  searchApi,
  type OrdenCompraData,
  type OrdenServicioData,
  urlHelpers,
} from "@/lib/connections";
import { useWebSocket } from "@/lib/useWebSocket";

// Helper para parsear fechas DATE del backend sin conversión de zona horaria
const parseDateSafe = (dateString: string): Date => {
  if (dateString && !dateString.includes("T")) {
    return parseISO(dateString + "T12:00:00");
  }
  return parseISO(dateString);
};

// Helper para formatear fecha string YYYY-MM-DD a dd/MM/yyyy
const formatDateString = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  try {
    return format(parseDateSafe(dateString), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateString;
  }
};

function AutorizacionBadge({ value }: { value: boolean | null | undefined }) {
  if (value === true) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobado</Badge>;
  }
  if (value === false) {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
  }
  return <span className="text-slate-400 text-xs">-</span>;
}

function DocLink({
  href,
  label,
  icon,
  className,
}: {
  href: string | null | undefined;
  label: string;
  icon: React.ReactNode;
  className: string;
}) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed whitespace-nowrap">
        {icon}
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${className}`}
    >
      {icon}
      {label}
    </a>
  );
}

function DocumentosLinks({
  pdfUrl,
  url,
  urlCotizacion,
  urlFactura,
  urlComprobanteRetencion,
  nroSerie,
}: {
  pdfUrl: string;
  url: string | null | undefined;
  urlCotizacion: string | null | undefined;
  urlFactura: string | null | undefined;
  urlComprobanteRetencion: string | null | undefined;
  nroSerie: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <DocLink href={pdfUrl} label="PDF" icon={<FileText className="h-3 w-3" />} className="bg-red-100 text-red-700 hover:bg-red-200" />
        <DocLink href={url} label="Operación" icon={<ExternalLink className="h-3 w-3" />} className="bg-blue-100 text-blue-700 hover:bg-blue-200" />
        <DocLink href={urlCotizacion} label="Cotización" icon={<ExternalLink className="h-3 w-3" />} className="bg-purple-100 text-purple-700 hover:bg-purple-200" />
        <DocLink href={urlFactura} label="Factura" icon={<ExternalLink className="h-3 w-3" />} className="bg-orange-100 text-orange-700 hover:bg-orange-200" />
        <DocLink href={urlComprobanteRetencion} label="Comp. Ret." icon={<FileText className="h-3 w-3" />} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200" />
      </div>
      {urlComprobanteRetencion && nroSerie && (
        <span className="text-[11px] text-slate-500">
          N° Serie: <span className="font-mono text-indigo-700">{nroSerie}</span>
        </span>
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string | null | undefined }) {
  const clase =
    estado === "PENDIENTE"
      ? "bg-yellow-100 text-yellow-800"
      : estado === "APROBADA"
        ? "bg-green-100 text-green-800"
        : estado === "COMPLETADA"
          ? "bg-blue-100 text-blue-800"
          : "bg-slate-100 text-slate-800";
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${clase}`}>{estado || "-"}</span>;
}

const PAGE_SIZE = 20;

export default function RegistroRecursosHumanosPage() {
  const [tab, setTab] = useState<"compra" | "servicio">("compra");

  // ---- Búsqueda y filtros (compartidos entre ambas pestañas) ----
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [fechaFiltro, setFechaFiltro] = useState<Date | undefined>(undefined);

  const filtros = useMemo(
    () => ({
      estado: filtroEstado !== "TODOS" ? filtroEstado : undefined,
      fecha: fechaFiltro ? format(fechaFiltro, "yyyy-MM-dd") : undefined,
    }),
    [filtroEstado, fechaFiltro]
  );

  // ---- Órdenes de Compra ----
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompraData[]>([]);
  const [totalCompra, setTotalCompra] = useState(0);
  const [pageCompra, setPageCompra] = useState(1);
  const [isLoadingCompra, setIsLoadingCompra] = useState(false);
  const totalPagesCompra = Math.max(1, Math.ceil(totalCompra / PAGE_SIZE));

  const fetchOrdenesCompra = useCallback(async () => {
    setIsLoadingCompra(true);
    try {
      const result = await searchApi.ordenesCompra(searchTerm, pageCompra, PAGE_SIZE, filtros);
      setOrdenesCompra(result.data);
      setTotalCompra(result.total);
    } catch (error) {
      console.error("Error al cargar órdenes de compra:", error);
      setOrdenesCompra([]);
    } finally {
      setIsLoadingCompra(false);
    }
  }, [searchTerm, pageCompra, filtros]);

  // ---- Órdenes de Servicio ----
  const [ordenesServicio, setOrdenesServicio] = useState<OrdenServicioData[]>([]);
  const [totalServicio, setTotalServicio] = useState(0);
  const [pageServicio, setPageServicio] = useState(1);
  const [isLoadingServicio, setIsLoadingServicio] = useState(false);
  const totalPagesServicio = Math.max(1, Math.ceil(totalServicio / PAGE_SIZE));

  const fetchOrdenesServicio = useCallback(async () => {
    setIsLoadingServicio(true);
    try {
      const result = await searchApi.ordenesServicio(searchTerm, pageServicio, PAGE_SIZE, filtros);
      setOrdenesServicio(result.data);
      setTotalServicio(result.total);
    } catch (error) {
      console.error("Error al cargar órdenes de servicio:", error);
      setOrdenesServicio([]);
    } finally {
      setIsLoadingServicio(false);
    }
  }, [searchTerm, pageServicio, filtros]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrdenesCompra();
      fetchOrdenesServicio();
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, pageCompra, pageServicio, filtros, fetchOrdenesCompra, fetchOrdenesServicio]);

  // WebSocket: refrescar automáticamente ante cambios (vista de solo lectura)
  useWebSocket("ordenCompraUpdated", fetchOrdenesCompra);
  useWebSocket("ordenServicioUpdated", fetchOrdenesServicio);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-indigo-700">
                  Recursos Humanos
                </h1>
                <p className="text-sm text-slate-600">
                  Consulta de órdenes de compra y servicio (solo lectura)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 pb-8 space-y-6 max-w-[1800px]">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "compra" | "servicio")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="compra">Órdenes de Compra</TabsTrigger>
            <TabsTrigger value="servicio">Órdenes de Servicio</TabsTrigger>
          </TabsList>

          {/* Filtros comunes */}
          <Card className="mt-4">
            <CardContent className="pt-6 flex flex-wrap items-end gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar por número de orden o proveedor..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPageCompra(1);
                    setPageServicio(1);
                  }}
                  className="pl-10 bg-white"
                />
              </div>

              <div className="min-w-[180px]">
                <Select
                  value={filtroEstado}
                  onValueChange={(v) => {
                    setFiltroEstado(v);
                    setPageCompra(1);
                    setPageServicio(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los estados</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="APROBADA">Aprobada</SelectItem>
                    <SelectItem value="COMPLETADA">Completada</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    <SelectItem value="FIRMADA">Firmada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFiltro ? format(fechaFiltro, "PPP", { locale: es }) : <span>Filtrar por fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaFiltro}
                    onSelect={(d) => {
                      setFechaFiltro(d);
                      setPageCompra(1);
                      setPageServicio(1);
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {fechaFiltro && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFechaFiltro(undefined);
                    setPageCompra(1);
                    setPageServicio(1);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar fecha
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ─────────────── TAB ÓRDENES DE COMPRA ─────────────── */}
          <TabsContent value="compra" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Órdenes de Compra</span>
                  {totalCompra > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">{totalCompra} total</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCompra ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : ordenesCompra.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron órdenes con ese criterio" : "No hay órdenes de compra registradas"}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="min-w-[180px]">Proveedor</TableHead>
                          <TableHead>N° Factura</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Admin.</TableHead>
                          <TableHead>Jefe Proy.</TableHead>
                          <TableHead>Contab.</TableHead>
                          <TableHead className="min-w-[320px]">Documentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordenesCompra.map((orden) => (
                          <TableRow key={orden.id_orden_compra}>
                            <TableCell className="font-mono font-semibold text-blue-600">
                              {orden.numero_orden}
                            </TableCell>
                            <TableCell>{formatDateString(orden.fecha_orden)}</TableCell>
                            <TableCell className="max-w-[220px] truncate">
                              {orden.nombre_proveedor || <span className="text-slate-400 italic">Sin proveedor</span>}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {orden.nro_factura || orden.multifacturas_nros || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-green-700">
                              {orden.moneda === "SOLES" ? "S/." : "$"} {Number(orden.total).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <EstadoBadge estado={orden.estado} />
                            </TableCell>
                            <TableCell>
                              <AutorizacionBadge value={orden.auto_administrador} />
                            </TableCell>
                            <TableCell>
                              <AutorizacionBadge value={orden.jefe_proyecto} />
                            </TableCell>
                            <TableCell>
                              <AutorizacionBadge value={orden.auto_contabilidad} />
                            </TableCell>
                            <TableCell>
                              {orden.id_orden_compra && (
                                <DocumentosLinks
                                  pdfUrl={urlHelpers.getOrdenCompraPdfUrl(orden.id_orden_compra)}
                                  url={orden.url}
                                  urlCotizacion={orden.url_cotizacion}
                                  urlFactura={orden.url_factura}
                                  urlComprobanteRetencion={orden.url_comprobante_retencion}
                                  nroSerie={orden.nro_serie}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalPagesCompra > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageCompra((p) => Math.max(1, p - 1))}
                      disabled={pageCompra <= 1 || isLoadingCompra}
                    >
                      ← Anterior
                    </Button>
                    <span className="text-sm text-slate-600">
                      Página {pageCompra} de {totalPagesCompra}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageCompra((p) => Math.min(totalPagesCompra, p + 1))}
                      disabled={pageCompra >= totalPagesCompra || isLoadingCompra}
                    >
                      Siguiente →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─────────────── TAB ÓRDENES DE SERVICIO ─────────────── */}
          <TabsContent value="servicio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Órdenes de Servicio</span>
                  {totalServicio > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">{totalServicio} total</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingServicio ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : ordenesServicio.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron órdenes con ese criterio" : "No hay órdenes de servicio registradas"}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="min-w-[180px]">Proveedor</TableHead>
                          <TableHead>N° Factura</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Admin.</TableHead>
                          <TableHead>Jefe Proy.</TableHead>
                          <TableHead>Contab.</TableHead>
                          <TableHead className="min-w-[320px]">Documentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordenesServicio.map((orden) => (
                          <TableRow key={orden.id_orden_servicio}>
                            <TableCell className="font-mono font-semibold text-green-600">
                              {orden.numero_orden}
                            </TableCell>
                            <TableCell>{formatDateString(orden.fecha_orden)}</TableCell>
                            <TableCell className="max-w-[220px] truncate">
                              {orden.nombre_proveedor || <span className="text-slate-400 italic">Sin proveedor</span>}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {orden.nro_factura || orden.multifacturas_nros || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-green-700">
                              {orden.moneda === "SOLES" ? "S/." : "$"} {Number(orden.total).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <EstadoBadge estado={orden.estado} />
                            </TableCell>
                            <TableCell>
                              <AutorizacionBadge value={orden.auto_administrador} />
                            </TableCell>
                            <TableCell>
                              <AutorizacionBadge value={orden.jefe_proyecto} />
                            </TableCell>
                            <TableCell>
                              <AutorizacionBadge value={orden.auto_contabilidad} />
                            </TableCell>
                            <TableCell>
                              {orden.id_orden_servicio && (
                                <DocumentosLinks
                                  pdfUrl={urlHelpers.getOrdenServicioPdfUrl(orden.id_orden_servicio)}
                                  url={orden.url}
                                  urlCotizacion={orden.url_cotizacion}
                                  urlFactura={orden.url_factura}
                                  urlComprobanteRetencion={orden.url_comprobante_retencion}
                                  nroSerie={orden.nro_serie}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalPagesServicio > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageServicio((p) => Math.max(1, p - 1))}
                      disabled={pageServicio <= 1 || isLoadingServicio}
                    >
                      ← Anterior
                    </Button>
                    <span className="text-sm text-slate-600">
                      Página {pageServicio} de {totalPagesServicio}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageServicio((p) => Math.min(totalPagesServicio, p + 1))}
                      disabled={pageServicio >= totalPagesServicio || isLoadingServicio}
                    >
                      Siguiente →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
