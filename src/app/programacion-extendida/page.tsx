"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  FileText,
  Copy,
  Send,
  Trash2,
  Folder,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react";
import {
  programacionApi,
  type ProgramacionTecnicaData,
} from "@/lib/connections";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";
import { useWebSocket } from "@/lib/useWebSocket";
import { ProyectoSelect } from "@/components/proyecto-select";
import { EtapaSelect } from "@/components/etapa-select";
import { SectorSelect } from "@/components/sector-select";
import { FrenteSelectBySector } from "@/components/frente-select-by-sector";
import { PartidaSelect } from "@/components/partida-select";
import { SubEtapaSelect } from "@/components/subetapa-select";
import { SubsectorSelect } from "@/components/subsector-select";
import { SubfrenteSelect } from "@/components/subfrente-select";
import { SubpartidaSelect } from "@/components/subpartida-select";

interface DuplicadoConModificaciones extends ProgramacionTecnicaData {
  _isModified?: boolean;
  observaciones?: string;
  items?: string;
  peso_bruto_total?: number | null;
}

// ✅ NUEVO FLUJO: Ya no hay loteId, duplicados solo en memoria
interface SelectedNamesType {
  proyecto: string;
  etapa: string;
  sector: string;
  frente: string;
  partida: string;
  subproyecto: string;
  subetapa: string;
  subsector: string;
  subfrente: string;
  subpartida: string;
}

interface DuplicadosPorGuia {
  [idGuiaOriginal: number]: {
    duplicados: DuplicadoConModificaciones[];
    selectionType?: "proyecto" | "subproyecto" | null;
    proyectoData?: {
      id_proyecto?: number;
      id_etapa?: number;
      id_sector?: number;
      id_frente?: number;
      id_partida?: number;
      id_subproyecto?: number;
      id_subetapa?: number;
      id_subsector?: number;
      id_subfrente?: number;
      id_subpartida?: number;
    };
    selectedNames: SelectedNamesType;
  };
}

interface ProgTecnicaCompletadaData {
  identificador_unico: string;
  pdf_link: string;
  xml_link: string;
  cdr_link: string;
}

export default function ProgramacionExtendidaPage() {
  const router = useRouter();
  const [dataOriginales, setDataOriginales] = useState<ProgramacionTecnicaData[]>([]);
  const [identificadoresConGuia, setIdentificadoresConGuia] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de duplicación
  const [isDuplicarModalOpen, setIsDuplicarModalOpen] = useState(false);
  const [guiaSeleccionada, setGuiaSeleccionada] = useState<ProgramacionTecnicaData | null>(null);
  const [cantidadDuplicados, setCantidadDuplicados] = useState(1);
  const [isDuplicando, setIsDuplicando] = useState(false);

  // Duplicados organizados por guía original
  const [duplicadosPorGuia, setDuplicadosPorGuia] = useState<DuplicadosPorGuia>({});

  // Filas expandidas
  const [filasExpandidas, setFilasExpandidas] = useState<Set<number>>(new Set());

  // Envío a Kafka
  const [isEnviando, setIsEnviando] = useState(false);
  const [progresoEnvio, setProgresoEnvio] = useState(0);

  const fetchDataOriginales = async () => {
    setIsLoading(true);
    try {
      const originales = await programacionApi.getAllOriginales();
      setDataOriginales(originales);
    } catch (error) {
      toast.error("Error al cargar los datos originales");
      console.error("Error fetching originales:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataOriginales();
  }, []);

  // WebSocket para actualización en tiempo real
  useWebSocket('prog-tecnica-completada', (data?: ProgTecnicaCompletadaData) => {
    if (!data) return;

    const { identificador_unico, pdf_link, xml_link, cdr_link } = data;

    // Actualizar dataOriginales
    setDataOriginales(prev => prev.map(item => {
      if (item.identificador_unico === identificador_unico) {
        return {
          ...item,
          enlace_del_pdf: pdf_link,
          enlace_del_xml: xml_link,
          enlace_del_cdr: cdr_link,
          estado_gre: 'ACEPTADA'
        };
      }
      return item;
    }));

    // Actualizar duplicadosPorGuia
    setDuplicadosPorGuia(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const guiaData = updated[Number(key)];
        guiaData.duplicados = guiaData.duplicados.map(dup => {
          if (dup.identificador_unico === identificador_unico) {
            return {
              ...dup,
              enlace_del_pdf: pdf_link,
              enlace_del_xml: xml_link,
              enlace_del_cdr: cdr_link,
              estado_gre: 'ACEPTADA'
            };
          }
          return dup;
        });
      });
      return updated;
    });

    // Remover de la lista de guías en proceso
    setIdentificadoresConGuia(prev => prev.filter(id => id !== identificador_unico));

    toast.success(`Guía ${identificador_unico} completada y lista`);
  });

  // Funciones helper para estados
  const hasArchivosGenerados = (item: ProgramacionTecnicaData): boolean => {
    return !!(item.enlace_del_pdf && item.enlace_del_xml && item.enlace_del_cdr);
  };

  const hasGuiaEnProceso = (item: ProgramacionTecnicaData): boolean => {
    return !!(item.identificador_unico && identificadoresConGuia.includes(item.identificador_unico));
  };

  const handleAbrirModalDuplicar = (guia: ProgramacionTecnicaData) => {
    // Validar que no tenga archivos generados
    if (guia.enlace_del_pdf || guia.enlace_del_xml || guia.enlace_del_cdr) {
      toast.error("No se puede duplicar una guía que ya tiene archivos generados");
      return;
    }

    setGuiaSeleccionada(guia);
    setCantidadDuplicados(1);
    setIsDuplicarModalOpen(true);
  };

  const handleDuplicarGuia = async () => {
    if (!guiaSeleccionada) return;

    if (cantidadDuplicados < 1 || cantidadDuplicados > 50) {
      toast.error("La cantidad de duplicados debe estar entre 1 y 50");
      return;
    }

    setIsDuplicando(true);
    try {
      const result = await programacionApi.duplicarGuia(
        guiaSeleccionada.id,
        cantidadDuplicados
      );

      if (result.success) {
        // Determinar el tipo de selección inicial (proyecto o subproyecto)
        // Basado en los datos del registro original
        let initialSelectionType: "proyecto" | "subproyecto" | null = null;
        let initialProyectoData: DuplicadosPorGuia[number]["proyectoData"] = {};

        if (guiaSeleccionada.id_proyecto && guiaSeleccionada.id_proyecto > 0) {
          initialSelectionType = "proyecto";
          initialProyectoData = {
            id_proyecto: guiaSeleccionada.id_proyecto,
            id_etapa: guiaSeleccionada.id_etapa ?? undefined,
            id_sector: guiaSeleccionada.id_sector ?? undefined,
            id_frente: guiaSeleccionada.id_frente ?? undefined,
            id_partida: guiaSeleccionada.id_partida ?? undefined,
          };
        } else if (guiaSeleccionada.id_subproyecto && guiaSeleccionada.id_subproyecto > 0) {
          initialSelectionType = "subproyecto";
          initialProyectoData = {
            id_subproyecto: guiaSeleccionada.id_subproyecto,
            id_subetapa: guiaSeleccionada.id_subetapa ?? undefined,
            id_subsector: guiaSeleccionada.id_subsector ?? undefined,
            id_subfrente: guiaSeleccionada.id_subfrente ?? undefined,
            id_subpartida: guiaSeleccionada.id_subpartida ?? undefined,
          };
        }

        // ✅ NUEVO FLUJO: Duplicados solo en memoria, listos para editar
        setDuplicadosPorGuia(prev => ({
          ...prev,
          [guiaSeleccionada.id]: {
            duplicados: result.duplicados,
            selectionType: initialSelectionType,
            proyectoData: initialProyectoData,
            selectedNames: {
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
            }
          }
        }));

        // Expandir automáticamente la fila
        setFilasExpandidas(prev => new Set(prev).add(guiaSeleccionada.id));

        toast.success(`${result.message}. Edite los campos y presione "Guardar y Enviar".`);
        setIsDuplicarModalOpen(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al duplicar la guía";
      toast.error(errorMessage);
      console.error("Error duplicando guía:", error);
    } finally {
      setIsDuplicando(false);
    }
  };

  const toggleFilaExpandida = (idGuia: number) => {
    setFilasExpandidas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idGuia)) {
        newSet.delete(idGuia);
      } else {
        newSet.add(idGuia);
      }
      return newSet;
    });
  };

  const handleEliminarDuplicado = (idGuiaOriginal: number, index: number) => {
    setDuplicadosPorGuia(prev => {
      const guiaDuplicados = prev[idGuiaOriginal];
      if (!guiaDuplicados) return prev;

      const nuevosDuplicados = guiaDuplicados.duplicados.filter((_, i) => i !== index);

      if (nuevosDuplicados.length === 0) {
        // Eliminar completamente la entrada si no quedan duplicados
        const { [idGuiaOriginal]: removed, ...rest } = prev;
        setFilasExpandidas(prevExpanded => {
          const newSet = new Set(prevExpanded);
          newSet.delete(idGuiaOriginal);
          return newSet;
        });
        return rest;
      }

      return {
        ...prev,
        [idGuiaOriginal]: {
          ...guiaDuplicados,
          duplicados: nuevosDuplicados
        }
      };
    });

    toast.info("Duplicado eliminado");
  };

  const handleModificarTodosDuplicados = (
    idGuiaOriginal: number,
    campo: string,
    valor: unknown
  ) => {
    setDuplicadosPorGuia(prev => {
      const guiaDuplicados = prev[idGuiaOriginal];
      if (!guiaDuplicados) return prev;

      // Actualizar TODOS los duplicados con el mismo valor
      const nuevosDuplicados = guiaDuplicados.duplicados.map(duplicado => ({
        ...duplicado,
        [campo]: valor,
        _isModified: true
      }));

      return {
        ...prev,
        [idGuiaOriginal]: {
          ...guiaDuplicados,
          duplicados: nuevosDuplicados
        }
      };
    });
  };

  const handleProyectoChange = (
    idGuiaOriginal: number,
    campo: string,
    valor: unknown
  ) => {
    setDuplicadosPorGuia(prev => {
      const guiaDuplicados = prev[idGuiaOriginal];
      if (!guiaDuplicados) return prev;

      const updatedProyectoData = {
        ...guiaDuplicados.proyectoData,
        [campo]: valor
      };

      // Actualizar TODOS los duplicados con los datos del proyecto
      const nuevosDuplicados = guiaDuplicados.duplicados.map(duplicado => ({
        ...duplicado,
        ...updatedProyectoData,
        _isModified: true
      }));

      return {
        ...prev,
        [idGuiaOriginal]: {
          ...guiaDuplicados,
          duplicados: nuevosDuplicados,
          proyectoData: updatedProyectoData
        }
      };
    });
  };

  // Función para actualizar nombres seleccionados
  const handleNameChange = (
    idGuiaOriginal: number,
    campo: keyof SelectedNamesType,
    nombre: string
  ) => {
    setDuplicadosPorGuia(prev => {
      const guiaDuplicados = prev[idGuiaOriginal];
      if (!guiaDuplicados) return prev;

      return {
        ...prev,
        [idGuiaOriginal]: {
          ...guiaDuplicados,
          selectedNames: {
            ...guiaDuplicados.selectedNames,
            [campo]: nombre
          }
        }
      };
    });
  };

  // Función para generar observaciones basadas en los nombres seleccionados
  const generarObservaciones = (
    selectionType: "proyecto" | "subproyecto" | null,
    selectedNames: SelectedNamesType
  ): string => {
    let observacionesText = "";

    // Si se seleccionó un proyecto
    if (selectionType === "proyecto") {
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
    }
    // Si se seleccionó un subproyecto
    else if (selectionType === "subproyecto") {
      if (selectedNames.subproyecto) {
        observacionesText += `Subproyecto: ${selectedNames.subproyecto}\n`;
      }
      if (selectedNames.subetapa) {
        observacionesText += `Sub-Etapa: ${selectedNames.subetapa}\n`;
      }
      if (selectedNames.subsector) {
        observacionesText += `Subsector: ${selectedNames.subsector}\n`;
      }
      if (selectedNames.subfrente) {
        observacionesText += `Subfrente: ${selectedNames.subfrente}\n`;
      }
      if (selectedNames.subpartida) {
        observacionesText += `Subpartida: ${selectedNames.subpartida}`;
      }
    }

    return observacionesText.trim();
  };

  // useEffect para actualizar observaciones cuando cambian los nombres
  useEffect(() => {
    Object.keys(duplicadosPorGuia).forEach(key => {
      const idGuiaOriginal = Number(key);
      const guiaDuplicados = duplicadosPorGuia[idGuiaOriginal];
      if (!guiaDuplicados) return;

      const observacionesGeneradas = generarObservaciones(
        guiaDuplicados.selectionType || null,
        guiaDuplicados.selectedNames
      );

      // Solo actualizar si las observaciones han cambiado
      const observacionesActuales = guiaDuplicados.duplicados[0]?.observaciones || "";
      if (observacionesActuales !== observacionesGeneradas) {
        setDuplicadosPorGuia(prev => {
          const guia = prev[idGuiaOriginal];
          if (!guia) return prev;

          const nuevosDuplicados = guia.duplicados.map(duplicado => ({
            ...duplicado,
            observaciones: observacionesGeneradas,
            _isModified: true
          }));

          return {
            ...prev,
            [idGuiaOriginal]: {
              ...guia,
              duplicados: nuevosDuplicados
            }
          };
        });
      }
    });
  }, [
    JSON.stringify(
      Object.fromEntries(
        Object.entries(duplicadosPorGuia).map(([key, value]) => [
          key,
          {
            selectionType: value.selectionType,
            selectedNames: value.selectedNames
          }
        ])
      )
    )
  ]);

  // ✅ NUEVO FLUJO: Guardar duplicados en BD con estado_gre: null (auto-detección)
  const handleEnviarDuplicadosDeGuia = async (idGuiaOriginal: number) => {
    const guiaDuplicados = duplicadosPorGuia[idGuiaOriginal];
    if (!guiaDuplicados || guiaDuplicados.duplicados.length === 0) {
      toast.error("No hay duplicados para guardar");
      return;
    }

    // Validar que se haya completado la cascada de proyecto
    const primerDuplicado = guiaDuplicados.duplicados[0];
    const esProyecto = guiaDuplicados.selectionType === "proyecto";
    const esSubproyecto = guiaDuplicados.selectionType === "subproyecto";

    if (esProyecto) {
      if (!primerDuplicado.id_partida) {
        toast.error("Debe completar la cascada de Proyecto hasta Partida para generar el código del producto");
        return;
      }
    } else if (esSubproyecto) {
      if (!primerDuplicado.id_subpartida) {
        toast.error("Debe completar la cascada de Subproyecto hasta Subpartida para generar el código del producto");
        return;
      }
    } else {
      toast.error("Debe seleccionar un Proyecto o Subproyecto");
      return;
    }

    // Validar que los items tengan código
    try {
      const items = JSON.parse(primerDuplicado.items || "[]");
      if (!items.length || !items[0]?.codigo || items[0].codigo.trim() === "") {
        toast.error("Los items no tienen código. Asegúrese de haber seleccionado la Partida/Subpartida completa.");
        return;
      }
    } catch (e) {
      toast.error("Error al validar los items de la guía");
      return;
    }

    // Validar peso bruto total
    if (!primerDuplicado.peso_bruto_total || primerDuplicado.peso_bruto_total <= 0) {
      toast.error("Debe ingresar un Peso Bruto Total válido");
      return;
    }

    // Generar observaciones actualizadas antes de guardar
    const observacionesFinales = generarObservaciones(
      guiaDuplicados.selectionType || null,
      guiaDuplicados.selectedNames
    );

    if (!confirm(`¿Está seguro de guardar ${guiaDuplicados.duplicados.length} duplicados? El sistema los procesará automáticamente.`)) {
      return;
    }

    setIsEnviando(true);
    setProgresoEnvio(50);

    try {
      toast.info("Guardando duplicados en la base de datos...");

      // Preparar duplicados con todos los datos editados
      const duplicadosParaGuardar = guiaDuplicados.duplicados.map(duplicado => ({
        ...duplicado,
        // Asegurar que los datos del proyecto estén incluidos
        ...guiaDuplicados.proyectoData,
        // Asegurar que las observaciones estén incluidas
        observaciones: observacionesFinales
      }));

      console.log("📋 Duplicados a guardar:", duplicadosParaGuardar);
      console.log("📝 Observaciones:", observacionesFinales);

      // Validar que todos los items tengan código
      duplicadosParaGuardar.forEach((dup, index) => {
        try {
          const items = JSON.parse(dup.items || "[]");
          console.log(`🔍 Duplicado ${index + 1} - Items:`, items);

          if (items.length === 0) {
            console.warn(`⚠️ Duplicado ${index + 1} no tiene items`);
          } else if (!items[0]?.codigo || items[0].codigo.trim() === "") {
            console.warn(`⚠️ Duplicado ${index + 1} tiene items sin código`);
          }
        } catch (e) {
          console.error(`❌ Error parseando items del duplicado ${index + 1}:`, e);
        }
      });

      // Llamar al nuevo endpoint para guardar
      const result = await programacionApi.guardarDuplicados(duplicadosParaGuardar);

      setProgresoEnvio(100);

      // Agregar identificadores al estado de "en proceso"
      const identificadores = result.guiasCreadas
        .map(g => g.identificador_unico)
        .filter(Boolean) as string[];
      setIdentificadoresConGuia(prev => [...prev, ...identificadores]);

      toast.success(
        `✅ ${result.guiasCreadas.length} duplicados guardados exitosamente. ` +
        `El sistema los procesará automáticamente en los próximos 30 segundos.`,
        { duration: 5000 }
      );

      // Eliminar del estado local
      setDuplicadosPorGuia(prev => {
        const { [idGuiaOriginal]: removed, ...rest } = prev;
        return rest;
      });

      setFilasExpandidas(prev => {
        const newSet = new Set(prev);
        newSet.delete(idGuiaOriginal);
        return newSet;
      });

      setProgresoEnvio(0);

      // Recargar datos después de un momento
      setTimeout(async () => {
        await fetchDataOriginales();
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al guardar duplicados";
      toast.error(errorMessage);
      console.error("Error guardando duplicados:", error);
    } finally {
      setIsEnviando(false);
    }
  };

  // ✅ NUEVO FLUJO: Cancelar solo elimina del estado local (no toca BD)
  const handleCancelarDuplicacion = (idGuiaOriginal: number) => {
    const guiaDuplicados = duplicadosPorGuia[idGuiaOriginal];
    if (!guiaDuplicados) return;

    if (!confirm("¿Está seguro de cancelar? Se descartarán todos los duplicados sin guardar.")) {
      return;
    }

    // Solo eliminar del estado local
    setDuplicadosPorGuia(prev => {
      const { [idGuiaOriginal]: removed, ...rest } = prev;
      return rest;
    });

    setFilasExpandidas(prev => {
      const newSet = new Set(prev);
      newSet.delete(idGuiaOriginal);
      return newSet;
    });

    toast.info("Duplicados descartados (no se guardaron en la base de datos)");
  };

  const getTotalDuplicados = () => {
    return Object.values(duplicadosPorGuia).reduce(
      (total, { duplicados }) => total + duplicados.length,
      0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Copy className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-purple-700">
                  Programación Extendida - Duplicación Masiva
                </h1>
                <p className="text-sm text-slate-600">
                  Procesamiento masivo de guías de remisión
                </p>
              </div>
            </div>
            {getTotalDuplicados() > 0 && (
              <div className="bg-purple-100 px-4 py-2 rounded-lg border border-purple-300">
                <span className="text-purple-700 font-semibold">
                  {getTotalDuplicados()} duplicados pendientes
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="w-full px-4 sm:px-6 pb-8 space-y-6">
        {/* Leyenda de colores */}
        <Card className="bg-gradient-to-r from-slate-50 to-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-100"></div>
                <span className="text-slate-700 font-medium">Completada (PDF/XML/CDR disponibles)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-cyan-500 bg-cyan-100"></div>
                <span className="text-slate-700 font-medium">En proceso (enviada a Nubefact)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-purple-500 bg-purple-50"></div>
                <span className="text-slate-700 font-medium">Con duplicados pendientes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de guías originales */}
        <Card>
          <CardHeader>
            <CardTitle>
              {dataOriginales.length > 0
                ? `${dataOriginales.length} guías originales disponibles`
                : "Guías Originales"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : dataOriginales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay guías originales disponibles para duplicar
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead className="w-[100px]">Fecha</TableHead>
                      <TableHead className="min-w-[120px]">Unidad</TableHead>
                      <TableHead className="min-w-[150px]">Proveedor</TableHead>
                      <TableHead className="min-w-[180px]">Apellidos y Nombres</TableHead>
                      <TableHead className="min-w-[150px]">Proyectos</TableHead>
                      <TableHead className="w-[120px]">Programación</TableHead>
                      <TableHead className="w-[80px]">H.P</TableHead>
                      <TableHead className="w-[80px]">M3</TableHead>
                      <TableHead className="w-[100px]">Cant. Viaje</TableHead>
                      <TableHead className="w-[150px] text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataOriginales.map((item) => {
                      const tieneDuplicados = !!duplicadosPorGuia[item.id];
                      const estaExpandida = filasExpandidas.has(item.id);
                      const duplicados = duplicadosPorGuia[item.id]?.duplicados || [];

                      return (
                        <Fragment key={item.id}>
                          {/* Fila principal */}
                          <TableRow
                            className={
                              hasArchivosGenerados(item)
                                ? "bg-green-100 hover:bg-green-200 border-l-4 border-green-500"
                                : hasGuiaEnProceso(item)
                                ? "bg-cyan-100 hover:bg-cyan-200 border-l-4 border-cyan-500"
                                : tieneDuplicados
                                ? "bg-purple-50 border-l-4 border-purple-500"
                                : ""
                            }
                          >
                            <TableCell>
                              {tieneDuplicados && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleFilaExpandida(item.id)}
                                >
                                  {estaExpandida ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{formatDatePeru(item.fecha)}</TableCell>
                            <TableCell className="min-w-24">
                              <div className={
                                (item.unidad?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
                                {item.unidad || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-32">
                              <div className={
                                (item.proveedor?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
                                {item.proveedor || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={
                                (item.apellidos_nombres?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
                                {item.apellidos_nombres || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={
                                (item.proyectos?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }>
                                {item.proyectos ? (
                                  <div className="flex items-center gap-2">
                                    {item.tipo_proyecto === "proyecto" ? (
                                      <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    ) : item.tipo_proyecto === "subproyecto" ? (
                                      <GitBranch className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                    ) : null}
                                    <span>{item.proyectos}</span>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={
                                item.programacion === "AFIRMADO"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                                  : item.programacion === "ELIMINACION"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
                                  : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
                              }>
                                {item.programacion || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm font-medium text-blue-700">
                                {formatTimePeru(item.hora_partida)}
                              </span>
                            </TableCell>
                            <TableCell>{item.m3 || "-"}</TableCell>
                            <TableCell>{item.cantidad_viaje || "-"}</TableCell>
                            <TableCell className="text-center">
                              {hasArchivosGenerados(item) ? (
                                <div className="flex items-center justify-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <a
                                    href={item.enlace_del_pdf || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                    title="Ver PDF"
                                  >
                                    PDF
                                  </a>
                                  <span className="text-slate-300">|</span>
                                  <a
                                    href={item.enlace_del_xml || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                    title="Ver XML"
                                  >
                                    XML
                                  </a>
                                  <span className="text-slate-300">|</span>
                                  <a
                                    href={item.enlace_del_cdr || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                    title="Ver CDR"
                                  >
                                    CDR
                                  </a>
                                </div>
                              ) : hasGuiaEnProceso(item) ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 text-cyan-600 animate-spin" />
                                  <span className="text-xs font-semibold text-cyan-700">En proceso...</span>
                                </div>
                              ) : tieneDuplicados ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                                  {duplicados.length} duplicado{duplicados.length !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleAbrirModalDuplicar(item)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                  disabled={!!(item.enlace_del_pdf || item.enlace_del_xml || item.enlace_del_cdr)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Filas de duplicados (expandibles) */}
                          {tieneDuplicados && estaExpandida && (
                            <TableRow>
                              <TableCell colSpan={12} className="bg-purple-50/50 p-0">
                                <div className="p-4 space-y-3">
                                  {/* Controles de envío */}
                                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-2">
                                      <GitBranch className="h-5 w-5 text-purple-600" />
                                      <span className="font-semibold text-purple-700">
                                        {duplicados.length} duplicado{duplicados.length !== 1 ? 's' : ''} creado{duplicados.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleCancelarDuplicacion(item.id)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                        disabled={isEnviando}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Cancelar
                                      </Button>
                                      <Button
                                        onClick={() => handleEnviarDuplicadosDeGuia(item.id)}
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        disabled={isEnviando}
                                      >
                                        {isEnviando ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Guardando...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Guardar y Procesar
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Barra de progreso */}
                                  {isEnviando && (
                                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                                      <Label className="text-sm font-semibold mb-2 block">
                                        Progreso: {progresoEnvio}%
                                      </Label>
                                      <Progress value={progresoEnvio} className="h-2" />
                                    </div>
                                  )}

                                  {/* Inputs generales para TODOS los duplicados */}
                                  <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
                                    <Label className="text-sm font-bold text-purple-700 mb-3 block">
                                      Valores para todos los duplicados
                                    </Label>

                                    {/* Peso Bruto Total - ÚNICO INPUT EDITABLE */}
                                    <div className="mb-4">
                                      <Label className="text-xs font-semibold text-slate-600">
                                        Peso Bruto Total (TNE)
                                      </Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={duplicados[0]?.peso_bruto_total || ""}
                                        onChange={(e) => {
                                          const valor = e.target.value ? parseFloat(e.target.value) : 0;

                                          // Actualizar peso_bruto_total y también la cantidad en items
                                          setDuplicadosPorGuia(prev => {
                                            const guia = prev[item.id];
                                            if (!guia) return prev;

                                            const nuevosDuplicados = guia.duplicados.map(duplicado => {
                                              // Parsear items existentes o crear uno nuevo
                                              let items = [{ unidad_de_medida: "MTQ", codigo: "", descripcion: "", cantidad: valor }];
                                              try {
                                                const itemsExistentes = JSON.parse(duplicado.items || "[]") as Array<{
                                                  unidad_de_medida: string;
                                                  codigo: string;
                                                  descripcion: string;
                                                  cantidad: number;
                                                }>;
                                                if (itemsExistentes.length > 0) {
                                                  items = itemsExistentes.map((it) => ({
                                                    ...it,
                                                    cantidad: valor
                                                  }));
                                                } else {
                                                  items = [{ unidad_de_medida: "MTQ", codigo: "", descripcion: "", cantidad: valor }];
                                                }
                                              } catch (e) {
                                                console.error("Error parseando items:", e);
                                              }

                                              return {
                                                ...duplicado,
                                                peso_bruto_total: valor,
                                                items: JSON.stringify(items),
                                                _isModified: true
                                              };
                                            });

                                            return {
                                              ...prev,
                                              [item.id]: {
                                                ...guia,
                                                duplicados: nuevosDuplicados
                                              }
                                            };
                                          });
                                        }}
                                        className="mt-1"
                                        placeholder="Ej: 25.5"
                                      />
                                    </div>

                                    {/* Proyecto / Subproyecto Selects */}
                                    <div className="space-y-3 border-t pt-3">
                                      <Label className="text-xs font-bold text-purple-700">
                                        Relacionar con Proyecto
                                      </Label>

                                      <div className="grid grid-cols-1 gap-3">
                                        {/* Proyecto/Subproyecto */}
                                        <div>
                                          <Label className="text-xs font-semibold text-slate-600">
                                            Proyecto / Subproyecto
                                          </Label>
                                          <ProyectoSelect
                                            value={
                                              duplicados[0]?.id_proyecto && duplicados[0]?.id_proyecto > 0
                                                ? `p-${duplicados[0].id_proyecto}`
                                                : duplicados[0]?.id_subproyecto && duplicados[0]?.id_subproyecto > 0
                                                ? `s-${duplicados[0].id_subproyecto}`
                                                : undefined
                                            }
                                            onChange={(id, type) => {
                                              setDuplicadosPorGuia(prev => ({
                                                ...prev,
                                                [item.id]: {
                                                  ...prev[item.id],
                                                  selectionType: type
                                                }
                                              }));

                                              if (type === "proyecto") {
                                                handleProyectoChange(item.id, "id_proyecto", id);
                                                handleProyectoChange(item.id, "id_subproyecto", undefined);
                                                handleProyectoChange(item.id, "id_etapa", undefined);
                                                handleProyectoChange(item.id, "id_sector", undefined);
                                                handleProyectoChange(item.id, "id_frente", undefined);
                                                handleProyectoChange(item.id, "id_partida", undefined);
                                                handleProyectoChange(item.id, "id_subetapa", undefined);
                                                handleProyectoChange(item.id, "id_subsector", undefined);
                                                handleProyectoChange(item.id, "id_subfrente", undefined);
                                                handleProyectoChange(item.id, "id_subpartida", undefined);
                                              } else if (type === "subproyecto") {
                                                handleProyectoChange(item.id, "id_subproyecto", id);
                                                handleProyectoChange(item.id, "id_proyecto", undefined);
                                                handleProyectoChange(item.id, "id_etapa", undefined);
                                                handleProyectoChange(item.id, "id_sector", undefined);
                                                handleProyectoChange(item.id, "id_frente", undefined);
                                                handleProyectoChange(item.id, "id_partida", undefined);
                                                handleProyectoChange(item.id, "id_subetapa", undefined);
                                                handleProyectoChange(item.id, "id_subsector", undefined);
                                                handleProyectoChange(item.id, "id_subfrente", undefined);
                                                handleProyectoChange(item.id, "id_subpartida", undefined);
                                              }
                                            }}
                                            onNameChange={(name) => {
                                              const tipo = duplicadosPorGuia[item.id]?.selectionType;
                                              if (tipo === "proyecto") {
                                                handleNameChange(item.id, "proyecto", name);
                                              } else if (tipo === "subproyecto") {
                                                handleNameChange(item.id, "subproyecto", name);
                                              }
                                            }}
                                          />
                                        </div>

                                        {/* Flujo PROYECTO */}
                                        {duplicados[0]?.id_proyecto && duplicados[0]?.id_proyecto > 0 && (
                                          <>
                                            <div>
                                              <Label className="text-xs font-semibold text-slate-600">Etapa</Label>
                                              <EtapaSelect
                                                idProyecto={duplicados[0].id_proyecto}
                                                value={duplicados[0]?.id_etapa ?? undefined}
                                                onChange={(id) => {
                                                  handleProyectoChange(item.id, "id_etapa", id);
                                                  handleProyectoChange(item.id, "id_sector", undefined);
                                                  handleProyectoChange(item.id, "id_frente", undefined);
                                                  handleProyectoChange(item.id, "id_partida", undefined);
                                                }}
                                                onNameChange={(name) => handleNameChange(item.id, "etapa", name)}
                                              />
                                            </div>

                                            {duplicados[0]?.id_etapa && (
                                              <div>
                                                <Label className="text-xs font-semibold text-slate-600">Sector</Label>
                                                <SectorSelect
                                                  idEtapa={duplicados[0].id_etapa}
                                                  value={duplicados[0]?.id_sector ?? undefined}
                                                  onChange={(id) => {
                                                    handleProyectoChange(item.id, "id_sector", id);
                                                    handleProyectoChange(item.id, "id_frente", undefined);
                                                    handleProyectoChange(item.id, "id_partida", undefined);
                                                  }}
                                                  onNameChange={(name) => handleNameChange(item.id, "sector", name)}
                                                />
                                              </div>
                                            )}

                                            {duplicados[0]?.id_sector && (
                                              <div>
                                                <Label className="text-xs font-semibold text-slate-600">Frente</Label>
                                                <FrenteSelectBySector
                                                  idSector={duplicados[0].id_sector}
                                                  value={duplicados[0]?.id_frente ?? undefined}
                                                  onChange={(id) => {
                                                    handleProyectoChange(item.id, "id_frente", id);
                                                    handleProyectoChange(item.id, "id_partida", undefined);
                                                  }}
                                                  onNameChange={(name) => handleNameChange(item.id, "frente", name)}
                                                />
                                              </div>
                                            )}

                                            {duplicados[0]?.id_frente && (
                                              <div>
                                                <Label className="text-xs font-semibold text-slate-600">Partida</Label>
                                                <PartidaSelect
                                                  idFrente={duplicados[0].id_frente}
                                                  value={duplicados[0]?.id_partida ?? undefined}
                                                  onChange={(id) => {
                                                    handleProyectoChange(item.id, "id_partida", id);
                                                  }}
                                                  onNameChange={(name) => handleNameChange(item.id, "partida", name)}
                                                  onPartidaDataChange={(data) => {
                                                    if (data) {
                                                      // Actualizar código y descripción en TODOS los duplicados
                                                      setDuplicadosPorGuia(prev => {
                                                        const guia = prev[item.id];
                                                        if (!guia) return prev;

                                                        const nuevosDuplicados = guia.duplicados.map(duplicado => ({
                                                          ...duplicado,
                                                          items: JSON.stringify([{
                                                            unidad_de_medida: "MTQ",
                                                            codigo: data.codigo,
                                                            descripcion: data.descripcion,
                                                            cantidad: duplicado.peso_bruto_total || 1
                                                          }]),
                                                          _isModified: true
                                                        }));

                                                        return {
                                                          ...prev,
                                                          [item.id]: {
                                                            ...guia,
                                                            duplicados: nuevosDuplicados
                                                          }
                                                        };
                                                      });
                                                    }
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* Flujo SUBPROYECTO */}
                                        {duplicados[0]?.id_subproyecto && duplicados[0]?.id_subproyecto > 0 && (
                                          <>
                                            <div>
                                              <Label className="text-xs font-semibold text-slate-600">SubEtapa</Label>
                                              <SubEtapaSelect
                                                idSubproyecto={duplicados[0].id_subproyecto}
                                                value={duplicados[0]?.id_subetapa ?? undefined}
                                                onChange={(id) => {
                                                  handleProyectoChange(item.id, "id_subetapa", id);
                                                  handleProyectoChange(item.id, "id_subsector", undefined);
                                                  handleProyectoChange(item.id, "id_subfrente", undefined);
                                                  handleProyectoChange(item.id, "id_subpartida", undefined);
                                                }}
                                                onNameChange={(name) => handleNameChange(item.id, "subetapa", name)}
                                              />
                                            </div>

                                            {duplicados[0]?.id_subetapa && (
                                              <div>
                                                <Label className="text-xs font-semibold text-slate-600">SubSector</Label>
                                                <SubsectorSelect
                                                  idSubEtapa={duplicados[0].id_subetapa}
                                                  value={duplicados[0]?.id_subsector ?? undefined}
                                                  onChange={(id) => {
                                                    handleProyectoChange(item.id, "id_subsector", id);
                                                    handleProyectoChange(item.id, "id_subfrente", undefined);
                                                    handleProyectoChange(item.id, "id_subpartida", undefined);
                                                  }}
                                                  onNameChange={(name) => handleNameChange(item.id, "subsector", name)}
                                                />
                                              </div>
                                            )}

                                            {duplicados[0]?.id_subsector && (
                                              <div>
                                                <Label className="text-xs font-semibold text-slate-600">SubFrente</Label>
                                                <SubfrenteSelect
                                                  idSubsector={duplicados[0].id_subsector}
                                                  value={duplicados[0]?.id_subfrente ?? undefined}
                                                  onChange={(id) => {
                                                    handleProyectoChange(item.id, "id_subfrente", id);
                                                    handleProyectoChange(item.id, "id_subpartida", undefined);
                                                  }}
                                                  onNameChange={(name) => handleNameChange(item.id, "subfrente", name)}
                                                />
                                              </div>
                                            )}

                                            {duplicados[0]?.id_subfrente && (
                                              <div>
                                                <Label className="text-xs font-semibold text-slate-600">SubPartida</Label>
                                                <SubpartidaSelect
                                                  idSubfrente={duplicados[0].id_subfrente}
                                                  value={duplicados[0]?.id_subpartida ?? undefined}
                                                  onChange={(id) => {
                                                    handleProyectoChange(item.id, "id_subpartida", id);
                                                  }}
                                                  onNameChange={(name) => handleNameChange(item.id, "subpartida", name)}
                                                  onSubpartidaDataChange={(data) => {
                                                    if (data) {
                                                      // Actualizar código y descripción en TODOS los duplicados
                                                      setDuplicadosPorGuia(prev => {
                                                        const guia = prev[item.id];
                                                        if (!guia) return prev;

                                                        const nuevosDuplicados = guia.duplicados.map(duplicado => ({
                                                          ...duplicado,
                                                          items: JSON.stringify([{
                                                            unidad_de_medida: "MTQ",
                                                            codigo: data.codigo,
                                                            descripcion: data.descripcion,
                                                            cantidad: duplicado.peso_bruto_total || 1
                                                          }]),
                                                          _isModified: true
                                                        }));

                                                        return {
                                                          ...prev,
                                                          [item.id]: {
                                                            ...guia,
                                                            duplicados: nuevosDuplicados
                                                          }
                                                        };
                                                      });
                                                    }
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <p className="text-xs font-bold text-blue-800 mb-2">
                                        ℹ️ Datos ya copiados del original:
                                      </p>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
                                        <div>✓ Destinatario (empresa)</div>
                                        <div>✓ Vehículo y placa</div>
                                        <div>✓ Conductor y licencia</div>
                                        <div>✓ Puntos de partida/llegada</div>
                                        <div>✓ M3: {item.m3 || '-'}</div>
                                        <div>✓ Hora Partida: {item.hora_partida ? formatTimePeru(item.hora_partida) : '-'}</div>
                                        <div>✓ Proyecto base preseleccionado</div>
                                      </div>
                                      <p className="text-xs text-green-600 font-semibold mt-2">
                                        🔄 Se generará automáticamente:
                                      </p>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700 mt-1">
                                        <div>• Código del producto (de Partida/Subpartida)</div>
                                        <div>• Descripción del producto (de Partida/Subpartida)</div>
                                        <div>• Observaciones (de la cascada de proyecto)</div>
                                        <div>• Cantidad (del Peso Bruto Total)</div>
                                      </div>
                                      <p className="text-xs text-blue-600 font-semibold mt-2">
                                        🚛 Cada duplicado = 1 viaje
                                      </p>
                                    </div>

                                    <p className="text-xs text-purple-600 font-semibold mt-2 text-center">
                                      Solo debes configurar: Peso Bruto Total y cascada de Proyecto (Etapa → Sector → Frente → Partida)
                                    </p>
                                  </div>

                                  {/* Mostrar observaciones generadas automáticamente */}
                                  {duplicados[0]?.observaciones && (
                                    <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                                      <Label className="text-xs font-bold text-green-700 mb-2 block">
                                        Observaciones Generadas (se aplicarán a todos los duplicados)
                                      </Label>
                                      <textarea
                                        value={duplicados[0].observaciones}
                                        readOnly
                                        rows={6}
                                        className="w-full p-2 text-xs bg-green-50 border border-green-200 rounded-md resize-none"
                                      />
                                    </div>
                                  )}

                                  {/* Lista de duplicados agrupados como acordeón */}
                                  <div className="bg-white rounded-lg border border-purple-200">
                                    <details open className="group">
                                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-50 rounded-t-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                          <GitBranch className="h-5 w-5 text-purple-600" />
                                          <Label className="text-sm font-semibold text-slate-700 cursor-pointer">
                                            Duplicados creados ({duplicados.length})
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-purple-600">
                                            {duplicados.filter(d => hasArchivosGenerados(d)).length} completados
                                          </span>
                                          <ChevronDown className="h-5 w-5 text-purple-600 transition-transform group-open:rotate-180" />
                                        </div>
                                      </summary>
                                      <div className="p-4 pt-2 border-t border-purple-100">
                                        <div className="grid grid-cols-10 gap-2">
                                          {duplicados.map((duplicado, index) => {
                                            const tieneArchivos = hasArchivosGenerados(duplicado);
                                            const enProceso = hasGuiaEnProceso(duplicado);

                                            return (
                                              <div
                                                key={duplicado.id || `duplicado-${item.id}-${index}`}
                                                className="relative group"
                                              >
                                                <div
                                                  className={`flex flex-col items-center justify-center w-full h-12 rounded-lg font-bold text-lg border-2 transition-all ${
                                                    tieneArchivos
                                                      ? "bg-green-100 text-green-700 border-green-400 hover:bg-green-200"
                                                      : enProceso
                                                      ? "bg-cyan-100 text-cyan-700 border-cyan-400 hover:bg-cyan-200"
                                                      : "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 hover:border-purple-400"
                                                  }`}
                                                >
                                                  {enProceso ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                  ) : tieneArchivos ? (
                                                    <CheckCircle className="h-4 w-4" />
                                                  ) : (
                                                    <span>{index + 1}</span>
                                                  )}
                                                </div>
                                                {!tieneArchivos && !enProceso && (
                                                  <button
                                                    onClick={() => handleEliminarDuplicado(item.id, index)}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                                                    title="Eliminar duplicado"
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </details>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Duplicación */}
      <Dialog open={isDuplicarModalOpen} onOpenChange={setIsDuplicarModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicar Guía #{guiaSeleccionada?.id}</DialogTitle>
            <DialogDescription>
              Ingrese la cantidad de duplicados a crear (máximo 50)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Unidad:</strong> {guiaSeleccionada?.unidad || "N/A"}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Proveedor:</strong> {guiaSeleccionada?.proveedor || "N/A"}
              </p>
            </div>

            <div>
              <Label htmlFor="cantidad">Cantidad de duplicados</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                max="50"
                value={cantidadDuplicados}
                onChange={(e) => setCantidadDuplicados(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 1, máximo 50 duplicados
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDuplicarModalOpen(false)}
                disabled={isDuplicando}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDuplicarGuia}
                disabled={isDuplicando}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isDuplicando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Duplicando...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
