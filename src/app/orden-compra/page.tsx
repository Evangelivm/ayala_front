"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { proveedoresApi, type ProveedorData } from "@/lib/connections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ClipboardList, Plus, Trash2 } from "lucide-react";
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

export default function OrdenCompraPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCentroCostoModalOpen, setIsCentroCostoModalOpen] = useState(false);
  const [isNuevaOrdenModalOpen, setIsNuevaOrdenModalOpen] = useState(false);
  const [isNuevoCentroCostoModalOpen, setIsNuevoCentroCostoModalOpen] = useState(false);
  const [isCentroCostoListModalOpen, setIsCentroCostoListModalOpen] = useState(false);
  const [isProveedoresModalOpen, setIsProveedoresModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedCentroCosto, setSelectedCentroCosto] = useState<string | null>(null);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  const [proveedores, setProveedores] = useState<ProveedorData[]>([]);

  // Estado para Nueva Orden
  const [nuevaOrdenData, setNuevaOrdenData] = useState({
    nroCliente: "",
    razonSocial: "",
    tipoDoc: "Orden de compra",
    serie: "0001",
    nroDoc: "",
    fechaEmision: new Date(),
    moneda: "Soles",
    fechaServicio: new Date(),
    estado: "Abierto",
    igvPorcentaje: 18,
    retencion: {
      porcentaje: 3,
      monto: 0,
    },
    items: [
      {
        id: 1,
        nombre: "",
        glosa: "",
        ot: "",
        cantidad: 0,
        unidadMed: "UNIDAD",
        precioUni: 0,
        valorUni: 0,
        subtotal: 0,
        alma: "",
        tIgv: "",
        almacen: "",
      },
    ],
    afecto: 0,
    inafecto: 0,
    exonerado: 0,
    gratuito: 0,
    igv: 0,
    totalPagar: 0,
    observacion: "",
  });

  const [formData, setFormData] = useState({
    numero: "25OT010034",
    descripcion:
      "RELLENO COMPACTADO/MANUAL - TORRE 1, CASA C., EST., CISTERNA, PORT",
    entidadCodigo: "C0003",
    entidadNombre: "BESCO S.A.C.",
    fechaRegistro: "21/01/2025",
    fechaPeriodo: new Date(),
    observacion: "",
    centroCosto: {
      codigo: "0801",
      nombre: "NUEVA INDEPENDENCIA -MOVIMIENTO DE TIERRAS",
    },
    moneda: "SOLES S/",
    tipoCambio: "3.700",
    venta: "603,968.74",
    compra: "422,778.12",
    margen: "181,190.62",
    porcentajeMargen: "30.00",
    compraTolerancia: ".00",
    ventaFact: "148,336.68",
    compraFact: "174,818.16",
    margenFact: ".00",
  });

  const centrosCosto = [
    { codigo: "0801", nombre: "NUEVA INDEPENDENCIA -MOVIMIENTO DE TIERRAS" },
    { codigo: "0802", nombre: "PROYECTO ALTO LIMA - ESTRUCTURAS" },
    { codigo: "0803", nombre: "VILLA EL SALVADOR - ACABADOS" },
  ];

  const centrosCostoList = [
    { cecoCod: "01", centroCosto: "01 - ADMINISTRACIÓN", selected: false },
    { cecoCod: "0101", centroCosto: "0101 - SOPORTE TÉCNICO", selected: false },
    { cecoCod: "0102", centroCosto: "0102 - ÚTILES DE OFICINA", selected: false },
    { cecoCod: "0103", centroCosto: "0103 - SERVICIOS COMUNICACIONES", selected: false },
  ];

  const [nuevoCentroCostoData, setNuevoCentroCostoData] = useState({
    codigo: "0202",
    nombre: "CENTRIOQ CONDOMINIO ECOAMIGABLE",
    año: "2025"
  });

  const ordenesTrabajos = [
    {
      proyNum: "25OT12C385",
      descripcion: "ABASTECIMIENTO DE COMBUSTIBLE",
      fecha: "01/12/2025",
      entCod: "C0002",
      razonSocial: "MAQUINARIAS AYALA S.A.C.",
      cecoCod: "060101",
      cecoNombre: "MC-001 PPNC",
      pptoVentas: "1.00",
      pptoCompras: "99",
      margen: "1.00",
      ventasVal: ".00",
      compraReal: ".00",
      margenFinal: ".00"
    },
    {
      proyNum: "25OT12C386",
      descripcion: "ABASTECIMIENTO DE COMBUSTIBLE",
      fecha: "01/12/2025",
      entCod: "C0002",
      razonSocial: "MAQUINARIAS AYALA S.A.C.",
      cecoCod: "060102",
      cecoNombre: "MC-002 PPNC",
      pptoVentas: "1.00",
      pptoCompras: "99",
      margen: "1.00",
      ventasVal: ".00",
      compraReal: ".00",
      margenFinal: ".00"
    },
    {
      proyNum: "25OT12C387",
      descripcion: "ABASTECIMIENTO DE COMBUSTIBLE",
      fecha: "01/12/2025",
      entCod: "C0002",
      razonSocial: "MAQUINARIAS AYALA S.A.C.",
      cecoCod: "060103",
      cecoNombre: "PE-003 RETRI",
      pptoVentas: "1.00",
      pptoCompras: "99",
      margen: "1.00",
      ventasVal: ".00",
      compraReal: ".00",
      margenFinal: ".00"
    },
    {
      proyNum: "25OT12C388",
      descripcion: "ABASTECIMIENTO DE COMBUSTIBLE",
      fecha: "01/12/2025",
      entCod: "C0002",
      razonSocial: "MAQUINARIAS AYALA S.A.C.",
      cecoCod: "060104",
      cecoNombre: "PE-003 RETRI",
      pptoVentas: "1.00",
      pptoCompras: "99",
      margen: "1.00",
      ventasVal: ".00",
      compraReal: ".00",
      margenFinal: ".00"
    },
    {
      proyNum: "25OT12C389",
      descripcion: "ABASTECIMIENTO DE COMBUSTIBLE",
      fecha: "01/12/2025",
      entCod: "C0002",
      razonSocial: "MAQUINARIAS AYALA S.A.C.",
      cecoCod: "060105",
      cecoNombre: "RE-004 SETRI",
      pptoVentas: "1.00",
      pptoCompras: "99",
      margen: "1.00",
      ventasVal: ".00",
      compraReal: ".00",
      margenFinal: ".00"
    }
  ];

  const handleInputChange = (
    field: string,
    value: string | Date | { codigo: string; nombre: string }
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("Datos del formulario:", formData);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setFormData({
      numero: "25OT010034",
      descripcion:
        "RELLENO COMPACTADO/MANUAL - TORRE 1, CASA C., EST., CISTERNA, PORT",
      entidadCodigo: "C0003",
      entidadNombre: "BESCO S.A.C.",
      fechaRegistro: "21/01/2025",
      fechaPeriodo: new Date(),
      observacion: "",
      centroCosto: {
        codigo: "0801",
        nombre: "NUEVA INDEPENDENCIA -MOVIMIENTO DE TIERRAS",
      },
      moneda: "SOLES S/",
      tipoCambio: "3.700",
      venta: "603,968.74",
      compra: "422,778.12",
      margen: "181,190.62",
      porcentajeMargen: "30.00",
      compraTolerancia: ".00",
      ventaFact: "148,336.68",
      compraFact: "174,818.16",
      margenFact: ".00",
    });
    setIsModalOpen(false);
  };

  const selectCentroCosto = (centro: { codigo: string; nombre: string }) => {
    setFormData((prev) => ({ ...prev, centroCosto: centro }));
    setIsCentroCostoModalOpen(false);
  };

  const handleRowClick = (proyNum: string) => {
    setSelectedOrder(proyNum);
  };

  const handleSelectOrder = () => {
    if (selectedOrder) {
      const orden = ordenesTrabajos.find(o => o.proyNum === selectedOrder);
      if (orden) {
        // Actualizar formData con los datos de la orden seleccionada
        setFormData((prev) => ({ 
          ...prev, 
          numero: orden.proyNum,
          descripcion: orden.descripcion,
          centroCosto: {
            codigo: orden.cecoCod,
            nombre: orden.cecoNombre
          }
        }));
        setIsCentroCostoModalOpen(false);
        setSelectedOrder(null);
      }
    }
  };

  const handleNuevoCentroCostoInputChange = (field: string, value: string) => {
    setNuevoCentroCostoData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveNuevoCentroCosto = () => {
    console.log("Nuevo centro de costo:", nuevoCentroCostoData);
    setIsNuevoCentroCostoModalOpen(false);
  };

  const handleCancelNuevoCentroCosto = () => {
    setNuevoCentroCostoData({
      codigo: "0202",
      nombre: "CENTRIOQ CONDOMINIO ECOAMIGABLE",
      año: "2025"
    });
    setIsNuevoCentroCostoModalOpen(false);
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
      const proveedor = proveedores.find(p => p.id === selectedProveedor);
      if (proveedor) {
        setNuevaOrdenData((prev) => ({
          ...prev,
          nroCliente: proveedor.nro_documento || "",
          razonSocial: proveedor.razon_social || "",
        }));
        setIsProveedoresModalOpen(false);
        setSelectedProveedor(null);
      }
    }
  };

  const handleCentroCostoRowClick = (cecoCod: string) => {
    setSelectedCentroCosto(cecoCod);
  };

  const handleSelectCentroCosto = () => {
    if (selectedCentroCosto) {
      const centro = centrosCostoList.find(c => c.cecoCod === selectedCentroCosto);
      if (centro) {
        // Actualizar formData principal
        setFormData((prev) => ({ 
          ...prev, 
          centroCosto: {
            codigo: centro.cecoCod,
            nombre: centro.centroCosto
          }
        }));
        
        // Actualizar también el estado del nuevo centro de costo
        setNuevoCentroCostoData((prev) => ({
          ...prev,
          codigo: centro.cecoCod,
          nombre: centro.centroCosto.split(' - ')[1] || centro.centroCosto
        }));
        
        setIsCentroCostoListModalOpen(false);
        setSelectedCentroCosto(null);
      }
    }
  };

  // Funciones para Nueva Orden
  const handleNuevaOrdenInputChange = (
    field: string,
    value: string | Date | number | { porcentaje: number; monto: number }
  ) => {
    setNuevaOrdenData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedItems = [...nuevaOrdenData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calcular subtotal automáticamente
    if (field === "cantidad" || field === "precioUni") {
      const cantidad = Number(
        field === "cantidad" ? value : updatedItems[index].cantidad
      );
      const precio = Number(
        field === "precioUni" ? value : updatedItems[index].precioUni
      );
      updatedItems[index].subtotal = cantidad * precio;
      updatedItems[index].valorUni = cantidad * precio;
    }

    setNuevaOrdenData((prev) => ({ ...prev, items: updatedItems }));
    calcularTotales(updatedItems);
  };

  const addItem = () => {
    const newItem = {
      id: nuevaOrdenData.items.length + 1,
      nombre: "",
      glosa: "",
      ot: "",
      cantidad: 0,
      unidadMed: "UNIDAD",
      precioUni: 0,
      valorUni: 0,
      subtotal: 0,
      alma: "",
      tIgv: "",
      almacen: "",
    };
    setNuevaOrdenData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (index: number) => {
    if (nuevaOrdenData.items.length > 1) {
      const updatedItems = nuevaOrdenData.items.filter((_, i) => i !== index);
      setNuevaOrdenData((prev) => ({ ...prev, items: updatedItems }));
      calcularTotales(updatedItems);
    }
  };

  const calcularTotales = (items: Array<{ subtotal: number }>) => {
    const subtotal = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const igv = subtotal * (nuevaOrdenData.igvPorcentaje / 100);
    const retencionMonto =
      subtotal * (nuevaOrdenData.retencion.porcentaje / 100);
    const total = subtotal + igv;

    setNuevaOrdenData((prev) => ({
      ...prev,
      afecto: subtotal,
      igv: igv,
      retencion: {
        ...prev.retencion,
        monto: retencionMonto,
      },
      totalPagar: total,
    }));
  };

  const handleNuevaOrdenSave = () => {
    console.log("Nueva orden data:", nuevaOrdenData);
    setIsNuevaOrdenModalOpen(false);
  };

  const handleNuevaOrdenCancel = () => {
    setNuevaOrdenData({
      nroCliente: "",
      razonSocial: "",
      tipoDoc: "Orden de compra",
      serie: "0001",
      nroDoc: "",
      fechaEmision: new Date(),
      moneda: "Soles",
      fechaServicio: new Date(),
      estado: "Abierto",
      igvPorcentaje: 18,
      retencion: {
        porcentaje: 3,
        monto: 0,
      },
      items: [
        {
          id: 1,
          nombre: "",
          glosa: "",
          ot: "",
          cantidad: 0,
          unidadMed: "UNIDAD",
          precioUni: 0,
          valorUni: 0,
          subtotal: 0,
          alma: "",
          tIgv: "",
          almacen: "",
        },
      ],
      afecto: 0,
      inafecto: 0,
      exonerado: 0,
      gratuito: 0,
      igv: 0,
      totalPagar: 0,
      observacion: "",
    });
    setIsNuevaOrdenModalOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Orden de Compra
            </h1>
            <p className="text-muted-foreground">
              Gestión de órdenes de compra y trabajo
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Órdenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Ordenes de trabajo
                    </Button>
                  </DialogTrigger>
                </Dialog>

                <Dialog
                  open={isNuevaOrdenModalOpen}
                  onOpenChange={setIsNuevaOrdenModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                      Nueva orden
                    </Button>
                  </DialogTrigger>
                </Dialog>

                <Dialog
                  open={isNuevoCentroCostoModalOpen}
                  onOpenChange={setIsNuevoCentroCostoModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4" />
                      Centro de costo
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[95vw] max-h-[90vh] w-full overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
                  </DialogHeader>

                  <div className="p-4 space-y-2 text-sm">
                    {/* Fila 1: Número, Automático, Descripción */}
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          value={formData.numero}
                          onChange={(e) =>
                            handleInputChange("numero", e.target.value)
                          }
                          className="bg-orange-100 font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm font-medium">Automático</span>
                      </div>
                      <div className="col-span-8">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Input
                          id="descripcion"
                          value={formData.descripcion}
                          onChange={(e) =>
                            handleInputChange("descripcion", e.target.value)
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Fila 2: Entidad, Fecha Período, F. Registro */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-4">
                        <Label htmlFor="entidad">Entidad</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="entidad"
                            value={formData.entidadCodigo}
                            onChange={(e) =>
                              handleInputChange("entidadCodigo", e.target.value)
                            }
                            className="w-20"
                          />
                          <span className="text-sm font-medium">
                            {formData.entidadNombre}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <Label htmlFor="fecha-periodo">Fecha (período)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.fechaPeriodo
                                ? format(formData.fechaPeriodo, "dd/MM/yyyy", {
                                    locale: es,
                                  })
                                : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.fechaPeriodo}
                              onSelect={(date) =>
                                handleInputChange(
                                  "fechaPeriodo",
                                  date ?? new Date()
                                )
                              }
                              locale={es}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="col-span-4">
                        <Label htmlFor="fecha-registro">F. Registro</Label>
                        <Input
                          id="fecha-registro"
                          value={formData.fechaRegistro}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Fila 3: Observación */}
                    <div>
                      <Label htmlFor="observacion">Observación</Label>
                      <Textarea
                        id="observacion"
                        value={formData.observacion}
                        onChange={(e) =>
                          handleInputChange("observacion", e.target.value)
                        }
                        className="min-h-[50px] resize-none"
                      />
                    </div>

                    {/* Fila 4: Centro de costo */}
                    <div>
                      <Label htmlFor="centro-costo">Centro de costo</Label>
                      <Button
                        variant="outline"
                        onClick={() => setIsCentroCostoModalOpen(true)}
                        className="w-full justify-start text-left h-9"
                      >
                        {formData.centroCosto.codigo} -{" "}
                        {formData.centroCosto.nombre}
                      </Button>
                    </div>

                    {/* Fila 5: Presupuesto y Facturación lado a lado */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Presupuesto */}
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <h3 className="font-semibold mb-2 text-sm">
                          Presupuesto
                        </h3>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="moneda">Moneda</Label>
                              <Select
                                value={formData.moneda}
                                onValueChange={(value) =>
                                  handleInputChange("moneda", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="SOLES S/" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SOLES S/">
                                    SOLES S/
                                  </SelectItem>
                                  <SelectItem value="DOLARES $">
                                    DOLARES $
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="tipo-cambio">
                                Tipo de cambio:
                              </Label>
                              <Input
                                id="tipo-cambio"
                                value={formData.tipoCambio}
                                onChange={(e) =>
                                  handleInputChange(
                                    "tipoCambio",
                                    e.target.value
                                  )
                                }
                                className="text-right"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="venta">Venta:</Label>
                              <Input
                                id="venta"
                                value={formData.venta}
                                onChange={(e) =>
                                  handleInputChange("venta", e.target.value)
                                }
                                className="text-right"
                              />
                            </div>
                            <div>
                              <Label htmlFor="compra">Compra:</Label>
                              <Input
                                id="compra"
                                value={formData.compra}
                                onChange={(e) =>
                                  handleInputChange("compra", e.target.value)
                                }
                                className="text-right"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="margen">Margen:</Label>
                              <Input
                                id="margen"
                                value={formData.margen}
                                onChange={(e) =>
                                  handleInputChange("margen", e.target.value)
                                }
                                className="text-right"
                              />
                            </div>
                            <div>
                              <Label htmlFor="porcentaje-margen">
                                % Margen
                              </Label>
                              <Input
                                id="porcentaje-margen"
                                value={formData.porcentajeMargen}
                                onChange={(e) =>
                                  handleInputChange(
                                    "porcentajeMargen",
                                    e.target.value
                                  )
                                }
                                className="text-right"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="compra-tolerancia">
                              Compra tolerancia %
                            </Label>
                            <Input
                              id="compra-tolerancia"
                              value={formData.compraTolerancia}
                              onChange={(e) =>
                                handleInputChange(
                                  "compraTolerancia",
                                  e.target.value
                                )
                              }
                              className="text-right w-32"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Facturación */}
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <h3 className="font-semibold mb-2 text-sm">
                          Facturación
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="venta-fact">Venta:</Label>
                            <Input
                              id="venta-fact"
                              value={formData.ventaFact}
                              onChange={(e) =>
                                handleInputChange("ventaFact", e.target.value)
                              }
                              className="text-right"
                            />
                          </div>
                          <div>
                            <Label htmlFor="compra-fact">Compra:</Label>
                            <Input
                              id="compra-fact"
                              value={formData.compraFact}
                              onChange={(e) =>
                                handleInputChange("compraFact", e.target.value)
                              }
                              className="text-right"
                            />
                          </div>
                          <div>
                            <Label htmlFor="margen-fact">Margen %:</Label>
                            <Input
                              id="margen-fact"
                              value={formData.margenFact}
                              onChange={(e) =>
                                handleInputChange("margenFact", e.target.value)
                              }
                              className="text-right"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 px-4 pb-3 border-t pt-3">
                    <Button
                      variant="outline"
                      className="px-6 h-9"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="px-6 h-9 bg-orange-500 hover:bg-orange-600"
                      onClick={handleSave}
                    >
                      Guardar
                    </Button>
                  </div>

                  {/* Modal para Centro de Costo */}
                  <Dialog
                    open={isCentroCostoModalOpen}
                    onOpenChange={setIsCentroCostoModalOpen}
                  >
                    <DialogContent className="max-w-[90vw] max-h-[90vh] w-full flex flex-col">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Lista de Órdenes de trabajo</DialogTitle>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-y-auto px-4 space-y-4">
                        {/* Filtro */}
                        <div className="flex gap-2 items-center">
                          <span className="text-sm font-semibold">Filtrar:</span>
                          <Input 
                            className="max-w-xs h-8 text-sm"
                            placeholder="Buscar..."
                          />
                          <Button size="sm" className="h-8 px-3 text-xs">
                            🔍
                          </Button>
                        </div>

                        {/* Tabla de órdenes */}
                        <div className="border rounded-lg overflow-x-auto flex-shrink-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-blue-100">
                                <TableHead className="text-xs font-bold text-center w-24">Proy Nume</TableHead>
                                <TableHead className="text-xs font-bold min-w-[200px]">Descripción</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">Fecha</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">Ent cod</TableHead>
                                <TableHead className="text-xs font-bold text-center w-40">Razón social</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">Ceco Cod</TableHead>
                                <TableHead className="text-xs font-bold text-center w-32">Ceco Nombre</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">PPTO Ventas</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">PPTO Compras</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">Margen</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">Ventas val</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">Compra real</TableHead>
                                <TableHead className="text-xs font-bold text-center w-20">Margen final</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ordenesTrabajos.map((orden, index) => (
                                <TableRow 
                                  key={orden.proyNum}
                                  className={`cursor-pointer transition-colors ${
                                    selectedOrder === orden.proyNum 
                                      ? 'bg-blue-200 hover:bg-blue-300' 
                                      : index === 0 
                                        ? 'hover:bg-orange-50 bg-orange-100' 
                                        : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleRowClick(orden.proyNum)}
                                >
                                  <TableCell className="text-xs text-center">{orden.proyNum}</TableCell>
                                  <TableCell className="text-xs">{orden.descripcion}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.fecha}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.entCod}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.razonSocial}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.cecoCod}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.cecoNombre}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.pptoVentas}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.pptoCompras}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.margen}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.ventasVal}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.compraReal}</TableCell>
                                  <TableCell className="text-xs text-center">{orden.margenFinal}</TableCell>
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
                          onClick={handleSelectOrder}
                          disabled={!selectedOrder}
                        >
                          Seleccionar
                        </Button>
                        <Button variant="outline" className="h-8 px-4 text-xs">
                          Registrar nuevo
                        </Button>
                        <Button variant="outline" className="h-8 px-4 text-xs" onClick={() => setIsCentroCostoModalOpen(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </DialogContent>
              </Dialog>

              {/* Modal Nuevo Centro de Costo */}
              <Dialog
                open={isNuevoCentroCostoModalOpen}
                onOpenChange={setIsNuevoCentroCostoModalOpen}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Centro de costo (consultar)</DialogTitle>
                  </DialogHeader>
                  
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="codigo-cc" className="text-sm font-semibold">
                          Código:
                        </Label>
                        <Button
                          variant="outline"
                          onClick={() => setIsCentroCostoListModalOpen(true)}
                          className="w-full h-8 text-sm bg-orange-100 hover:bg-orange-200 justify-start font-normal border-gray-300"
                        >
                          {nuevoCentroCostoData.codigo}
                        </Button>
                      </div>
                      
                      <div>
                        <Label htmlFor="nombre-cc" className="text-sm font-semibold">
                          Nombre:
                        </Label>
                        <Input
                          id="nombre-cc"
                          value={nuevoCentroCostoData.nombre}
                          onChange={(e) =>
                            handleNuevoCentroCostoInputChange("nombre", e.target.value)
                          }
                          className="h-8 text-sm bg-orange-100"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="año-cc" className="text-sm font-semibold">
                          Año:
                        </Label>
                        <Input
                          id="año-cc"
                          value={nuevoCentroCostoData.año}
                          onChange={(e) =>
                            handleNuevoCentroCostoInputChange("año", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        className="h-8 px-4 text-xs bg-yellow-500 hover:bg-yellow-600"
                        onClick={handleSaveNuevoCentroCosto}
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 px-4 text-xs"
                        onClick={handleCancelNuevoCentroCosto}
                      >
                        Cancelar
                      </Button>
                    </div>

                  </div>
                </DialogContent>
              </Dialog>

              {/* Modal Lista de Centro de Costo */}
              <Dialog
                open={isCentroCostoListModalOpen}
                onOpenChange={setIsCentroCostoListModalOpen}
              >
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Lista de Centro de costo</DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto px-4 space-y-4">
                    {/* Filtro */}
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-semibold">Filtrar:</span>
                      <Input 
                        className="max-w-xs h-8 text-sm bg-yellow-100"
                        placeholder="Buscar..."
                      />
                    </div>

                    {/* Tabla de centros de costo */}
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-100">
                            <TableHead className="text-xs font-bold text-center w-24">Ceco Cod</TableHead>
                            <TableHead className="text-xs font-bold">Centro de costo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {centrosCostoList.map((centro, index) => (
                            <TableRow 
                              key={centro.cecoCod}
                              className={`cursor-pointer transition-colors ${
                                selectedCentroCosto === centro.cecoCod 
                                  ? 'bg-blue-200 hover:bg-blue-300' 
                                  : index === 0 
                                    ? 'hover:bg-yellow-50 bg-yellow-100' 
                                    : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleCentroCostoRowClick(centro.cecoCod)}
                            >
                              <TableCell className="text-xs text-center">{centro.cecoCod}</TableCell>
                              <TableCell className="text-xs">{centro.centroCosto}</TableCell>
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
                      onClick={handleSelectCentroCosto}
                      disabled={!selectedCentroCosto}
                    >
                      Seleccionar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-8 px-4 text-xs"
                      onClick={() => setIsCentroCostoListModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Modal Nueva Orden */}
              <Dialog
                open={isNuevaOrdenModalOpen}
                onOpenChange={setIsNuevaOrdenModalOpen}
              >
                <DialogContent className="max-w-[95vw] max-h-[90vh] w-full overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nueva Orden de Compra</DialogTitle>
                  </DialogHeader>

                  <div className="p-4 space-y-4 text-sm">
                    {/* Header con información del cliente y documento */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border rounded-lg">
                      {/* Primera fila */}
                      <div className="col-span-2">
                        <Label
                          htmlFor="nro-cliente"
                          className="text-xs font-semibold"
                        >
                          Nro cliente:
                        </Label>
                        <Button
                          variant="outline"
                          onClick={handleOpenProveedoresModal}
                          className="w-full h-8 text-xs justify-start bg-orange-100 hover:bg-orange-200 font-normal border-gray-300"
                        >
                          {nuevaOrdenData.nroCliente || "Seleccionar..."}
                        </Button>
                      </div>
                      <div className="col-span-4">
                        <Label
                          htmlFor="razon-social"
                          className="text-xs font-semibold"
                        >
                          Razón social:
                        </Label>
                        <Input
                          id="razon-social"
                          value={nuevaOrdenData.razonSocial}
                          readOnly
                          className="h-8 text-xs bg-gray-100"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor="fecha-emision"
                          className="text-xs font-semibold"
                        >
                          F. emisión:
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-8 text-xs justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {nuevaOrdenData.fechaEmision
                                ? format(
                                    nuevaOrdenData.fechaEmision,
                                    "dd/MM/yyyy",
                                    { locale: es }
                                  )
                                : "Fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={nuevaOrdenData.fechaEmision}
                              onSelect={(date) =>
                                handleNuevaOrdenInputChange(
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
                        <Label
                          htmlFor="moneda"
                          className="text-xs font-semibold"
                        >
                          Moneda:
                        </Label>
                        <Select
                          value={nuevaOrdenData.moneda}
                          onValueChange={(value) =>
                            handleNuevaOrdenInputChange("moneda", value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Soles">Soles</SelectItem>
                            <SelectItem value="Dolares">Dólares</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor="fecha-servicio"
                          className="text-xs font-semibold"
                        >
                          F. servicio:
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-8 text-xs justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {nuevaOrdenData.fechaServicio
                                ? format(
                                    nuevaOrdenData.fechaServicio,
                                    "dd/MM/yyyy HH:mm",
                                    { locale: es }
                                  )
                                : "Fecha y hora"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3">
                              <Calendar
                                mode="single"
                                selected={nuevaOrdenData.fechaServicio}
                                onSelect={(date) => {
                                  if (date) {
                                    const currentTime =
                                      nuevaOrdenData.fechaServicio;
                                    date.setHours(currentTime.getHours());
                                    date.setMinutes(currentTime.getMinutes());
                                  }
                                  handleNuevaOrdenInputChange(
                                    "fechaServicio",
                                    date || new Date()
                                  );
                                }}
                                locale={es}
                                initialFocus
                              />
                              <div className="flex gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <label className="text-xs">Hora:</label>
                                  <input
                                    type="time"
                                    className="h-7 text-xs border rounded px-2"
                                    value={format(
                                      nuevaOrdenData.fechaServicio,
                                      "HH:mm"
                                    )}
                                    onChange={(e) => {
                                      const [hours, minutes] =
                                        e.target.value.split(":");
                                      const newDate = new Date(
                                        nuevaOrdenData.fechaServicio
                                      );
                                      newDate.setHours(parseInt(hours));
                                      newDate.setMinutes(parseInt(minutes));
                                      handleNuevaOrdenInputChange(
                                        "fechaServicio",
                                        newDate
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Segunda fila */}
                      <div className="col-span-2">
                        <Label
                          htmlFor="tipo-doc"
                          className="text-xs font-semibold"
                        >
                          Tipo doc.
                        </Label>
                        <Select
                          value={nuevaOrdenData.tipoDoc}
                          onValueChange={(value) =>
                            handleNuevaOrdenInputChange("tipoDoc", value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Orden de compra">
                              Orden de compra
                            </SelectItem>
                            <SelectItem value="Orden de trabajo">
                              Orden de trabajo
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor="serie"
                          className="text-xs font-semibold"
                        >
                          Serie + Nro doc:
                        </Label>
                        <div className="flex gap-1">
                          <Input
                            id="serie"
                            value={nuevaOrdenData.serie}
                            onChange={(e) =>
                              handleNuevaOrdenInputChange(
                                "serie",
                                e.target.value
                              )
                            }
                            className="h-8 text-xs w-16"
                          />
                          <Input
                            value={nuevaOrdenData.nroDoc}
                            onChange={(e) =>
                              handleNuevaOrdenInputChange(
                                "nroDoc",
                                e.target.value
                              )
                            }
                            className="h-8 text-xs flex-1"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-semibold">
                          Contacto:
                        </Label>
                        <Input className="h-8 text-xs bg-gray-100" disabled />
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor="estado"
                          className="text-xs font-semibold"
                        >
                          Estado:
                        </Label>
                        <Select
                          value={nuevaOrdenData.estado}
                          onValueChange={(value) =>
                            handleNuevaOrdenInputChange("estado", value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Abierto">Abierto</SelectItem>
                            <SelectItem value="Cerrado">Cerrado</SelectItem>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                          </SelectContent>
                        </Select>
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
                              <TableHead className="min-w-[200px] text-xs font-bold">
                                Nombre
                              </TableHead>
                              <TableHead className="min-w-[150px] text-xs font-bold">
                                Glosa
                              </TableHead>
                              <TableHead className="w-20 text-xs font-bold">
                                OT
                              </TableHead>
                              <TableHead className="w-16 text-xs font-bold text-center">
                                Cant
                              </TableHead>
                              <TableHead className="w-24 text-xs font-bold text-center">
                                Unid. Med.
                              </TableHead>
                              <TableHead className="w-24 text-xs font-bold text-right">
                                Precio uni
                              </TableHead>
                              <TableHead className="w-24 text-xs font-bold text-right">
                                Valor uni
                              </TableHead>
                              <TableHead className="w-24 text-xs font-bold text-right">
                                Subtotal
                              </TableHead>
                              <TableHead className="w-16 text-xs font-bold">
                                Alma
                              </TableHead>
                              <TableHead className="w-16 text-xs font-bold">
                                T/Igv
                              </TableHead>
                              <TableHead className="w-20 text-xs font-bold">
                                Almacén
                              </TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {nuevaOrdenData.items.map((item, index) => (
                              <TableRow
                                key={item.id}
                                className="hover:bg-gray-50"
                              >
                                <TableCell className="text-center text-xs font-semibold">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.nombre}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "nombre",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1"
                                    placeholder="Nombre del producto/servicio"
                                    required
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.glosa}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "glosa",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1"
                                    placeholder="Descripción"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.ot}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "ot",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.cantidad}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "cantidad",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1 text-center"
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.unidadMed}
                                    onValueChange={(value) =>
                                      handleItemChange(
                                        index,
                                        "unidadMed",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="UNIDAD">
                                        UNIDAD
                                      </SelectItem>
                                      <SelectItem value="KG">KG</SelectItem>
                                      <SelectItem value="M">M</SelectItem>
                                      <SelectItem value="M2">M²</SelectItem>
                                      <SelectItem value="M3">M³</SelectItem>
                                      <SelectItem value="SERVICIO">
                                        SERVICIO
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.precioUni}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "precioUni",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1 text-right"
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </TableCell>
                                <TableCell className="text-right text-xs">
                                  {item.valorUni.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-xs font-semibold">
                                  {item.subtotal.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.alma}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "alma",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.tIgv}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "tIgv",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.almacen}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "almacen",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs border-0 bg-transparent p-1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    onClick={() => removeItem(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    disabled={nuevaOrdenData.items.length <= 1}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Sección de Totales */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-8">
                        <div className="space-y-2">
                          <div>
                            <Label
                              htmlFor="observacion-nueva"
                              className="text-xs font-semibold"
                            >
                              Observación:
                            </Label>
                            <Textarea
                              id="observacion-nueva"
                              value={nuevaOrdenData.observacion}
                              onChange={(e) =>
                                handleNuevaOrdenInputChange(
                                  "observacion",
                                  e.target.value
                                )
                              }
                              className="min-h-[60px] resize-none text-xs"
                              placeholder="Observaciones adicionales..."
                            />
                          </div>

                          {/* Sección de Retención */}
                          <div className="mt-4 p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <h4 className="text-sm font-semibold mb-2">
                              Retención
                            </h4>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">Retención</span>
                                <Select
                                  value={nuevaOrdenData.retencion.porcentaje.toString()}
                                  onValueChange={(value) => {
                                    handleNuevaOrdenInputChange("retencion", {
                                      ...nuevaOrdenData.retencion,
                                      porcentaje: parseInt(value),
                                    });
                                    calcularTotales(nuevaOrdenData.items);
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs w-16">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="3">3%</SelectItem>
                                    <SelectItem value="8">8%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={nuevaOrdenData.retencion.monto.toFixed(
                                    2
                                  )}
                                  readOnly
                                  className="h-7 text-xs w-24 bg-gray-100"
                                />
                                <input type="checkbox" className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                          <div className="mb-3">
                            <Label
                              htmlFor="igv-porcentaje"
                              className="text-xs font-semibold"
                            >
                              IGV:
                            </Label>
                            <Select
                              value={nuevaOrdenData.igvPorcentaje.toString()}
                              onValueChange={(value) => {
                                handleNuevaOrdenInputChange(
                                  "igvPorcentaje",
                                  parseInt(value)
                                );
                                calcularTotales(nuevaOrdenData.items);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="18">18%</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="0">0%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">Afecto:</span>
                            <span className="font-mono">
                              {nuevaOrdenData.afecto.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">Inafecto:</span>
                            <span className="font-mono">
                              {nuevaOrdenData.inafecto.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">Exonerado:</span>
                            <span className="font-mono">
                              {nuevaOrdenData.exonerado.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">Gratuito:</span>
                            <span className="font-mono">
                              {nuevaOrdenData.gratuito.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs border-t pt-2">
                            <span className="font-semibold">
                              Igv ({nuevaOrdenData.igvPorcentaje}%):
                            </span>
                            <span className="font-mono">
                              {nuevaOrdenData.igv.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-bold border-t pt-2 bg-blue-100 -mx-3 px-3 py-2 rounded-b-lg">
                            <span>Total a pagar:</span>
                            <span className="font-mono">
                              {nuevaOrdenData.totalPagar.toFixed(2)}
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
                      onClick={handleNuevaOrdenCancel}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="px-6 h-9 bg-orange-500 hover:bg-orange-600"
                      onClick={handleNuevaOrdenSave}
                    >
                      Guardar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Modal de Selección de Proveedores */}
              <Dialog
                open={isProveedoresModalOpen}
                onOpenChange={setIsProveedoresModalOpen}
              >
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Seleccionar Proveedor</DialogTitle>
                  </DialogHeader>

                  {/* Filtro - fijo en la parte superior */}
                  <div className="flex gap-2 items-center px-4 pt-4 flex-shrink-0">
                    <span className="text-sm font-semibold">Filtrar:</span>
                    <Input
                      className="max-w-xs h-8 text-sm bg-yellow-100"
                      placeholder="Buscar por documento o razón social..."
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
                            <TableHead className="text-xs font-bold">
                              Razón Social
                            </TableHead>
                            <TableHead className="text-xs font-bold">
                              Dirección
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proveedores.map((proveedor) => (
                            <TableRow
                              key={proveedor.id}
                              className={`cursor-pointer transition-colors ${
                                selectedProveedor === proveedor.id
                                  ? "bg-blue-200 hover:bg-blue-300"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => handleProveedorRowClick(proveedor.id)}
                            >
                              <TableCell className="text-xs text-center">
                                {proveedor.nro_documento}
                              </TableCell>
                              <TableCell className="text-xs">
                                {proveedor.razon_social}
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
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
