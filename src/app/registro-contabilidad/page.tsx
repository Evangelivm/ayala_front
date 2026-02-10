"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ordenesCompraApi,
  type OrdenCompraData,
  ordenesServicioApi,
  type OrdenServicioData,
  urlHelpers,
} from "@/lib/connections";
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
import { ClipboardList, FileText, CheckCircle, Search, Filter, ExternalLink, CalendarIcon, X, Upload } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWebSocket } from "@/lib/useWebSocket";

// Helper para parsear fechas DATE del backend sin conversión de zona horaria
const parseDateSafe = (dateString: string): Date => {
  // Si la fecha viene sin hora (DATE en SQL), agregamos T12:00:00 para evitar problemas de zona horaria
  if (dateString && !dateString.includes('T')) {
    return parseISO(dateString + 'T12:00:00');
  }
  return parseISO(dateString);
};

// Helper para formatear fecha string YYYY-MM-DD a dd/MM/yyyy sin usar Date
const formatDateString = (dateString: string | null | undefined): string => {
  if (!dateString) return '';

  // Si la fecha ya está en formato YYYY-MM-DD, convertir a dd/MM/yyyy
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  // Si no coincide, intentar parsear normalmente
  try {
    return format(parseDateSafe(dateString), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateString;
  }
};

export default function RegistroContabilidadPage() {
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompraData[]>([]);
  const [ordenesServicio, setOrdenesServicio] = useState<OrdenServicioData[]>([]);

  // Estados para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [filtroContabilidad, setFiltroContabilidad] = useState<string>("TODOS");
  const [fechaFiltro, setFechaFiltro] = useState<Date | undefined>(undefined);

  // Estados para subida de comprobante de retención
  const [isUploadComprobanteDialogOpen, setIsUploadComprobanteDialogOpen] = useState(false);
  const [selectedFileComprobante, setSelectedFileComprobante] = useState<File | null>(null);
  const [currentOrdenIdForUpload, setCurrentOrdenIdForUpload] = useState<number | null>(null);
  const [currentOrdenTypeForUpload, setCurrentOrdenTypeForUpload] = useState<"compra" | "servicio" | null>(null);
  const [nroSerie, setNroSerie] = useState<string>("");

  // Funciones para cargar órdenes
  const loadOrdenesCompra = useCallback(async () => {
    try {
      const data = await ordenesCompraApi.getAll();
      setOrdenesCompra(data);
    } catch (error) {
      console.error("Error loading ordenes compra:", error);
      setOrdenesCompra([]);
    }
  }, []);

  const loadOrdenesServicio = useCallback(async () => {
    try {
      const data = await ordenesServicioApi.getAll();
      setOrdenesServicio(data);
    } catch (error) {
      console.error("Error loading ordenes servicio:", error);
      setOrdenesServicio([]);
    }
  }, []);

  // Cargar órdenes al montar el componente
  useEffect(() => {
    loadOrdenesCompra();
    loadOrdenesServicio();
  }, [loadOrdenesCompra, loadOrdenesServicio]);

  // WebSocket: Escuchar actualizaciones en tiempo real
  const handleOrdenCompraUpdate = useCallback(() => {
    loadOrdenesCompra();
  }, [loadOrdenesCompra]);

  const handleOrdenServicioUpdate = useCallback(() => {
    loadOrdenesServicio();
  }, [loadOrdenesServicio]);

  useWebSocket('ordenCompraUpdated', handleOrdenCompraUpdate);
  useWebSocket('ordenServicioUpdated', handleOrdenServicioUpdate);

  // Función para aprobar orden de compra
  const handleAprobarOrdenCompra = async (id: number) => {
    if (!confirm("¿Está seguro de que desea aprobar esta orden de compra para contabilidad?")) {
      return;
    }

    try {
      toast.loading("Aprobando orden de compra...");
      await ordenesCompraApi.aprobarContabilidad(id);
      toast.dismiss();
      toast.success("Orden de compra aprobada para contabilidad exitosamente");
      loadOrdenesCompra();
    } catch (error) {
      console.error("Error al aprobar orden de compra:", error);
      toast.dismiss();
      toast.error("Error al aprobar la orden de compra", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // Función para aprobar orden de servicio
  const handleAprobarOrdenServicio = async (id: number) => {
    if (!confirm("¿Está seguro de que desea aprobar esta orden de servicio para contabilidad?")) {
      return;
    }

    try {
      toast.loading("Aprobando orden de servicio...");
      await ordenesServicioApi.aprobarContabilidad(id);
      toast.dismiss();
      toast.success("Orden de servicio aprobada para contabilidad exitosamente");
      loadOrdenesServicio();
    } catch (error) {
      console.error("Error al aprobar orden de servicio:", error);
      toast.dismiss();
      toast.error("Error al aprobar la orden de servicio", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // ===== HANDLERS PARA SUBIDA DE COMPROBANTE DE RETENCIÓN =====

  // Función para abrir el diálogo de subida de comprobante
  const handleOpenUploadComprobanteDialog = (ordenId: number, type: "compra" | "servicio") => {
    setCurrentOrdenIdForUpload(ordenId);
    setCurrentOrdenTypeForUpload(type);
    setNroSerie("");
    setIsUploadComprobanteDialogOpen(true);
  };

  // Función para cerrar el diálogo de subida de comprobante
  const handleCloseUploadComprobanteDialog = () => {
    setIsUploadComprobanteDialogOpen(false);
    setSelectedFileComprobante(null);
    setCurrentOrdenIdForUpload(null);
    setCurrentOrdenTypeForUpload(null);
    setNroSerie("");
  };

  // Función para manejar la selección de archivo de comprobante
  const handleFileComprobanteSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileComprobante(file);
    }
  };

  // Función para confirmar la subida de comprobante
  const handleConfirmUploadComprobante = async () => {
    if (!selectedFileComprobante || !currentOrdenIdForUpload || !currentOrdenTypeForUpload) {
      toast.error("No se ha seleccionado un archivo");
      return;
    }

    if (!nroSerie.trim()) {
      toast.error("Debe ingresar el número de serie");
      return;
    }

    try {
      toast.loading("Subiendo comprobante de retención...");

      const formData = new FormData();
      formData.append('file', selectedFileComprobante);
      formData.append('nro_serie', nroSerie.trim());

      if (currentOrdenTypeForUpload === "compra") {
        await ordenesCompraApi.uploadComprobanteRetencion(currentOrdenIdForUpload, formData);
      } else {
        await ordenesServicioApi.uploadComprobanteRetencion(currentOrdenIdForUpload, formData);
      }

      toast.dismiss();
      toast.success("Comprobante de retención subido exitosamente");
      handleCloseUploadComprobanteDialog();

      // Recargar las órdenes para actualizar los links
      loadOrdenesCompra();
      loadOrdenesServicio();
    } catch (error) {
      console.error("Error al subir comprobante de retención:", error);
      toast.dismiss();
      toast.error("Error al subir el comprobante de retención", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // Función para filtrar órdenes de compra
  const ordenesFiltradas = useMemo(() => {
    return ordenesCompra.filter((orden) => {
      // Filtro por búsqueda (número de orden, proveedor)
      const matchSearch = searchQuery === "" ||
        orden.numero_orden?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.nombre_proveedor?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro por estado
      const matchEstado = filtroEstado === "TODOS" || orden.estado === filtroEstado;

      // Filtro por aprobación contabilidad
      const matchContabilidad =
        filtroContabilidad === "TODOS" ||
        (filtroContabilidad === "APROBADO" && orden.auto_contabilidad === true) ||
        (filtroContabilidad === "PENDIENTE" && (orden.auto_contabilidad === false || !orden.auto_contabilidad));

      // Filtro por fecha
      const matchFecha = !fechaFiltro || (() => {
        const fechaFiltroStr = format(fechaFiltro, 'yyyy-MM-dd');
        return orden.fecha_orden === fechaFiltroStr;
      })();

      return matchSearch && matchEstado && matchContabilidad && matchFecha;
    });
  }, [ordenesCompra, searchQuery, filtroEstado, filtroContabilidad, fechaFiltro]);

  // Función para filtrar órdenes de servicio
  const ordenesServicioFiltradas = useMemo(() => {
    return ordenesServicio.filter((orden) => {
      // Filtro por búsqueda (número de orden, proveedor)
      const matchSearch = searchQuery === "" ||
        orden.numero_orden?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.nombre_proveedor?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro por estado
      const matchEstado = filtroEstado === "TODOS" || orden.estado === filtroEstado;

      // Filtro por aprobación contabilidad
      const matchContabilidad =
        filtroContabilidad === "TODOS" ||
        (filtroContabilidad === "APROBADO" && orden.auto_contabilidad === true) ||
        (filtroContabilidad === "PENDIENTE" && (orden.auto_contabilidad === false || !orden.auto_contabilidad));

      // Filtro por fecha
      const matchFecha = !fechaFiltro || (() => {
        const fechaFiltroStr = format(fechaFiltro, 'yyyy-MM-dd');
        return orden.fecha_orden === fechaFiltroStr;
      })();

      return matchSearch && matchEstado && matchContabilidad && matchFecha;
    });
  }, [ordenesServicio, searchQuery, filtroEstado, filtroContabilidad, fechaFiltro]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
        <div className="mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Registro de Contabilidad
            </h1>
            <p className="text-muted-foreground">
              Autorizaciones - Contabilidad
            </p>
          </div>

          {/* Sección de Búsqueda y Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Buscador */}
                <div className="md:col-span-2">
                  <Label htmlFor="search" className="text-sm font-semibold mb-2 block">
                    Buscar
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Buscar por número de orden o proveedor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <Label htmlFor="filtro-estado" className="text-sm font-semibold mb-2 block">
                    Estado
                  </Label>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger id="filtro-estado">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="APROBADA">Aprobada</SelectItem>
                      <SelectItem value="COMPLETADA">Completada</SelectItem>
                      <SelectItem value="CANCELADA">Cancelada</SelectItem>
                      <SelectItem value="FIRMADA">Firmada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Aprobación Contabilidad */}
                <div>
                  <Label htmlFor="filtro-contabilidad" className="text-sm font-semibold mb-2 block">
                    Aprobación Contabilidad
                  </Label>
                  <Select value={filtroContabilidad} onValueChange={setFiltroContabilidad}>
                    <SelectTrigger id="filtro-contabilidad">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="APROBADO">Aprobado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtro por Fecha */}
              <div className="mt-4 flex items-center gap-2">
                <Label htmlFor="fecha-filtro" className="text-sm font-medium">
                  Filtrar por Fecha:
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="fecha-filtro"
                      variant="outline"
                      className="w-[240px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFiltro ? (
                        format(fechaFiltro, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaFiltro}
                      onSelect={setFechaFiltro}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fechaFiltro && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFechaFiltro(undefined)}
                    className="h-8 px-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar filtro
                  </Button>
                )}
              </div>

              {/* Indicador de resultados */}
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>
                  Mostrando {ordenesFiltradas.length} de {ordenesCompra.length} órdenes de compra
                  {" | "}
                  {ordenesServicioFiltradas.length} de {ordenesServicio.length} órdenes de servicio
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs para Órdenes de Compra y Servicio */}
          <Tabs defaultValue="compra" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compra">Órdenes de Compra</TabsTrigger>
              <TabsTrigger value="servicio">Órdenes de Servicio</TabsTrigger>
            </TabsList>

            <TabsContent value="compra" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Órdenes de Compra - Autorizaciones - Contabilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordenesFiltradas.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="h-12 w-12 opacity-50" />
                        <p className="text-sm">
                          {ordenesCompra.length === 0
                            ? "No hay órdenes de compra registradas"
                            : "No se encontraron órdenes de compra con los filtros seleccionados"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      {ordenesFiltradas.map((orden) => (
                        <AccordionItem
                          key={orden.id_orden_compra}
                          value={`item-${orden.id_orden_compra}`}
                          className="border rounded-lg bg-white shadow-sm"
                        >
                          <AccordionTrigger className="hover:no-underline px-4 py-3">
                            <div className="flex items-center justify-between w-full gap-4 pr-4">
                              {/* Información principal - visible cuando está cerrado */}
                              <div className="flex items-center gap-4 flex-wrap flex-1">
                                <div className="flex flex-col items-start min-w-[120px]">
                                  <span className="text-xs text-gray-500 font-medium">Número</span>
                                  <span className="text-sm font-mono font-bold text-blue-600">
                                    {orden.numero_orden}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start min-w-[100px]">
                                  <span className="text-xs text-gray-500 font-medium">Fecha</span>
                                  <span className="text-sm font-medium">
                                    {formatDateString(orden.fecha_orden)}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start flex-1 min-w-[200px]">
                                  <span className="text-xs text-gray-500 font-medium">Proveedor</span>
                                  <span className="text-sm font-medium truncate max-w-full">
                                    {orden.nombre_proveedor || <span className="text-gray-400 italic">Sin proveedor</span>}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start min-w-[120px]">
                                  <span className="text-xs text-gray-500 font-medium">Total</span>
                                  <span className="text-sm font-bold font-mono text-green-700">
                                    {orden.moneda === "SOLES" ? "S/." : "$"} {Number(orden.total).toFixed(2)}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start min-w-[100px]">
                                  <span className="text-xs text-gray-500 font-medium">Estado</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      orden.estado === "PENDIENTE"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : orden.estado === "APROBADA"
                                          ? "bg-green-100 text-green-800"
                                          : orden.estado === "COMPLETADA"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {orden.estado}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-3 pt-2">
                              {/* Primera Fila: Información Financiera + Autorizaciones */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Información Financiera */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" />
                                    Información Financiera
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500 block">Moneda</span>
                                      <span className="text-sm font-semibold">{orden.moneda}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Subtotal</span>
                                      <span className="text-sm font-mono">{Number(orden.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">IGV</span>
                                      <span className="text-sm font-mono">{Number(orden.igv).toFixed(2)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Total</span>
                                      <span className="text-sm font-bold font-mono text-green-700">
                                        {Number(orden.total).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Autorizaciones */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Autorizaciones
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500 block">Admin.</span>
                                      {orden.auto_administrador === true ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          APROBADO
                                        </span>
                                      ) : orden.auto_administrador === false ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-block">
                                          PENDIENTE
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Jefe Proy.</span>
                                      {orden.jefe_proyecto === true ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          APROBADO
                                        </span>
                                      ) : orden.jefe_proyecto === false ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-block">
                                          PENDIENTE
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Contab.</span>
                                      {orden.auto_contabilidad === true ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          APROBADO
                                        </span>
                                      ) : orden.auto_contabilidad === false ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-block">
                                          PENDIENTE
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Proc. Pago</span>
                                      {orden.procede_pago === "TRANSFERIR" ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 inline-block">
                                          TRANSFERIDO
                                        </span>
                                      ) : orden.procede_pago === "PAGAR" ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          ORDENAR PAGO
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Segunda Fila: Retención y Anticipo + Documentos */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Retención y Anticipo */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2">Retención y Anticipo</h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500 block">Retención</span>
                                      {orden.retencion ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 inline-block">
                                          {orden.retencion}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Valor</span>
                                      <span className="text-sm font-mono">
                                        {orden.valor_retencion ? Number(orden.valor_retencion).toFixed(2) : "0.00"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Anticipo</span>
                                      {orden.tiene_anticipo === "SI" ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          SÍ
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 inline-block">
                                          NO
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Documentos */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2">Documentos</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={orden.id_orden_compra ? urlHelpers.getOrdenCompraPdfUrl(orden.id_orden_compra) : '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      PDF
                                    </a>

                                    {orden.url ? (
                                      <a
                                        href={orden.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Operación
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Operación
                                      </span>
                                    )}

                                    {orden.url_cotizacion ? (
                                      <a
                                        href={orden.url_cotizacion}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Cotización
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Cotización
                                      </span>
                                    )}

                                    {orden.url_factura ? (
                                      <a
                                        href={orden.url_factura}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Factura
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Factura
                                      </span>
                                    )}

                                    {orden.url_comprobante_retencion ? (
                                      <a
                                        href={orden.url_comprobante_retencion}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        Comp. Retención
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <FileText className="h-3.5 w-3.5" />
                                        Comp. Retención
                                      </span>
                                    )}
                                  </div>

                                  {/* Mostrar número de serie si existe */}
                                  {orden.url_comprobante_retencion && orden.nro_serie && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <span className="text-xs text-gray-600">
                                        <span className="font-semibold">N° Serie del Comprobante:</span>{" "}
                                        <span className="font-mono text-indigo-700">{orden.nro_serie}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Sección de Acciones */}
                              <div className="flex items-center gap-3 pt-2 border-t">
                                <button
                                  onClick={() => orden.id_orden_compra && handleAprobarOrdenCompra(orden.id_orden_compra)}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Aprobar para Contabilidad"
                                  disabled={!orden.id_orden_compra || orden.auto_contabilidad === true}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Aprobar
                                </button>
                                <Button
                                  size="sm"
                                  onClick={() => orden.id_orden_compra && handleOpenUploadComprobanteDialog(orden.id_orden_compra, "compra")}
                                  disabled={!orden.id_orden_compra}
                                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <Upload className="h-3 w-3" />
                                  Subir Comprobante de Retención
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
            </TabsContent>

            <TabsContent value="servicio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Órdenes de Servicio - Autorizaciones - Contabilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordenesServicioFiltradas.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="h-12 w-12 opacity-50" />
                        <p className="text-sm">
                          {ordenesServicio.length === 0
                            ? "No hay órdenes de servicio registradas"
                            : "No se encontraron órdenes de servicio con los filtros seleccionados"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      {ordenesServicioFiltradas.map((orden) => (
                        <AccordionItem
                          key={orden.id_orden_servicio}
                          value={`item-${orden.id_orden_servicio}`}
                          className="border rounded-lg bg-white shadow-sm"
                        >
                          <AccordionTrigger className="hover:no-underline px-4 py-3">
                            <div className="flex items-center justify-between w-full gap-4 pr-4">
                              {/* Información principal - visible cuando está cerrado */}
                              <div className="flex items-center gap-4 flex-wrap flex-1">
                                <div className="flex flex-col items-start min-w-[120px]">
                                  <span className="text-xs text-gray-500 font-medium">Número</span>
                                  <span className="text-sm font-mono font-bold text-green-600">
                                    {orden.numero_orden}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start min-w-[100px]">
                                  <span className="text-xs text-gray-500 font-medium">Fecha</span>
                                  <span className="text-sm font-medium">
                                    {formatDateString(orden.fecha_orden)}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start flex-1 min-w-[200px]">
                                  <span className="text-xs text-gray-500 font-medium">Proveedor</span>
                                  <span className="text-sm font-medium truncate max-w-full">
                                    {orden.nombre_proveedor || <span className="text-gray-400 italic">Sin proveedor</span>}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start min-w-[120px]">
                                  <span className="text-xs text-gray-500 font-medium">Total</span>
                                  <span className="text-sm font-bold font-mono text-green-700">
                                    {orden.moneda === "SOLES" ? "S/." : "$"} {Number(orden.total).toFixed(2)}
                                  </span>
                                </div>

                                <div className="flex flex-col items-start min-w-[100px]">
                                  <span className="text-xs text-gray-500 font-medium">Estado</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      orden.estado === "PENDIENTE"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : orden.estado === "APROBADA"
                                          ? "bg-green-100 text-green-800"
                                          : orden.estado === "COMPLETADA"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {orden.estado}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-3 pt-2">
                              {/* Primera Fila: Información Financiera + Autorizaciones */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Información Financiera */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" />
                                    Información Financiera
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500 block">Moneda</span>
                                      <span className="text-sm font-semibold">{orden.moneda}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Subtotal</span>
                                      <span className="text-sm font-mono">{Number(orden.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">IGV</span>
                                      <span className="text-sm font-mono">{Number(orden.igv).toFixed(2)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Total</span>
                                      <span className="text-sm font-bold font-mono text-green-700">
                                        {Number(orden.total).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Autorizaciones */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Autorizaciones
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500 block">Admin.</span>
                                      {orden.auto_administrador === true ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          APROBADO
                                        </span>
                                      ) : orden.auto_administrador === false ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-block">
                                          PENDIENTE
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Jefe Proy.</span>
                                      {orden.jefe_proyecto === true ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          APROBADO
                                        </span>
                                      ) : orden.jefe_proyecto === false ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-block">
                                          PENDIENTE
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Contab.</span>
                                      {orden.auto_contabilidad === true ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          APROBADO
                                        </span>
                                      ) : orden.auto_contabilidad === false ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-block">
                                          PENDIENTE
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Proc. Pago</span>
                                      {orden.procede_pago === "TRANSFERIR" ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 inline-block">
                                          TRANSFERIDO
                                        </span>
                                      ) : orden.procede_pago === "PAGAR" ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          ORDENAR PAGO
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Segunda Fila: Detracción y Anticipo + Documentos */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Detracción y Anticipo */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2">Detracción y Anticipo</h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500 block">Detracción</span>
                                      {orden.detraccion ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 inline-block">
                                          {orden.detraccion}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic text-sm">-</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Valor</span>
                                      <span className="text-sm font-mono">
                                        {orden.valor_detraccion ? Number(orden.valor_detraccion).toFixed(2) : "0.00"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 block">Anticipo</span>
                                      {orden.tiene_anticipo === "SI" ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-block">
                                          SÍ
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 inline-block">
                                          NO
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Documentos */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-bold text-gray-700 mb-2">Documentos</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={orden.id_orden_servicio ? urlHelpers.getOrdenServicioPdfUrl(orden.id_orden_servicio) : '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      PDF
                                    </a>

                                    {orden.url ? (
                                      <a
                                        href={orden.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Operación
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Operación
                                      </span>
                                    )}

                                    {orden.url_cotizacion ? (
                                      <a
                                        href={orden.url_cotizacion}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Cotización
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Cotización
                                      </span>
                                    )}

                                    {orden.url_factura ? (
                                      <a
                                        href={orden.url_factura}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Factura
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Factura
                                      </span>
                                    )}

                                    {orden.url_comprobante_retencion ? (
                                      <a
                                        href={orden.url_comprobante_retencion}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        Comp. Retención
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                        <FileText className="h-3.5 w-3.5" />
                                        Comp. Retención
                                      </span>
                                    )}
                                  </div>

                                  {/* Mostrar número de serie si existe */}
                                  {orden.url_comprobante_retencion && orden.nro_serie && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <span className="text-xs text-gray-600">
                                        <span className="font-semibold">N° Serie del Comprobante:</span>{" "}
                                        <span className="font-mono text-indigo-700">{orden.nro_serie}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Sección de Acciones */}
                              <div className="flex items-center gap-3 pt-2 border-t">
                                <button
                                  onClick={() => orden.id_orden_servicio && handleAprobarOrdenServicio(orden.id_orden_servicio)}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Aprobar para Contabilidad"
                                  disabled={!orden.id_orden_servicio || orden.auto_contabilidad === true}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Aprobar
                                </button>
                                <Button
                                  size="sm"
                                  onClick={() => orden.id_orden_servicio && handleOpenUploadComprobanteDialog(orden.id_orden_servicio, "servicio")}
                                  disabled={!orden.id_orden_servicio}
                                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <Upload className="h-3 w-3" />
                                  Subir Comprobante de Retención
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Diálogo para subir Comprobante de Retención */}
      <Dialog open={isUploadComprobanteDialogOpen} onOpenChange={setIsUploadComprobanteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subir Comprobante de Retención</DialogTitle>
            <DialogDescription>
              Seleccione un archivo de comprobante de retención para la orden {currentOrdenTypeForUpload === "compra" ? "de compra" : "de servicio"} #{currentOrdenIdForUpload}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Input de número de serie */}
            <div>
              <Label htmlFor="nro-serie" className="text-sm font-semibold mb-2 block">
                Número de Serie *
              </Label>
              <Input
                id="nro-serie"
                placeholder="Ingrese el número de serie"
                value={nroSerie}
                onChange={(e) => setNroSerie(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Input de archivo */}
            <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                id="file-upload-comprobante"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileComprobanteSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload-comprobante"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-indigo-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Haz clic para seleccionar un comprobante
                </p>
                <p className="text-xs text-gray-500">
                  PDF o Imágenes (JPG, PNG)
                </p>
              </label>
            </div>

            {/* Previsualización del archivo seleccionado */}
            {selectedFileComprobante && (
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFileComprobante.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFileComprobante.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFileComprobante(null)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCloseUploadComprobanteDialog}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmUploadComprobante}
              disabled={!selectedFileComprobante || !nroSerie.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Confirmar Subida
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
