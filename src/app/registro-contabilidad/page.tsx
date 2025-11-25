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
import { ClipboardList, FileText, CheckCircle, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

export default function RegistroContabilidadPage() {
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompraData[]>([]);
  const [ordenesServicio, setOrdenesServicio] = useState<OrdenServicioData[]>([]);

  // Estados para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [filtroContabilidad, setFiltroContabilidad] = useState<string>("TODOS");

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

      return matchSearch && matchEstado && matchContabilidad;
    });
  }, [ordenesCompra, searchQuery, filtroEstado, filtroContabilidad]);

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

      return matchSearch && matchEstado && matchContabilidad;
    });
  }, [ordenesServicio, searchQuery, filtroEstado, filtroContabilidad]);

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
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-100">
                          <TableHead className="text-xs font-bold text-center">
                            Número Orden
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Fecha Orden
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Fecha Registro
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Moneda
                          </TableHead>
                          <TableHead className="text-xs font-bold text-right">
                            Subtotal
                          </TableHead>
                          <TableHead className="text-xs font-bold text-right">
                            IGV
                          </TableHead>
                          <TableHead className="text-xs font-bold text-right">
                            Total
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Estado
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Tiene Anticipo
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Procede Pago
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Auto Admin.
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Auto Contab.
                          </TableHead>
                          <TableHead className="text-xs font-bold">
                            Proveedor
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            PDF
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Acción
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordenesFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={15}
                              className="text-center py-8 text-gray-400"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <ClipboardList className="h-8 w-8 opacity-50" />
                                <p className="text-sm">
                                  {ordenesCompra.length === 0
                                    ? "No hay órdenes de compra registradas"
                                    : "No se encontraron órdenes de compra con los filtros seleccionados"}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          ordenesFiltradas.map((orden) => (
                            <TableRow
                              key={orden.id_orden_compra}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="text-xs text-center font-mono">
                                {orden.numero_orden}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {format(new Date(orden.fecha_orden), "dd/MM/yyyy", {
                                  locale: es,
                                })}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {format(new Date(orden.fecha_registro), "dd/MM/yyyy", {
                                  locale: es,
                                })}
                              </TableCell>
                              <TableCell className="text-xs text-center font-semibold">
                                {orden.moneda}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {orden.subtotal}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {orden.igv}
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold font-mono">
                                {orden.total}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    orden.estado === "PENDIENTE"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : orden.estado === "APROBADA"
                                        ? "bg-green-100 text-green-800"
                                        : orden.estado === "COMPLETADA"
                                          ? "bg-purple-100 text-purple-800"
                                          : orden.estado === "CANCELADA"
                                            ? "bg-red-100 text-red-800"
                                            : orden.estado === "FIRMADA"
                                              ? "bg-indigo-100 text-indigo-800"
                                              : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {orden.estado}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.tiene_anticipo === "SI" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    SÍ
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    NO
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.procede_pago === "TRANSFERIR" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    TRANSFERIDO
                                  </span>
                                ) : orden.procede_pago === "PAGAR" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    ORDENAR PAGO
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.auto_administrador === true ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    APROBADO
                                  </span>
                                ) : orden.auto_administrador === false ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    PENDIENTE
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.auto_contabilidad === true ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    APROBADO
                                  </span>
                                ) : orden.auto_contabilidad === false ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    PENDIENTE
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {orden.nombre_proveedor || (
                                  <span className="text-gray-400 italic">Sin proveedor</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <a
                                  href={orden.id_orden_compra ? urlHelpers.getOrdenCompraPdfUrl(orden.id_orden_compra) : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Ver PDF"
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <button
                                  onClick={() => orden.id_orden_compra && handleAprobarOrdenCompra(orden.id_orden_compra)}
                                  className="inline-flex items-center justify-center px-3 h-8 text-white bg-green-600 hover:bg-green-700 rounded transition-colors text-xs font-semibold"
                                  title="Aprobar para Contabilidad"
                                  disabled={!orden.id_orden_compra || orden.auto_contabilidad === true}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aprobar
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="servicio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Órdenes de Servicio - Autorizaciones - Contabilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-green-100">
                          <TableHead className="text-xs font-bold text-center">
                            Número Orden
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Fecha Orden
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Fecha Registro
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Moneda
                          </TableHead>
                          <TableHead className="text-xs font-bold text-right">
                            Subtotal
                          </TableHead>
                          <TableHead className="text-xs font-bold text-right">
                            IGV
                          </TableHead>
                          <TableHead className="text-xs font-bold text-right">
                            Total
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Estado
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Tiene Anticipo
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Procede Pago
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Auto Admin.
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Auto Contab.
                          </TableHead>
                          <TableHead className="text-xs font-bold">
                            Proveedor
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            PDF
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Acción
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordenesServicioFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={15}
                              className="text-center py-8 text-gray-400"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <ClipboardList className="h-8 w-8 opacity-50" />
                                <p className="text-sm">
                                  {ordenesServicio.length === 0
                                    ? "No hay órdenes de servicio registradas"
                                    : "No se encontraron órdenes de servicio con los filtros seleccionados"}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          ordenesServicioFiltradas.map((orden) => (
                            <TableRow
                              key={orden.id_orden_servicio}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="text-xs text-center font-mono">
                                {orden.numero_orden}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {format(new Date(orden.fecha_orden), "dd/MM/yyyy", {
                                  locale: es,
                                })}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {format(new Date(orden.fecha_registro), "dd/MM/yyyy", {
                                  locale: es,
                                })}
                              </TableCell>
                              <TableCell className="text-xs text-center font-semibold">
                                {orden.moneda}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {orden.subtotal}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {orden.igv}
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold font-mono">
                                {orden.total}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    orden.estado === "PENDIENTE"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : orden.estado === "APROBADA"
                                        ? "bg-green-100 text-green-800"
                                        : orden.estado === "COMPLETADA"
                                          ? "bg-purple-100 text-purple-800"
                                          : orden.estado === "CANCELADA"
                                            ? "bg-red-100 text-red-800"
                                            : orden.estado === "FIRMADA"
                                              ? "bg-indigo-100 text-indigo-800"
                                              : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {orden.estado}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.tiene_anticipo === "SI" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    SÍ
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    NO
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.procede_pago === "TRANSFERIR" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    TRANSFERIDO
                                  </span>
                                ) : orden.procede_pago === "PAGAR" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    ORDENAR PAGO
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.auto_administrador === true ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    APROBADO
                                  </span>
                                ) : orden.auto_administrador === false ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    PENDIENTE
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.auto_contabilidad === true ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    APROBADO
                                  </span>
                                ) : orden.auto_contabilidad === false ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    PENDIENTE
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {orden.nombre_proveedor || (
                                  <span className="text-gray-400 italic">Sin proveedor</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <a
                                  href={orden.id_orden_servicio ? urlHelpers.getOrdenServicioPdfUrl(orden.id_orden_servicio) : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Ver PDF"
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <button
                                  onClick={() => orden.id_orden_servicio && handleAprobarOrdenServicio(orden.id_orden_servicio)}
                                  className="inline-flex items-center justify-center px-3 h-8 text-white bg-green-600 hover:bg-green-700 rounded transition-colors text-xs font-semibold"
                                  title="Aprobar para Contabilidad"
                                  disabled={!orden.id_orden_servicio || orden.auto_contabilidad === true}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aprobar
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
