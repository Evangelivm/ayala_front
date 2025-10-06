"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  FileText,
  Truck,
  Package,
  MapPin,
  Calendar,
  User,
  Building2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { ProyectoSelect } from "@/components/proyecto-select";
import { EtapaSelect } from "@/components/etapa-select";
import { SectorSelect } from "@/components/sector-select";
import { FrenteSelectBySector } from "@/components/frente-select-by-sector";
import { PartidaSelect } from "@/components/partida-select";
import { guiasRemisionApi, type GuiaRemisionData } from "@/lib/connections";
import { toast } from "sonner";

interface ItemGRE {
  unidad_de_medida: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
}

interface DocumentoRelacionado {
  tipo: string;
  serie: string;
  numero: number;
}

export default function GuiaRemisionPage() {
  const [tipoGRE, setTipoGRE] = useState<number>(7); // 7 = Remitente, 8 = Transportista
  const [tipoTransporte, setTipoTransporte] = useState<string>("02"); // 01 = Público, 02 = Privado
  const [loading, setLoading] = useState(false);
  const [loadingNumber, setLoadingNumber] = useState(true);

  // Estados para los nombres seleccionados
  const [selectedNames, setSelectedNames] = useState({
    proyecto: "",
    etapa: "",
    sector: "",
    frente: "",
    partida: "",
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Datos básicos
    operacion: "generar_guia",
    serie: "T001",
    numero: 1,
    fecha_de_emision: new Date().toISOString().split("T")[0],
    fecha_de_inicio_de_traslado: new Date().toISOString().split("T")[0],

    // Cliente/Destinatario
    cliente_tipo_de_documento: 6, // RUC por defecto
    cliente_numero_de_documento: "",
    cliente_denominacion: "",
    cliente_direccion: "",
    cliente_email: "",

    // Traslado
    motivo_de_traslado: "01", // Venta
    numero_de_bultos: 1,

    // Peso
    peso_bruto_total: 0,
    peso_bruto_unidad_de_medida: "KGM",

    // Transporte
    transportista_placa_numero: "",
    transportista_documento_tipo: 6,
    transportista_documento_numero: "",
    transportista_denominacion: "",

    // Conductor
    conductor_documento_tipo: 1, // DNI
    conductor_documento_numero: "",
    conductor_nombre: "",
    conductor_apellidos: "",
    conductor_numero_licencia: "",

    // Destinatario (para GRE Transportista)
    destinatario_documento_tipo: 6,
    destinatario_documento_numero: "",
    destinatario_denominacion: "",

    // Ubicaciones
    punto_de_partida_ubigeo: "",
    punto_de_partida_direccion: "",
    punto_de_partida_codigo_establecimiento_sunat: "",
    punto_de_llegada_ubigeo: "",
    punto_de_llegada_direccion: "",
    punto_de_llegada_codigo_establecimiento_sunat: "",

    // Proyecto (opcional)
    id_proyecto: undefined as number | undefined,
    id_etapa: undefined as number | undefined,
    id_sector: undefined as number | undefined,
    id_frente: undefined as number | undefined,
    id_partida: undefined as number | undefined,

    observaciones: "",
  });

  // Items
  const [items, setItems] = useState<ItemGRE[]>([
    {
      unidad_de_medida: "NIU",
      codigo: "",
      descripcion: "",
      cantidad: 1,
    },
  ]);

  // Documentos relacionados
  const [documentosRelacionados, setDocumentosRelacionados] = useState<
    DocumentoRelacionado[]
  >([]);

  // Manejo de cambios en el formulario
  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Agregar item
  const addItem = () => {
    setItems([
      ...items,
      {
        unidad_de_medida: "NIU",
        codigo: "",
        descripcion: "",
        cantidad: 1,
      },
    ]);
  };

  // Eliminar item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Actualizar item
  const updateItem = (
    index: number,
    field: keyof ItemGRE,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Agregar documento relacionado
  const addDocumentoRelacionado = () => {
    setDocumentosRelacionados([
      ...documentosRelacionados,
      {
        tipo: "01", // Factura
        serie: "",
        numero: 0,
      },
    ]);
  };

  // Eliminar documento relacionado
  const removeDocumentoRelacionado = (index: number) => {
    setDocumentosRelacionados(
      documentosRelacionados.filter((_, i) => i !== index)
    );
  };

  // Actualizar documento relacionado
  const updateDocumentoRelacionado = (
    index: number,
    field: keyof DocumentoRelacionado,
    value: string | number
  ) => {
    const newDocs = [...documentosRelacionados];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setDocumentosRelacionados(newDocs);
  };

  // Validar y enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar items
      if (
        items.length === 0 ||
        items.some((item) => !item.descripcion || item.cantidad <= 0)
      ) {
        toast.error("Debe agregar al menos un ítem válido");
        setLoading(false);
        return;
      }

      // Validaciones específicas según tipo
      if (tipoGRE === 7) {
        if (!formData.motivo_de_traslado) {
          toast.error("Debe seleccionar el motivo de traslado");
          setLoading(false);
          return;
        }
        if (!formData.numero_de_bultos || formData.numero_de_bultos < 1) {
          toast.error("Debe especificar el número de bultos");
          setLoading(false);
          return;
        }
        if (tipoTransporte === "01") {
          if (!formData.transportista_documento_numero) {
            toast.error(
              "Debe ingresar los datos del transportista para transporte público"
            );
            setLoading(false);
            return;
          }
        }
      }

      if (tipoGRE === 8) {
        if (!formData.destinatario_documento_numero) {
          toast.error("Debe ingresar los datos del destinatario");
          setLoading(false);
          return;
        }
      }

      // Validar conductor
      if (tipoGRE === 8 || (tipoGRE === 7 && tipoTransporte === "02")) {
        if (
          !formData.conductor_documento_numero ||
          !formData.conductor_numero_licencia
        ) {
          toast.error("Debe ingresar los datos completos del conductor");
          setLoading(false);
          return;
        }
      }

      // Validar ubicaciones
      if (
        !formData.punto_de_partida_ubigeo ||
        formData.punto_de_partida_ubigeo.length !== 6
      ) {
        toast.error("El ubigeo de partida debe tener 6 dígitos");
        setLoading(false);
        return;
      }

      if (
        !formData.punto_de_llegada_ubigeo ||
        formData.punto_de_llegada_ubigeo.length !== 6
      ) {
        toast.error("El ubigeo de llegada debe tener 6 dígitos");
        setLoading(false);
        return;
      }

      // Validar códigos de establecimiento SUNAT para motivos 04 y 18
      if (
        tipoGRE === 7 &&
        (formData.motivo_de_traslado === "04" ||
          formData.motivo_de_traslado === "18")
      ) {
        if (
          !formData.punto_de_partida_codigo_establecimiento_sunat ||
          formData.punto_de_partida_codigo_establecimiento_sunat.length !== 4
        ) {
          toast.error(
            "El código de establecimiento SUNAT de partida debe tener 4 dígitos (Ej: 0000)"
          );
          setLoading(false);
          return;
        }
        if (
          !formData.punto_de_llegada_codigo_establecimiento_sunat ||
          formData.punto_de_llegada_codigo_establecimiento_sunat.length !== 4
        ) {
          toast.error(
            "El código de establecimiento SUNAT de llegada debe tener 4 dígitos (Ej: 0000)"
          );
          setLoading(false);
          return;
        }
      }

      // Construir datos de la guía
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const guiaData: Record<string, any> = {
        ...formData,
        tipo_de_comprobante: tipoGRE,
        tipo_de_transporte: tipoGRE === 7 ? tipoTransporte : undefined,
        items: items.filter((item) => item.descripcion && item.cantidad > 0),
        documento_relacionado:
          documentosRelacionados.length > 0
            ? documentosRelacionados
            : undefined,
      };

      // Limpiar campos de transportista si están vacíos o no son requeridos
      // Para GRE Remitente con transporte privado (tipo 7, transporte 02): NO se requiere transportista
      // Para GRE Remitente con transporte público (tipo 7, transporte 01): SÍ se requiere transportista
      if (tipoGRE === 7 && tipoTransporte === "02") {
        // Transporte privado: eliminar campos de transportista si están vacíos
        if (
          !guiaData.transportista_documento_numero ||
          guiaData.transportista_documento_numero.trim() === ""
        ) {
          delete guiaData.transportista_documento_numero;
        }
        if (
          !guiaData.transportista_denominacion ||
          guiaData.transportista_denominacion.trim() === ""
        ) {
          delete guiaData.transportista_denominacion;
        }
        if (!guiaData.transportista_documento_tipo) {
          delete guiaData.transportista_documento_tipo;
        }
      }

      // Para GRE Transportista (tipo 8): eliminar campos vacíos de destinatario
      if (tipoGRE === 8) {
        if (
          !guiaData.destinatario_documento_numero ||
          guiaData.destinatario_documento_numero.trim() === ""
        ) {
          delete guiaData.destinatario_documento_numero;
        }
        if (
          !guiaData.destinatario_denominacion ||
          guiaData.destinatario_denominacion.trim() === ""
        ) {
          delete guiaData.destinatario_denominacion;
        }
      }

      // Limpiar conductor si está vacío (solo para casos donde no es requerido)
      if (tipoGRE === 7 && tipoTransporte === "01") {
        // Transporte público: conductor es opcional
        if (
          !guiaData.conductor_documento_numero ||
          guiaData.conductor_documento_numero.trim() === ""
        ) {
          delete guiaData.conductor_documento_numero;
          delete guiaData.conductor_nombre;
          delete guiaData.conductor_apellidos;
          delete guiaData.conductor_numero_licencia;
        }
      }

      // Enviar a la API
      const response = await guiasRemisionApi.create(guiaData as Omit<GuiaRemisionData, "id_guia" | "created_at" | "updated_at" | "estado_gre" | "enlace_del_pdf" | "enlace_del_xml" | "enlace_del_cdr">);

      toast.success("Guía de Remisión creada exitosamente", {
        description: `Serie: ${formData.serie}-${formData.numero}. El sistema procesará automáticamente la guía.`,
      });

      // Resetear formulario
      resetForm();
    } catch (error: unknown) {
      console.error("Error creando guía:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Por favor, verifique los datos ingresados";
      toast.error("Error al crear la guía de remisión", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      operacion: "generar_guia",
      serie: tipoGRE === 7 ? "T001" : "V001",
      numero: formData.numero + 1,
      fecha_de_emision: new Date().toISOString().split("T")[0],
      fecha_de_inicio_de_traslado: new Date().toISOString().split("T")[0],
      cliente_tipo_de_documento: 6,
      cliente_numero_de_documento: "",
      cliente_denominacion: "",
      cliente_direccion: "",
      cliente_email: "",
      motivo_de_traslado: "01",
      numero_de_bultos: 1,
      peso_bruto_total: 0,
      peso_bruto_unidad_de_medida: "KGM",
      transportista_placa_numero: "",
      transportista_documento_tipo: 6,
      transportista_documento_numero: "",
      transportista_denominacion: "",
      conductor_documento_tipo: 1,
      conductor_documento_numero: "",
      conductor_nombre: "",
      conductor_apellidos: "",
      conductor_numero_licencia: "",
      destinatario_documento_tipo: 6,
      destinatario_documento_numero: "",
      destinatario_denominacion: "",
      punto_de_partida_ubigeo: "",
      punto_de_partida_direccion: "",
      punto_de_partida_codigo_establecimiento_sunat: "",
      punto_de_llegada_ubigeo: "",
      punto_de_llegada_direccion: "",
      punto_de_llegada_codigo_establecimiento_sunat: "",
      id_proyecto: undefined,
      id_etapa: undefined,
      id_sector: undefined,
      id_frente: undefined,
      id_partida: undefined,
      observaciones: "",
    });
    setItems([
      {
        unidad_de_medida: "NIU",
        codigo: "",
        descripcion: "",
        cantidad: 1,
      },
    ]);
    setDocumentosRelacionados([]);
    setSelectedNames({
      proyecto: "",
      etapa: "",
      sector: "",
      frente: "",
      partida: "",
    });
  };

  // Cargar el último número al iniciar
  useEffect(() => {
    const fetchLastNumber = async () => {
      try {
        setLoadingNumber(true);
        const lastNumber = await guiasRemisionApi.getLastNumber();
        setFormData((prev) => ({
          ...prev,
          numero: lastNumber + 1,
        }));
      } catch (error) {
        console.error("Error obteniendo último número:", error);
        toast.error("No se pudo obtener el último número de guía");
      } finally {
        setLoadingNumber(false);
      }
    };

    fetchLastNumber();
  }, []);

  // Actualizar serie cuando cambia el tipo de GRE
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      serie: tipoGRE === 7 ? "T001" : "V001",
    }));
  }, [tipoGRE]);

  // Actualizar observaciones cuando cambian los nombres seleccionados
  useEffect(() => {
    let observacionesText = "";

    if (selectedNames.proyecto) {
      observacionesText += `Proyecto: ${selectedNames.proyecto}\n`;
    }
    if (selectedNames.etapa) {
      observacionesText += `Etapa: ${selectedNames.etapa}\n`;
    }
    if (selectedNames.sector) {
      observacionesText += `Sector: ${selectedNames.sector}\n`;
    }
    if (selectedNames.frente) {
      observacionesText += `Frente: ${selectedNames.frente}\n`;
    }
    if (selectedNames.partida) {
      observacionesText += `Partida: ${selectedNames.partida}`;
    }

    setFormData((prev) => ({
      ...prev,
      observaciones: observacionesText.trim(),
    }));
  }, [selectedNames]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-6">
          <Link href="/home">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FileText className="h-8 w-8" />
                Guía de Remisión Electrónica
              </h1>
              {/* <p className="text-gray-600 dark:text-gray-300 mt-2">
                Sistema integrado con SUNAT mediante NUBEFACT API
              </p> */}
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {formData.serie}-{formData.numero.toString().padStart(4, "0")}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs
            value={tipoGRE.toString()}
            onValueChange={(v) => setTipoGRE(parseInt(v))}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="7" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                GRE Remitente
              </TabsTrigger>
              <TabsTrigger value="8" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                GRE Transportista
              </TabsTrigger>
            </TabsList>

            {/* Contenido del formulario */}
            <div className="grid gap-6">
              {/* Datos Básicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Datos del Comprobante
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="serie">Serie *</Label>
                    <Input
                      id="serie"
                      value={formData.serie}
                      onChange={(e) =>
                        handleInputChange("serie", e.target.value)
                      }
                      placeholder={tipoGRE === 7 ? "T001" : "V001"}
                      maxLength={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      type="number"
                      value={formData.numero}
                      onChange={(e) =>
                        handleInputChange(
                          "numero",
                          parseInt(e.target.value) || 1
                        )
                      }
                      required
                      min={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_emision">Fecha de Emisión *</Label>
                    <Input
                      id="fecha_emision"
                      type="date"
                      value={formData.fecha_de_emision}
                      onChange={(e) =>
                        handleInputChange("fecha_de_emision", e.target.value)
                      }
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Cliente/Destinatario */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {tipoGRE === 7 ? "Destinatario" : "Remitente"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Documento *</Label>
                    <Select
                      value={formData.cliente_tipo_de_documento.toString()}
                      onValueChange={(v) =>
                        handleInputChange(
                          "cliente_tipo_de_documento",
                          parseInt(v)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">DNI</SelectItem>
                        <SelectItem value="6">RUC</SelectItem>
                        <SelectItem value="4">Carnet de Extranjería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cliente_doc">Número de Documento *</Label>
                    <Input
                      id="cliente_doc"
                      value={formData.cliente_numero_de_documento}
                      onChange={(e) =>
                        handleInputChange(
                          "cliente_numero_de_documento",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="cliente_denom">Denominación *</Label>
                    <Input
                      id="cliente_denom"
                      value={formData.cliente_denominacion}
                      onChange={(e) =>
                        handleInputChange(
                          "cliente_denominacion",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="cliente_dir">Dirección *</Label>
                    <Input
                      id="cliente_dir"
                      value={formData.cliente_direccion}
                      onChange={(e) =>
                        handleInputChange("cliente_direccion", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cliente_email">Email (Opcional)</Label>
                    <Input
                      id="cliente_email"
                      type="email"
                      value={formData.cliente_email}
                      onChange={(e) =>
                        handleInputChange("cliente_email", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Traslado - Solo para GRE Remitente */}
              {tipoGRE === 7 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Datos del Traslado</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Motivo de Traslado *</Label>
                      <Select
                        value={formData.motivo_de_traslado}
                        onValueChange={(v) =>
                          handleInputChange("motivo_de_traslado", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">Venta</SelectItem>
                          <SelectItem value="02">Compra</SelectItem>
                          <SelectItem value="04">
                            Traslado entre establecimientos
                          </SelectItem>
                          <SelectItem value="08">Importación</SelectItem>
                          <SelectItem value="09">Exportación</SelectItem>
                          <SelectItem value="13">Otros</SelectItem>
                          <SelectItem value="14">
                            Venta sujeta a confirmación
                          </SelectItem>
                          <SelectItem value="18">
                            Traslado emisor itinerante CP
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Número de Bultos *</Label>
                      <Input
                        type="number"
                        value={formData.numero_de_bultos}
                        onChange={(e) =>
                          handleInputChange(
                            "numero_de_bultos",
                            parseInt(e.target.value) || 1
                          )
                        }
                        min={1}
                        required
                      />
                    </div>

                    <div>
                      <Label>Tipo de Transporte *</Label>
                      <Select
                        value={tipoTransporte}
                        onValueChange={setTipoTransporte}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">Transporte Público</SelectItem>
                          <SelectItem value="02">Transporte Privado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Fecha Inicio Traslado *</Label>
                      <Input
                        type="date"
                        value={formData.fecha_de_inicio_de_traslado}
                        onChange={(e) =>
                          handleInputChange(
                            "fecha_de_inicio_de_traslado",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Peso y Medidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Peso de la Carga</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Peso Bruto Total *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.peso_bruto_total}
                      onChange={(e) =>
                        handleInputChange(
                          "peso_bruto_total",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Unidad de Medida *</Label>
                    <Select
                      value={formData.peso_bruto_unidad_de_medida}
                      onValueChange={(v) =>
                        handleInputChange("peso_bruto_unidad_de_medida", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KGM">Kilogramos (KGM)</SelectItem>
                        <SelectItem value="TNE">Toneladas (TNE)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Transportista - Solo para transporte público */}
              {tipoGRE === 7 && tipoTransporte === "01" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Datos del Transportista
                    </CardTitle>
                    <CardDescription>
                      Obligatorio para transporte público
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo Documento *</Label>
                      <Select
                        value={formData.transportista_documento_tipo.toString()}
                        onValueChange={(v) =>
                          handleInputChange(
                            "transportista_documento_tipo",
                            parseInt(v)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">RUC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>RUC Transportista *</Label>
                      <Input
                        value={formData.transportista_documento_numero}
                        onChange={(e) =>
                          handleInputChange(
                            "transportista_documento_numero",
                            e.target.value
                          )
                        }
                        maxLength={11}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Razón Social *</Label>
                      <Input
                        value={formData.transportista_denominacion}
                        onChange={(e) =>
                          handleInputChange(
                            "transportista_denominacion",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Placa del Vehículo *</Label>
                      <Input
                        value={formData.transportista_placa_numero}
                        onChange={(e) =>
                          handleInputChange(
                            "transportista_placa_numero",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Placa para transporte privado */}
              {tipoGRE === 7 && tipoTransporte === "02" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vehículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label>Placa del Vehículo *</Label>
                      <Input
                        value={formData.transportista_placa_numero}
                        onChange={(e) =>
                          handleInputChange(
                            "transportista_placa_numero",
                            e.target.value
                          )
                        }
                        placeholder="ABC-123"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Placa para GRE Transportista */}
              {tipoGRE === 8 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vehículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label>Placa del Vehículo *</Label>
                      <Input
                        value={formData.transportista_placa_numero}
                        onChange={(e) =>
                          handleInputChange(
                            "transportista_placa_numero",
                            e.target.value
                          )
                        }
                        placeholder="ABC-123"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conductor - Para transporte privado o GRE Transportista */}
              {(tipoGRE === 8 ||
                (tipoGRE === 7 && tipoTransporte === "02")) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Datos del Conductor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo Documento *</Label>
                      <Select
                        value={formData.conductor_documento_tipo.toString()}
                        onValueChange={(v) =>
                          handleInputChange(
                            "conductor_documento_tipo",
                            parseInt(v)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">DNI</SelectItem>
                          <SelectItem value="4">
                            Carnet de Extranjería
                          </SelectItem>
                          <SelectItem value="7">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Número de Documento *</Label>
                      <Input
                        value={formData.conductor_documento_numero}
                        onChange={(e) =>
                          handleInputChange(
                            "conductor_documento_numero",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Nombres *</Label>
                      <Input
                        value={formData.conductor_nombre}
                        onChange={(e) =>
                          handleInputChange("conductor_nombre", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Apellidos *</Label>
                      <Input
                        value={formData.conductor_apellidos}
                        onChange={(e) =>
                          handleInputChange(
                            "conductor_apellidos",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Número de Licencia *</Label>
                      <Input
                        value={formData.conductor_numero_licencia}
                        onChange={(e) =>
                          handleInputChange(
                            "conductor_numero_licencia",
                            e.target.value
                          )
                        }
                        placeholder="Q12345678"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Destinatario - Solo para GRE Transportista */}
              {tipoGRE === 8 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Datos del Destinatario</CardTitle>
                    <CardDescription>
                      Obligatorio para GRE Transportista
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo Documento *</Label>
                      <Select
                        value={formData.destinatario_documento_tipo.toString()}
                        onValueChange={(v) =>
                          handleInputChange(
                            "destinatario_documento_tipo",
                            parseInt(v)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">DNI</SelectItem>
                          <SelectItem value="6">RUC</SelectItem>
                          <SelectItem value="4">
                            Carnet de Extranjería
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Número de Documento *</Label>
                      <Input
                        value={formData.destinatario_documento_numero}
                        onChange={(e) =>
                          handleInputChange(
                            "destinatario_documento_numero",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Denominación *</Label>
                      <Input
                        value={formData.destinatario_denominacion}
                        onChange={(e) =>
                          handleInputChange(
                            "destinatario_denominacion",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ubicaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Punto de Partida y Llegada
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  {/* Punto de Partida */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                      Punto de Partida
                    </h3>

                    <div>
                      <Label>Ubigeo (6 dígitos) *</Label>
                      <Input
                        value={formData.punto_de_partida_ubigeo}
                        onChange={(e) =>
                          handleInputChange(
                            "punto_de_partida_ubigeo",
                            e.target.value
                          )
                        }
                        placeholder="150101"
                        maxLength={6}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ejemplo: 150101 (Lima - Lima - Lima)
                      </p>
                    </div>

                    <div>
                      <Label>Dirección *</Label>
                      <Textarea
                        value={formData.punto_de_partida_direccion}
                        onChange={(e) =>
                          handleInputChange(
                            "punto_de_partida_direccion",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    {/* Código establecimiento SUNAT - Solo para motivos 04 y 18 */}
                    {tipoGRE === 7 &&
                      (formData.motivo_de_traslado === "04" ||
                        formData.motivo_de_traslado === "18") && (
                        <div>
                          <Label>Código Establecimiento SUNAT</Label>
                          <Input
                            value={
                              formData.punto_de_partida_codigo_establecimiento_sunat
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "punto_de_partida_codigo_establecimiento_sunat",
                                e.target.value
                              )
                            }
                            placeholder="0000"
                            maxLength={4}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Requerido para motivos 04 y 18. Ejemplo: 0000
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Punto de Llegada */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                      Punto de Llegada
                    </h3>

                    <div>
                      <Label>Ubigeo (6 dígitos) *</Label>
                      <Input
                        value={formData.punto_de_llegada_ubigeo}
                        onChange={(e) =>
                          handleInputChange(
                            "punto_de_llegada_ubigeo",
                            e.target.value
                          )
                        }
                        placeholder="150101"
                        maxLength={6}
                        required
                      />
                    </div>

                    <div>
                      <Label>Dirección *</Label>
                      <Textarea
                        value={formData.punto_de_llegada_direccion}
                        onChange={(e) =>
                          handleInputChange(
                            "punto_de_llegada_direccion",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    {/* Código establecimiento SUNAT - Solo para motivos 04 y 18 */}
                    {tipoGRE === 7 &&
                      (formData.motivo_de_traslado === "04" ||
                        formData.motivo_de_traslado === "18") && (
                        <div>
                          <Label>Código Establecimiento SUNAT</Label>
                          <Input
                            value={
                              formData.punto_de_llegada_codigo_establecimiento_sunat
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "punto_de_llegada_codigo_establecimiento_sunat",
                                e.target.value
                              )
                            }
                            placeholder="0000"
                            maxLength={4}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Requerido para motivos 04 y 18. Ejemplo: 0000
                          </p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Items / Productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Productos a Transportar
                    </span>
                    <Button
                      type="button"
                      onClick={addItem}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 relative"
                      >
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="absolute top-2 right-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}

                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <Label>Unidad de Medida *</Label>
                            <Select
                              value={item.unidad_de_medida}
                              onValueChange={(v) =>
                                updateItem(index, "unidad_de_medida", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NIU">
                                  Unidad (NIU)
                                </SelectItem>
                                <SelectItem value="KGM">
                                  Kilogramos (KGM)
                                </SelectItem>
                                <SelectItem value="TNE">
                                  Toneladas (TNE)
                                </SelectItem>
                                <SelectItem value="MTR">
                                  Metros (MTR)
                                </SelectItem>
                                <SelectItem value="LTR">
                                  Litros (LTR)
                                </SelectItem>
                                <SelectItem value="ZZ">
                                  Servicio (ZZ)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Código</Label>
                            <Input
                              value={item.codigo}
                              onChange={(e) =>
                                updateItem(index, "codigo", e.target.value)
                              }
                              placeholder="Opcional"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label>Descripción *</Label>
                            <Input
                              value={item.descripcion}
                              onChange={(e) =>
                                updateItem(index, "descripcion", e.target.value)
                              }
                              placeholder="Descripción del producto"
                              required
                            />
                          </div>

                          <div>
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.cantidad}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "cantidad",
                                  parseFloat(e.target.value) || 1
                                )
                              }
                              min={0.01}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Documentos Relacionados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Documentos Relacionados (Opcional)</span>
                    <Button
                      type="button"
                      onClick={addDocumentoRelacionado}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Documento
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Facturas, boletas u otros documentos relacionados al
                    traslado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentosRelacionados.length > 0 ? (
                    <div className="space-y-4">
                      {documentosRelacionados.map((doc, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocumentoRelacionado(index)}
                            className="absolute top-2 right-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>

                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <Label>Tipo de Documento</Label>
                              <Select
                                value={doc.tipo}
                                onValueChange={(v) =>
                                  updateDocumentoRelacionado(index, "tipo", v)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="01">Factura</SelectItem>
                                  <SelectItem value="03">
                                    Boleta de Venta
                                  </SelectItem>
                                  <SelectItem value="04">
                                    Liquidación de Compra
                                  </SelectItem>
                                  <SelectItem value="09">
                                    Guía de Remisión Remitente
                                  </SelectItem>
                                  <SelectItem value="12">
                                    Ticket de Máquina Registradora
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Serie</Label>
                              <Input
                                value={doc.serie}
                                onChange={(e) =>
                                  updateDocumentoRelacionado(
                                    index,
                                    "serie",
                                    e.target.value
                                  )
                                }
                                placeholder="F001"
                              />
                            </div>

                            <div>
                              <Label>Número</Label>
                              <Input
                                type="number"
                                value={doc.numero || 0}
                                onChange={(e) =>
                                  updateDocumentoRelacionado(
                                    index,
                                    "numero",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay documentos relacionados
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Proyecto (Opcional) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Relacionar con Proyecto (Opcional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Proyecto</Label>
                    <ProyectoSelect
                      value={formData.id_proyecto}
                      onChange={(id) => {
                        handleInputChange("id_proyecto", id);
                        // Limpiar selecciones dependientes
                        handleInputChange("id_etapa", undefined);
                        handleInputChange("id_sector", undefined);
                        handleInputChange("id_frente", undefined);
                        handleInputChange("id_partida", undefined);
                      }}
                      onNameChange={(name) =>
                        setSelectedNames((prev) => ({
                          ...prev,
                          proyecto: name,
                        }))
                      }
                    />
                  </div>

                  {formData.id_proyecto && (
                    <div>
                      <Label>Etapa</Label>
                      <EtapaSelect
                        idProyecto={formData.id_proyecto}
                        value={formData.id_etapa}
                        onChange={(id) => {
                          handleInputChange("id_etapa", id);
                          // Limpiar selecciones dependientes
                          handleInputChange("id_sector", undefined);
                          handleInputChange("id_frente", undefined);
                          handleInputChange("id_partida", undefined);
                        }}
                        onNameChange={(name) =>
                          setSelectedNames((prev) => ({ ...prev, etapa: name }))
                        }
                      />
                    </div>
                  )}

                  {formData.id_etapa && (
                    <div>
                      <Label>Sector</Label>
                      <SectorSelect
                        idEtapa={formData.id_etapa}
                        value={formData.id_sector}
                        onChange={(id) => {
                          handleInputChange("id_sector", id);
                          // Limpiar selecciones dependientes
                          handleInputChange("id_frente", undefined);
                          handleInputChange("id_partida", undefined);
                        }}
                        onNameChange={(name) =>
                          setSelectedNames((prev) => ({
                            ...prev,
                            sector: name,
                          }))
                        }
                      />
                    </div>
                  )}

                  {formData.id_sector && (
                    <div>
                      <Label>Frente</Label>
                      <FrenteSelectBySector
                        idSector={formData.id_sector}
                        value={formData.id_frente}
                        onChange={(id) => {
                          handleInputChange("id_frente", id);
                          // Limpiar selección dependiente
                          handleInputChange("id_partida", undefined);
                        }}
                        onNameChange={(name) =>
                          setSelectedNames((prev) => ({
                            ...prev,
                            frente: name,
                          }))
                        }
                      />
                    </div>
                  )}

                  {formData.id_frente && (
                    <div>
                      <Label>Partida</Label>
                      <PartidaSelect
                        idFrente={formData.id_frente}
                        value={formData.id_partida}
                        onChange={(id) => handleInputChange("id_partida", id)}
                        onNameChange={(name) =>
                          setSelectedNames((prev) => ({
                            ...prev,
                            partida: name,
                          }))
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Observaciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                  <CardDescription>
                    Se genera automáticamente con los datos del proyecto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.observaciones}
                    readOnly
                    placeholder="Seleccione un proyecto, etapa, sector, frente y partida para generar las observaciones automáticamente..."
                    rows={6}
                    className="bg-gray-50 dark:bg-gray-900"
                  />
                </CardContent>
              </Card>

              {/* Botones de Acción */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Limpiar Formulario
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Crear Guía de Remisión
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  );
}
