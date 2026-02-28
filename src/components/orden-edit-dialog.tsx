"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  camionesApi,
  type CamionData,
  ordenesCompraApi,
  type OrdenCompraData,
  ordenesServicioApi,
  type OrdenServicioData,
} from "@/lib/connections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  Trash2,
  RefreshCw,
  X,
  Search,
  ClipboardList,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CamionSelectDialog } from "@/components/camion-select-dialog";
import { DetraccionSelectDialog } from "@/components/detraccion-select-dialog";

const parseDateSafe = (dateString: string): Date => {
  if (dateString && !dateString.includes("T")) {
    return parseISO(dateString + "T12:00:00");
  }
  return parseISO(dateString);
};

interface OrdenEditDialogProps {
  orden: OrdenCompraData | OrdenServicioData | null;
  tipo: "compra" | "servicio";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const emptyFormData = {
  id_proveedor: 0,
  nroCliente: "",
  razonSocial: "",
  retencionProveedor: "",
  almacenCentral: false,
  anticipo: false,
  serie: "0001",
  nroDoc: "",
  fechaEmision: new Date(),
  moneda: "SOLES",
  tipoCambio: 0,
  fechaServicio: new Date(),
  estado: "PENDIENTE",
  centroCostoNivel1Codigo: "",
  centroCostoNivel2Codigo: "",
  centroCostoNivel3Codigo: "",
  unidad: "",
  unidad_id: 0,
  igvPorcentaje: 18,
  aplicarRetencion: false,
  retencion: { porcentaje: 3, monto: 0 },
  aplicarDetraccion: false,
  detraccion: { porcentaje: 3, monto: 0, tipo_detraccion: "" },
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
};

export function OrdenEditDialog({
  orden,
  tipo,
  open,
  onOpenChange,
  onSaved,
}: OrdenEditDialogProps) {
  const [formData, setFormData] = useState({ ...emptyFormData });
  const [isSaving, setIsSaving] = useState(false);

  // Sub-modal: Proveedores
  const [isProveedoresOpen, setIsProveedoresOpen] = useState(false);
  const [proveedores, setProveedores] = useState<ProveedorData[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  const [proveedorSearchQuery, setProveedorSearchQuery] = useState("");

  // Sub-modal: Items
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [items, setItems] = useState<ItemData[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [replacingItemIndex, setReplacingItemIndex] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  // Datos auxiliares
  const [centrosProyecto, setCentrosProyecto] = useState<CentroProyectoData[]>([]);
  const [fases, setFases] = useState<FaseControlData[]>([]);
  const [rubros, setRubros] = useState<RubroData[]>([]);
  const [camiones, setCamiones] = useState<CamionData[]>([]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debounce = useCallback((fn: () => void, delay = 300) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(fn, delay);
  }, []);

  // Cargar datos auxiliares al abrir
  useEffect(() => {
    if (!open) return;
    camionesApi.getAll().then(setCamiones).catch(() => {});
    centroProyectoApi.getAll().then(setCentrosProyecto).catch(() => {});
    faseControlApi.getAll().then(setFases).catch(() => {});
    rubroApi.getAll().then(setRubros).catch(() => {});
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [open]);

  // Poblar formulario cuando cambia la orden
  useEffect(() => {
    if (!open || !orden) return;
    const [serie, nroDoc] = orden.numero_orden.split("-");
    const camion = camiones.find((c) => c.id_camion === orden.unidad_id);

    const isCompra = tipo === "compra";
    const o = orden as OrdenCompraData & OrdenServicioData;

    setFormData({
      id_proveedor: o.id_proveedor,
      nroCliente: o.ruc_proveedor || "",
      razonSocial: o.nombre_proveedor || "",
      retencionProveedor: o.retencion || "",
      almacenCentral: o.almacen_central === "SI",
      anticipo: o.tiene_anticipo === "SI" || o.tiene_anticipo === 1,
      serie: serie || "0001",
      nroDoc: nroDoc || "",
      fechaEmision: parseDateSafe(o.fecha_orden),
      moneda: o.moneda,
      tipoCambio: Number(o.tipo_cambio) || 0,
      fechaServicio: parseDateSafe(o.fecha_registro),
      estado: o.estado,
      centroCostoNivel1Codigo: o.centro_costo_nivel1 || "",
      centroCostoNivel2Codigo: o.centro_costo_nivel2 || "",
      centroCostoNivel3Codigo: o.centro_costo_nivel3 || "",
      unidad: camion?.placa || "",
      unidad_id: o.unidad_id || 0,
      igvPorcentaje: 18,
      aplicarRetencion: isCompra ? o.retencion === "SI" : o.retencion === "SI",
      retencion: {
        porcentaje: o.porcentaje_valor_retencion ? Number(o.porcentaje_valor_retencion) : 3,
        monto: Number(o.valor_retencion) || 0,
      },
      aplicarDetraccion: o.detraccion === "SI",
      detraccion: {
        porcentaje: o.porcentaje_valor_detraccion ? Number(o.porcentaje_valor_detraccion) : 3,
        monto: Number(o.valor_detraccion) || 0,
        tipo_detraccion: o.tipo_detraccion || "",
      },
      items: (o.items || []).map((item) => ({
        codigo_item: item.codigo_item,
        descripcion_item: item.descripcion_item,
        cantidad_solicitada: Number(item.cantidad_solicitada) || 0,
        unidadMed: "UNIDAD",
        precio_unitario: Number(item.precio_unitario) || 0,
        subtotal: Number(item.subtotal) || 0,
      })),
      subtotal: Number(o.subtotal) || 0,
      igv: Number(o.igv) || 0,
      total: Number(o.total) || 0,
      netoAPagar: Number(o.total) || 0,
      observacion: o.observaciones || "",
    });
  }, [open, orden, camiones, tipo]);

  const calcularTotales = useCallback(
    (
      itemsArr: Array<{ subtotal: number }>,
      nuevoPorcentajeRetencion?: number,
      nuevoPorcentajeDetraccion?: number
    ) => {
      const subtotalCalc = itemsArr.reduce((acc, i) => acc + (i.subtotal || 0), 0);
      const igvCalc = subtotalCalc * (formData.igvPorcentaje / 100);
      const totalCalc = subtotalCalc + igvCalc;

      const pctRet = nuevoPorcentajeRetencion ?? formData.retencion.porcentaje;
      const pctDet = nuevoPorcentajeDetraccion ?? formData.detraccion.porcentaje;
      const retMonto = formData.aplicarRetencion ? totalCalc * (pctRet / 100) : 0;
      const detMonto = formData.aplicarDetraccion ? totalCalc * (pctDet / 100) : 0;

      setFormData((prev) => ({
        ...prev,
        subtotal: subtotalCalc,
        igv: igvCalc,
        total: totalCalc,
        retencion: { ...prev.retencion, monto: retMonto },
        detraccion: { ...prev.detraccion, monto: detMonto },
        netoAPagar: totalCalc - retMonto - detMonto,
      }));
    },
    [formData.igvPorcentaje, formData.aplicarRetencion, formData.retencion.porcentaje, formData.aplicarDetraccion, formData.detraccion.porcentaje]
  );

  const handleFieldChange = useCallback(
    (
      field: string,
      value: string | Date | number | boolean | { porcentaje: number; monto: number; tipo_detraccion?: string }
    ) => {
      setFormData((prev) => {
        if (field === "almacenCentral" && value === true) {
          return { ...prev, [field]: value, centroCostoNivel1Codigo: "", centroCostoNivel2Codigo: "", centroCostoNivel3Codigo: "" };
        }
        return { ...prev, [field]: value };
      });
    },
    []
  );

  const handleItemChange = useCallback(
    (index: number, field: string, value: string | number) => {
      const updated = [...formData.items];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "subtotal") {
        const cant = Number(updated[index].cantidad_solicitada);
        if (cant > 0) updated[index].precio_unitario = Number(value) / cant;
      }
      setFormData((prev) => ({ ...prev, items: updated }));
      debounce(() => calcularTotales(updated), 300);
    },
    [formData.items, debounce, calcularTotales]
  );

  const addItem = () => {
    setIsItemsOpen(true);
    itemsApi.getAll().then(setItems).catch(() => setItems([]));
  };

  const removeItem = (index: number) => {
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updated }));
    calcularTotales(updated);
  };

  const replaceItem = (index: number) => {
    setReplacingItemIndex(index);
    setIsItemsOpen(true);
    itemsApi.getAll().then(setItems).catch(() => setItems([]));
  };

  const handleSelectItem = () => {
    if (!selectedItem) return;
    const item = items.find((i) => i.codigo === selectedItem);
    if (!item) return;
    const newItem = {
      codigo_item: item.codigo,
      descripcion_item: item.descripcion,
      cantidad_solicitada: 1,
      unidadMed: item.u_m || "UNIDAD",
      precio_unitario: Number(item.precio_unitario) || 0,
      subtotal: Number(item.precio_unitario) || 0,
    };
    let updated: typeof formData.items;
    if (replacingItemIndex !== null) {
      updated = [...formData.items];
      updated[replacingItemIndex] = newItem;
    } else {
      updated = [...formData.items, newItem];
    }
    setFormData((prev) => ({ ...prev, items: updated }));
    calcularTotales(updated);
    setIsItemsOpen(false);
    setSelectedItem(null);
    setReplacingItemIndex(null);
  };

  const handleSelectProveedor = () => {
    if (!selectedProveedor) return;
    const p = proveedores.find((x) => x.id_proveedor === selectedProveedor);
    if (!p) return;
    setFormData((prev) => ({
      ...prev,
      id_proveedor: p.id_proveedor,
      nroCliente: p.ruc || "",
      razonSocial: p.nombre_proveedor || "",
      retencionProveedor: p.retencion || "",
      aplicarRetencion: p.retencion === "Si",
    }));
    setIsProveedoresOpen(false);
    setSelectedProveedor(null);
    setProveedorSearchQuery("");
  };

  const handleSave = async () => {
    if (!orden) return;
    if (!formData.id_proveedor) { toast.error("Debe seleccionar un proveedor"); return; }
    if (!formData.serie || !formData.nroDoc) { toast.error("Debe ingresar la serie y número de documento"); return; }
    if (formData.items.length === 0) { toast.error("Debe agregar al menos un item"); return; }
    if (isSaving) return;

    setIsSaving(true);
    const numero_orden = `${formData.serie}-${formData.nroDoc}`;
    const ordenId = tipo === "compra"
      ? (orden as OrdenCompraData).id_orden_compra!
      : (orden as OrdenServicioData).id_orden_servicio!;
    const tipoTexto = tipo === "compra" ? "compra" : "servicio";

    try {
      const payload = {
        id_proveedor: formData.id_proveedor,
        numero_orden,
        fecha_orden: format(formData.fechaEmision, "yyyy-MM-dd"),
        moneda: formData.moneda,
        fecha_registro: formData.fechaServicio.toISOString(),
        estado: formData.estado || "PENDIENTE",
        centro_costo_nivel1: formData.centroCostoNivel1Codigo,
        centro_costo_nivel2: formData.centroCostoNivel2Codigo,
        centro_costo_nivel3: formData.centroCostoNivel3Codigo,
        unidad_id: formData.unidad_id > 0 ? formData.unidad_id : null,
        retencion: formData.aplicarRetencion ? "SI" : "NO",
        porcentaje_valor_retencion: formData.retencion.porcentaje.toString(),
        valor_retencion: formData.retencion.monto,
        detraccion: formData.aplicarDetraccion ? "SI" : "NO",
        porcentaje_valor_detraccion: formData.detraccion.porcentaje.toString(),
        tipo_detraccion: formData.detraccion.tipo_detraccion,
        valor_detraccion: formData.detraccion.monto,
        almacen_central: formData.almacenCentral ? "SI" : "NO",
        has_anticipo: formData.anticipo ? 1 : 0,
        tiene_anticipo: formData.anticipo ? "SI" : "NO",
        items: formData.items.map((i) => ({
          codigo_item: i.codigo_item,
          descripcion_item: i.descripcion_item,
          cantidad_solicitada: i.cantidad_solicitada,
          precio_unitario: i.precio_unitario,
          subtotal: i.subtotal,
        })),
        subtotal: formData.subtotal,
        igv: formData.igv,
        total: formData.total,
        observaciones: formData.observacion,
      };

      toast.loading(`Actualizando orden de ${tipoTexto}...`);
      const api = tipo === "compra" ? ordenesCompraApi : ordenesServicioApi;
      await api.update(ordenId, payload as OrdenCompraData & OrdenServicioData);
      toast.dismiss();
      toast.success(`Orden de ${tipoTexto} actualizada exitosamente`, {
        description: `Número: ${numero_orden}`,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.dismiss();
      let msg = "Error desconocido";
      if (error && typeof error === "object") {
        // @ts-expect-error - Axios error
        if (error.response?.data?.message) msg = error.response.data.message;
        else if (error instanceof Error) msg = error.message;
      }
      toast.error(`Error al actualizar la orden de ${tipoTexto}`, { description: msg, duration: 7000 });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProveedores = proveedores.filter(
    (p) =>
      !proveedorSearchQuery ||
      p.nombre_proveedor?.toLowerCase().includes(proveedorSearchQuery.toLowerCase()) ||
      p.ruc?.includes(proveedorSearchQuery)
  );

  const filteredItems = items.filter(
    (i) =>
      !itemSearchQuery ||
      i.descripcion?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      i.codigo?.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const ordenId = orden
    ? tipo === "compra"
      ? (orden as OrdenCompraData).id_orden_compra
      : (orden as OrdenServicioData).id_orden_servicio
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] w-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Orden de {tipo === "compra" ? "Compra" : "Servicio"}
            </DialogTitle>
            <DialogDescription>
              Edite los datos de la orden de {tipo === "compra" ? "compra" : "servicio"}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-4 text-sm">
            {/* Header con información del cliente */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border rounded-lg">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Nro cliente:</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsProveedoresOpen(true);
                    proveedoresApi.getAll().then(setProveedores).catch(() => setProveedores([]));
                  }}
                  className="w-full h-8 text-xs justify-start bg-orange-100 hover:bg-orange-200 font-normal border-gray-300"
                >
                  {formData.nroCliente || "Seleccionar..."}
                </Button>
              </div>
              <div className="col-span-4">
                <Label className="text-xs font-semibold">Razón social:</Label>
                <Input value={formData.razonSocial} readOnly className="h-8 text-xs bg-gray-100" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Retención:</Label>
                <Select
                  value={formData.aplicarRetencion ? "SI" : "NO"}
                  onValueChange={(v) => {
                    const aplicar = v === "SI";
                    setFormData((prev) => {
                      const n = { ...prev, aplicarRetencion: aplicar };
                      const sub = n.items.reduce((a, i) => a + (i.subtotal || 0), 0);
                      const igv = sub * (n.igvPorcentaje / 100);
                      const tot = sub + igv;
                      const ret = aplicar ? tot * (n.retencion.porcentaje / 100) : 0;
                      const det = n.aplicarDetraccion ? tot * (n.detraccion.porcentaje / 100) : 0;
                      return { ...n, subtotal: sub, igv, total: tot, retencion: { ...n.retencion, monto: ret }, detraccion: { ...n.detraccion, monto: det }, netoAPagar: tot - ret - det };
                    });
                  }}
                >
                  <SelectTrigger className={`h-8 text-xs ${tipo === "compra" && formData.total > 700 && !formData.aplicarRetencion ? "border-red-500 border-2" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO">NO</SelectItem>
                    <SelectItem value="SI">SÍ</SelectItem>
                  </SelectContent>
                </Select>
                {tipo === "compra" && formData.total > 700 && !formData.aplicarRetencion && (
                  <p className="mt-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-300 animate-pulse">
                    ⚠️ Verifique si es agente de retención
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Detracción:</Label>
                <Select
                  value={formData.aplicarDetraccion ? "SI" : "NO"}
                  onValueChange={(v) => {
                    const aplicar = v === "SI";
                    setFormData((prev) => {
                      const n = { ...prev, aplicarDetraccion: aplicar };
                      const sub = n.items.reduce((a, i) => a + (i.subtotal || 0), 0);
                      const igv = sub * (n.igvPorcentaje / 100);
                      const tot = sub + igv;
                      const ret = n.aplicarRetencion ? tot * (n.retencion.porcentaje / 100) : 0;
                      const det = aplicar ? tot * (n.detraccion.porcentaje / 100) : 0;
                      return { ...n, subtotal: sub, igv, total: tot, retencion: { ...n.retencion, monto: ret }, detraccion: { ...n.detraccion, monto: det }, netoAPagar: tot - ret - det };
                    });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO">NO</SelectItem>
                    <SelectItem value="SI">SÍ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">F. emisión:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-8 text-xs justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {format(formData.fechaEmision, "dd/MM/yyyy", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.fechaEmision} onSelect={(d) => handleFieldChange("fechaEmision", d || new Date())} locale={es} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Moneda:</Label>
                <Select value={formData.moneda} onValueChange={(v) => handleFieldChange("moneda", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLES">SOLES</SelectItem>
                    <SelectItem value="DOLARES">DÓLARES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">{tipo === "compra" ? "Fecha Compra:" : "Fecha Servicio:"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-8 text-xs justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {format(formData.fechaServicio, "dd/MM/yyyy HH:mm", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={formData.fechaServicio}
                        onSelect={(d) => {
                          if (d) {
                            d.setHours(formData.fechaServicio.getHours());
                            d.setMinutes(formData.fechaServicio.getMinutes());
                          }
                          handleFieldChange("fechaServicio", d || new Date());
                        }}
                        locale={es}
                        initialFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <label className="text-xs">Hora:</label>
                        <input
                          type="time"
                          className="h-7 text-xs border rounded px-2"
                          value={format(formData.fechaServicio, "HH:mm")}
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(":");
                            const d = new Date(formData.fechaServicio);
                            d.setHours(parseInt(h));
                            d.setMinutes(parseInt(m));
                            handleFieldChange("fechaServicio", d);
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Unidad:</Label>
                <div className="scale-90 origin-left">
                  <CamionSelectDialog
                    camiones={camiones}
                    onSelect={(camion) => {
                      setFormData((prev) => ({ ...prev, unidad: camion.placa, unidad_id: camion.id_camion }));
                    }}
                    currentPlaca={formData.unidad}
                    buttonText="Seleccionar"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold mb-2 block">Opciones</Label>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={formData.almacenCentral} onChange={(e) => handleFieldChange("almacenCentral", e.target.checked)} className="w-4 h-4" />
                    Almacén Central
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={formData.anticipo} onChange={(e) => handleFieldChange("anticipo", e.target.checked)} className="w-4 h-4" />
                    Anticipo
                  </label>
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Serie + Nro doc:</Label>
                <div className="flex gap-1">
                  <Input value={formData.serie} onChange={(e) => handleFieldChange("serie", e.target.value)} className="h-8 text-xs w-16" />
                  <Input value={formData.nroDoc} onChange={(e) => handleFieldChange("nroDoc", e.target.value)} className="h-8 text-xs flex-1" />
                </div>
              </div>
            </div>

            {/* Centro de Costos */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="col-span-12">
                <h3 className="text-sm font-bold text-blue-800 mb-2">Centro de Costos</h3>
              </div>
              <div className="col-span-4">
                <Label className="text-xs font-semibold">Nivel 1 (Proyecto):</Label>
                <div className="flex gap-1">
                  <Select
                    value={formData.centroCostoNivel1Codigo}
                    onValueChange={(v) => handleFieldChange("centroCostoNivel1Codigo", v)}
                    disabled={formData.almacenCentral}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar proyecto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosProyecto.map((c) => (
                        <SelectItem key={c.id} value={c.codigo}>{c.proyecto}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.centroCostoNivel1Codigo && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleFieldChange("centroCostoNivel1Codigo", "")} disabled={formData.almacenCentral}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="col-span-4">
                <Label className="text-xs font-semibold">Nivel 2 (Fase):</Label>
                <div className="flex gap-1">
                  <Select value={formData.centroCostoNivel2Codigo} onValueChange={(v) => handleFieldChange("centroCostoNivel2Codigo", v)} disabled={formData.almacenCentral}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar fase..." /></SelectTrigger>
                    <SelectContent>
                      {fases.map((f) => (<SelectItem key={f.id} value={f.codigo || ""}>{f.descripcion}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {formData.centroCostoNivel2Codigo && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleFieldChange("centroCostoNivel2Codigo", "")} disabled={formData.almacenCentral}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="col-span-4">
                <Label className="text-xs font-semibold">Nivel 3 (Rubro):</Label>
                <div className="flex gap-1">
                  <Select value={formData.centroCostoNivel3Codigo} onValueChange={(v) => handleFieldChange("centroCostoNivel3Codigo", v)} disabled={formData.almacenCentral}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar rubro..." /></SelectTrigger>
                    <SelectContent>
                      {rubros.map((r) => (<SelectItem key={r.id} value={r.codigo}>{r.descripcion}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {formData.centroCostoNivel3Codigo && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleFieldChange("centroCostoNivel3Codigo", "")} disabled={formData.almacenCentral}>
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
                <Button onClick={addItem} size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700">
                  <Plus className="h-3 w-3 mr-1" /> Agregar ítem
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="w-12 text-xs font-bold text-center">Ítem</TableHead>
                      <TableHead className="w-32 text-xs font-bold text-center">Código</TableHead>
                      <TableHead className="min-w-[200px] text-xs font-bold">Nombre</TableHead>
                      <TableHead className="w-24 text-xs font-bold text-center">Cantidad</TableHead>
                      <TableHead className="w-36 text-xs font-bold text-right">Precio Unit.</TableHead>
                      <TableHead className="w-40 text-xs font-bold text-right">Subtotal</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-center text-xs font-semibold">{index + 1}</TableCell>
                        <TableCell className="text-xs text-center bg-gray-50 p-2 font-mono">{item.codigo_item || <span className="text-gray-400 italic">-</span>}</TableCell>
                        <TableCell className="text-xs bg-gray-50 p-2">{item.descripcion_item || <span className="text-gray-400 italic">Sin seleccionar</span>}</TableCell>
                        <TableCell>
                          <Input type="number" value={item.cantidad_solicitada} onChange={(e) => handleItemChange(index, "cantidad_solicitada", parseFloat(e.target.value) || 0)} className="h-8 text-xs text-center" min="0" step="0.01" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.precio_unitario} onChange={(e) => handleItemChange(index, "precio_unitario", parseFloat(e.target.value) || 0)} className="h-8 text-xs text-right font-mono" min="0" step="0.01" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.subtotal} onChange={(e) => handleItemChange(index, "subtotal", parseFloat(e.target.value) || 0)} className="h-8 text-xs text-right font-mono" min="0" step="0.01" />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button onClick={() => replaceItem(index)} variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Reemplazar">
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button onClick={() => removeItem(index)} variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" title="Eliminar">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {formData.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList className="h-8 w-8 opacity-50" />
                            <p className="text-sm">No hay items agregados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totales y Observaciones */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <Label className="text-xs font-semibold">Observación:</Label>
                <Textarea
                  value={formData.observacion}
                  onChange={(e) => handleFieldChange("observacion", e.target.value)}
                  className="min-h-[180px] resize-none text-xs mt-1"
                  placeholder="Observaciones adicionales..."
                />
              </div>
              <div className="col-span-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Resumen de Totales</h3>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-mono">{formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">IGV:</span>
                      <Select
                        value={formData.igvPorcentaje.toString()}
                        onValueChange={(v) => { handleFieldChange("igvPorcentaje", parseInt(v)); calcularTotales(formData.items); }}
                      >
                        <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="0">0%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="font-mono">{formData.igv.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="font-mono">{formData.total.toFixed(2)}</span>
                  </div>
                  {formData.aplicarRetencion && (
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">Retención:</span>
                        <span className="font-mono text-red-600">-{formData.retencion.monto.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Porcentaje:</span>
                        <Select
                          value={formData.retencion.porcentaje.toString()}
                          onValueChange={(v) => {
                            const pct = parseInt(v);
                            handleFieldChange("retencion", { ...formData.retencion, porcentaje: pct });
                            calcularTotales(formData.items, pct, undefined);
                          }}
                        >
                          <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="3">3%</SelectItem>
                            <SelectItem value="8">8%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {formData.aplicarDetraccion && (
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">Detracción:</span>
                        <span className="font-mono text-red-600">-{formData.detraccion.monto.toFixed(2)}</span>
                      </div>
                      <div className="scale-95 origin-left">
                        <DetraccionSelectDialog
                          currentPorcentaje={formData.detraccion.porcentaje}
                          currentCodigo={formData.detraccion.tipo_detraccion}
                          onSelect={(porcentaje, codigo) => {
                            handleFieldChange("detraccion", { ...formData.detraccion, porcentaje, tipo_detraccion: codigo });
                            calcularTotales(formData.items, undefined, porcentaje);
                          }}
                          buttonText="Seleccionar tipo de detracción"
                          buttonClassName="h-7 text-xs bg-purple-50 hover:bg-purple-100 border-purple-300"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t-2 pt-3 bg-blue-100 -mx-4 px-4 py-3 rounded-b-lg">
                    <span>Neto a Pagar:</span>
                    <span className="font-mono text-blue-700">{formData.netoAPagar.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 px-4 pb-3 border-t pt-3">
            <Button variant="outline" className="px-6 h-9" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button className="px-6 h-9 bg-orange-500 hover:bg-orange-600" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modal: Proveedores */}
      <Dialog open={isProveedoresOpen} onOpenChange={setIsProveedoresOpen}>
        <DialogContent className="max-w-[80vw] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Proveedor</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedor..."
              value={proveedorSearchQuery}
              onChange={(e) => setProveedorSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto border rounded">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="text-xs font-bold">RUC</TableHead>
                  <TableHead className="text-xs font-bold">Nombre</TableHead>
                  <TableHead className="text-xs font-bold">Retención</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.map((p) => (
                  <TableRow
                    key={p.id_proveedor}
                    className={`cursor-pointer ${selectedProveedor === p.id_proveedor ? "bg-blue-100" : "hover:bg-gray-50"}`}
                    onClick={() => setSelectedProveedor(p.id_proveedor)}
                    onDoubleClick={() => { setSelectedProveedor(p.id_proveedor); handleSelectProveedor(); }}
                  >
                    <TableCell className="text-xs font-mono">{p.ruc}</TableCell>
                    <TableCell className="text-xs">{p.nombre_proveedor}</TableCell>
                    <TableCell className="text-xs">{p.retencion || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsProveedoresOpen(false)}>Cancelar</Button>
            <Button onClick={handleSelectProveedor} disabled={!selectedProveedor} className="bg-blue-600 hover:bg-blue-700">Seleccionar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modal: Items */}
      <Dialog open={isItemsOpen} onOpenChange={setIsItemsOpen}>
        <DialogContent className="max-w-[80vw] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Ítem</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ítem..."
              value={itemSearchQuery}
              onChange={async (e) => {
                const q = e.target.value;
                setItemSearchQuery(q);
                if (q.trim() === "") {
                  itemsApi.getAll().then(setItems).catch(() => setItems([]));
                } else {
                  itemsApi.search(q).then(setItems).catch(() => setItems([]));
                }
              }}
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto border rounded">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="text-xs font-bold">Código</TableHead>
                  <TableHead className="text-xs font-bold">Descripción</TableHead>
                  <TableHead className="text-xs font-bold">U.M.</TableHead>
                  <TableHead className="text-xs font-bold text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((i) => (
                  <TableRow
                    key={i.codigo}
                    className={`cursor-pointer ${selectedItem === i.codigo ? "bg-blue-100" : "hover:bg-gray-50"}`}
                    onClick={() => setSelectedItem(i.codigo)}
                    onDoubleClick={() => { setSelectedItem(i.codigo); handleSelectItem(); }}
                  >
                    <TableCell className="text-xs font-mono">{i.codigo}</TableCell>
                    <TableCell className="text-xs">{i.descripcion}</TableCell>
                    <TableCell className="text-xs">{i.u_m}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{Number(i.precio_unitario).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => { setIsItemsOpen(false); setReplacingItemIndex(null); }}>Cancelar</Button>
            <Button onClick={handleSelectItem} disabled={!selectedItem} className="bg-blue-600 hover:bg-blue-700">Seleccionar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
