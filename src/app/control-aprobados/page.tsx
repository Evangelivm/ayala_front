"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ordenesCompraApi,
  type OrdenCompraData,
  ordenesServicioApi,
  type OrdenServicioData,
} from "@/lib/connections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Search, Filter, X, CalendarIcon, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocket } from "@/lib/useWebSocket";

export default function ControlAprobadosPage() {
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompraData[]>([]);
  const [ordenesServicio, setOrdenesServicio] = useState<OrdenServicioData[]>([]);

  // Estados para filtros y busqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [fechaFiltro, setFechaFiltro] = useState<Date | undefined>(undefined);

  // Funciones para cargar ordenes
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

  // Cargar ordenes al montar el componente
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

  // Funcion para filtrar ordenes de compra
  const ordenesFiltradas = useMemo(() => {
    return ordenesCompra.filter((orden) => {
      // Filtro por busqueda (numero de orden, proveedor)
      const matchSearch = searchQuery === "" ||
        orden.numero_orden?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.nombre_proveedor?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro por estado
      const matchEstado = filtroEstado === "TODOS" || orden.estado === filtroEstado;

      // Filtro por fecha
      const matchFecha = !fechaFiltro || (() => {
        const fechaFiltroStr = format(fechaFiltro, 'yyyy-MM-dd');
        const fechaOrden = orden.fecha_orden ? format(new Date(orden.fecha_orden), 'yyyy-MM-dd') : null;
        return fechaOrden === fechaFiltroStr;
      })();

      return matchSearch && matchEstado && matchFecha;
    });
  }, [ordenesCompra, searchQuery, filtroEstado, fechaFiltro]);

  // Funcion para filtrar ordenes de servicio
  const ordenesServicioFiltradas = useMemo(() => {
    return ordenesServicio.filter((orden) => {
      // Filtro por busqueda (numero de orden, proveedor)
      const matchSearch = searchQuery === "" ||
        orden.numero_orden?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.nombre_proveedor?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro por estado
      const matchEstado = filtroEstado === "TODOS" || orden.estado === filtroEstado;

      // Filtro por fecha
      const matchFecha = !fechaFiltro || (() => {
        const fechaFiltroStr = format(fechaFiltro, 'yyyy-MM-dd');
        const fechaOrden = orden.fecha_orden ? format(new Date(orden.fecha_orden), 'yyyy-MM-dd') : null;
        return fechaOrden === fechaFiltroStr;
      })();

      return matchSearch && matchEstado && matchFecha;
    });
  }, [ordenesServicio, searchQuery, filtroEstado, fechaFiltro]);

  // Componente para renderizar el badge de autorizacion
  const AutorizacionBadge = ({ aprobado, fecha }: { aprobado?: boolean; fecha?: string | null }) => {
    if (aprobado === true) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            SI
          </span>
          {fecha && (
            <span className="text-xs font-medium text-gray-600">
              {format(new Date(fecha), "dd/MM/yyyy", { locale: es })}
            </span>
          )}
        </div>
      );
    } else if (aprobado === false) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            NO
          </span>
        </div>
      );
    }
    return <span className="text-gray-400 text-xs">-</span>;
  };

  // Componente para renderizar la tabla de ordenes
  const TablaOrdenes = ({
    ordenes,
    tipo
  }: {
    ordenes: (OrdenCompraData | OrdenServicioData)[];
    tipo: "compra" | "servicio"
  }) => {
    if (ordenes.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <ClipboardList className="h-12 w-12 opacity-50" />
            <p className="text-sm">
              No se encontraron ordenes de {tipo} con los filtros seleccionados
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-bold text-xs">Numero</TableHead>
              <TableHead className="font-bold text-xs">Fecha</TableHead>
              <TableHead className="font-bold text-xs">Proveedor</TableHead>
              <TableHead className="font-bold text-xs text-right">Total</TableHead>
              <TableHead className="font-bold text-xs text-center">Estado</TableHead>
              <TableHead className="font-bold text-xs text-center" colSpan={3}>
                <div className="flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Autorizaciones
                </div>
              </TableHead>
              <TableHead className="font-bold text-xs text-center">Proc. Pago</TableHead>
            </TableRow>
            <TableRow className="bg-gray-50/50">
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead className="font-medium text-[10px] text-center text-gray-600">Admin.</TableHead>
              <TableHead className="font-medium text-[10px] text-center text-gray-600">Contab.</TableHead>
              <TableHead className="font-medium text-[10px] text-center text-gray-600">Jefe Proy.</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.map((orden) => {
              const id = tipo === "compra"
                ? (orden as OrdenCompraData).id_orden_compra
                : (orden as OrdenServicioData).id_orden_servicio;

              return (
                <TableRow key={id} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-bold text-blue-600 text-sm">
                    {orden.numero_orden}
                  </TableCell>
                  <TableCell className="text-sm">
                    {orden.fecha_orden
                      ? format(new Date(orden.fecha_orden), "dd/MM/yyyy", { locale: es })
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate" title={orden.nombre_proveedor || ""}>
                    {orden.nombre_proveedor || <span className="text-gray-400 italic">Sin proveedor</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-green-700 text-sm">
                    {orden.moneda === "SOLES" ? "S/." : "$"} {Number(orden.total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        orden.estado === "PENDIENTE"
                          ? "bg-yellow-100 text-yellow-800"
                          : orden.estado === "APROBADA"
                            ? "bg-green-100 text-green-800"
                            : orden.estado === "COMPLETADA"
                              ? "bg-blue-100 text-blue-800"
                              : orden.estado === "FIRMADA"
                                ? "bg-purple-100 text-purple-800"
                                : orden.estado === "CANCELADA"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {orden.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <AutorizacionBadge
                      aprobado={orden.auto_administrador}
                      fecha={orden.fecha_auto_administrador}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <AutorizacionBadge
                      aprobado={orden.auto_contabilidad}
                      fecha={orden.fecha_auto_contabilidad}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <AutorizacionBadge
                      aprobado={orden.jefe_proyecto}
                      fecha={orden.fecha_jefe_proyecto}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {orden.procede_pago === "TRANSFERIR" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        TRANSF.
                      </span>
                    ) : orden.procede_pago === "PAGAR" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        PAGADO
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
        <div className="mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Control de Aprobados
            </h1>
            <p className="text-muted-foreground">
              Vista general de ordenes de compra y servicio con sus autorizaciones
            </p>
          </div>

          {/* Seccion de Busqueda y Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Buscador */}
                <div className="md:col-span-1">
                  <Label htmlFor="search" className="text-sm font-semibold mb-2 block">
                    Buscar
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Numero de orden o proveedor..."
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

                {/* Filtro por Fecha */}
                <div>
                  <Label htmlFor="fecha-filtro" className="text-sm font-semibold mb-2 block">
                    Fecha
                  </Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="fecha-filtro"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
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
                        size="icon"
                        onClick={() => setFechaFiltro(undefined)}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Indicador de resultados */}
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>
                  Mostrando {ordenesFiltradas.length} de {ordenesCompra.length} ordenes de compra
                  {" | "}
                  {ordenesServicioFiltradas.length} de {ordenesServicio.length} ordenes de servicio
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs para Ordenes de Compra y Servicio */}
          <Tabs defaultValue="compra" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compra">
                Ordenes de Compra ({ordenesFiltradas.length})
              </TabsTrigger>
              <TabsTrigger value="servicio">
                Ordenes de Servicio ({ordenesServicioFiltradas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compra" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Ordenes de Compra
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TablaOrdenes ordenes={ordenesFiltradas} tipo="compra" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="servicio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Ordenes de Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TablaOrdenes ordenes={ordenesServicioFiltradas} tipo="servicio" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
