"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  proveedoresApi,
  type ProveedorData,
  itemsApi,
  type ItemData,
  centroProyectoApi,
  type CentroProyectoData,
  faseControlApi,
  type FaseControlData,
  rubroApi,
  type RubroData,
} from "@/lib/connections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Plus, Trash2, Edit, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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

export default function FacturaPage() {
  const [isNuevaFacturaModalOpen, setIsNuevaFacturaModalOpen] = useState(false);
  const [facturaEditandoId, setFacturaEditandoId] = useState<number | null>(null);
  const [isProveedoresModalOpen, setIsProveedoresModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<ProveedorData[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [proveedorSearchQuery, setProveedorSearchQuery] = useState("");
  const [centrosProyecto, setCentrosProyecto] = useState<CentroProyectoData[]>([]);
  const [fases, setFases] = useState<FaseControlData[]>([]);
  const [rubros, setRubros] = useState<RubroData[]>([]);
  const [facturas, setFacturas] = useState<Array<{
    id: number;
    numero_factura: string;
    fecha_factura: string;
    proveedor: string;
    subtotal: number;
    igv: number;
    total: number;
    estado: string;
  }>>([]);

  // Estado para Nueva Factura
  const [nuevaFacturaData, setNuevaFacturaData] = useState({
    // Campos para el backend
    id_proveedor: 0,
    // Campos visuales
    nroCliente: "",
    razonSocial: "",
    retencionProveedor: "",
    fondoGarantia: false, // Checkbox Fondo de Garantía
    fondoGarantiaValor: "", // Valor del fondo de garantía
    ordenCompra: false, // Checkbox O/C
    ordenCompraValor: "", // Valor de orden de compra
    serie: "0001",
    nroDoc: "",
    fechaEmision: new Date(),
    moneda: "SOLES",
    tipoCambio: 0, // Tipo de cambio de SUNAT
    fechaServicio: new Date(),
    estado: "PENDIENTE",
    centroCostoNivel1Codigo: "", // Código de proyectos
    centroCostoNivel2Codigo: "", // Código de línea de servicio
    unidad: "", // Placa del camión
    unidad_id: 0, // ID del camión
    igvPorcentaje: 18,
    aplicarDetraccion: false, // Si/No para aplicar detracción
    detraccion: {
      porcentaje: 3,
      monto: 0,
    },
    items: [] as Array<{
      codigo_item: string;
      descripcion_item: string;
      cantidad_solicitada: number;
      unidadMed: string;
      precio_unitario: number;
      subtotal: number;
    }>,
    subtotal: 0,
    igv: 0,
    total: 0,
    netoAPagar: 0,
    observacion: "",
  });

  // Hook de debounce para optimizar cálculos
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debounce = useCallback((fn: () => void, delay: number = 300) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(fn, delay);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadFacturas();

    // Limpiar timer de debounce al desmontar
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const loadFacturas = async () => {
    try {
      // TODO: Implementar cuando exista el endpoint
      setFacturas([]);
    } catch (error) {
      console.error("Error loading facturas:", error);
      setFacturas([]);
    }
  };

  // Función para cargar proveedores
  const fetchProveedores = async () => {
    try {
      const data = await proveedoresApi.getAll();
      setProveedores(data);
    } catch (error) {
      console.error("Error fetching proveedores:", error);
      setProveedores([]);
    }
  };

  // Función para cargar items
  const fetchItems = async () => {
    try {
      const data = await itemsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  };

  // Función para buscar items
  const searchItems = async (query: string) => {
    setItemSearchQuery(query);
    if (query.trim() === "") {
      fetchItems();
      return;
    }
    try {
      const data = await itemsApi.search(query);
      setItems(data);
    } catch (error) {
      console.error("Error searching items:", error);
      setItems([]);
    }
  };

  // Funciones para cargar datos de Centro de Costos
  const loadCentrosProyecto = async () => {
    try {
      const data = await centroProyectoApi.getAll();
      setCentrosProyecto(data);
    } catch (error) {
      console.error("Error loading centros proyecto:", error);
      setCentrosProyecto([]);
    }
  };

  const loadFases = async () => {
    try {
      const data = await faseControlApi.getAll();
      setFases(data);
    } catch (error) {
      console.error("Error loading fases:", error);
      setFases([]);
    }
  };

  const loadRubros = async () => {
    try {
      const data = await rubroApi.getAll();
      setRubros(data);
    } catch (error) {
      console.error("Error loading rubros:", error);
      setRubros([]);
    }
  };

  const handleCentroCostoNivel1Change = (codigo: string) => {
    setNuevaFacturaData((prev) => ({
      ...prev,
      centroCostoNivel1Codigo: codigo,
    }));
  };

  const handleCentroCostoNivel2Change = (codigo: string) => {
    setNuevaFacturaData((prev) => ({
      ...prev,
      centroCostoNivel2Codigo: codigo,
    }));
  };

  const handleCentroCostoNivel3Change = (codigo: string) => {
    setNuevaFacturaData((prev) => ({
      ...prev,
      centroCostoNivel3Codigo: codigo,
    }));
  };

  // Handler para abrir modal de proveedores
  const handleOpenProveedoresModal = () => {
    setIsProveedoresModalOpen(true);
    fetchProveedores();
  };

  // Handler para seleccionar fila de proveedor
  const handleProveedorRowClick = (id: number) => {
    setSelectedProveedor(id);
  };

  // Handler para confirmar selección de proveedor
  const handleSelectProveedor = () => {
    if (selectedProveedor) {
      const proveedor = proveedores.find((p) => p.id_proveedor === selectedProveedor);
      if (proveedor) {
        setNuevaFacturaData((prev) => ({
          ...prev,
          id_proveedor: proveedor.id_proveedor,
          nroCliente: proveedor.ruc || "",
          razonSocial: proveedor.nombre_proveedor || "",
          retencionProveedor: proveedor.retencion || "",
          aplicarDetraccion: proveedor.retencion === "Si",
        }));
        // Recalcular totales si cambia la detracción
        setTimeout(() => calcularTotales(nuevaFacturaData.items), 0);
        setIsProveedoresModalOpen(false);
        setSelectedProveedor(null);
        setProveedorSearchQuery("");
      }
    }
  };

  // Función optimizada para calcular totales (memoizada)
  const calcularTotales = useCallback((items: Array<{ subtotal: number }>) => {
    const subtotalCalculado = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const igvCalculado = subtotalCalculado * (nuevaFacturaData.igvPorcentaje / 100);
    const totalCalculado = subtotalCalculado + igvCalculado;
    const detraccionMonto = nuevaFacturaData.aplicarDetraccion
      ? totalCalculado * (nuevaFacturaData.detraccion.porcentaje / 100)
      : 0;
    const netoAPagarCalculado = totalCalculado - detraccionMonto;

    setNuevaFacturaData((prev) => ({
      ...prev,
      subtotal: subtotalCalculado,
      igv: igvCalculado,
      total: totalCalculado,
      detraccion: {
        ...prev.detraccion,
        monto: detraccionMonto,
      },
      netoAPagar: netoAPagarCalculado,
    }));
  }, [nuevaFacturaData.igvPorcentaje, nuevaFacturaData.aplicarDetraccion, nuevaFacturaData.detraccion.porcentaje]);

  // Optimizado con debouncing para evitar cálculos excesivos
  const handleItemChange = useCallback(
    (index: number, field: string, value: string | number) => {
      const updatedItems = [...nuevaFacturaData.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      // Calcular subtotal automáticamente
      if (field === "cantidad_solicitada" || field === "precio_unitario") {
        const cantidad = Number(
          field === "cantidad_solicitada" ? value : updatedItems[index].cantidad_solicitada
        );
        const precio = Number(
          field === "precio_unitario" ? value : updatedItems[index].precio_unitario
        );
        updatedItems[index].subtotal = cantidad * precio;
      }

      // Actualizar estado inmediatamente para UI responsiva
      setNuevaFacturaData((prev) => ({ ...prev, items: updatedItems }));

      // Calcular totales con debounce (solo después de que el usuario deje de escribir)
      debounce(() => calcularTotales(updatedItems), 300);
    },
    [nuevaFacturaData.items, debounce, calcularTotales]
  );

  // Handler para abrir modal de items
  const handleOpenItemsModal = () => {
    setIsItemsModalOpen(true);
    fetchItems();
  };

  // Handler para seleccionar fila de item
  const handleItemRowClick = (codigo: string) => {
    setSelectedItem(codigo);
  };

  // Handler para confirmar selección de item
  const handleSelectItem = () => {
    if (selectedItem) {
      const item = items.find((i) => i.codigo === selectedItem);
      if (item) {
        const newItem = {
          codigo_item: item.codigo,
          descripcion_item: item.descripcion,
          cantidad_solicitada: 1,
          unidadMed: item.u_m || "UNIDAD",
          precio_unitario: Number(item.precio_unitario) || 0,
          subtotal: Number(item.precio_unitario) || 0,
        };
        setNuevaFacturaData((prev) => ({
          ...prev,
          items: [...prev.items, newItem],
        }));
        calcularTotales([...nuevaFacturaData.items, newItem]);
        setIsItemsModalOpen(false);
        setSelectedItem(null);
      }
    }
  };

  const addItem = () => {
    handleOpenItemsModal();
  };

  const removeItem = (index: number) => {
    const updatedItems = nuevaFacturaData.items.filter((_, i) => i !== index);
    setNuevaFacturaData((prev) => ({ ...prev, items: updatedItems }));
    calcularTotales(updatedItems);
  };

  const handleNuevaFacturaInputChange = useCallback(
    (field: string, value: string | Date | number | boolean | { porcentaje: number; monto: number }) => {
      setNuevaFacturaData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const limpiarFormularioFactura = () => {
    setNuevaFacturaData({
      id_proveedor: 0,
      nroCliente: "",
      razonSocial: "",
      retencionProveedor: "",
      fondoGarantia: false,
      fondoGarantiaValor: "",
      ordenCompra: false,
      ordenCompraValor: "",
      serie: "0001",
      nroDoc: "",
      fechaEmision: new Date(),
      moneda: "SOLES",
      tipoCambio: 0,
      fechaServicio: new Date(),
      estado: "PENDIENTE",
      centroCostoNivel1Codigo: "",
      centroCostoNivel2Codigo: "",
      unidad: "",
      unidad_id: 0,
      igvPorcentaje: 18,
      aplicarDetraccion: false,
      detraccion: {
        porcentaje: 3,
        monto: 0,
      },
      items: [],
      subtotal: 0,
      igv: 0,
      total: 0,
      netoAPagar: 0,
      observacion: "",
    });
    setFacturaEditandoId(null);
  };

  const handleNuevaFacturaSave = async () => {
    try {
      // Validaciones básicas
      if (!nuevaFacturaData.id_proveedor) {
        toast.error("Debe seleccionar un proveedor");
        return;
      }

      if (!nuevaFacturaData.serie || !nuevaFacturaData.nroDoc) {
        toast.error("Debe ingresar la serie y número de documento");
        return;
      }

      if (nuevaFacturaData.items.length === 0) {
        toast.error("Debe agregar al menos un item a la factura");
        return;
      }

      // Preparar datos para enviar al backend
      const numero_factura = `${nuevaFacturaData.serie}-${nuevaFacturaData.nroDoc}`;

      console.log("Datos de factura para enviar:", nuevaFacturaData);

      toast.success("Factura guardada exitosamente (modo mock)", {
        description: `Número de factura: ${numero_factura}`,
      });

      // Cerrar el modal y limpiar el formulario
      setIsNuevaFacturaModalOpen(false);
      handleNuevaFacturaCancel();
    } catch (error) {
      console.error("Error al guardar factura:", error);
      toast.error("Error al guardar la factura", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  const handleNuevaFacturaCancel = () => {
    limpiarFormularioFactura();
    setIsNuevaFacturaModalOpen(false);
  };

  const handleDeleteFactura = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta factura?")) {
      return;
    }

    try {
      toast.success("Factura eliminada exitosamente (modo mock)");
      loadFacturas();
    } catch (error) {
      console.error("Error al eliminar factura:", error);
      toast.error("Error al eliminar la factura");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
        <div className="mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground">
              Gestión de facturas del sistema
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 mb-6">
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                limpiarFormularioFactura();
                setIsNuevaFacturaModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Button>
          </div>

          {/* Tabla de Facturas */}
          <Card>
            <CardHeader>
              <CardTitle>Facturas Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-100">
                      <TableHead className="text-xs font-bold text-center">
                        Número Factura
                      </TableHead>
                      <TableHead className="text-xs font-bold text-center">
                        Fecha Factura
                      </TableHead>
                      <TableHead className="text-xs font-bold">Proveedor</TableHead>
                      <TableHead className="text-xs font-bold text-right">Subtotal</TableHead>
                      <TableHead className="text-xs font-bold text-right">IGV</TableHead>
                      <TableHead className="text-xs font-bold text-right">Total</TableHead>
                      <TableHead className="text-xs font-bold text-center">Estado</TableHead>
                      <TableHead className="text-xs font-bold text-center">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList className="h-8 w-8 opacity-50" />
                            <p className="text-sm">No hay facturas registradas</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      facturas.map((factura) => (
                        <TableRow key={factura.id} className="hover:bg-gray-50">
                          <TableCell className="text-xs text-center font-mono">
                            {factura.numero_factura}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {format(new Date(factura.fecha_factura), "dd/MM/yyyy", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="text-xs">{factura.proveedor}</TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {factura.subtotal}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {factura.igv}
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold font-mono">
                            {factura.total}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {factura.estado}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFactura(factura.id)}
                                className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded transition-colors"
                                title="Eliminar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Modal Nueva Factura */}
          <Dialog open={isNuevaFacturaModalOpen} onOpenChange={setIsNuevaFacturaModalOpen}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] w-full overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {facturaEditandoId ? "Editar Factura" : "Nueva Factura"}
                </DialogTitle>
                <DialogDescription>
                  {facturaEditandoId
                    ? "Edite los datos de la factura"
                    : "Complete los datos para crear una nueva factura"}
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 space-y-4 text-sm">
                {/* Header con información del cliente y documento */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border rounded-lg">
                  {/* Primera fila */}
                  <div className="col-span-2">
                    <Label htmlFor="nro-cliente" className="text-xs font-semibold">
                      Nro cliente:
                    </Label>
                    <Button
                      variant="outline"
                      onClick={handleOpenProveedoresModal}
                      className="w-full h-8 text-xs justify-start bg-orange-100 hover:bg-orange-200 font-normal border-gray-300"
                    >
                      {nuevaFacturaData.nroCliente || "Seleccionar..."}
                    </Button>
                  </div>
                  <div className="col-span-4">
                    <Label htmlFor="razon-social" className="text-xs font-semibold">
                      Razón social:
                    </Label>
                    <Input
                      id="razon-social"
                      value={nuevaFacturaData.razonSocial}
                      readOnly
                      className="h-8 text-xs bg-gray-100"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="detraccion" className="text-xs font-semibold">
                      Detracción:
                    </Label>
                    <Select
                      value={nuevaFacturaData.aplicarDetraccion ? "SI" : "NO"}
                      onValueChange={(value) => {
                        const aplicar = value === "SI";
                        setNuevaFacturaData((prev) => {
                          const newData = {
                            ...prev,
                            aplicarDetraccion: aplicar,
                            detraccion: aplicar
                              ? { porcentaje: 3, monto: 0 }
                              : prev.detraccion,
                          };
                          // Recalcular totales con los nuevos datos
                          const subtotalCalculado = newData.items.reduce(
                            (acc, item) => acc + (item.subtotal || 0),
                            0
                          );
                          const igvCalculado =
                            subtotalCalculado * (newData.igvPorcentaje / 100);
                          const totalCalculado = subtotalCalculado + igvCalculado;
                          const detraccionMonto = newData.aplicarDetraccion
                            ? totalCalculado * (newData.detraccion.porcentaje / 100)
                            : 0;
                          const netoAPagarCalculado = totalCalculado - detraccionMonto;

                          return {
                            ...newData,
                            subtotal: subtotalCalculado,
                            igv: igvCalculado,
                            total: totalCalculado,
                            detraccion: {
                              ...newData.detraccion,
                              monto: detraccionMonto,
                            },
                            netoAPagar: netoAPagarCalculado,
                          };
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO">NO</SelectItem>
                        <SelectItem value="SI">SÍ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="fecha-emision" className="text-xs font-semibold">
                      F. emisión:
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-8 text-xs justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {nuevaFacturaData.fechaEmision
                            ? format(nuevaFacturaData.fechaEmision, "dd/MM/yyyy", {
                                locale: es,
                              })
                            : "Fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={nuevaFacturaData.fechaEmision}
                          onSelect={(date) =>
                            handleNuevaFacturaInputChange(
                              "fechaEmision",
                              date || new Date()
                            )
                          }
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="moneda" className="text-xs font-semibold">
                      Moneda:
                    </Label>
                    <Select
                      value={nuevaFacturaData.moneda}
                      onValueChange={(value) =>
                        handleNuevaFacturaInputChange("moneda", value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLES">SOLES</SelectItem>
                        <SelectItem value="DOLARES">DÓLARES</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Segunda fila */}
                  <div className="col-span-6">
                    <Label className="text-xs font-semibold mb-2 block">Opciones</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="fondo-garantia"
                            checked={nuevaFacturaData.fondoGarantia}
                            onChange={(e) =>
                              handleNuevaFacturaInputChange(
                                "fondoGarantia",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor="fondo-garantia"
                            className="text-xs font-medium text-gray-700 cursor-pointer"
                          >
                            Fondo de Garantía
                          </label>
                        </div>
                        {nuevaFacturaData.fondoGarantia && (
                          <Input
                            value={nuevaFacturaData.fondoGarantiaValor}
                            onChange={(e) =>
                              handleNuevaFacturaInputChange("fondoGarantiaValor", e.target.value)
                            }
                            placeholder="Ingrese valor..."
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="orden-compra"
                            checked={nuevaFacturaData.ordenCompra}
                            onChange={(e) =>
                              handleNuevaFacturaInputChange("ordenCompra", e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor="orden-compra"
                            className="text-xs font-medium text-gray-700 cursor-pointer"
                          >
                            O/C
                          </label>
                        </div>
                        {nuevaFacturaData.ordenCompra && (
                          <Input
                            value={nuevaFacturaData.ordenCompraValor}
                            onChange={(e) =>
                              handleNuevaFacturaInputChange("ordenCompraValor", e.target.value)
                            }
                            placeholder="Ingrese valor..."
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="serie" className="text-xs font-semibold">
                      Serie + Nro doc:
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        id="serie"
                        value={nuevaFacturaData.serie}
                        onChange={(e) =>
                          handleNuevaFacturaInputChange("serie", e.target.value)
                        }
                        className="h-8 text-xs w-16"
                      />
                      <Input
                        value={nuevaFacturaData.nroDoc}
                        onChange={(e) =>
                          handleNuevaFacturaInputChange("nroDoc", e.target.value)
                        }
                        className="h-8 text-xs flex-1"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold">Contacto:</Label>
                    <Input className="h-8 text-xs bg-gray-100" disabled />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="estado" className="text-xs font-semibold">
                      Estado:
                    </Label>
                    <Input
                      id="estado"
                      value="PENDIENTE"
                      readOnly
                      className="h-8 text-xs bg-gray-100"
                    />
                  </div>
                </div>

                {/* Centro de Costos */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="col-span-6">
                    <Label
                      htmlFor="proyectos"
                      className="text-xs font-semibold"
                    >
                      Proyectos:
                    </Label>
                    <div className="flex gap-1">
                      <Select
                        value={nuevaFacturaData.centroCostoNivel1Codigo}
                        onValueChange={handleCentroCostoNivel1Change}
                        onOpenChange={(open) => {
                          if (open && centrosProyecto.length === 0) {
                            loadCentrosProyecto();
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccionar proyecto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {centrosProyecto.map((centro) => (
                            <SelectItem key={centro.id} value={centro.codigo}>
                              {centro.proyecto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {nuevaFacturaData.centroCostoNivel1Codigo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleCentroCostoNivel1Change("")}
                          title="Limpiar selección"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="col-span-6">
                    <Label
                      htmlFor="linea-servicio"
                      className="text-xs font-semibold"
                    >
                      Línea de Servicio:
                    </Label>
                    <div className="flex gap-1">
                      <Select
                        value={nuevaFacturaData.centroCostoNivel2Codigo}
                        onValueChange={handleCentroCostoNivel2Change}
                        onOpenChange={(open) => {
                          if (open && fases.length === 0) {
                            loadFases();
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccionar línea de servicio..." />
                        </SelectTrigger>
                        <SelectContent>
                          {fases.map((fase) => (
                            <SelectItem
                              key={fase.id}
                              value={fase.codigo || ""}
                            >
                              {fase.descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {nuevaFacturaData.centroCostoNivel2Codigo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleCentroCostoNivel2Change("")}
                          title="Limpiar selección"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabla de Items */}
                <div className="border rounded-lg">
                  <div className="flex justify-between items-center p-3 bg-gray-100 border-b">
                    <h3 className="text-sm font-semibold">Detalle</h3>
                    <Button
                      onClick={addItem}
                      size="sm"
                      className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar ítem
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="w-12 text-xs font-bold text-center">
                            Ítem
                          </TableHead>
                          <TableHead className="w-32 text-xs font-bold text-center">
                            Código
                          </TableHead>
                          <TableHead className="min-w-[300px] text-xs font-bold">
                            Nombre
                          </TableHead>
                          <TableHead className="w-24 text-xs font-bold text-center">
                            U.M.
                          </TableHead>
                          <TableHead className="w-24 text-xs font-bold text-center">
                            Cantidad
                          </TableHead>
                          <TableHead className="w-32 text-xs font-bold text-right">
                            Valor Unitario
                          </TableHead>
                          <TableHead className="w-32 text-xs font-bold text-right">
                            Subtotal
                          </TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nuevaFacturaData.items.map((item, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="text-center text-xs font-semibold">
                              {index + 1}
                            </TableCell>
                            <TableCell className="text-xs text-center bg-gray-50 p-2 font-mono">
                              {item.codigo_item || (
                                <span className="text-gray-400 italic">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs bg-gray-50 p-2">
                              {item.descripcion_item || (
                                <span className="text-gray-400 italic">
                                  Sin seleccionar
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-center bg-gray-50 p-2">
                              {item.unidadMed}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.cantidad_solicitada}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "cantidad_solicitada",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-8 text-xs border border-gray-300 p-2 text-center rounded"
                                min="0"
                                step="0.01"
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.precio_unitario}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "precio_unitario",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-8 text-xs border border-gray-300 p-2 text-right rounded font-mono"
                                min="0"
                                step="0.01"
                                required
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold bg-yellow-50 p-2 font-mono">
                              {item.subtotal.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => removeItem(index)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {nuevaFacturaData.items.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center py-8 text-gray-400"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <ClipboardList className="h-8 w-8 opacity-50" />
                                <p className="text-sm">No hay items agregados</p>
                                <p className="text-xs">
                                  Haz clic en &quot;Agregar ítem&quot; para comenzar
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Sección de Totales */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <div>
                      <Label
                        htmlFor="observacion-nueva"
                        className="text-xs font-semibold"
                      >
                        Observación:
                      </Label>
                      <Textarea
                        id="observacion-nueva"
                        value={nuevaFacturaData.observacion}
                        onChange={(e) =>
                          handleNuevaFacturaInputChange("observacion", e.target.value)
                        }
                        className="min-h-[180px] resize-none text-xs mt-1"
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-bold text-gray-700 mb-3">
                        Resumen de Totales
                      </h3>

                      {/* Subtotal */}
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">Subtotal:</span>
                        <span className="font-mono">
                          {nuevaFacturaData.subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* IGV */}
                      <div className="flex justify-between items-center text-sm border-t pt-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">IGV:</span>
                          <Select
                            value={nuevaFacturaData.igvPorcentaje.toString()}
                            onValueChange={(value) => {
                              handleNuevaFacturaInputChange(
                                "igvPorcentaje",
                                parseInt(value)
                              );
                              calcularTotales(nuevaFacturaData.items);
                            }}
                          >
                            <SelectTrigger className="h-7 w-20 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="0">0%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <span className="font-mono">
                          {nuevaFacturaData.igv.toFixed(2)}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between text-sm font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="font-mono">
                          {nuevaFacturaData.total.toFixed(2)}
                        </span>
                      </div>

                      {/* Detracción - Solo se muestra si está activada */}
                      {nuevaFacturaData.aplicarDetraccion && (
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-start text-sm mb-2">
                            <span className="font-semibold">Detracción:</span>
                            <span className="font-mono text-red-600">
                              -{nuevaFacturaData.detraccion.monto.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Porcentaje:</span>
                            <Select
                              value={nuevaFacturaData.detraccion.porcentaje.toString()}
                              onValueChange={(value) => {
                                handleNuevaFacturaInputChange("detraccion", {
                                  ...nuevaFacturaData.detraccion,
                                  porcentaje: parseInt(value),
                                });
                                calcularTotales(nuevaFacturaData.items);
                              }}
                            >
                              <SelectTrigger className="h-7 w-20 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="3">3%</SelectItem>
                                <SelectItem value="8">8%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Neto a Pagar */}
                      <div className="flex justify-between text-base font-bold border-t-2 pt-3 bg-blue-100 -mx-4 px-4 py-3 rounded-b-lg">
                        <span>Neto a Pagar:</span>
                        <span className="font-mono text-blue-700">
                          {nuevaFacturaData.netoAPagar.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones del modal */}
              <div className="flex justify-end gap-4 px-4 pb-3 border-t pt-3">
                <Button
                  variant="outline"
                  className="px-6 h-9"
                  onClick={handleNuevaFacturaCancel}
                >
                  Cancelar
                </Button>
                <Button
                  className="px-6 h-9 bg-orange-500 hover:bg-orange-600"
                  onClick={handleNuevaFacturaSave}
                >
                  Guardar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Selección de Proveedores */}
          <Dialog open={isProveedoresModalOpen} onOpenChange={setIsProveedoresModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Seleccionar Proveedor</DialogTitle>
                <DialogDescription>
                  Seleccione un proveedor de la lista
                </DialogDescription>
              </DialogHeader>

              {/* Filtro - fijo en la parte superior */}
              <div className="flex gap-2 items-center px-4 pt-4 flex-shrink-0">
                <span className="text-sm font-semibold">Filtrar:</span>
                <Input
                  className="max-w-xs h-8 text-sm bg-yellow-100"
                  placeholder="Buscar por documento o razón social..."
                  value={proveedorSearchQuery}
                  onChange={(e) => setProveedorSearchQuery(e.target.value)}
                />
              </div>

              {/* Tabla de proveedores - con scroll */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-100">
                        <TableHead className="text-xs font-bold text-center w-32">
                          Nro Documento
                        </TableHead>
                        <TableHead className="text-xs font-bold">Razón Social</TableHead>
                        <TableHead className="text-xs font-bold">Dirección</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedores
                        .filter((proveedor) => {
                          if (!proveedorSearchQuery.trim()) return true;
                          const query = proveedorSearchQuery.toLowerCase();
                          return (
                            proveedor.ruc?.toLowerCase().includes(query) ||
                            proveedor.nombre_proveedor?.toLowerCase().includes(query)
                          );
                        })
                        .map((proveedor) => (
                          <TableRow
                            key={proveedor.id_proveedor}
                            className={`cursor-pointer transition-colors ${
                              selectedProveedor === proveedor.id_proveedor
                                ? "bg-blue-200 hover:bg-blue-300"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleProveedorRowClick(proveedor.id_proveedor)}
                          >
                            <TableCell className="text-xs text-center">
                              {proveedor.ruc}
                            </TableCell>
                            <TableCell className="text-xs">
                              {proveedor.nombre_proveedor}
                            </TableCell>
                            <TableCell className="text-xs">
                              {proveedor.direccion}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Botones fijos en la parte inferior */}
              <div className="flex gap-2 justify-start p-4 border-t bg-white flex-shrink-0">
                <Button
                  className="h-8 px-4 text-xs bg-yellow-500 hover:bg-yellow-600"
                  onClick={handleSelectProveedor}
                  disabled={!selectedProveedor}
                >
                  Seleccionar
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-4 text-xs"
                  onClick={() => {
                    setIsProveedoresModalOpen(false);
                    setSelectedProveedor(null);
                    setProveedorSearchQuery("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Selección de Items */}
          <Dialog open={isItemsModalOpen} onOpenChange={setIsItemsModalOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Seleccionar Item</DialogTitle>
                <DialogDescription>
                  Busque y seleccione un item para agregar a la factura
                </DialogDescription>
              </DialogHeader>

              {/* Filtro - fijo en la parte superior */}
              <div className="flex gap-2 items-center px-4 pt-4 flex-shrink-0">
                <span className="text-sm font-semibold">Buscar:</span>
                <Input
                  className="max-w-md h-8 text-sm bg-yellow-100"
                  placeholder="Buscar por código o descripción..."
                  value={itemSearchQuery}
                  onChange={(e) => searchItems(e.target.value)}
                />
              </div>

              {/* Tabla de items - con scroll */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-100">
                        <TableHead className="text-xs font-bold text-center w-32">
                          Código
                        </TableHead>
                        <TableHead className="text-xs font-bold min-w-[300px]">
                          Descripción
                        </TableHead>
                        <TableHead className="text-xs font-bold text-center w-24">
                          U.M.
                        </TableHead>
                        <TableHead className="text-xs font-bold text-right w-32">
                          Precio Unitario
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow
                          key={item.codigo}
                          className={`cursor-pointer transition-colors ${
                            selectedItem === item.codigo
                              ? "bg-blue-200 hover:bg-blue-300"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleItemRowClick(item.codigo)}
                        >
                          <TableCell className="text-xs text-center">
                            {item.codigo}
                          </TableCell>
                          <TableCell className="text-xs">{item.descripcion}</TableCell>
                          <TableCell className="text-xs text-center">
                            {item.u_m}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {item.precio_unitario
                              ? Number(item.precio_unitario).toFixed(2)
                              : "0.00"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Botones fijos en la parte inferior */}
              <div className="flex gap-2 justify-start p-4 border-t bg-white flex-shrink-0">
                <Button
                  className="h-8 px-4 text-xs bg-yellow-500 hover:bg-yellow-600"
                  onClick={handleSelectItem}
                  disabled={!selectedItem}
                >
                  Seleccionar
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-4 text-xs"
                  onClick={() => {
                    setIsItemsModalOpen(false);
                    setSelectedItem(null);
                    setItemSearchQuery("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
