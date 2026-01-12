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
  facturaApi,
  type FacturaData,
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
import {
  ClipboardList,
  Plus,
  Trash2,
  X,
  FileText,
  RefreshCw,
  RotateCw,
  Info,
} from "lucide-react";
import { EstadoBadge } from "@/components/factura/EstadoBadge";
import { EnlacesModal } from "@/components/factura/EnlacesModal";
import { DetraccionSelectDialog } from "@/components/detraccion-select-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWebSocket } from "@/lib/useWebSocket";
import { useDistributedLock } from "@/lib/useDistributedLock";
import { LockResource } from "@/lib/distributed-lock";
import { formatDatePeru, toDateStringPeru, getTodayPeru } from "@/lib/date-utils";
import dayjs from 'dayjs';

// Extended types for factura data with all fields
interface FacturaItem {
  codigo_item?: string;
  descripcion_item: string;
  cantidad: number;
  unidad_medida: string;
  valor_unitario?: number; // Precio SIN IGV
  precio_unitario: number; // Precio CON IGV (para NUBEFACT)
  subtotal: number;
}

interface FacturaCompletaData extends FacturaData {
  empresa_nro_documento?: string;
  empresa_razon_social?: string;
  empresa_direccion?: string;
  proveedores?: {
    nombre_proveedor: string;
    ruc: string;
    retencion?: string;
  };
  fondo_garantia?: boolean;
  fondo_garantia_valor?: string;
  orden_compra?: boolean;
  orden_compra_valor?: string;
  tipo_cambio?: number;
  fecha_servicio?: string;
  centro_costo_nivel1_codigo?: string;
  centro_costo_nivel2_codigo?: string;
  placa_vehiculo?: string;
  unidad_id?: number;
  porcentaje_igv?: number;
  aplicar_detraccion?: boolean;
  detraccion_porcentaje?: number;
  detraccion_total?: number;
  factura_item?: FacturaItem[];
  items?: FacturaItem[];
  total_gravada?: number;
  total_igv?: number;
  observaciones?: string;
  id_proyecto?: number;
  id_subproyecto?: number;
}

export default function FacturaPage() {
  const [isNuevaFacturaModalOpen, setIsNuevaFacturaModalOpen] = useState(false);
  const [facturaEditandoId, setFacturaEditandoId] = useState<number | null>(
    null
  );
  const [isProveedoresModalOpen, setIsProveedoresModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [isEnlacesModalOpen, setIsEnlacesModalOpen] = useState(false);
  const [selectedFacturaForModal, setSelectedFacturaForModal] = useState<{
    id: number;
    numero_factura: string;
    fecha_factura: string;
    proveedor: string;
    subtotal: number;
    igv: number;
    total: number;
    estado: string;
    fecha_emision?: string;
    tipo_comprobante?: string;
    serie?: string;
    numero?: string;
    observaciones?: string;
    moneda?: string;
    items?: Array<{
      descripcion_item: string;
      cantidad: number;
      unidad_medida: string;
      precio_unitario: number;
      subtotal: number;
    }>;
    enlace_pdf?: string | null;
    enlace_xml?: string | null;
    enlace_cdr?: string | null;
    aceptada_por_sunat?: boolean | null;
    sunat_description?: string | null;
    sunat_note?: string | null;
  } | null>(null);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [replacingItemIndex, setReplacingItemIndex] = useState<number | null>(
    null
  ); // Índice del item que se está reemplazando
  const [infoAutomaticaGenerada, setInfoAutomaticaGenerada] = useState(false); // Estado para rastrear si se generó la info automática
  const [proveedores, setProveedores] = useState<ProveedorData[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [proveedorSearchQuery, setProveedorSearchQuery] = useState("");
  const [centrosProyecto, setCentrosProyecto] = useState<CentroProyectoData[]>(
    []
  );
  const [fases, setFases] = useState<FaseControlData[]>([]);
  const [rubros, setRubros] = useState<RubroData[]>([]);
  const [facturas, setFacturas] = useState<
    Array<{
      id: number;
      numero_factura: string;
      serie: string;
      numero: number;
      fecha_factura: string;
      proveedor: string;
      subtotal: number;
      igv: number;
      total: number;
      estado: string;
      // Campos adicionales
      enlace_pdf?: string | null;
      enlace_xml?: string | null;
      enlace_cdr?: string | null;
      aceptada_por_sunat?: boolean | null;
      sunat_description?: string | null;
      sunat_note?: string | null;
    }>
  >([]);

  // Estados para filtros de tabla
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [filtroProveedor, setFiltroProveedor] = useState<string>("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<Date | undefined>(
    undefined
  );
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<Date | undefined>(
    undefined
  );

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
    serie: "FFF1",
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
      tipo_detraccion: "", // Código del tipo de detracción
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
    tipoVenta: "CONTADO", // CONTADO o CREDITO
    plazoCredito: 0, // 7, 15, 30, 45, 60 días
    medioPago: "EFECTIVO", // Medio de pago para CONTADO
  });

  // Hook de debounce para optimizar cálculos
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debounce = useCallback((fn: () => void, delay: number = 300) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(fn, delay);
  }, []);

  // Hook para gestión de locks distribuidos
  const { withLock, isLocked } = useDistributedLock({
    autoRelease: true,
    ttl: 30000, // 30 segundos
    timeout: 10000, // 10 segundos de espera máxima
  });

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

  // WebSocket: Escuchar actualizaciones de facturas en tiempo real
  useWebSocket<{
    id_factura: number;
    estado: string;
    enlace_pdf?: string;
    enlace_xml?: string;
    enlace_cdr?: string;
    aceptada_por_sunat?: boolean | null;
  }>("facturaUpdated", (data) => {
    if (data) {
      console.log("📡 Evento facturaUpdated recibido:", data);

      // Actualizar la factura en el estado local
      setFacturas((prevFacturas) =>
        prevFacturas.map((factura) => {
          if (factura.id === data.id_factura) {
            // Determinar el estado real
            let estadoReal = data.estado;
            const nuevoPdf = data.enlace_pdf || factura.enlace_pdf;
            const aceptada =
              data.aceptada_por_sunat ?? factura.aceptada_por_sunat;

            // Si tiene PDF y fue aceptada, mostrar como COMPLETADO
            if (nuevoPdf && aceptada === true) {
              estadoReal = "COMPLETADO";
            }

            return {
              ...factura,
              estado: estadoReal,
              enlace_pdf: nuevoPdf,
              enlace_xml: data.enlace_xml || factura.enlace_xml,
              enlace_cdr: data.enlace_cdr || factura.enlace_cdr,
              aceptada_por_sunat: aceptada,
            };
          }
          return factura;
        })
      );

      // Mostrar notificación
      if (data.estado === "COMPLETADO") {
        toast.success(`Factura ${data.id_factura} procesada exitosamente`);
      }
    }
  });

  // Polling automático para facturas en PROCESANDO (como respaldo)
  useEffect(() => {
    // Solo hacer polling si hay facturas en PROCESANDO
    const facturasEnProcesamiento = facturas.filter(
      (f) => f.estado === "PROCESANDO"
    );

    if (facturasEnProcesamiento.length === 0) {
      return; // No hay nada que hacer
    }

    // Configurar intervalo de 30 segundos (aumentado porque WebSocket es primario)
    const intervalId = setInterval(() => {
      console.log(
        `Polling automático (respaldo): ${facturasEnProcesamiento.length} facturas en PROCESANDO`
      );
      loadFacturas(); // Recargar todas las facturas
    }, 30000); // 30 segundos

    // Cleanup al desmontar o cuando cambien las facturas
    return () => {
      clearInterval(intervalId);
    };
  }, [facturas]); // Dependencia: facturas

  // Polling automático para facturas en FALLIDO (verificación de estado real)
  useEffect(() => {
    // Solo hacer polling si hay facturas en FALLIDO o con errores
    const facturasConErrores = facturas.filter(
      (f) => f.estado === "FALLIDO" || f.estado === "ERROR"
    );

    if (facturasConErrores.length === 0) {
      return; // No hay nada que hacer
    }

    // Verificar inmediatamente después de 5 segundos
    const timeoutId = setTimeout(() => {
      console.log(
        `🔍 Verificando estado real de ${facturasConErrores.length} factura(s) con errores...`
      );
      loadFacturas();
    }, 5000); // 5 segundos

    // Luego continuar verificando cada 20 segundos
    const intervalId = setInterval(() => {
      console.log(
        `🔍 Revalidando ${facturasConErrores.length} factura(s) en estado de error`
      );
      loadFacturas();
    }, 20000); // 20 segundos

    // Cleanup al desmontar o cuando cambien las facturas
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [facturas]); // Dependencia: facturas

  const loadFacturas = async () => {
    try {
      const data = await facturaApi.getAll();

      // Transformar datos al formato esperado por la tabla
      const facturasTransformadas = data.map((factura) => {
        // Determinar el estado real de la factura
        let estadoReal = factura.estado_factura || "SIN PROCESAR";

        // VALIDACIÓN INTELIGENTE DE ESTADO:
        // Si tiene enlaces y fue aceptada por SUNAT, considerarla COMPLETADA
        // independientemente del estado en la BD (previene falsos positivos de errores)
        const tieneEnlacesPDF = Boolean(factura.enlace_del_pdf);
        const tieneEnlaceXML = Boolean(factura.enlace_del_xml);
        const tieneEnlaceCDR = Boolean(factura.enlace_del_cdr);
        const aceptadaSUNAT = factura.aceptada_por_sunat === true;

        // Si tiene PDF Y fue aceptada por SUNAT -> definitivamente COMPLETADA
        if (tieneEnlacesPDF && aceptadaSUNAT) {
          if (estadoReal !== "COMPLETADO") {
            console.log(`✅ Factura ${factura.serie}-${factura.numero}: Corrigiendo estado de "${estadoReal}" a "COMPLETADO" (tiene PDF y aceptada por SUNAT)`);
          }
          estadoReal = "COMPLETADO";
        }
        // Si tiene los 3 enlaces (PDF, XML, CDR) aunque SUNAT no responda -> muy probablemente COMPLETADA
        else if (tieneEnlacesPDF && tieneEnlaceXML && tieneEnlaceCDR) {
          if (estadoReal === "FALLIDO" || estadoReal === "ERROR") {
            console.log(`✅ Factura ${factura.serie}-${factura.numero}: Corrigiendo estado de "${estadoReal}" a "COMPLETADO" (tiene todos los enlaces)`);
            estadoReal = "COMPLETADO";
          }
        }

        return {
          id: factura.id_factura,
          numero_factura: `${factura.serie}-${String(factura.numero).padStart(
            8,
            "0"
          )}`,
          serie: factura.serie,
          numero: factura.numero,
          fecha_factura: factura.fecha_emision,
          proveedor:
            factura.proveedores?.nombre_proveedor ||
            factura.cliente_denominacion ||
            "Sin proveedor",
          subtotal: Number((factura.total / 1.18).toFixed(2)), // Calcular subtotal sin IGV
          igv: Number((factura.total - factura.total / 1.18).toFixed(2)),
          total: Number(factura.total),
          estado: estadoReal,
          // Datos adicionales para funcionalidades avanzadas
          enlace_pdf: factura.enlace_del_pdf || null,
          enlace_xml: factura.enlace_del_xml || null,
          enlace_cdr: factura.enlace_del_cdr || null,
          aceptada_por_sunat: factura.aceptada_por_sunat ?? null,
          sunat_description: factura.sunat_description || null,
          sunat_note: factura.sunat_note || null,
        };
      });

      setFacturas(facturasTransformadas);
    } catch (error: unknown) {
      console.error("Error loading facturas:", error);

      let errorMessage = "Error desconocido";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al cargar las facturas", {
        description: errorMessage,
      });
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
      const proveedor = proveedores.find(
        (p) => p.id_proveedor === selectedProveedor
      );
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
  const calcularTotales = useCallback(
    (items: Array<{ subtotal: number }>) => {
      const subtotalCalculado = items.reduce(
        (acc, item) => acc + (item.subtotal || 0),
        0
      );
      const igvCalculado =
        subtotalCalculado * (nuevaFacturaData.igvPorcentaje / 100);
      const totalCalculado = subtotalCalculado + igvCalculado;
      const detraccionMonto = nuevaFacturaData.aplicarDetraccion
        ? totalCalculado * (nuevaFacturaData.detraccion.porcentaje / 100)
        : 0;
      const fondoGarantiaMonto = nuevaFacturaData.fondoGarantia
        ? parseFloat(nuevaFacturaData.fondoGarantiaValor || "0")
        : 0;
      const netoAPagarCalculado =
        totalCalculado - detraccionMonto - fondoGarantiaMonto;

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
    },
    [
      nuevaFacturaData.igvPorcentaje,
      nuevaFacturaData.aplicarDetraccion,
      nuevaFacturaData.detraccion.porcentaje,
      nuevaFacturaData.fondoGarantia,
      nuevaFacturaData.fondoGarantiaValor,
    ]
  );

  // Optimizado con debouncing para evitar cálculos excesivos
  const handleItemChange = useCallback(
    (index: number, field: string, value: string | number) => {
      const updatedItems = [...nuevaFacturaData.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      // Calcular subtotal automáticamente
      // IMPORTANTE: subtotal debe ser cantidad × precio SIN IGV
      if (field === "cantidad_solicitada" || field === "precio_unitario") {
        const cantidad = Number(
          field === "cantidad_solicitada"
            ? value
            : updatedItems[index].cantidad_solicitada
        );
        const precioSinIgv = Number(
          field === "precio_unitario"
            ? value
            : updatedItems[index].precio_unitario
        );
        // Subtotal = cantidad × precio SIN IGV
        updatedItems[index].subtotal = cantidad * precioSinIgv;
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

        // Si estamos reemplazando un item existente
        if (replacingItemIndex !== null) {
          const updatedItems = [...nuevaFacturaData.items];
          updatedItems[replacingItemIndex] = newItem;
          setNuevaFacturaData((prev) => ({
            ...prev,
            items: updatedItems,
          }));
          calcularTotales(updatedItems);
          setReplacingItemIndex(null); // Resetear índice de reemplazo
        } else {
          // Si estamos agregando un nuevo item
          setNuevaFacturaData((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
          }));
          calcularTotales([...nuevaFacturaData.items, newItem]);
        }

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

  const replaceItem = (index: number) => {
    setReplacingItemIndex(index);
    handleOpenItemsModal();
  };

  const handleNuevaFacturaInputChange = useCallback(
    (
      field: string,
      value:
        | string
        | Date
        | number
        | boolean
        | { porcentaje: number; monto: number; tipo_detraccion: string }
    ) => {
      setNuevaFacturaData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Función para obtener el siguiente número de documento disponible
  const obtenerSiguienteNumeroDocumento = (serie: string): string => {
    // Filtrar facturas por serie y obtener el número más alto
    const facturasConMismaSerie = facturas.filter((f) => f.serie === serie);

    if (facturasConMismaSerie.length === 0) {
      // Si no hay facturas con esta serie, empezar desde 1
      return "1";
    }

    // Obtener el número más alto
    const numeroMaximo = Math.max(...facturasConMismaSerie.map((f) => f.numero));

    // Retornar el siguiente número
    return String(numeroMaximo + 1);
  };

  const limpiarFormularioFactura = () => {
    const serieInicial = "FFF1";
    const siguienteNumero = obtenerSiguienteNumeroDocumento(serieInicial);

    setNuevaFacturaData({
      id_proveedor: 0,
      nroCliente: "",
      razonSocial: "",
      retencionProveedor: "",
      fondoGarantia: false,
      fondoGarantiaValor: "",
      ordenCompra: false,
      ordenCompraValor: "",
      serie: serieInicial,
      nroDoc: siguienteNumero,
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
        tipo_detraccion: "",
      },
      items: [],
      subtotal: 0,
      igv: 0,
      total: 0,
      netoAPagar: 0,
      observacion: "",
      tipoVenta: "CONTADO",
      plazoCredito: 0,
      medioPago: "EFECTIVO",
    });
    setFacturaEditandoId(null);
    setInfoAutomaticaGenerada(false);
  };

  // Función para generar observaciones automáticas con formato mejorado
  const generarObservacionesAutomaticas = () => {
    const cuentasPago = [
      "Cta. Cte. BCP Soles: 191-2551705-0-96",
      "Cci. BCP Soles: 002-191-002551705096-56",
      "Cta. Detracciones: 00-050-045072",
    ];

    const numCuotas =
      nuevaFacturaData.tipoVenta === "CONTADO"
        ? 1
        : Math.ceil(nuevaFacturaData.plazoCredito / 30);

    const fechaVencimiento =
      nuevaFacturaData.tipoVenta === "CREDITO"
        ? (() => {
            const fechaEmisionStr = toDateStringPeru(nuevaFacturaData.fechaEmision);
            const fechaVenc = dayjs(fechaEmisionStr).add(nuevaFacturaData.plazoCredito, 'day');
            return formatDatePeru(fechaVenc.format('YYYY-MM-DD'));
          })()
        : "Inmediato";

    // Generar texto con formato en 3 columnas
    let observacion = "";

    // NETO A PAGAR arriba
    observacion += `Neto a pagar: S/ ${nuevaFacturaData.netoAPagar.toFixed(
      2
    )}\n`;

    // Fondo de Garantía (si aplica)
    if (nuevaFacturaData.fondoGarantia) {
      observacion += `Fondo de Garantía: S/ ${parseFloat(
        nuevaFacturaData.fondoGarantiaValor || "0"
      ).toFixed(2)}\n`;
    }

    observacion += "\n";

    // Encabezados: Si es CREDITO mostrar 3 columnas, si es CONTADO solo 2
    if (nuevaFacturaData.tipoVenta === "CREDITO") {
      // 3 columnas: Cuenta de pago | Información del crédito | Información de la detracción
      observacion +=
        "Cuenta de pago".padEnd(65) +
        "Información del crédito".padEnd(55) +
        "Información de la detracción\n";

      // Línea 1: Primera cuenta | Monto neto | Bien o Servicio
      const cuenta1 = cuentasPago[0].padEnd(52);
      const montoNeto = `Monto neto: S/ ${nuevaFacturaData.netoAPagar.toFixed(
        2
      )}`.padEnd(56);
      const bienServicio = nuevaFacturaData.aplicarDetraccion
        ? `Bien o Servicio: ${
            nuevaFacturaData.detraccion.tipo_detraccion || "---"
          }`
        : "No aplica detracción";
      observacion += cuenta1 + montoNeto + bienServicio + "\n";

      // Línea 2: Segunda cuenta | N° de cuotas | Porcentaje
      const cuenta2 = cuentasPago[1].padEnd(48);
      const noCuotas = `Nº de cuotas: ${numCuotas}`.padEnd(59);
      const porcentaje = nuevaFacturaData.aplicarDetraccion
        ? `Porcentaje %: ${nuevaFacturaData.detraccion.porcentaje.toFixed(2)}`
        : "";
      observacion += cuenta2 + noCuotas + porcentaje + "\n";

      // Línea 3: Tercera cuenta | Fecha de Vencimiento | Monto detracción
      const cuenta3 = cuentasPago[2].padEnd(55);
      const vencimiento = `Fecha de Vencimiento: ${fechaVencimiento}`.padEnd(
        45
      );
      const montoDetraccion = nuevaFacturaData.aplicarDetraccion
        ? `Monto detracción S/: ${nuevaFacturaData.detraccion.monto.toFixed(2)}`
        : "";
      observacion += cuenta3 + vencimiento + montoDetraccion;
    } else {
      // 2 columnas: Cuenta de pago | Información de la detracción
      // Los padEnd se calculan sumando las dos primeras columnas del caso CREDITO
      // Línea 1: 52+65=117, Línea 2: 48+70=118, Línea 3: 55+57=112
      observacion +=
        "Cuenta de pago".padEnd(117) + "Información de la detracción\n";

      // Línea 1: Primera cuenta | Bien o Servicio
      const cuenta1 = cuentasPago[0].padEnd(104);
      const bienServicio = nuevaFacturaData.aplicarDetraccion
        ? `Bien o Servicio: ${
            nuevaFacturaData.detraccion.tipo_detraccion || "---"
          }`
        : "No aplica detracción";
      observacion += cuenta1 + bienServicio + "\n";

      // Línea 2: Segunda cuenta | Porcentaje
      const cuenta2 = cuentasPago[1].padEnd(100);
      const porcentaje = nuevaFacturaData.aplicarDetraccion
        ? `Porcentaje %: ${nuevaFacturaData.detraccion.porcentaje.toFixed(2)}`
        : "";
      observacion += cuenta2 + porcentaje + "\n";

      // Línea 3: Tercera cuenta | Monto detracción
      const cuenta3 = cuentasPago[2].padEnd(106);
      const montoDetraccion = nuevaFacturaData.aplicarDetraccion
        ? `Monto detracción S/: ${nuevaFacturaData.detraccion.monto.toFixed(2)}`
        : "";
      observacion += cuenta3 + montoDetraccion;
    }

    setNuevaFacturaData((prev) => ({
      ...prev,
      observacion: observacion,
    }));
    // Marcar que se ha generado la información automática
    setInfoAutomaticaGenerada(true);
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

      // Validar tipo de venta a crédito
      if (
        nuevaFacturaData.tipoVenta === "CREDITO" &&
        nuevaFacturaData.plazoCredito === 0
      ) {
        toast.error("Debe seleccionar un plazo para venta a crédito");
        return;
      }

      // Validar que si se seleccionó detracción, se haya seleccionado el tipo de detracción
      if (
        nuevaFacturaData.aplicarDetraccion &&
        !nuevaFacturaData.detraccion.tipo_detraccion
      ) {
        toast.error("Debe seleccionar el tipo de detracción antes de guardar");
        return;
      }

      // Validar que si se seleccionó detracción, se haya generado la información automática
      if (nuevaFacturaData.aplicarDetraccion && !infoAutomaticaGenerada) {
        toast.error(
          "Debe presionar el botón 'Generar Info Automática' antes de guardar cuando se aplica detracción"
        );
        return;
      }

      // Asegurar que la serie tenga el formato correcto para SUNAT
      if (!nuevaFacturaData.serie || nuevaFacturaData.serie.length < 4) {
        // Autocompletar con FFF1 si está vacía o incompleta
        setNuevaFacturaData((prev) => ({ ...prev, serie: "FFF1" }));
        nuevaFacturaData.serie = "FFF1";
      }

      console.log("🔍 Validando serie:", nuevaFacturaData.serie);

      // Validación flexible: acepta formatos como FFF1, F001, E001, B001, etc.
      if (!nuevaFacturaData.serie.match(/^[A-Z0-9]{4}$/)) {
        toast.error(
          `La serie "${nuevaFacturaData.serie}" no es válida. Debe tener 4 caracteres (ej: FFF1, F001, E001)`
        );
        return;
      }

      // Validar que la fecha de emisión sea hoy (requisito de SUNAT)
      const hoyPeru = getTodayPeru(); // YYYY-MM-DD en timezone de Perú
      const fechaEmisionStr = toDateStringPeru(nuevaFacturaData.fechaEmision);

      if (fechaEmisionStr !== hoyPeru) {
        toast.warning(
          "La fecha de emisión debe ser HOY según SUNAT. Se ajustará automáticamente.",
          {
            duration: 4000,
          }
        );
        // Ajustar la fecha a hoy en timezone de Perú
        nuevaFacturaData.fechaEmision = new Date(hoyPeru);
      }

      // Obtener datos del proveedor seleccionado
      const proveedorSeleccionado = proveedores.find(
        (p) => p.id_proveedor === nuevaFacturaData.id_proveedor
      );

      if (!proveedorSeleccionado) {
        toast.error("Error: Proveedor no encontrado");
        return;
      }

      // Transformar datos del frontend al formato del backend
      const dataParaBackend = {
        // Datos principales de la factura
        id_proveedor: nuevaFacturaData.id_proveedor,
        operacion: "generar_comprobante",
        tipo_de_comprobante: 1, // 1 = Factura
        serie: nuevaFacturaData.serie,
        numero: parseInt(nuevaFacturaData.nroDoc),
        sunat_transaction: 1,

        // Cliente (usar datos del proveedor)
        cliente_tipo_documento: 6, // 6 = RUC
        cliente_numero_documento: proveedorSeleccionado.ruc || "",
        cliente_denominacion: proveedorSeleccionado.nombre_proveedor || "",
        cliente_direccion: proveedorSeleccionado.direccion || "",
        cliente_email: proveedorSeleccionado.email || null,
        cliente_email_1: null,
        cliente_email_2: null,

        // Fechas (enviar en formato YYYY-MM-DD en timezone de Perú)
        fecha_emision: toDateStringPeru(nuevaFacturaData.fechaEmision),
        fecha_vencimiento:
          nuevaFacturaData.tipoVenta === "CREDITO"
            ? (() => {
                // Sumar días a la fecha de emisión usando dayjs
                const fechaEmisionStr = toDateStringPeru(nuevaFacturaData.fechaEmision);
                const fechaVencimiento = dayjs(fechaEmisionStr).add(nuevaFacturaData.plazoCredito, 'day');
                // Formato DD-MM-YYYY según NubeFact
                return fechaVencimiento.format('DD-MM-YYYY');
              })()
            : null,
        fecha_servicio: toDateStringPeru(nuevaFacturaData.fechaServicio),

        // Moneda y totales
        moneda: nuevaFacturaData.moneda === "SOLES" ? 1 : 2,
        tipo_cambio: nuevaFacturaData.tipoCambio || null,
        porcentaje_igv: nuevaFacturaData.igvPorcentaje,
        descuento_global: null,
        total_descuento: null,
        total_anticipo: null,
        total_gravada: nuevaFacturaData.subtotal,
        total_inafecta: null,
        total_exonerada: null,
        total_igv: nuevaFacturaData.igv,
        total_gratuita: null,
        total_otros_cargos: null,
        total_isc: null,
        total: nuevaFacturaData.total,

        // Detracción
        aplicar_detraccion: nuevaFacturaData.aplicarDetraccion,
        detraccion_tipo:
          nuevaFacturaData.aplicarDetraccion &&
          nuevaFacturaData.detraccion.tipo_detraccion
            ? parseInt(nuevaFacturaData.detraccion.tipo_detraccion)
            : null,
        detraccion_porcentaje: nuevaFacturaData.aplicarDetraccion
          ? nuevaFacturaData.detraccion.porcentaje
          : null,
        detraccion_total: nuevaFacturaData.aplicarDetraccion
          ? nuevaFacturaData.detraccion.monto
          : null,
        medio_pago_detraccion: null,

        // Ubicaciones (para transporte)
        ubigeo_origen: null,
        direccion_origen: null,
        ubigeo_destino: null,
        direccion_destino: null,
        detalle_viaje: null,

        // Percepción y Retención
        percepcion_tipo: null,
        percepcion_base_imponible: null,
        total_percepcion: null,
        total_incluido_percepcion: null,
        retencion_tipo: null,
        retencion_base_imponible: null,
        total_retencion: null,

        // Fondo de garantía y O/C
        fondo_garantia: nuevaFacturaData.fondoGarantia,
        fondo_garantia_valor: nuevaFacturaData.fondoGarantia
          ? nuevaFacturaData.fondoGarantiaValor
          : null,
        orden_compra: nuevaFacturaData.ordenCompra,
        orden_compra_valor: nuevaFacturaData.ordenCompra
          ? nuevaFacturaData.ordenCompraValor
          : null,
        placa_vehiculo: nuevaFacturaData.unidad || null,
        orden_compra_servicio: null,

        // Centro de costos
        centro_costo_nivel1_codigo:
          nuevaFacturaData.centroCostoNivel1Codigo || null,
        centro_costo_nivel2_codigo:
          nuevaFacturaData.centroCostoNivel2Codigo || null,
        centro_costo_nivel3_codigo: null,

        // Unidad
        unidad: nuevaFacturaData.unidad || null,
        unidad_id: nuevaFacturaData.unidad_id || null,

        // Observaciones
        observaciones: nuevaFacturaData.observacion || null,

        // Configuración de envío
        enviar_automaticamente_sunat: true,
        enviar_automaticamente_cliente: false,
        formato_pdf: "A4",

        // Transformar items del frontend al backend
        items: nuevaFacturaData.items.map((item) => {
          // Calcular valores con y sin IGV usando el porcentaje configurado
          const igvPorcentajeDecimal = nuevaFacturaData.igvPorcentaje / 100;
          const factorIgv = 1 + igvPorcentajeDecimal;

          // precio_unitario ya viene SIN IGV de la base de datos
          const valorSinIgv = item.precio_unitario;
          const cantidad = item.cantidad_solicitada;
          const subtotal = valorSinIgv * cantidad;
          const igvItem = subtotal * igvPorcentajeDecimal;
          const totalItem = subtotal + igvItem;
          const precioConIgv = valorSinIgv * factorIgv;

          return {
            codigo_item: item.codigo_item,
            codigo_producto_sunat: null,
            descripcion_item: item.descripcion_item,
            unidad_medida: item.unidadMed,
            cantidad: Number(cantidad.toFixed(10)),
            valor_unitario: Number(valorSinIgv.toFixed(10)),
            precio_unitario: Number(precioConIgv.toFixed(10)),
            descuento: 0,
            subtotal: Number(subtotal.toFixed(2)),
            tipo_de_igv: 1, // 1 = Gravado - Operación Onerosa
            igv: Number(igvItem.toFixed(2)),
            tipo_de_isc: null,
            isc: null,
            total: Number(totalItem.toFixed(2)),
            anticipo_regularizacion: false,
            anticipo_documento_serie: null,
            anticipo_documento_numero: null,
          };
        }),
      };

      // Recalcular totales sumando los valores de las líneas
      const totalGravadaCalculado = dataParaBackend.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      const totalIgvCalculado = dataParaBackend.items.reduce(
        (sum, item) => sum + item.igv,
        0
      );
      const totalCalculado = dataParaBackend.items.reduce(
        (sum, item) => sum + item.total,
        0
      );

      // Actualizar los totales en dataParaBackend
      dataParaBackend.total_gravada = Number(totalGravadaCalculado.toFixed(2));
      dataParaBackend.total_igv = Number(totalIgvCalculado.toFixed(2));
      dataParaBackend.total = Number(totalCalculado.toFixed(2));

      // Recalcular detracción si aplica
      if (dataParaBackend.aplicar_detraccion) {
        const detraccionMonto =
          totalCalculado * (nuevaFacturaData.detraccion.porcentaje / 100);
        dataParaBackend.detraccion_total = Number(detraccionMonto.toFixed(2));
      }

      // Preparar datos finales según la documentación de NubeFact
      const finalDataParaBackend = {
        ...dataParaBackend,

        // Campos de forma de pago según documentación NubeFact
        // Si es CRÉDITO: usar condiciones_de_pago + venta_al_credito + medio_de_pago
        // Si es CONTADO: usar medio_de_pago
        condiciones_de_pago: nuevaFacturaData.tipoVenta === "CREDITO"
          ? `CRÉDITO ${nuevaFacturaData.plazoCredito} DÍAS`
          : "",

        // Enviar medio_de_pago para ambos casos
        medio_de_pago: nuevaFacturaData.tipoVenta === "CREDITO"
          ? `CRÉDITO ${nuevaFacturaData.plazoCredito} DÍAS`
          : nuevaFacturaData.medioPago,

        // Agregar venta_al_credito solo si es CRÉDITO (según documentación)
        ...(nuevaFacturaData.tipoVenta === "CREDITO" &&
        nuevaFacturaData.plazoCredito > 0
          ? {
              venta_al_credito: (() => {
                // Calcular fecha de vencimiento en timezone de Perú
                const fechaEmisionStr = toDateStringPeru(nuevaFacturaData.fechaEmision);
                const fechaVencimiento = dayjs(fechaEmisionStr).add(nuevaFacturaData.plazoCredito, 'day');

                return [
                  {
                    cuota: 1,
                    fecha_de_pago: fechaVencimiento.format('DD-MM-YYYY'), // Formato DD-MM-YYYY
                    importe: Number(totalCalculado.toFixed(2)),
                  },
                ];
              })(),
            }
          : {}),
      };

      console.log("📤 Enviando datos al backend:", finalDataParaBackend);
      console.log("📊 Totales recalculados:", {
        total_gravada: finalDataParaBackend.total_gravada,
        total_igv: finalDataParaBackend.total_igv,
        total: finalDataParaBackend.total,
      });

      // DEBUG: Verificar cálculos de items
      console.log("🔍 DEBUG - Items enviados:");
      finalDataParaBackend.items.forEach((item, index) => {
        console.log(`  Item ${index + 1}:`, {
          descripcion: item.descripcion_item,
          cantidad: item.cantidad,
          valor_unitario: item.valor_unitario,
          subtotal: item.subtotal,
          subtotal_calculado: item.valor_unitario * item.cantidad,
          subtotal_correcto:
            item.subtotal === item.valor_unitario * item.cantidad,
        });
      });
      console.log("🔍 DEBUG - Suma subtotales:", {
        suma_subtotales: finalDataParaBackend.items.reduce(
          (sum, item) => sum + item.subtotal,
          0
        ),
        total_gravada_enviado: finalDataParaBackend.total_gravada,
        coincide:
          finalDataParaBackend.items.reduce(
            (sum, item) => sum + item.subtotal,
            0
          ) === finalDataParaBackend.total_gravada,
      });

      // Enviar al backend - detectar si es creación o edición
      // Usar locks distribuidos para evitar condiciones de carrera
      if (facturaEditandoId) {
        // Modo edición - actualizar factura existente
        // Lock: factura:ID:update
        const lockResource = LockResource.facturaUpdate(facturaEditandoId);

        await withLock(lockResource, async () => {
          const result = await facturaApi.update(
            facturaEditandoId,
            finalDataParaBackend
          );
          toast.success("Factura actualizada exitosamente", {
            description: `Número: ${nuevaFacturaData.serie}-${nuevaFacturaData.nroDoc}`,
          });
        });

        // Cerrar modal y recargar para edición
        setIsNuevaFacturaModalOpen(false);
        handleNuevaFacturaCancel();
        await loadFacturas();

      } else {
        // Modo creación - crear nueva factura
        // Lock: factura:create:SERIE para evitar duplicados de número
        const lockResource = LockResource.facturaCreate(nuevaFacturaData.serie);

        let facturaId: number | null = null;
        await withLock(lockResource, async () => {
          const result = await facturaApi.create(finalDataParaBackend);
          facturaId = result.id_factura;
          toast.success("Factura creada exitosamente", {
            description: `Número: ${nuevaFacturaData.serie}-${nuevaFacturaData.nroDoc}`,
          });
        });

        // Cerrar el modal y limpiar el formulario
        setIsNuevaFacturaModalOpen(false);
        handleNuevaFacturaCancel();

        // Recargar la lista de facturas inmediatamente
        await loadFacturas();

        // Continuar recargando cada 2 segundos hasta que la factura tenga un estado final
        let pollCount = 0;
        const maxPolls = 30; // 30 veces x 2 segundos = 60 segundos máximo
        const pollInterval = setInterval(async () => {
          pollCount++;
          console.log(`🔄 Actualizando lista de facturas (${pollCount}/${maxPolls})...`);

          const facturas = await facturaApi.getAll();
          const facturaCreada = facturas.find(f => f.id_factura === facturaId);

          if (facturaCreada) {
            const estadoFinal = facturaCreada.estado_factura === "COMPLETADO" ||
                               facturaCreada.estado_factura === "ERROR" ||
                               facturaCreada.aceptada_por_sunat === true;

            if (estadoFinal) {
              clearInterval(pollInterval);
              console.log(`✅ Factura ${facturaCreada.serie}-${facturaCreada.numero} procesada: ${facturaCreada.estado_factura}`);
              await loadFacturas(); // Recargar una última vez
              return;
            }
          }

          await loadFacturas();

          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            console.log("⏱️ Tiempo máximo de polling alcanzado");
          }
        }, 2000);
      }
    } catch (error: unknown) {
      console.error("Error al guardar factura:", error);

      // Extraer el mensaje del error desde la respuesta del servidor
      let errorMessage = "Error desconocido";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al guardar la factura", {
        description: errorMessage,
      });

      // Verificar el estado real después de 3 segundos
      // (a veces el error es un timeout pero la factura sí se procesó)
      setTimeout(async () => {
        try {
          console.log("🔍 Verificando estado real después de error...");
          await loadFacturas();

          // Intentar encontrar la factura recién creada por serie y número
          const facturaCreada = facturas.find(
            (f) => f.numero_factura === `${nuevaFacturaData.serie}-${String(nuevaFacturaData.nroDoc).padStart(8, "0")}`
          );

          if (facturaCreada && facturaCreada.estado === "COMPLETADO") {
            toast.success("La factura se procesó correctamente", {
              description: "El error fue temporal, la factura está completada",
            });
          }
        } catch (recheckError) {
          console.error("Error al verificar estado:", recheckError);
        }
      }, 3000);
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
      await facturaApi.delete(id);
      toast.success("Factura eliminada exitosamente");
      loadFacturas();
    } catch (error: unknown) {
      console.error("Error al eliminar factura:", error);

      let errorMessage = "Error desconocido";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al eliminar la factura", {
        description: errorMessage,
      });
    }
  };

  const handleEditFactura = async (id: number) => {
    try {
      // Obtener los detalles de la factura desde la API
      const facturaCompleta: FacturaCompletaData = (await facturaApi.getById(
        id
      )) as FacturaCompletaData;

      console.log("Factura completa cargada:", facturaCompleta);
      console.log(
        "Items en factura_item:",
        facturaCompleta.factura_item?.length || 0
      );
      console.log("Items en items:", facturaCompleta.items?.length || 0);

      // Cargar datos necesarios para el formulario
      await Promise.all([
        loadCentrosProyecto(),
        loadFases(),
        loadRubros(),
        fetchProveedores(),
      ]);

      // Transformar los datos de la factura a la estructura del formulario
      setNuevaFacturaData({
        id_proveedor: facturaCompleta.id_proveedor || 0,
        nroCliente: facturaCompleta.cliente_numero_documento || "",
        razonSocial: facturaCompleta.cliente_denominacion || "",
        retencionProveedor: facturaCompleta.proveedores?.retencion || "",
        fondoGarantia: Boolean(facturaCompleta.fondo_garantia),
        fondoGarantiaValor: facturaCompleta.fondo_garantia_valor || "",
        ordenCompra: Boolean(facturaCompleta.orden_compra),
        ordenCompraValor: facturaCompleta.orden_compra_valor || "",
        serie: facturaCompleta.serie || "FFF1",
        nroDoc: String(facturaCompleta.numero || ""),
        fechaEmision: new Date(facturaCompleta.fecha_emision || new Date()),
        moneda: facturaCompleta.moneda === 1 ? "SOLES" : "DOLARES",
        tipoCambio: Number(facturaCompleta.tipo_cambio) || 0,
        fechaServicio: new Date(facturaCompleta.fecha_servicio || new Date()),
        estado: facturaCompleta.estado_factura || "PENDIENTE",
        centroCostoNivel1Codigo:
          facturaCompleta.centro_costo_nivel1_codigo || "",
        centroCostoNivel2Codigo:
          facturaCompleta.centro_costo_nivel2_codigo || "",
        unidad: facturaCompleta.placa_vehiculo || "",
        unidad_id: facturaCompleta.unidad_id || 0,
        igvPorcentaje: Number(facturaCompleta.porcentaje_igv) || 18,
        aplicarDetraccion: Boolean(facturaCompleta.aplicar_detraccion),
        detraccion: {
          porcentaje: Number(facturaCompleta.detraccion_porcentaje) || 3,
          monto: Number(facturaCompleta.detraccion_total) || 0,
          tipo_detraccion: "", // Backend doesn't return this field, initialize as empty
        },
        items: (
          facturaCompleta.factura_item ||
          facturaCompleta.items ||
          []
        ).map((item: FacturaItem) => ({
          codigo_item: item.codigo_item || "",
          descripcion_item: item.descripcion_item || "",
          cantidad_solicitada: Number(item.cantidad) || 0,
          unidadMed: item.unidad_medida || "UNIDAD",
          // CORRECCIÓN: usar valor_unitario (SIN IGV) para cálculos locales
          precio_unitario: Number(item.valor_unitario) || 0,
          subtotal: Number(item.subtotal) || 0,
        })),
        subtotal: Number(facturaCompleta.total_gravada) || 0,
        igv: Number(facturaCompleta.total_igv) || 0,
        total: Number(facturaCompleta.total) || 0,
        netoAPagar:
          (Number(facturaCompleta.total) || 0) -
          (Number(facturaCompleta.detraccion_total) || 0) -
          (Number(facturaCompleta.fondo_garantia_valor) || 0),
        observacion: facturaCompleta.observaciones || "",
        tipoVenta: "CONTADO", // Por defecto CONTADO al editar (backend no devuelve este campo aún)
        plazoCredito: 0,
        medioPago: "EFECTIVO", // Por defecto EFECTIVO al editar
      });

      // Establecer el ID de la factura que se está editando
      setFacturaEditandoId(id);

      // Abrir el modal
      setIsNuevaFacturaModalOpen(true);

      const itemsCount = (
        facturaCompleta.factura_item ||
        facturaCompleta.items ||
        []
      ).length;
      toast.success(`Factura cargada con ${itemsCount} item(s)`);
    } catch (error: unknown) {
      console.error("Error al cargar factura para editar:", error);

      let errorMessage = "Error desconocido";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al cargar la factura para editar", {
        description: errorMessage,
      });
    }
  };

  const handleVerificarEstado = async (id: number) => {
    try {
      const status = await facturaApi.getStatus(id);

      if (status.isActive) {
        toast.info(`Polling activo - Intento ${status.attempts}`, {
          description: `Estado: ${status.dbRecord.estado_factura}`,
        });
      } else {
        toast.info("Polling no activo", {
          description: `Estado actual: ${status.dbRecord.estado_factura}`,
        });
      }

      // Recargar facturas para actualizar la tabla
      await loadFacturas();
    } catch (error: unknown) {
      console.error("Error verificando estado:", error);

      let errorMessage = "Error desconocido";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al verificar el estado de la factura", {
        description: errorMessage,
      });
    }
  };

  const handleReintentarFactura = async (id: number) => {
    if (!confirm("¿Está seguro de que desea reintentar esta factura?")) {
      return;
    }

    try {
      await facturaApi.reset(id);
      toast.success("Factura reseteada para reintento");

      // Forzar detección
      await facturaApi.forceDetection(id);
      toast.info("Detección forzada - La factura será procesada nuevamente");

      // Recargar facturas
      await loadFacturas();
    } catch (error: unknown) {
      console.error("Error reintentando factura:", error);

      let errorMessage = "Error desconocido";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al reintentar la factura", {
        description: errorMessage,
      });
    }
  };

  const handleVerDetalles = async (id: number) => {
    try {
      console.log("📋 Ver detalles de factura ID:", id);

      // Obtener los detalles completos de la factura desde la API
      const facturaCompleta: FacturaCompletaData = (await facturaApi.getById(
        id
      )) as FacturaCompletaData;

      if (!facturaCompleta) {
        console.error("❌ Factura no encontrada con ID:", id);
        toast.error("Factura no encontrada");
        return;
      }

      console.log("✅ Factura completa cargada:", facturaCompleta);

      // Mapear tipo de comprobante
      const tipoComprobanteMap: { [key: number]: string } = {
        1: "FACTURA",
        2: "BOLETA",
        3: "NOTA DE CRÉDITO",
        4: "NOTA DE DÉBITO",
      };

      // Preparar datos para el modal
      const facturaParaModal = {
        id: facturaCompleta.id_factura,
        numero_factura: `${facturaCompleta.serie}-${facturaCompleta.numero}`,
        fecha_factura: facturaCompleta.fecha_emision || "",
        proveedor:
          facturaCompleta.proveedores?.nombre_proveedor || "Sin proveedor",
        total: Number(facturaCompleta.total) || 0,
        fecha_emision: facturaCompleta.fecha_emision || "",
        estado: facturaCompleta.estado_factura || "",
        tipo_comprobante:
          tipoComprobanteMap[facturaCompleta.tipo_de_comprobante] || "FACTURA",
        serie: facturaCompleta.serie || "",
        numero: String(facturaCompleta.numero || ""),
        observaciones: facturaCompleta.observaciones || "",
        moneda: facturaCompleta.moneda === 1 ? "PEN" : "USD",
        subtotal: Number(facturaCompleta.total_gravada) || 0,
        igv: Number(facturaCompleta.total_igv) || 0,
        items: (
          facturaCompleta.factura_item ||
          facturaCompleta.items ||
          []
        ).map((item: FacturaItem) => ({
          descripcion_item: item.descripcion_item || "",
          cantidad: Number(item.cantidad) || 0,
          unidad_medida: item.unidad_medida || "UNIDAD",
          precio_unitario: Number(item.precio_unitario) || 0,
          subtotal: Number(item.subtotal) || 0,
        })),
        enlace_pdf: facturaCompleta.enlace_del_pdf || null,
        enlace_xml: facturaCompleta.enlace_del_xml || null,
        enlace_cdr: facturaCompleta.enlace_del_cdr || null,
        aceptada_por_sunat: facturaCompleta.aceptada_por_sunat || null,
        sunat_description: facturaCompleta.sunat_description || null,
        sunat_note: facturaCompleta.sunat_note || null,
      };

      // Abrir modal de enlaces y detalles completos
      setSelectedFacturaForModal(facturaParaModal);
      setIsEnlacesModalOpen(true);
    } catch (error: unknown) {
      console.error("❌ Error al abrir modal de detalles:", error);

      let errorMessage = "Error desconocido";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al mostrar los detalles de la factura", {
        description: errorMessage,
      });
    }
  };

  // Función para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltroEstado("TODOS");
    setFiltroProveedor("");
    setFiltroFechaDesde(undefined);
    setFiltroFechaHasta(undefined);
  };

  // Filtrar facturas según los criterios
  const facturasFiltradas = facturas.filter((factura) => {
    // Filtro por estado
    if (filtroEstado !== "TODOS" && factura.estado !== filtroEstado) {
      return false;
    }

    // Filtro por proveedor (búsqueda parcial)
    if (
      filtroProveedor &&
      !factura.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())
    ) {
      return false;
    }

    // Filtro por fecha desde
    if (filtroFechaDesde) {
      const fechaFacturaStr = toDateStringPeru(factura.fecha_factura);
      const fechaDesdeStr = toDateStringPeru(filtroFechaDesde);
      if (fechaFacturaStr < fechaDesdeStr) {
        return false;
      }
    }

    // Filtro por fecha hasta
    if (filtroFechaHasta) {
      const fechaFacturaStr = toDateStringPeru(factura.fecha_factura);
      const fechaHastaStr = toDateStringPeru(filtroFechaHasta);
      if (fechaFacturaStr > fechaHastaStr) {
        return false;
      }
    }

    return true;
  });

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

          {/* Indicador de polling activo */}
          {facturas.some((f) => f.estado === "PROCESANDO") && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">
                Actualizando automáticamente cada 10 segundos... (
                {facturas.filter((f) => f.estado === "PROCESANDO").length}{" "}
                facturas en proceso)
              </span>
            </div>
          )}

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
              {/* Filtros */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Filtro por Estado */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Estado</Label>
                    <Select
                      value={filtroEstado}
                      onValueChange={setFiltroEstado}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos los estados</SelectItem>
                        <SelectItem value="SIN PROCESAR">
                          Sin Procesar
                        </SelectItem>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="PROCESANDO">Procesando</SelectItem>
                        <SelectItem value="COMPLETADO">Completado</SelectItem>
                        <SelectItem value="FALLADO">Fallado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Proveedor */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Proveedor</Label>
                    <Input
                      placeholder="Buscar proveedor..."
                      value={filtroProveedor}
                      onChange={(e) => setFiltroProveedor(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Filtro por Fecha Desde */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Fecha Desde</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 w-full justify-start text-xs font-normal"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filtroFechaDesde ? (
                            formatDatePeru(filtroFechaDesde)
                          ) : (
                            <span className="text-gray-400">
                              Seleccionar fecha
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filtroFechaDesde}
                          onSelect={setFiltroFechaDesde}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Filtro por Fecha Hasta */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Fecha Hasta</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 w-full justify-start text-xs font-normal"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filtroFechaHasta ? (
                            formatDatePeru(filtroFechaHasta)
                          ) : (
                            <span className="text-gray-400">
                              Seleccionar fecha
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filtroFechaHasta}
                          onSelect={setFiltroFechaHasta}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Botón Limpiar Filtros y Contador */}
                <div className="mt-3 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLimpiarFiltros}
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpiar Filtros
                  </Button>
                  <span className="text-xs text-gray-600">
                    Mostrando {facturasFiltradas.length} de {facturas.length}{" "}
                    facturas
                  </span>
                </div>
              </div>

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
                      <TableHead className="text-xs font-bold">
                        Proveedor
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
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList className="h-8 w-8 opacity-50" />
                            <p className="text-sm">
                              {facturas.length === 0
                                ? "No hay facturas registradas"
                                : "No hay facturas que coincidan con los filtros"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      facturasFiltradas.map((factura) => (
                        <TableRow key={factura.id} className="hover:bg-gray-50">
                          <TableCell className="text-xs text-center font-mono">
                            {factura.numero_factura}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {formatDatePeru(factura.fecha_factura)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {factura.proveedor}
                          </TableCell>
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
                            <div className="flex justify-center">
                              <EstadoBadge estado={factura.estado} />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Botón Ver PDF - Solo si está disponible */}
                              {factura.enlace_pdf && (
                                <button
                                  onClick={() =>
                                    window.open(factura.enlace_pdf!, "_blank")
                                  }
                                  className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-white hover:bg-green-600 rounded transition-colors"
                                  title="Ver PDF"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                              )}

                              {/* Botón Verificar Estado - Para estados PENDIENTE y PROCESANDO */}
                              {(factura.estado === "PENDIENTE" ||
                                factura.estado === "PROCESANDO") && (
                                <button
                                  onClick={() =>
                                    handleVerificarEstado(factura.id)
                                  }
                                  className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-colors"
                                  title="Verificar Estado"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              )}

                              {/* Botón Reintentar - Solo para facturas FALLADAS */}
                              {factura.estado === "FALLADO" && (
                                <button
                                  onClick={() =>
                                    handleReintentarFactura(factura.id)
                                  }
                                  className="inline-flex items-center justify-center w-8 h-8 text-orange-600 hover:text-white hover:bg-orange-600 rounded transition-colors"
                                  title="Reintentar"
                                >
                                  <RotateCw className="h-4 w-4" />
                                </button>
                              )}

                              {/* Botón Ver Detalles/Error */}
                              <button
                                onClick={() => handleVerDetalles(factura.id)}
                                className="inline-flex items-center justify-center w-8 h-8 text-purple-600 hover:text-white hover:bg-purple-600 rounded transition-colors"
                                title="Ver Detalles"
                              >
                                <Info className="h-4 w-4" />
                              </button>

                              {/* Botón Eliminar - Solo para sin procesar o falladas */}
                              {(factura.estado === "SIN PROCESAR" ||
                                factura.estado === "FALLADO") && (
                                <button
                                  onClick={() =>
                                    handleDeleteFactura(factura.id)
                                  }
                                  className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
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
          <Dialog
            open={isNuevaFacturaModalOpen}
            onOpenChange={setIsNuevaFacturaModalOpen}
          >
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
                      {nuevaFacturaData.nroCliente || "Seleccionar..."}
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
                      value={nuevaFacturaData.razonSocial}
                      readOnly
                      className="h-8 text-xs bg-gray-100"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label
                      htmlFor="detraccion"
                      className="text-xs font-semibold"
                    >
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
                              ? {
                                  porcentaje: 3,
                                  monto: 0,
                                  tipo_detraccion:
                                    prev.detraccion.tipo_detraccion,
                                }
                              : prev.detraccion,
                          };
                          // Recalcular totales con los nuevos datos
                          const subtotalCalculado = newData.items.reduce(
                            (acc, item) => acc + (item.subtotal || 0),
                            0
                          );
                          const igvCalculado =
                            subtotalCalculado * (newData.igvPorcentaje / 100);
                          const totalCalculado =
                            subtotalCalculado + igvCalculado;
                          const detraccionMonto = newData.aplicarDetraccion
                            ? totalCalculado *
                              (newData.detraccion.porcentaje / 100)
                            : 0;
                          const fondoGarantiaMonto = newData.fondoGarantia
                            ? parseFloat(newData.fondoGarantiaValor || "0")
                            : 0;
                          const netoAPagarCalculado =
                            totalCalculado -
                            detraccionMonto -
                            fondoGarantiaMonto;

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
                        // Resetear el estado cuando se cambia la detracción
                        setInfoAutomaticaGenerada(false);
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
                          {nuevaFacturaData.fechaEmision
                            ? formatDatePeru(nuevaFacturaData.fechaEmision)
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

                  {/* Tipo de Venta */}
                  <div className="col-span-2">
                    <Label
                      htmlFor="tipo-venta"
                      className="text-xs font-semibold"
                    >
                      Tipo de Venta:
                    </Label>
                    <Select
                      value={nuevaFacturaData.tipoVenta}
                      onValueChange={(value) => {
                        handleNuevaFacturaInputChange("tipoVenta", value);
                        // Si cambia a CONTADO, resetear el plazo
                        if (value === "CONTADO") {
                          handleNuevaFacturaInputChange("plazoCredito", 0);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONTADO">Contado</SelectItem>
                        <SelectItem value="CREDITO">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Medio de Pago - Solo visible si es CONTADO */}
                  {nuevaFacturaData.tipoVenta === "CONTADO" && (
                    <div className="col-span-2">
                      <Label
                        htmlFor="medio-pago"
                        className="text-xs font-semibold"
                      >
                        Medio de Pago:
                      </Label>
                      <Select
                        value={nuevaFacturaData.medioPago}
                        onValueChange={(value) =>
                          handleNuevaFacturaInputChange("medioPago", value)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccione medio de pago" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                          <SelectItem value="TRANSFERENCIA BANCARIA">
                            Transferencia Bancaria
                          </SelectItem>
                          <SelectItem value="TARJETA DE CRÉDITO">
                            Tarjeta de Crédito
                          </SelectItem>
                          <SelectItem value="TARJETA DE DÉBITO">
                            Tarjeta de Débito
                          </SelectItem>
                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                          <SelectItem value="YAPE">Yape</SelectItem>
                          <SelectItem value="PLIN">Plin</SelectItem>
                          <SelectItem value="DEPÓSITO EN CUENTA">
                            Depósito en Cuenta
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Plazo de Crédito - Solo visible si es CREDITO */}
                  {nuevaFacturaData.tipoVenta === "CREDITO" && (
                    <div className="col-span-2">
                      <Label
                        htmlFor="plazo-credito"
                        className="text-xs font-semibold"
                      >
                        Plazo:
                      </Label>
                      <Select
                        value={nuevaFacturaData.plazoCredito.toString()}
                        onValueChange={(value) =>
                          handleNuevaFacturaInputChange(
                            "plazoCredito",
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccione plazo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 días</SelectItem>
                          <SelectItem value="15">15 días</SelectItem>
                          <SelectItem value="30">30 días</SelectItem>
                          <SelectItem value="45">45 días</SelectItem>
                          <SelectItem value="60">60 días</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Segunda fila */}
                  <div className="col-span-6">
                    <Label className="text-xs font-semibold mb-2 block">
                      Opciones
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="fondo-garantia"
                            checked={nuevaFacturaData.fondoGarantia}
                            onChange={(e) => {
                              handleNuevaFacturaInputChange(
                                "fondoGarantia",
                                e.target.checked
                              );
                              // Recalcular totales cuando se active/desactive
                              setTimeout(
                                () => calcularTotales(nuevaFacturaData.items),
                                0
                              );
                            }}
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
                            onChange={(e) => {
                              const nuevoValor = e.target.value;
                              // Recalcular totales inmediatamente con el nuevo valor
                              const subtotalCalculado =
                                nuevaFacturaData.items.reduce(
                                  (acc, item) => acc + (item.subtotal || 0),
                                  0
                                );
                              const igvCalculado =
                                subtotalCalculado *
                                (nuevaFacturaData.igvPorcentaje / 100);
                              const totalCalculado =
                                subtotalCalculado + igvCalculado;
                              const detraccionMonto =
                                nuevaFacturaData.aplicarDetraccion
                                  ? totalCalculado *
                                    (nuevaFacturaData.detraccion.porcentaje /
                                      100)
                                  : 0;
                              const fondoGarantiaMonto = parseFloat(
                                nuevoValor || "0"
                              );
                              const netoAPagarCalculado =
                                totalCalculado -
                                detraccionMonto -
                                fondoGarantiaMonto;

                              setNuevaFacturaData((prev) => ({
                                ...prev,
                                fondoGarantiaValor: nuevoValor,
                                subtotal: subtotalCalculado,
                                igv: igvCalculado,
                                total: totalCalculado,
                                detraccion: {
                                  ...prev.detraccion,
                                  monto: detraccionMonto,
                                },
                                netoAPagar: netoAPagarCalculado,
                              }));
                            }}
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
                              handleNuevaFacturaInputChange(
                                "ordenCompra",
                                e.target.checked
                              )
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
                              handleNuevaFacturaInputChange(
                                "ordenCompraValor",
                                e.target.value
                              )
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
                        onChange={(e) => {
                          const nuevaSerie = e.target.value.toUpperCase();
                          handleNuevaFacturaInputChange(
                            "serie",
                            nuevaSerie
                          );
                          // Actualizar el número de documento automáticamente al cambiar la serie
                          const siguienteNumero = obtenerSiguienteNumeroDocumento(nuevaSerie);
                          handleNuevaFacturaInputChange("nroDoc", siguienteNumero);
                        }}
                        onBlur={(e) => {
                          // Asegurar formato correcto al perder el foco
                          if (
                            !nuevaFacturaData.serie ||
                            nuevaFacturaData.serie.length < 4
                          ) {
                            handleNuevaFacturaInputChange("serie", "FFF1");
                            // Actualizar el número al volver a FFF1
                            const siguienteNumero = obtenerSiguienteNumeroDocumento("FFF1");
                            handleNuevaFacturaInputChange("nroDoc", siguienteNumero);
                          }
                        }}
                        placeholder="FFF1"
                        maxLength={4}
                        className="h-8 text-xs w-16"
                      />
                      <Input
                        value={nuevaFacturaData.nroDoc}
                        onChange={(e) =>
                          handleNuevaFacturaInputChange(
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
                            <SelectItem key={fase.id} value={fase.codigo || ""}>
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
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => replaceItem(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  title="Reemplazar item"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => removeItem(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                  title="Eliminar item"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
                                <p className="text-sm">
                                  No hay items agregados
                                </p>
                                <p className="text-xs">
                                  Haz clic en &quot;Agregar ítem&quot; para
                                  comenzar
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
                      <div className="flex items-center justify-between mb-1">
                        <Label
                          htmlFor="observacion-nueva"
                          className="text-xs font-semibold"
                        >
                          Observación:
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generarObservacionesAutomaticas}
                          className="h-7 text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Generar Info Automática
                        </Button>
                      </div>
                      <Textarea
                        id="observacion-nueva"
                        value={nuevaFacturaData.observacion}
                        onChange={(e) =>
                          handleNuevaFacturaInputChange(
                            "observacion",
                            e.target.value
                          )
                        }
                        className="min-h-[180px] resize-none text-xs font-mono"
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
                              const nuevoPorcentaje = parseInt(value);
                              // Recalcular totales inmediatamente con el nuevo porcentaje de IGV
                              const subtotalCalculado =
                                nuevaFacturaData.items.reduce(
                                  (acc, item) => acc + (item.subtotal || 0),
                                  0
                                );
                              const igvCalculado =
                                subtotalCalculado * (nuevoPorcentaje / 100);
                              const totalCalculado =
                                subtotalCalculado + igvCalculado;
                              const detraccionMonto =
                                nuevaFacturaData.aplicarDetraccion
                                  ? totalCalculado *
                                    (nuevaFacturaData.detraccion.porcentaje /
                                      100)
                                  : 0;
                              const fondoGarantiaMonto =
                                nuevaFacturaData.fondoGarantia
                                  ? parseFloat(
                                      nuevaFacturaData.fondoGarantiaValor || "0"
                                    )
                                  : 0;
                              const netoAPagarCalculado =
                                totalCalculado -
                                detraccionMonto -
                                fondoGarantiaMonto;

                              setNuevaFacturaData((prev) => ({
                                ...prev,
                                igvPorcentaje: nuevoPorcentaje,
                                subtotal: subtotalCalculado,
                                igv: igvCalculado,
                                total: totalCalculado,
                                detraccion: {
                                  ...prev.detraccion,
                                  monto: detraccionMonto,
                                },
                                netoAPagar: netoAPagarCalculado,
                              }));
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

                          <div className="scale-95 origin-left">
                            <DetraccionSelectDialog
                              currentPorcentaje={
                                nuevaFacturaData.detraccion.porcentaje
                              }
                              currentCodigo={
                                nuevaFacturaData.detraccion.tipo_detraccion
                              }
                              onSelect={(porcentaje, codigo, descripcion) => {
                                // Recalcular totales inmediatamente con el nuevo porcentaje
                                const subtotalCalculado =
                                  nuevaFacturaData.items.reduce(
                                    (acc, item) => acc + (item.subtotal || 0),
                                    0
                                  );
                                const igvCalculado =
                                  subtotalCalculado *
                                  (nuevaFacturaData.igvPorcentaje / 100);
                                const totalCalculado =
                                  subtotalCalculado + igvCalculado;
                                const detraccionMonto =
                                  totalCalculado * (porcentaje / 100);
                                const fondoGarantiaMonto =
                                  nuevaFacturaData.fondoGarantia
                                    ? parseFloat(
                                        nuevaFacturaData.fondoGarantiaValor ||
                                          "0"
                                      )
                                    : 0;
                                const netoAPagarCalculado =
                                  totalCalculado -
                                  detraccionMonto -
                                  fondoGarantiaMonto;

                                setNuevaFacturaData((prev) => ({
                                  ...prev,
                                  subtotal: subtotalCalculado,
                                  igv: igvCalculado,
                                  total: totalCalculado,
                                  detraccion: {
                                    porcentaje: porcentaje,
                                    monto: detraccionMonto,
                                    tipo_detraccion: codigo,
                                  },
                                  netoAPagar: netoAPagarCalculado,
                                }));
                              }}
                              buttonText="Seleccionar tipo de detracción"
                              buttonClassName="h-7 text-xs bg-purple-50 hover:bg-purple-100 border-purple-300"
                            />
                          </div>
                        </div>
                      )}

                      {/* Fondo de Garantía - Solo se muestra si está activado */}
                      {nuevaFacturaData.fondoGarantia && (
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-start text-sm">
                            <span className="font-semibold">
                              Fondo de Garantía:
                            </span>
                            <span className="font-mono text-red-600">
                              -
                              {parseFloat(
                                nuevaFacturaData.fondoGarantiaValor || "0"
                              ).toFixed(2)}
                            </span>
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
                  {facturaEditandoId ? "Actualizar" : "Guardar"}
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
                        <TableHead className="text-xs font-bold">
                          Razón Social
                        </TableHead>
                        <TableHead className="text-xs font-bold">
                          Dirección
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedores
                        .filter((proveedor) => {
                          if (!proveedorSearchQuery.trim()) return true;
                          const query = proveedorSearchQuery.toLowerCase();
                          return (
                            proveedor.ruc?.toLowerCase().includes(query) ||
                            proveedor.nombre_proveedor
                              ?.toLowerCase()
                              .includes(query)
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
                            onClick={() =>
                              handleProveedorRowClick(proveedor.id_proveedor)
                            }
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

          {/* Modal de Enlaces de Descarga */}
          <EnlacesModal
            isOpen={isEnlacesModalOpen}
            onClose={() => {
              setIsEnlacesModalOpen(false);
              setSelectedFacturaForModal(null);
            }}
            factura={selectedFacturaForModal}
          />
        </div>
      </div>
    </div>
  );
}
