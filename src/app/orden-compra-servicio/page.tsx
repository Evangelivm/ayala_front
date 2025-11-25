"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  proveedoresApi,
  type ProveedorData,
  itemsApi,
  type ItemData,
  centrosCostoApi,
  type CentroCostoData,
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
  urlHelpers,
} from "@/lib/connections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ClipboardList, Plus, Trash2, FileText, X } from "lucide-react";
import { CamionSelectDialog } from "@/components/camion-select-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrdenCompraPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCentroCostoModalOpen, setIsCentroCostoModalOpen] = useState(false);
  const [isNuevaOrdenModalOpen, setIsNuevaOrdenModalOpen] = useState(false);
  const [tipoOrden, setTipoOrden] = useState<"compra" | "servicio">("compra"); // Controla qué tipo de orden se está creando
  const [isNuevoCentroCostoModalOpen, setIsNuevoCentroCostoModalOpen] = useState(false);
  const [isCentroCostoListModalOpen, setIsCentroCostoListModalOpen] = useState(false);
  const [isProveedoresModalOpen, setIsProveedoresModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedCentroCosto, setSelectedCentroCosto] = useState<string | null>(null);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<ProveedorData[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [centrosCosto, setCentrosCosto] = useState<CentroCostoData[]>([]);
  const [centrosProyecto, setCentrosProyecto] = useState<CentroProyectoData[]>([]);
  const [fases, setFases] = useState<FaseControlData[]>([]);
  const [rubros, setRubros] = useState<RubroData[]>([]);
  const [camiones, setCamiones] = useState<CamionData[]>([]);
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompraData[]>([]);
  const [ordenesServicio, setOrdenesServicio] = useState<OrdenServicioData[]>([]);

  // Estado para Nueva Orden
  const [nuevaOrdenData, setNuevaOrdenData] = useState({
    // Campos para el backend
    id_proveedor: 0,
    // Campos visuales
    nroCliente: "",
    razonSocial: "",
    retencionProveedor: "",
    almacenCentral: false, // Checkbox Almacén Central
    anticipo: false, // Checkbox Anticipo
    serie: "0001",
    nroDoc: "",
    fechaEmision: new Date(),
    moneda: "SOLES",
    tipoCambio: 0, // Tipo de cambio de SUNAT
    fechaServicio: new Date(),
    estado: "PENDIENTE",
    centroCostoNivel1Codigo: "", // Código de centroproyecto
    centroCostoNivel2Codigo: "", // Código de fasecontrol
    centroCostoNivel3Codigo: "", // Código de rubro
    unidad: "", // Placa del camión
    unidad_id: 0, // ID del camión
    igvPorcentaje: 18,
    aplicarRetencion: false, // Si/No para aplicar retención
    retencion: {
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

  // Cargar camiones y órdenes al montar el componente
  useEffect(() => {
    loadCamiones();
    loadOrdenesCompra();
    loadOrdenesServicio();
  }, []);

  // Cargar el siguiente número de orden cuando se abre el modal
  useEffect(() => {
    if (isNuevaOrdenModalOpen) {
      cargarSiguienteNumeroOrden();
    }
  }, [isNuevaOrdenModalOpen]);

  const cargarSiguienteNumeroOrden = async () => {
    try {
      const api = tipoOrden === "compra" ? ordenesCompraApi : ordenesServicioApi;
      const { serie, nroDoc } = await api.getSiguienteNumero();
      setNuevaOrdenData((prev) => ({
        ...prev,
        serie,
        nroDoc,
      }));
    } catch (error) {
      console.error("Error cargando siguiente número de orden:", error);
      toast.error("Error al cargar el número de orden");
    }
  };

  const centrosCostoMock = [
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

  const loadCamiones = async () => {
    try {
      const data = await camionesApi.getAll();
      setCamiones(data);
    } catch (error) {
      console.error("Error loading camiones:", error);
      setCamiones([]);
    }
  };

  const loadOrdenesCompra = async () => {
    try {
      const data = await ordenesCompraApi.getAll();
      setOrdenesCompra(data);
    } catch (error) {
      console.error("Error loading ordenes compra:", error);
      setOrdenesCompra([]);
    }
  };

  const loadOrdenesServicio = async () => {
    try {
      const data = await ordenesServicioApi.getAll();
      setOrdenesServicio(data);
    } catch (error) {
      console.error("Error loading ordenes servicio:", error);
      setOrdenesServicio([]);
    }
  };

  // Funciones para centros de costo - Selects independientes (deprecado, se usará las nuevas)
  const loadCentrosCosto = async () => {
    try {
      const data = await centrosCostoApi.getAll();
      setCentrosCosto(data);
    } catch (error) {
      console.error("Error loading centros costo:", error);
      setCentrosCosto([]);
    }
  };

  const handleCentroCostoNivel1Change = (codigo: string) => {
    setNuevaOrdenData((prev) => ({
      ...prev,
      centroCostoNivel1Codigo: codigo,
    }));
  };

  const handleCentroCostoNivel2Change = (codigo: string) => {
    setNuevaOrdenData((prev) => ({
      ...prev,
      centroCostoNivel2Codigo: codigo,
    }));
  };

  const handleCentroCostoNivel3Change = (codigo: string) => {
    setNuevaOrdenData((prev) => ({
      ...prev,
      centroCostoNivel3Codigo: codigo,
    }));
  };

  // Handler para seleccionar camión
  const handleCamionSelect = (camion: CamionData) => {
    setNuevaOrdenData((prev) => ({
      ...prev,
      unidad: camion.placa,
      unidad_id: camion.id_camion,
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
      const proveedor = proveedores.find(p => p.id_proveedor === selectedProveedor);
      if (proveedor) {
        setNuevaOrdenData((prev) => ({
          ...prev,
          id_proveedor: proveedor.id_proveedor,
          nroCliente: proveedor.ruc || "",
          razonSocial: proveedor.nombre_proveedor || "",
          retencionProveedor: proveedor.retencion || "",
          aplicarRetencion: proveedor.retencion === "Si",
        }));
        // Recalcular totales si cambia la retención
        setTimeout(() => calcularTotales(nuevaOrdenData.items), 0);
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

  // Función para obtener el tipo de cambio de SUNAT
  const obtenerTipoCambio = async () => {
    try {
      const api = tipoOrden === "compra" ? ordenesCompraApi : ordenesServicioApi;
      const response = await api.getTipoCambio();
      if (response.success && response.tipo_cambio > 0) {
        setNuevaOrdenData((prev) => ({
          ...prev,
          tipoCambio: response.tipo_cambio,
        }));
        toast.success(`Tipo de cambio actualizado: S/. ${response.tipo_cambio.toFixed(3)}`);
      }
    } catch (error) {
      console.error("Error obteniendo tipo de cambio:", error);
      toast.error("No se pudo obtener el tipo de cambio de SUNAT");
    }
  };

  // Funciones para Nueva Orden
  const handleNuevaOrdenInputChange = (
    field: string,
    value: string | Date | number | boolean | { porcentaje: number; monto: number }
  ) => {
    setNuevaOrdenData((prev) => ({ ...prev, [field]: value }));

    // Si cambia a moneda DOLARES, obtener el tipo de cambio automáticamente
    if (field === "moneda" && value === "DOLARES") {
      obtenerTipoCambio();
    }
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedItems = [...nuevaOrdenData.items];
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

    setNuevaOrdenData((prev) => ({ ...prev, items: updatedItems }));
    calcularTotales(updatedItems);
  };

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
        setNuevaOrdenData((prev) => ({
          ...prev,
          items: [...prev.items, newItem],
        }));
        calcularTotales([...nuevaOrdenData.items, newItem]);
        setIsItemsModalOpen(false);
        setSelectedItem(null);
      }
    }
  };

  const addItem = () => {
    handleOpenItemsModal();
  };

  const removeItem = (index: number) => {
    const updatedItems = nuevaOrdenData.items.filter((_, i) => i !== index);
    setNuevaOrdenData((prev) => ({ ...prev, items: updatedItems }));
    calcularTotales(updatedItems);
  };

  const calcularTotales = (items: Array<{ subtotal: number }>) => {
    const subtotalCalculado = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const igvCalculado = subtotalCalculado * (nuevaOrdenData.igvPorcentaje / 100);
    const totalCalculado = subtotalCalculado + igvCalculado;
    const retencionMonto = nuevaOrdenData.aplicarRetencion
      ? totalCalculado * (nuevaOrdenData.retencion.porcentaje / 100)
      : 0;
    const netoAPagarCalculado = totalCalculado - retencionMonto;

    setNuevaOrdenData((prev) => ({
      ...prev,
      subtotal: subtotalCalculado,
      igv: igvCalculado,
      total: totalCalculado,
      retencion: {
        ...prev.retencion,
        monto: retencionMonto,
      },
      netoAPagar: netoAPagarCalculado,
    }));
  };

  const handleNuevaOrdenSave = async () => {
    try {
      // Validaciones básicas
      if (!nuevaOrdenData.id_proveedor) {
        toast.error("Debe seleccionar un proveedor");
        return;
      }

      if (!nuevaOrdenData.serie || !nuevaOrdenData.nroDoc) {
        toast.error("Debe ingresar la serie y número de documento");
        return;
      }

      if (nuevaOrdenData.items.length === 0) {
        toast.error("Debe agregar al menos un item a la orden");
        return;
      }

      // Preparar datos para enviar al backend
      const numero_orden = `${nuevaOrdenData.serie}-${nuevaOrdenData.nroDoc}`;

      // Transformar items al formato del backend
      const itemsParaBackend = nuevaOrdenData.items.map((item) => ({
        codigo_item: item.codigo_item,
        descripcion_item: item.descripcion_item,
        cantidad_solicitada: item.cantidad_solicitada,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }));

      const ordenParaEnviar = {
        id_proveedor: nuevaOrdenData.id_proveedor,
        numero_orden: numero_orden,
        fecha_orden: nuevaOrdenData.fechaEmision.toISOString(),
        moneda: nuevaOrdenData.moneda,
        fecha_registro: nuevaOrdenData.fechaServicio.toISOString(),
        estado: "PENDIENTE",
        centro_costo_nivel1: nuevaOrdenData.centroCostoNivel1Codigo,
        centro_costo_nivel2: nuevaOrdenData.centroCostoNivel2Codigo,
        centro_costo_nivel3: nuevaOrdenData.centroCostoNivel3Codigo,
        unidad_id: nuevaOrdenData.unidad_id > 0 ? nuevaOrdenData.unidad_id : null,
        retencion: nuevaOrdenData.aplicarRetencion ? "SI" : "NO",
        almacen_central: nuevaOrdenData.almacenCentral ? "SI" : "NO",
        has_anticipo: nuevaOrdenData.anticipo ? 1 : 0,
        tiene_anticipo: nuevaOrdenData.anticipo ? "SI" : "NO",
        items: itemsParaBackend,
        subtotal: nuevaOrdenData.subtotal,
        igv: nuevaOrdenData.igv,
        total: nuevaOrdenData.total,
        observaciones: nuevaOrdenData.observacion,
      };

      console.log("Datos para enviar al backend:", ordenParaEnviar);

      // Seleccionar la API correcta según el tipo de orden
      const api = tipoOrden === "compra" ? ordenesCompraApi : ordenesServicioApi;
      const tipoTexto = tipoOrden === "compra" ? "compra" : "servicio";

      // Mostrar toast de carga
      toast.loading(`Creando orden de ${tipoTexto}...`);

      // Enviar al backend usando la API configurada
      const result = await api.create(ordenParaEnviar);

      // Cerrar el toast de carga
      toast.dismiss();

      console.log("Respuesta del servidor:", result);

      // Mostrar toast de éxito
      toast.success(`Orden de ${tipoTexto} creada exitosamente`, {
        description: `Número de orden: ${numero_orden}`,
      });

      // Recargar la lista de órdenes
      loadOrdenesCompra();
      loadOrdenesServicio();

      // Cerrar el modal y limpiar el formulario
      setIsNuevaOrdenModalOpen(false);
      handleNuevaOrdenCancel();
    } catch (error) {
      console.error(`Error al guardar orden de ${tipoOrden === "compra" ? "compra" : "servicio"}:`, error);
      toast.dismiss();
      toast.error(`Error al crear la orden de ${tipoOrden === "compra" ? "compra" : "servicio"}`, {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  const handleNuevaOrdenCancel = () => {
    setNuevaOrdenData({
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
      retencion: {
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
    setIsNuevaOrdenModalOpen(false);
  };

  // Función para eliminar orden de compra
  const handleDeleteOrdenCompra = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta orden de compra?")) {
      return;
    }

    try {
      toast.loading("Eliminando orden de compra...");
      await ordenesCompraApi.delete(id);
      toast.dismiss();
      toast.success("Orden de compra eliminada exitosamente");
      loadOrdenesCompra();
    } catch (error) {
      console.error("Error al eliminar orden de compra:", error);
      toast.dismiss();
      toast.error("Error al eliminar la orden de compra", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // Función para eliminar orden de servicio
  const handleDeleteOrdenServicio = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta orden de servicio?")) {
      return;
    }

    try {
      toast.loading("Eliminando orden de servicio...");
      await ordenesServicioApi.delete(id);
      toast.dismiss();
      toast.success("Orden de servicio eliminada exitosamente");
      loadOrdenesServicio();
    } catch (error) {
      console.error("Error al eliminar orden de servicio:", error);
      toast.dismiss();
      toast.error("Error al eliminar la orden de servicio", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
        <div className="mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Orden de Compra y Servicio
            </h1>
            <p className="text-muted-foreground">
              Gestión de órdenes de compra y servicio
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 mb-6">
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                setTipoOrden("servicio");
                setIsNuevaOrdenModalOpen(true);
              }}
            >
              <ClipboardList className="h-4 w-4" />
              Nueva orden de servicio
            </Button>

            <Button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setTipoOrden("compra");
                setIsNuevaOrdenModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nueva orden de compra
            </Button>

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

          {/* Tabs para Órdenes de Compra y Servicio */}
          <Tabs defaultValue="compra" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compra">Órdenes de Compra</TabsTrigger>
              <TabsTrigger value="servicio">Órdenes de Servicio</TabsTrigger>
            </TabsList>

            <TabsContent value="compra" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Órdenes de Compra Registradas</CardTitle>
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
                            Estado Firma
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
                          <TableHead className="text-xs font-bold">
                            Observaciones
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            PDF
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordenesCompra.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={17}
                              className="text-center py-8 text-gray-400"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <ClipboardList className="h-8 w-8 opacity-50" />
                                <p className="text-sm">
                                  No hay órdenes de compra registradas
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          ordenesCompra.map((orden) => (
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
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {orden.estado}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.estado_firma ? (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      orden.estado_firma === "PENDIENTE"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : orden.estado_firma === "FIRMADA"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {orden.estado_firma}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Sin estado</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.tiene_anticipo === "SI" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    SÍ
                                  </span>
                                ) : orden.tiene_anticipo === "NO" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    NO
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.procede_pago || "-"}
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
                              <TableCell className="text-xs">
                                {orden.observaciones ? (
                                  orden.observaciones
                                ) : (
                                  <span className="text-gray-400 italic">Sin observaciones</span>
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
                                  onClick={() => orden.id_orden_compra && handleDeleteOrdenCompra(orden.id_orden_compra)}
                                  className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded transition-colors"
                                  title="Eliminar"
                                  disabled={!orden.id_orden_compra}
                                >
                                  <X className="h-4 w-4" />
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
                  <CardTitle>Órdenes de Servicio Registradas</CardTitle>
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
                            Estado Firma
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
                          <TableHead className="text-xs font-bold">
                            Observaciones
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            PDF
                          </TableHead>
                          <TableHead className="text-xs font-bold text-center">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordenesServicio.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={17}
                              className="text-center py-8 text-gray-400"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <ClipboardList className="h-8 w-8 opacity-50" />
                                <p className="text-sm">
                                  No hay órdenes de servicio registradas
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          ordenesServicio.map((orden) => (
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
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {orden.estado}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.estado_firma ? (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      orden.estado_firma === "PENDIENTE"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : orden.estado_firma === "FIRMADA"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {orden.estado_firma}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Sin estado</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.tiene_anticipo === "SI" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    SÍ
                                  </span>
                                ) : orden.tiene_anticipo === "NO" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    NO
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {orden.procede_pago || "-"}
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
                              <TableCell className="text-xs">
                                {orden.observaciones ? (
                                  orden.observaciones
                                ) : (
                                  <span className="text-gray-400 italic">Sin observaciones</span>
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
                                  onClick={() => orden.id_orden_servicio && handleDeleteOrdenServicio(orden.id_orden_servicio)}
                                  className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded transition-colors"
                                  title="Eliminar"
                                  disabled={!orden.id_orden_servicio}
                                >
                                  <X className="h-4 w-4" />
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

          {/* Modales */}
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
                    <DialogTitle>
                      {tipoOrden === "compra" ? "Nueva Orden de Compra" : "Nueva Orden de Servicio"}
                    </DialogTitle>
                    <DialogDescription>
                      Complete los datos para crear una nueva orden de {tipoOrden === "compra" ? "compra" : "servicio"}
                    </DialogDescription>
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
                          htmlFor="retencion"
                          className="text-xs font-semibold"
                        >
                          Retención:
                        </Label>
                        <Select
                          value={nuevaOrdenData.aplicarRetencion ? "SI" : "NO"}
                          onValueChange={(value) => {
                            const aplicar = value === "SI";
                            setNuevaOrdenData((prev) => {
                              const newData = {
                                ...prev,
                                aplicarRetencion: aplicar,
                                retencion: aplicar
                                  ? { porcentaje: 3, monto: 0 }
                                  : prev.retencion,
                              };
                              // Recalcular totales con los nuevos datos
                              const subtotalCalculado = newData.items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
                              const igvCalculado = subtotalCalculado * (newData.igvPorcentaje / 100);
                              const totalCalculado = subtotalCalculado + igvCalculado;
                              const retencionMonto = newData.aplicarRetencion
                                ? totalCalculado * (newData.retencion.porcentaje / 100)
                                : 0;
                              const netoAPagarCalculado = totalCalculado - retencionMonto;

                              return {
                                ...newData,
                                subtotal: subtotalCalculado,
                                igv: igvCalculado,
                                total: totalCalculado,
                                retencion: {
                                  ...newData.retencion,
                                  monto: retencionMonto,
                                },
                                netoAPagar: netoAPagarCalculado,
                              };
                            });
                          }}
                        >
                          <SelectTrigger className={`h-8 text-xs ${nuevaOrdenData.total > 700 && !nuevaOrdenData.aplicarRetencion ? 'border-red-500 border-2' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NO">NO</SelectItem>
                            <SelectItem value="SI">SÍ</SelectItem>
                          </SelectContent>
                        </Select>
                        {nuevaOrdenData.total > 700 && !nuevaOrdenData.aplicarRetencion && (
                          <div className="mt-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-300 animate-pulse">
                            ⚠️ Verifique si es agente de retención
                          </div>
                        )}
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
                            <SelectItem value="SOLES">SOLES</SelectItem>
                            <SelectItem value="DOLARES">DÓLARES</SelectItem>
                          </SelectContent>
                        </Select>
                        {nuevaOrdenData.moneda === "DOLARES" && nuevaOrdenData.tipoCambio > 0 && (
                          <div className="mt-1 text-xs text-gray-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                            T/C: S/. {nuevaOrdenData.tipoCambio.toFixed(3)}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor="fecha-servicio"
                          className="text-xs font-semibold"
                        >
                          Fecha Compra:
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

                      {/* Campo de Unidad */}
                      <div className="col-span-2">
                        <Label
                          htmlFor="unidad"
                          className="text-xs font-semibold"
                        >
                          Unidad:
                        </Label>
                        <div className="scale-90 origin-left">
                          <CamionSelectDialog
                            camiones={camiones}
                            onSelect={handleCamionSelect}
                            currentPlaca={nuevaOrdenData.unidad}
                            buttonText="Seleccionar"
                          />
                        </div>
                      </div>

                      {/* Segunda fila */}
                      <div className="col-span-2">
                        <Label className="text-xs font-semibold mb-2 block">
                          Opciones
                        </Label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="almacen-central"
                              checked={nuevaOrdenData.almacenCentral}
                              onChange={(e) =>
                                handleNuevaOrdenInputChange(
                                  "almacenCentral",
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor="almacen-central"
                              className="text-xs font-medium text-gray-700 cursor-pointer"
                            >
                              Almacén Central
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="anticipo"
                              checked={nuevaOrdenData.anticipo}
                              onChange={(e) =>
                                handleNuevaOrdenInputChange(
                                  "anticipo",
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor="anticipo"
                              className="text-xs font-medium text-gray-700 cursor-pointer"
                            >
                              Anticipo
                            </label>
                          </div>
                        </div>
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
                        <Input
                          id="estado"
                          value="PENDIENTE"
                          readOnly
                          className="h-8 text-xs bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Centro de Costos - 3 Niveles */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="col-span-12">
                        <h3 className="text-sm font-bold text-blue-800 mb-2">
                          Centro de Costos
                        </h3>
                      </div>
                      <div className="col-span-4">
                        <Label
                          htmlFor="centro-costo-nivel1"
                          className="text-xs font-semibold"
                        >
                          Nivel 1 (Proyecto):
                        </Label>
                        <Select
                          value={nuevaOrdenData.centroCostoNivel1Codigo}
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
                              <SelectItem
                                key={centro.id}
                                value={centro.codigo}
                              >
                                {centro.proyecto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label
                          htmlFor="centro-costo-nivel2"
                          className="text-xs font-semibold"
                        >
                          Nivel 2 (Fase):
                        </Label>
                        <Select
                          value={nuevaOrdenData.centroCostoNivel2Codigo}
                          onValueChange={handleCentroCostoNivel2Change}
                          onOpenChange={(open) => {
                            if (open && fases.length === 0) {
                              loadFases();
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccionar fase..." />
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
                      </div>
                      <div className="col-span-4">
                        <Label
                          htmlFor="centro-costo-nivel3"
                          className="text-xs font-semibold"
                        >
                          Nivel 3 (Rubro):
                        </Label>
                        <Select
                          value={nuevaOrdenData.centroCostoNivel3Codigo}
                          onValueChange={handleCentroCostoNivel3Change}
                          onOpenChange={(open) => {
                            if (open && rubros.length === 0) {
                              loadRubros();
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccionar rubro..." />
                          </SelectTrigger>
                          <SelectContent>
                            {rubros.map((rubro) => (
                              <SelectItem
                                key={rubro.id}
                                value={rubro.codigo}
                              >
                                {rubro.descripcion}
                              </SelectItem>
                            ))}
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
                            {nuevaOrdenData.items.map((item, index) => (
                              <TableRow
                                key={index}
                                className="hover:bg-gray-50"
                              >
                                <TableCell className="text-center text-xs font-semibold">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-xs text-center bg-gray-50 p-2 font-mono">
                                  {item.codigo_item || (
                                    <span className="text-gray-400 italic">
                                      -
                                    </span>
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
                                    type="text"
                                    value={item.cantidad_solicitada}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Permitir solo números enteros (sin puntos ni comas)
                                      if (value === '' || /^\d+$/.test(value)) {
                                        handleItemChange(
                                          index,
                                          "cantidad_solicitada",
                                          value === '' ? 0 : parseInt(value)
                                        );
                                      }
                                    }}
                                    onKeyPress={(e) => {
                                      // Bloquear cualquier tecla que no sea un número
                                      if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    className="h-8 text-xs border border-gray-300 p-2 text-center rounded"
                                    required
                                    inputMode="numeric"
                                    pattern="[0-9]*"
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
                            {nuevaOrdenData.items.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={8}
                                  className="text-center py-8 text-gray-400"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <ClipboardList className="h-8 w-8 opacity-50" />
                                    <p className="text-sm">
                                      No hay items agregados
                                    </p>
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
                            value={nuevaOrdenData.observacion}
                            onChange={(e) =>
                              handleNuevaOrdenInputChange(
                                "observacion",
                                e.target.value
                              )
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
                              {nuevaOrdenData.subtotal.toFixed(2)}
                            </span>
                          </div>

                          {/* IGV */}
                          <div className="flex justify-between items-center text-sm border-t pt-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">IGV:</span>
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
                              {nuevaOrdenData.igv.toFixed(2)}
                            </span>
                          </div>

                          {/* Total */}
                          <div className={`flex justify-between text-sm font-bold border-t pt-2 ${nuevaOrdenData.total > 700 && !nuevaOrdenData.aplicarRetencion ? 'bg-red-50 border-red-300 -mx-4 px-4 py-2 rounded' : ''}`}>
                            <span>Total:</span>
                            <span className="font-mono">
                              {nuevaOrdenData.total.toFixed(2)}
                            </span>
                          </div>

                          {/* Alerta de retención */}
                          {nuevaOrdenData.total > 700 && !nuevaOrdenData.aplicarRetencion && (
                            <div className="text-xs text-red-700 bg-red-100 px-3 py-2 rounded border border-red-400 animate-pulse font-semibold text-center">
                              ⚠️ Verifique si es agente de retención
                            </div>
                          )}

                          {/* Retención - Solo se muestra si está activada */}
                          {nuevaOrdenData.aplicarRetencion && (
                            <div className="flex justify-between items-center text-sm border-t pt-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Retención:</span>
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
                              <span className="font-mono text-red-600">
                                -{nuevaOrdenData.retencion.monto.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {/* Neto a Pagar */}
                          <div className="flex justify-between text-base font-bold border-t-2 pt-3 bg-blue-100 -mx-4 px-4 py-3 rounded-b-lg">
                            <span>Neto a Pagar:</span>
                            <span className="font-mono text-blue-700">
                              {nuevaOrdenData.netoAPagar.toFixed(2)}
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
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Modal de Selección de Items */}
              <Dialog
                open={isItemsModalOpen}
                onOpenChange={setIsItemsModalOpen}
              >
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Seleccionar Item</DialogTitle>
                    <DialogDescription>
                      Busque y seleccione un item para agregar a la orden
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
                              <TableCell className="text-xs">
                                {item.descripcion}
                              </TableCell>
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
