"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  FileText,
  Truck,
  Package,
  MapPin,
  User,
  Building2,
} from "lucide-react";
import { ProyectoSelect } from "@/components/proyecto-select";
import { EtapaSelect } from "@/components/etapa-select";
import { SectorSelect } from "@/components/sector-select";
import { FrenteSelectBySector } from "@/components/frente-select-by-sector";
import { PartidaSelect } from "@/components/partida-select";
import { SubEtapaSelect } from "@/components/subetapa-select";
import { SubsectorSelect } from "@/components/subsector-select";
import { SubfrenteSelect } from "@/components/subfrente-select";
import { SubpartidaSelect } from "@/components/subpartida-select";
import {
  guiasRemisionApi,
  programacionApi,
  type GuiaRemisionData,
  type ProgramacionTecnicaDetalleData,
} from "@/lib/connections";
import { toast } from "sonner";
import { UbigeoDialog } from "@/components/ubigeo-dialog";
import { CamionDialog } from "@/components/camion-dialog";
import { EmpresaDialog } from "@/components/empresa-dialog";
import { ubigeosLima } from "@/lib/ubigeos-lima";
import { getTodayPeru } from "@/lib/date-utils";

interface ItemGRE {
  unidad_de_medida: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
}

interface GuiaRemisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacionId: number;
  onSuccess?: () => void;
}

export function GuiaRemisionModal({
  open,
  onOpenChange,
  programacionId,
  onSuccess,
}: GuiaRemisionModalProps) {
  const [tipoGRE] = useState<number>(7); // 7 = Remitente
  const [tipoTransporte] = useState<string>("02"); // 02 = Privado
  const [loading, setLoading] = useState(false);
  const [loadingNumber, setLoadingNumber] = useState(true);
  const [identificadorUnico, setIdentificadorUnico] = useState<string>("");

  // Estado para rastrear si se seleccionó proyecto o subproyecto
  const [selectionType, setSelectionType] = useState<"proyecto" | "subproyecto" | null>(null);

  // Estados para los nombres seleccionados
  const [selectedNames, setSelectedNames] = useState({
    proyecto: "",
    etapa: "",
    sector: "",
    frente: "",
    partida: "",
    subproyecto: "",
    subetapa: "",
    subsector: "",
    subfrente: "",
    subpartida: "",
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    operacion: "generar_guia",
    serie: "TTT1",
    numero: 1,
    fecha_de_emision: getTodayPeru(),
    fecha_de_inicio_de_traslado: getTodayPeru(),
    cliente_tipo_de_documento: 6,
    cliente_numero_de_documento: "",
    cliente_denominacion: "",
    cliente_direccion: "",
    cliente_email: "",
    motivo_de_traslado: "13",
    numero_de_bultos: 1,
    peso_bruto_total: 0,
    peso_bruto_unidad_de_medida: "TNE",
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
    id_proyecto: undefined as number | undefined,
    id_etapa: undefined as number | undefined,
    id_sector: undefined as number | undefined,
    id_frente: undefined as number | undefined,
    id_partida: undefined as number | undefined,
    id_subproyecto: undefined as number | undefined,
    id_subetapa: undefined as number | undefined,
    id_subsector: undefined as number | undefined,
    id_subfrente: undefined as number | undefined,
    id_subpartida: undefined as number | undefined,
    observaciones: "",
    identificador_unico: "",
  });

  // Items
  const [items, setItems] = useState<ItemGRE[]>([
    {
      unidad_de_medida: "MTQ",
      codigo: "",
      descripcion: "",
      cantidad: 1,
    },
  ]);

  // Manejo de cambios en el formulario
  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Actualizar item
  const updateItem = (index: number, field: keyof ItemGRE, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Validar y enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar items
      if (items.length === 0 || items.some((item) => !item.descripcion || item.cantidad <= 0)) {
        toast.error("Debe agregar al menos un ítem válido");
        setLoading(false);
        return;
      }

      // Construir datos de la guía
      const guiaData: Record<string, unknown> = {
        ...formData,
        tipo_de_comprobante: tipoGRE,
        tipo_de_transporte: tipoGRE === 7 ? tipoTransporte : undefined,
        items: items.filter((item) => item.descripcion && item.cantidad > 0),
      };

      // Limpiar campos de transportista si están vacíos
      if (tipoGRE === 7 && tipoTransporte === "02") {
        if (!guiaData.transportista_documento_numero || (typeof guiaData.transportista_documento_numero === 'string' && guiaData.transportista_documento_numero.trim() === "")) {
          delete guiaData.transportista_documento_numero;
        }
        if (!guiaData.transportista_denominacion || (typeof guiaData.transportista_denominacion === 'string' && guiaData.transportista_denominacion.trim() === "")) {
          delete guiaData.transportista_denominacion;
        }
        if (!guiaData.transportista_documento_tipo) {
          delete guiaData.transportista_documento_tipo;
        }
      }

      // Enviar a la API
      await guiasRemisionApi.create(
        guiaData as Omit<GuiaRemisionData, | "id_guia" | "created_at" | "updated_at" | "estado_gre" | "enlace_del_pdf" | "enlace_del_xml" | "enlace_del_cdr">
      );

      // Actualizar programación técnica si es necesario
      if (
        programacionId &&
        (formData.id_proyecto ||
          formData.id_etapa ||
          formData.id_sector ||
          formData.id_frente ||
          formData.id_partida ||
          formData.id_subproyecto ||
          formData.id_subetapa ||
          formData.id_subsector ||
          formData.id_subfrente ||
          formData.id_subpartida ||
          items[0]?.cantidad)
      ) {
        try {
          await programacionApi.updateTecnica(programacionId, {
            id_proyecto: formData.id_proyecto,
            id_etapa: formData.id_etapa,
            id_sector: formData.id_sector,
            id_frente: formData.id_frente,
            id_partida: formData.id_partida,
            id_subproyecto: formData.id_subproyecto,
            id_subetapa: formData.id_subetapa,
            id_subsector: formData.id_subsector,
            id_subfrente: formData.id_subfrente,
            id_subpartida: formData.id_subpartida,
            m3: items[0]?.cantidad?.toString() || "0",
          });
        } catch (updateError) {
          console.error("Error al actualizar programación técnica:", updateError);
        }
      }

      toast.success("Guía de Remisión creada exitosamente", {
        description: `Serie: ${formData.serie}-${formData.numero}`,
      });

      // Cerrar modal y ejecutar callback
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error("Error creando guía:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Por favor, verifique los datos ingresados";
      toast.error("Error al crear la guía de remisión", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de programación técnica
  useEffect(() => {
    const loadProgramacionData = async () => {
      if (!open || !programacionId) return;

      try {
        setLoading(true);
        const data: ProgramacionTecnicaDetalleData | null = await programacionApi.getTecnicaById(programacionId);

        if (!data) {
          toast.error("No se encontraron datos de programación técnica");
          return;
        }

        setIdentificadorUnico(data.identificador_unico || "");

        setFormData((prev) => ({
          ...prev,
          cliente_numero_de_documento: data.empresa_nro_documento || data.guia_numero_documento || "",
          cliente_denominacion: data.empresa_razon_social || data.guia_destinatario_denominacion || "",
          cliente_direccion: data.empresa_direccion || data.guia_destinatario_direccion || "",
          peso_bruto_total: parseFloat(data.guia_traslado_peso_bruto || "0"),
          transportista_placa_numero: data.camion_placa || data.guia_traslado_vehiculo_placa || "",
          conductor_documento_numero: data.camion_dni || data.guia_conductor_dni_numero || "",
          conductor_nombre: data.camion_nombre_chofer || data.guia_conductor_nombres || "",
          conductor_apellidos: data.camion_apellido_chofer || data.guia_conductor_apellidos || "",
          conductor_numero_licencia: data.camion_numero_licencia || data.guia_conductor_num_licencia || "",
          punto_de_partida_ubigeo: data.punto_partida_ubigeo || "",
          punto_de_partida_direccion: data.punto_partida_direccion || "",
          punto_de_llegada_ubigeo: data.punto_llegada_ubigeo || "",
          punto_de_llegada_direccion: data.punto_llegada_direccion || "",
          identificador_unico: data.identificador_unico || "",
          id_proyecto: data.id_proyecto && data.id_proyecto > 0 ? data.id_proyecto : undefined,
          id_subproyecto: data.id_subproyecto && data.id_subproyecto > 0 ? data.id_subproyecto : undefined,
        }));

        if (data.id_proyecto && data.id_proyecto > 0) {
          setSelectionType("proyecto");
        } else if (data.id_subproyecto && data.id_subproyecto > 0) {
          setSelectionType("subproyecto");
        }

        toast.success("Datos cargados desde programación técnica");
      } catch (error) {
        console.error("Error cargando programación técnica:", error);
        toast.error("No se pudo cargar los datos de programación técnica");
      } finally {
        setLoading(false);
      }
    };

    loadProgramacionData();
  }, [open, programacionId]);

  // Cargar el último número al iniciar
  useEffect(() => {
    const fetchLastNumber = async () => {
      if (!open) return;

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
  }, [open]);

  // Memoized callbacks for name changes
  const handlePartidaDataChange = useCallback((data: { codigo: string; descripcion: string } | null) => {
    if (data) {
      setItems((prevItems) => {
        const newItems = [...prevItems];
        if (newItems.length > 0) {
          newItems[0] = {
            ...newItems[0],
            codigo: data.codigo,
            descripcion: data.descripcion,
          };
        }
        return newItems;
      });
    }
  }, []);

  const handleSubpartidaDataChange = useCallback((data: { codigo: string; descripcion: string } | null) => {
    if (data) {
      setItems((prevItems) => {
        const newItems = [...prevItems];
        if (newItems.length > 0) {
          newItems[0] = {
            ...newItems[0],
            codigo: data.codigo,
            descripcion: data.descripcion,
          };
        }
        return newItems;
      });
    }
  }, []);

  // Actualizar cantidad del primer ítem cuando cambia el peso bruto total
  useEffect(() => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      if (newItems.length > 0) {
        if (newItems[0].cantidad !== formData.peso_bruto_total) {
          newItems[0] = {
            ...newItems[0],
            cantidad: formData.peso_bruto_total,
          };
          return newItems;
        }
      }
      return prevItems;
    });
  }, [formData.peso_bruto_total]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6" />
            Guía de Remisión Electrónica
            {identificadorUnico && (
              <Badge variant="outline" className="ml-auto">
                {identificadorUnico}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos del Comprobante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Datos del Comprobante
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Serie</Label>
                <Input value={formData.serie} disabled />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={formData.numero} disabled />
              </div>
              <div>
                <Label>Fecha de Emisión</Label>
                <Input type="date" value={formData.fecha_de_emision} onChange={(e) => handleInputChange("fecha_de_emision", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Relacionar con Proyecto *
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Proyecto / Subproyecto</Label>
                <ProyectoSelect
                  value={
                    selectionType === "proyecto"
                      ? `p-${formData.id_proyecto}`
                      : selectionType === "subproyecto"
                      ? `s-${formData.id_subproyecto}`
                      : undefined
                  }
                  onChange={(id, type) => {
                    setSelectionType(type);
                    if (type === "proyecto") {
                      handleInputChange("id_subproyecto", undefined);
                      handleInputChange("id_subetapa", undefined);
                      handleInputChange("id_subsector", undefined);
                      handleInputChange("id_subfrente", undefined);
                      handleInputChange("id_subpartida", undefined);
                      handleInputChange("id_proyecto", id);
                      handleInputChange("id_etapa", undefined);
                      handleInputChange("id_sector", undefined);
                      handleInputChange("id_frente", undefined);
                      handleInputChange("id_partida", undefined);
                    } else if (type === "subproyecto") {
                      handleInputChange("id_proyecto", undefined);
                      handleInputChange("id_etapa", undefined);
                      handleInputChange("id_sector", undefined);
                      handleInputChange("id_frente", undefined);
                      handleInputChange("id_partida", undefined);
                      handleInputChange("id_subproyecto", id);
                      handleInputChange("id_subetapa", undefined);
                      handleInputChange("id_subsector", undefined);
                      handleInputChange("id_subfrente", undefined);
                      handleInputChange("id_subpartida", undefined);
                    }
                  }}
                  onNameChange={(name) => {
                    setSelectedNames((prev) => ({
                      ...prev,
                      [selectionType === "proyecto" ? "proyecto" : "subproyecto"]: name,
                    }));
                  }}
                />
              </div>

              {/* Flujo PROYECTO */}
              {selectionType === "proyecto" && formData.id_proyecto && (
                <>
                  <div>
                    <Label>Etapa</Label>
                    <EtapaSelect
                      idProyecto={formData.id_proyecto}
                      value={formData.id_etapa}
                      onChange={(id) => {
                        handleInputChange("id_etapa", id);
                        handleInputChange("id_sector", undefined);
                        handleInputChange("id_frente", undefined);
                        handleInputChange("id_partida", undefined);
                      }}
                      onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, etapa: name }))}
                    />
                  </div>

                  {formData.id_etapa && (
                    <div>
                      <Label>Sector</Label>
                      <SectorSelect
                        idEtapa={formData.id_etapa}
                        value={formData.id_sector}
                        onChange={(id) => {
                          handleInputChange("id_sector", id);
                          handleInputChange("id_frente", undefined);
                          handleInputChange("id_partida", undefined);
                        }}
                        onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, sector: name }))}
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
                          handleInputChange("id_partida", undefined);
                        }}
                        onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, frente: name }))}
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
                        onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, partida: name }))}
                        onPartidaDataChange={handlePartidaDataChange}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Flujo SUBPROYECTO */}
              {selectionType === "subproyecto" && formData.id_subproyecto && (
                <>
                  <div>
                    <Label>Sub-Etapa</Label>
                    <SubEtapaSelect
                      idSubproyecto={formData.id_subproyecto}
                      value={formData.id_subetapa}
                      onChange={(id) => {
                        handleInputChange("id_subetapa", id);
                        handleInputChange("id_subsector", undefined);
                        handleInputChange("id_subfrente", undefined);
                        handleInputChange("id_subpartida", undefined);
                      }}
                      onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, subetapa: name }))}
                    />
                  </div>

                  {formData.id_subetapa && (
                    <div>
                      <Label>Subsector</Label>
                      <SubsectorSelect
                        idSubEtapa={formData.id_subetapa}
                        value={formData.id_subsector}
                        onChange={(id) => {
                          handleInputChange("id_subsector", id);
                          handleInputChange("id_subfrente", undefined);
                          handleInputChange("id_subpartida", undefined);
                        }}
                        onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, subsector: name }))}
                      />
                    </div>
                  )}

                  {formData.id_subsector && (
                    <div>
                      <Label>Subfrente</Label>
                      <SubfrenteSelect
                        idSubsector={formData.id_subsector}
                        value={formData.id_subfrente}
                        onChange={(id) => {
                          handleInputChange("id_subfrente", id);
                          handleInputChange("id_subpartida", undefined);
                        }}
                        onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, subfrente: name }))}
                      />
                    </div>
                  )}

                  {formData.id_subfrente && (
                    <div>
                      <Label>Subpartida</Label>
                      <SubpartidaSelect
                        idSubfrente={formData.id_subfrente}
                        value={formData.id_subpartida}
                        onChange={(id) => handleInputChange("id_subpartida", id)}
                        onNameChange={(name) => setSelectedNames((prev) => ({ ...prev, subpartida: name }))}
                        onSubpartidaDataChange={handleSubpartidaDataChange}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Peso de la Carga */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peso de la Carga *</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Peso Bruto Total</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.peso_bruto_total}
                  onChange={(e) => handleInputChange("peso_bruto_total", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label>Unidad de Medida</Label>
                <Select value={formData.peso_bruto_unidad_de_medida} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TNE">Toneladas (TNE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Procesando..." : "Crear Guía de Remisión"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
