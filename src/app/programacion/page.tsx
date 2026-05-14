"use client";

import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Trash2, Save, Plus, X, MapPin, Folder, GitBranch, FileText, Download, CheckSquare, Truck, FileDown, Loader2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDatePeru, formatTimePeru } from "@/lib/date-utils";
import {
  programacionApi,
  searchApi,
  type ProgramacionData,
  type ProgramacionTecnicaData,
  camionesApi,
  type CamionData,
  empresasApi,
  type EmpresaData,
  proyectosApi,
  type ProyectoData,
} from "@/lib/connections";
import { RutaDialog } from "@/components/ruta-dialog";
import { CamionSelectDialog } from "@/components/camion-select-dialog";
import { ProyectoSelect } from "@/components/proyecto-select";
import { AddCamionDialog } from "@/components/add-camion-dialog";
import { AddEmpresaDialog } from "@/components/add-empresa-dialog";
import { ubigeosLima } from "@/lib/ubigeos-lima";
import {
  getManualRows,
  saveManualRows,
  updateManualRow as updateManualRowDB,
  deleteManualRow as deleteManualRowDB,
  clearManualRows as clearManualRowsDB,
  migrateFromLocalStorage,
  type ManualRow,
} from "@/lib/indexeddb";

// Opciones para los selects
const PROGRAMACIONES = ["AFIRMADO", "ELIMINACION", "SUB BASE", "1 INTERNOS", "BASE GRANULAR"];
const ESTADOS = ["OK", "EN PROCESO", "NO EJECUTADO"];

export default function ProgramacionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ProgramacionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para entrada manual
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);

  // Estado para camiones
  const [camiones, setCamiones] = useState<CamionData[]>([]);

  // Estado para empresas (proveedores)
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);

  // Estado para proyectos
  const [proyectos, setProyectos] = useState<ProyectoData[]>([]);

  // Estados para la pestaña de Registros
  const [dataTecnica, setDataTecnica] = useState<ProgramacionTecnicaData[]>([]);
  const [isLoadingTecnica, setIsLoadingTecnica] = useState(false);
  const [identificadoresConGuia, setIdentificadoresConGuia] = useState<string[]>([]);

  // Estados para selección de PDFs
  const [selectedPdfs, setSelectedPdfs] = useState<Set<number>>(new Set());

  // Estado para filas con viaje activo (muestra input numero_orden)
  const [viajeActivoRows, setViajeActivoRows] = useState<Set<string>>(new Set());

  // Estado para viaje activo en la pestaña de Registros
  const [viajeActivoRegistros, setViajeActivoRegistros] = useState<Set<number>>(new Set());
  const [numeroOrdenRegistros, setNumeroOrdenRegistros] = useState<Map<number, string>>(new Map());

  const toggleViajeActivoRegistro = (id: number, currentNumeroOrden: string | null) => {
    setViajeActivoRegistros((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Pre-cargar el valor existente si lo hay
        if (currentNumeroOrden) {
          setNumeroOrdenRegistros((m) => new Map(m).set(id, currentNumeroOrden));
        }
      }
      return next;
    });
  };

  const saveNumeroOrdenRegistro = async (id: number) => {
    const numeroOrden = numeroOrdenRegistros.get(id) || null;
    try {
      await programacionApi.updateNumeroOrden(id, numeroOrden);
      setDataTecnica((prev) =>
        prev.map((item) => item.id === id ? { ...item, numero_orden: numeroOrden } : item)
      );
      toast.success("N° Orden guardado");
      setViajeActivoRegistros((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch {
      toast.error("Error al guardar N° Orden");
    }
  };

  const toggleViajeActivo = (rowId: string) => {
    setViajeActivoRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
        // Limpiar numero_orden al desactivar
        updateManualRow(rowId, "numero_orden", "");
      } else {
        next.add(rowId);
      }
      return next;
    });
  };
  const [isCombiningPdfs, setIsCombiningPdfs] = useState(false);

  // Estados para exportar Excel
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportProveedores, setSelectedExportProveedores] = useState<Set<string>>(new Set());
  const [selectedExportUnidades, setSelectedExportUnidades] = useState<Set<string>>(new Set());
  const [exportFechaDesde, setExportFechaDesde] = useState("");
  const [exportFechaHasta, setExportFechaHasta] = useState("");
  const [exportando, setExportando] = useState(false);

  // Estados para búsqueda y paginación de Registros
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Cargar datos de IndexedDB al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Intentar migrar datos de localStorage si existen
        const migratedCount = await migrateFromLocalStorage(
          "programacion_manual_data"
        );
        if (migratedCount > 0) {
          toast.info(
            `Se migraron ${migratedCount} registros de localStorage a IndexedDB`
          );
        }

        // Cargar datos de IndexedDB
        const rows = await getManualRows();
        if (rows.length > 0) {
          setManualRows(rows);
          toast.info(`Se recuperaron ${rows.length} registros guardados`);
        }
      } catch (error) {
        console.error("Error al cargar datos de IndexedDB:", error);
        toast.error("Error al cargar datos guardados");
      }
    };

    loadData();
  }, []);

  // Función para cargar camiones
  const loadCamiones = async () => {
    try {
      const camionesData = await camionesApi.getAll();
      setCamiones(camionesData);
    } catch (error) {
      console.error("Error al cargar camiones:", error);
      toast.error("Error al cargar la lista de camiones");
    }
  };

  // Función para cargar empresas
  const loadEmpresas = async () => {
    try {
      const empresasData = await empresasApi.getAll();
      // Filtrar solo empresas con datos completos
      const empresasCompletas = empresasData.filter(
        (e) => e.nro_documento && e.razon_social && e.direccion
      );
      setEmpresas(empresasCompletas);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      toast.error("Error al cargar la lista de empresas");
    }
  };

  // Cargar camiones al montar el componente
  useEffect(() => {
    loadCamiones();
  }, []);

  // Cargar empresas (proveedores) al montar el componente
  useEffect(() => {
    loadEmpresas();
  }, []);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    const loadProyectos = async () => {
      try {
        const proyectosData = await proyectosApi.getAll();
        setProyectos(proyectosData);
      } catch (error) {
        console.error("Error al cargar proyectos:", error);
        toast.error("Error al cargar la lista de proyectos");
      }
    };

    loadProyectos();
  }, []);

  // Fetch con búsqueda y paginación (debounce 400ms en búsqueda, inmediato en cambio de página)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDataTecnica(searchTerm, currentPage);
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, currentPage]);

  // Polling ligero: actualizar registros de la página actual que recibieron guía
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const registrosRecientes = await programacionApi.getRecienCompletados(15);
        if (registrosRecientes.length > 0) {
          setDataTecnica((prevData) => {
            const registrosMap = new Map(registrosRecientes.map((reg) => [reg.id, reg]));
            return prevData.map((item) => registrosMap.get(item.id) ?? item);
          });
          const nuevosIds = registrosRecientes
            .map((reg) => reg.identificador_unico)
            .filter((id): id is string => id !== null);
          setIdentificadoresConGuia((prev) => Array.from(new Set([...prev, ...nuevosIds])));
          toast.success(
            `${registrosRecientes.length} guía${registrosRecientes.length > 1 ? 's' : ''} procesada${registrosRecientes.length > 1 ? 's' : ''}`
          );
        }
      } catch (error) {
        console.error("Error en polling:", error);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Guardar en IndexedDB cada vez que cambien las filas manuales
  useEffect(() => {
    const saveData = async () => {
      if (manualRows.length > 0) {
        try {
          await saveManualRows(manualRows);
        } catch (error) {
          console.error("Error al guardar en IndexedDB:", error);
        }
      }
    };

    saveData();
  }, [manualRows]);

  // Funciones para entrada manual
  const addManualRow = () => {
    const besco = empresas.find((e) => e.nro_documento === "20416162299");
    const newRow: ManualRow = {
      id: Date.now().toString(),
      fecha: new Date().toISOString().split("T")[0],
      unidad: "",
      unidad_id: 0,
      proveedor: besco?.razon_social || "",
      proveedor_id: besco?.codigo || "",
      apellidos_nombres: "",
      programacion: "",
      hora_partida: "08:00",
      estado_programacion: "",
      comentarios: "",
      punto_partida_ubigeo: "",
      punto_partida_direccion: "",
      punto_llegada_ubigeo: "",
      punto_llegada_direccion: "",
      peso: "",
      proyecto: "",
      proyecto_id: 0,
      subproyecto_id: 0,
      numero_orden: "",
      origen: besco?.razon_social || "",
    };
    setManualRows([newRow, ...manualRows]);
  };

  const removeManualRow = (id: string) => {
    setManualRows(manualRows.filter((row) => row.id !== id));
  };

  // Función helper para capitalizar texto
  const capitalizeText = (text: string) => {
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Función específica para manejar la selección de camión desde el diálogo
  const handleCamionSelect = (id: string, camion: CamionData) => {
    console.log("Camión seleccionado:", camion); // Debug log

    const nombreCompleto =
      camion.nombre_chofer && camion.apellido_chofer
        ? `${capitalizeText(camion.nombre_chofer)} ${capitalizeText(
            camion.apellido_chofer
          )}`
        : "";
    const capacidadTanque = camion.capacidad_tanque
      ? camion.capacidad_tanque.toString()
      : "";

    // Actualizar múltiples campos a la vez
    setManualRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === id) {
          const updatedRow = {
            ...row,
            unidad: camion.placa,
            unidad_id: camion.id_camion,
            apellidos_nombres: nombreCompleto,
            peso: capacidadTanque,
            origen: camion.razon_social_empresa || "",
            // Autocompletar proveedor si el camión tiene empresa asignada
            proveedor: camion.razon_social_empresa || row.proveedor,
            proveedor_id: camion.empresa || row.proveedor_id,
          };

          console.log("Fila actualizada:", updatedRow); // Debug log

          return updatedRow;
        }
        return row;
      })
    );
  };

  const updateManualRow = (
    id: string,
    field: keyof ManualRow,
    value: string | number
  ) => {
    // Si el campo es 'unidad', buscar el camión y autocompletar apellidos_nombres y peso
    if (field === "unidad") {
      const camionSeleccionado = camiones.find((c) => c.placa === value);
      if (camionSeleccionado) {
        handleCamionSelect(id, camionSeleccionado);
        return;
      }
    }

    // Si el campo es 'proveedor', buscar la empresa y guardar su código
    if (field === "proveedor") {
      const empresaSeleccionada = empresas.find(
        (e) => e.razon_social === value
      );
      if (empresaSeleccionada) {
        setManualRows((prevRows) =>
          prevRows.map((row) =>
            row.id === id
              ? {
                  ...row,
                  proveedor: value as string,
                  proveedor_id: empresaSeleccionada.codigo,
                }
              : row
          )
        );
        return;
      }
    }

    setManualRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Función para actualizar múltiples campos a la vez
  const updateManualRowMultiple = (id: string, updates: Partial<ManualRow>) => {
    setManualRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, ...updates } : row))
    );
  };

  // Función para manejar cambio de proyecto/subproyecto
  const handleProyectoChange = (
    rowId: string,
    id: number | undefined,
    type: "proyecto" | "subproyecto",
    nombre: string
  ) => {
    setManualRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          if (type === "proyecto") {
            return {
              ...row,
              proyecto: nombre,
              proyecto_id: id || 0,
              subproyecto_id: 0, // Limpiar subproyecto
            };
          } else {
            return {
              ...row,
              proyecto: nombre,
              proyecto_id: 0, // Limpiar proyecto
              subproyecto_id: id || 0,
            };
          }
        }
        return row;
      })
    );
  };

  const clearManualData = async () => {
    try {
      await clearManualRowsDB();
      setManualRows([]);
      toast.success("Datos limpiados exitosamente");
    } catch (error) {
      console.error("Error al limpiar datos:", error);
      toast.error("Error al limpiar datos");
    }
  };

  // Función para verificar si una fila está completa
  const isRowComplete = (row: ManualRow) => {
    // Validar formato de hora
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    const horaValida = row.hora_partida && horaRegex.test(row.hora_partida);

    const basicFieldsComplete =
      row.fecha &&
      row.unidad &&
      row.unidad_id > 0 &&
      row.proveedor &&
      row.proveedor_id &&
      row.programacion &&
      horaValida &&
      row.estado_programacion &&
      row.punto_partida_ubigeo &&
      row.punto_partida_direccion &&
      row.punto_llegada_ubigeo &&
      row.punto_llegada_direccion;

    // Debe tener proyecto O subproyecto (al menos uno)
    const hasProyecto = row.proyecto && (row.proyecto_id > 0 || row.subproyecto_id > 0);

    return basicFieldsComplete && hasProyecto;
  };

  const handleSaveManualData = async () => {
    if (manualRows.length === 0) {
      toast.error("No hay datos para guardar");
      return;
    }

    // Validar que todos los campos obligatorios estén llenos
    const invalidRows = manualRows.filter((row) => !isRowComplete(row));

    if (invalidRows.length > 0) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);
    try {
      // Convertir ManualRow a ProgramacionData con IDs
      const dataToSend = manualRows.map((row) => {
        // Formatear hora_partida para asegurar formato HH:MM:SS
        let horaFormateada = row.hora_partida || "08:00";

        // Si la hora no está vacía y no incluye segundos, agregar :00
        if (horaFormateada && !horaFormateada.includes(":00:") && horaFormateada.split(":").length === 2) {
          horaFormateada = `${horaFormateada}:00`;
        }

        // Validar formato HH:MM o HH:MM:SS
        const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!horaRegex.test(horaFormateada)) {
          console.warn(`Hora inválida en fila: ${horaFormateada}, usando valor por defecto 08:00:00`);
          horaFormateada = "08:00:00";
        }

        return {
          fecha: row.fecha, // Enviar como string para evitar conversión de zona horaria
          unidad: row.unidad_id,
          proveedor: row.proveedor_id,
          programacion: row.programacion,
          hora_partida: horaFormateada,
          estado_programacion: row.estado_programacion,
          comentarios: row.comentarios,
          punto_partida_ubigeo: row.punto_partida_ubigeo,
          punto_partida_direccion: row.punto_partida_direccion,
          punto_llegada_ubigeo: row.punto_llegada_ubigeo,
          punto_llegada_direccion: row.punto_llegada_direccion,
          peso: row.peso,
          id_proyecto: row.proyecto_id > 0 ? row.proyecto_id : undefined,
          id_subproyecto: row.subproyecto_id > 0 ? row.subproyecto_id : undefined,
          numero_orden: row.numero_orden || undefined,
        };
      });

      const result = await programacionApi.createBatch(dataToSend);

      toast.success(
        `${result.successCount} registros guardados exitosamente en ${result.processingTime}ms`
      );

      // Limpiar datos después de enviar exitosamente
      clearManualData();

      // Actualizar la pestaña de Registros con los nuevos datos
      await fetchDataTecnica(searchTerm, currentPage);

      toast.success("¡Información subida exitosamente!");
    } catch (error) {
      toast.error("Error al guardar los datos");
      console.error("Error saving manual data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para guardar un registro individual
  const handleSaveIndividualRow = async (rowId: string) => {
    const row = manualRows.find((r) => r.id === rowId);

    if (!row) {
      toast.error("Registro no encontrado");
      return;
    }

    if (!isRowComplete(row)) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);
    try {
      // Formatear hora_partida para asegurar formato HH:MM:SS
      let horaFormateada = row.hora_partida || "08:00";

      // Si la hora no está vacía y no incluye segundos, agregar :00
      if (horaFormateada && !horaFormateada.includes(":00:") && horaFormateada.split(":").length === 2) {
        horaFormateada = `${horaFormateada}:00`;
      }

      // Validar formato HH:MM o HH:MM:SS
      const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!horaRegex.test(horaFormateada)) {
        console.warn(`Hora inválida en fila: ${horaFormateada}, usando valor por defecto 08:00:00`);
        horaFormateada = "08:00:00";
      }

      const dataToSend = [{
        fecha: row.fecha, // Enviar como string para evitar conversión de zona horaria
        unidad: row.unidad_id,
        proveedor: row.proveedor_id,
        programacion: row.programacion,
        hora_partida: horaFormateada,
        estado_programacion: row.estado_programacion,
        comentarios: row.comentarios,
        punto_partida_ubigeo: row.punto_partida_ubigeo,
        punto_partida_direccion: row.punto_partida_direccion,
        punto_llegada_ubigeo: row.punto_llegada_ubigeo,
        punto_llegada_direccion: row.punto_llegada_direccion,
        peso: row.peso,
        id_proyecto: row.proyecto_id > 0 ? row.proyecto_id : undefined,
        id_subproyecto: row.subproyecto_id > 0 ? row.subproyecto_id : undefined,
        numero_orden: row.numero_orden || undefined,
      }];

      const result = await programacionApi.createBatch(dataToSend);

      toast.success("Registro guardado exitosamente");

      // Eliminar solo este registro de la lista
      await deleteManualRowDB(rowId);
      setManualRows(manualRows.filter((r) => r.id !== rowId));

      // Actualizar la pestaña de Registros con los nuevos datos
      await fetchDataTecnica(searchTerm, currentPage);

    } catch (error) {
      toast.error("Error al guardar el registro");
      console.error("Error saving individual row:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(xlsx|xls)$/i)
      ) {
        toast.error(
          "Por favor selecciona un archivo Excel válido (.xlsx o .xls)"
        );
        return;
      }

      // Validar tamaño del archivo (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 10MB permitido.");
        return;
      }

      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  const processExcelFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Procesar datos (saltando la primera fila de headers)
        const processedData: ProgramacionData[] = (jsonData as unknown[][])
          .slice(1)
          .filter((row: unknown[]) => row.length > 0 && row[0])
          .map((row: unknown[], index: number) => {
            try {
              // Procesar fecha - convertir a Date object
              let fechaProcessed: Date = new Date();
              if (row[0]) {
                if (typeof row[0] === "number") {
                  // Convertir fecha de Excel a Date
                  fechaProcessed = new Date((row[0] - 25569) * 86400 * 1000);
                } else {
                  // Intentar parsear string como fecha
                  const dateStr = String(row[0]);
                  const parsedDate = new Date(dateStr);
                  fechaProcessed = isNaN(parsedDate.getTime())
                    ? new Date()
                    : parsedDate;
                }
              }

              // Procesar hora_partida - convertir a formato TIME
              let horaPartidaProcessed = "00:00:00";
              if (row[6]) {
                if (typeof row[6] === "number") {
                  // Convertir decimal a tiempo (0.33333 = 8 horas)
                  const totalHours = Math.round(row[6] * 24);
                  const hours = String(totalHours).padStart(2, "0");
                  horaPartidaProcessed = `${hours}:00:00`;
                } else {
                  const timeStr = String(row[6]);
                  // Si no tiene segundos, agregarlos
                  horaPartidaProcessed = timeStr.includes(":")
                    ? timeStr.split(":").length === 2
                      ? `${timeStr}:00`
                      : timeStr
                    : `${timeStr}:00:00`;
                }
              }

              return {
                fecha: fechaProcessed,
                unidad: 0, // Necesita ser configurado manualmente o mapeado desde una tabla de camiones
                proveedor: String(row[2] || ""),
                programacion: String(row[5] || ""),
                hora_partida: horaPartidaProcessed,
                estado_programacion: String(row[7] || "")
                  .trim()
                  .toUpperCase(),
                comentarios: String(row[8] || ""),
                punto_partida_ubigeo: "",
                punto_partida_direccion: "",
                punto_llegada_ubigeo: "",
                punto_llegada_direccion: "",
                peso: "",
              };
            } catch (error) {
              console.warn(`Error procesando fila ${index + 2}:`, error);
              let horaPartidaFallback = "00:00:00";
              if (row[6]) {
                if (typeof row[6] === "number") {
                  const totalHours = Math.round(row[6] * 24);
                  const hours = String(totalHours).padStart(2, "0");
                  horaPartidaFallback = `${hours}:00:00`;
                } else {
                  const timeStr = String(row[6]);
                  horaPartidaFallback = timeStr.includes(":")
                    ? timeStr.split(":").length === 2
                      ? `${timeStr}:00`
                      : timeStr
                    : `${timeStr}:00:00`;
                }
              }

              return {
                fecha: row[0]
                  ? new Date(row[0] as string | number | Date)
                  : new Date(),
                unidad: 0, // Necesita ser configurado manualmente o mapeado desde una tabla de camiones
                proveedor: String(row[2] || ""),
                programacion: String(row[5] || ""),
                hora_partida: horaPartidaFallback,
                estado_programacion: String(row[7] || "")
                  .trim()
                  .toUpperCase(),
                comentarios: String(row[8] || ""),
                punto_partida_ubigeo: "",
                punto_partida_direccion: "",
                punto_llegada_ubigeo: "",
                punto_llegada_direccion: "",
                peso: "",
              };
            }
          });

        setData(processedData);
        toast.success(`Se procesaron ${processedData.length} registros`);
      } catch (error) {
        toast.error("Error al procesar el archivo Excel");
        console.error("Error processing Excel file:", error);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDiscard = () => {
    setFile(null);
    setData([]);
    const fileInput = document.getElementById("excel-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    toast.info("Datos descartados");
  };

  const handleSave = async () => {
    if (data.length === 0) {
      toast.error("No hay datos para guardar");
      return;
    }

    setIsLoading(true);
    try {
      // Log de la información que se enviaría al backend
      // console.log('Datos a enviar al backend:', {
      //   totalRecords: data.length,
      //   data: data,
      //   timestamp: new Date().toISOString()
      // });

      // Llamada a la API usando la función de connections.ts
      const result = await programacionApi.createBatch(data);

      toast.success(
        `${result.successCount} registros guardados exitosamente en ${result.processingTime}ms`
      );

      handleDiscard();

      // Actualizar la pestaña de Registros con los nuevos datos
      await fetchDataTecnica(searchTerm, currentPage);

      toast.success("¡Información subida exitosamente!");
    } catch (error) {
      toast.error("Error al guardar los datos");
      console.error("Error saving data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para la pestaña de Registros
  const fetchDataTecnica = async (q: string = "", page: number = 1) => {
    setIsLoadingTecnica(true);
    try {
      const [result, idsConGuia] = await Promise.all([
        searchApi.programacionTecnica(q, page, PAGE_SIZE),
        programacionApi.getIdentificadoresConGuia(),
      ]);
      const seen = new Set<number>();
      const deduped = result.data.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      setDataTecnica(deduped);
      setTotalItems(result.total);
      setIdentificadoresConGuia(idsConGuia);
    } catch (error) {
      toast.error("Error al cargar los datos técnicos");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingTecnica(false);
    }
  };

  // Función para verificar si tiene los archivos generados
  const hasArchivosGenerados = (item: ProgramacionTecnicaData): boolean => {
    return !!(
      item.enlace_del_pdf &&
      item.enlace_del_xml &&
      item.enlace_del_cdr
    );
  };

  // Función para verificar si tiene guía generada (en proceso)
  const hasGuiaEnProceso = (item: ProgramacionTecnicaData): boolean => {
    return !!(
      item.identificador_unico &&
      identificadoresConGuia.includes(item.identificador_unico)
    );
  };

  // Funciones para manejo de selección de PDFs
  const handleSelectPdf = (id: number, hasEnlace: boolean) => {
    if (!hasEnlace) return;

    setSelectedPdfs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllPdfs = () => {
    const registrosConPdf = dataTecnica.filter((item) => item.enlace_del_pdf);

    if (selectedPdfs.size === registrosConPdf.length) {
      // Deseleccionar todos
      setSelectedPdfs(new Set());
    } else {
      // Seleccionar todos los que tienen PDF
      setSelectedPdfs(new Set(registrosConPdf.map((item) => item.id)));
    }
  };

  // Función para combinar PDFs
  const handleCombinePdfs = async () => {
    if (selectedPdfs.size === 0) {
      toast.error("No hay PDFs seleccionados");
      return;
    }

    setIsCombiningPdfs(true);
    try {
      // Filtrar registros seleccionados y ordenarlos
      const registrosSeleccionados = dataTecnica
        .filter((item) => selectedPdfs.has(item.id) && item.enlace_del_pdf)
        .sort((a, b) => a.id - b.id);

      if (registrosSeleccionados.length === 0) {
        toast.error("No hay PDFs válidos para combinar");
        return;
      }

      toast.info(`Procesando ${registrosSeleccionados.length} PDFs...`);

      // Extraer las URLs de los PDFs seleccionados
      const urls = registrosSeleccionados.map((registro) => registro.enlace_del_pdf!);

      // Llamar al backend para combinar los PDFs
      const blob = await programacionApi.combinarPdfs(urls);

      // Descargar el PDF combinado
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `programacion_combinado_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${registrosSeleccionados.length} PDFs combinados exitosamente`);

      // Limpiar selección
      setSelectedPdfs(new Set());

    } catch (error) {
      console.error("Error al combinar PDFs:", error);
      toast.error("Error al combinar los PDFs");
    } finally {
      setIsCombiningPdfs(false);
    }
  };

  const uniqueExportProveedores = useMemo(() =>
    empresas.map(e => e.razon_social || '').filter(Boolean).sort()
  , [empresas]);

  const uniqueExportUnidades = useMemo(() =>
    camiones.map(c => c.placa || '').filter(Boolean).sort()
  , [camiones]);

  const handleAbrirExportModal = () => {
    setSelectedExportProveedores(new Set(uniqueExportProveedores));
    setSelectedExportUnidades(new Set(uniqueExportUnidades));
    setExportFechaDesde("");
    setExportFechaHasta("");
    setExportModalOpen(true);
  };

  const handleExportExcel = async () => {
    setExportando(true);
    try {
      const filtros = {
        proveedores: selectedExportProveedores.size === uniqueExportProveedores.length
          ? undefined
          : Array.from(selectedExportProveedores),
        unidades: selectedExportUnidades.size === uniqueExportUnidades.length
          ? undefined
          : Array.from(selectedExportUnidades),
        fechaDesde: exportFechaDesde || undefined,
        fechaHasta: exportFechaHasta || undefined,
      };

      const buffer = await programacionApi.exportarExcel(filtros);

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `programacion_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Excel exportado exitosamente");
      setExportModalOpen(false);
    } catch {
      toast.error("Error al exportar el archivo Excel");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-orange-600 text-white">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-700">
                  Programación
                </h1>
                <p className="text-sm text-slate-600">
                  Importar o ingresar datos de programación
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AddEmpresaDialog
                onEmpresaAdded={loadEmpresas}
                buttonText="Agregar Empresa"
              />
              <AddCamionDialog
                empresas={empresas}
                onCamionAdded={loadCamiones}
                buttonText="Agregar Unidad"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="mx-auto px-4 sm:px-6 pb-8 space-y-6">
        <Tabs defaultValue="manual" className="w-full">
          <div className="max-w-7xl mx-auto">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
              <TabsTrigger value="registros">Registros</TabsTrigger>
            </TabsList>
          </div>

          {/* Pestaña de Entrada Manual */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>
                <div className="flex flex-col gap-1">
                  <span>Entrada Manual de Datos</span>
                  {manualRows.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {manualRows.filter(isRowComplete).length} de{" "}
                      {manualRows.length} filas completas
                    </span>
                  )}
                </div>
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={addManualRow} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fila
                </Button>
                {manualRows.length > 0 && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={clearManualData}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar Todo
                    </Button>
                    <Button
                      onClick={handleSaveManualData}
                      disabled={isLoading || !manualRows.every(isRowComplete)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar en BD
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {manualRows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>
                    No hay registros. Haz clic en &quot;Agregar Fila&quot; para
                    comenzar.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[130px]">Acciones</TableHead>
                        <TableHead className="w-[180px]">Fecha</TableHead>
                        <TableHead className="w-[100px]">Unidad</TableHead>
                        <TableHead className="w-[220px]">Origen</TableHead>
                        <TableHead className="w-[280px]">Proveedor</TableHead>
                        <TableHead className="w-[220px]">
                          Apellidos y Nombres
                        </TableHead>
                        <TableHead className="w-[200px]">Proyecto</TableHead>
                        <TableHead className="w-[160px]">
                          Programación
                        </TableHead>
                        <TableHead className="w-[120px]">H.P</TableHead>
                        <TableHead className="w-[160px]">Estado</TableHead>
                        <TableHead className="w-[200px]">
                          Ruta
                        </TableHead>
                        <TableHead className="min-w-[200px]">
                          Comentario
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className={
                            isRowComplete(row)
                              ? "bg-green-200 hover:bg-green-300"
                              : ""
                          }
                        >
                          <TableCell className="p-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveIndividualRow(row.id)}
                                  disabled={isLoading || !isRowComplete(row)}
                                  className="h-9 w-9 p-0"
                                  title="Guardar este registro"
                                >
                                  <CheckSquare className={`h-4 w-4 ${isRowComplete(row) ? 'text-green-600' : 'text-gray-400'}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeManualRow(row.id)}
                                  disabled={isLoading}
                                  className="h-9 w-9 p-0"
                                  title="Eliminar fila"
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleViajeActivo(row.id)}
                                  disabled={isLoading}
                                  className={`h-9 w-9 p-0 ${viajeActivoRows.has(row.id) ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}
                                  title="Activar viaje"
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                              </div>
                              {viajeActivoRows.has(row.id) && (
                                <Input
                                  placeholder="N° Orden"
                                  value={row.numero_orden || ""}
                                  onChange={(e) => updateManualRow(row.id, "numero_orden", e.target.value)}
                                  className="h-7 text-xs w-28"
                                  disabled={isLoading}
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="date"
                              value={row.fecha}
                              onChange={(e) =>
                                updateManualRow(row.id, "fecha", e.target.value)
                              }
                              disabled={isLoading}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <CamionSelectDialog
                              camiones={camiones}
                              onSelect={(camion) =>
                                handleCamionSelect(row.id, camion)
                              }
                              currentPlaca={row.unidad}
                              buttonText=""
                              empresas={empresas}
                              onCamionUpdated={loadCamiones}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="text"
                              value={row.origen || ""}
                              placeholder="Auto desde unidad..."
                              readOnly
                              className="bg-slate-50 cursor-not-allowed text-slate-600 text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={row.proveedor}
                              onValueChange={(value) =>
                                updateManualRow(row.id, "proveedor", value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {empresas.map((empresa) => (
                                  <SelectItem
                                    key={empresa.codigo}
                                    value={empresa.razon_social || ""}
                                  >
                                    {`(${empresa.nro_documento}) - ${empresa.razon_social}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="text"
                              value={row.apellidos_nombres}
                              placeholder="Apellidos y Nombres..."
                              readOnly
                              className="bg-gray-50 cursor-not-allowed"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <ProyectoSelect
                              value={
                                row.proyecto_id > 0
                                  ? `p-${row.proyecto_id}`
                                  : row.subproyecto_id > 0
                                  ? `s-${row.subproyecto_id}`
                                  : undefined
                              }
                              onChange={(id, type) => {
                                handleProyectoChange(row.id, id, type, "");
                              }}
                              onNameChange={(nombre) => {
                                setManualRows((prevRows) =>
                                  prevRows.map((r) =>
                                    r.id === row.id ? { ...r, proyecto: nombre } : r
                                  )
                                );
                              }}
                              placeholder="Seleccionar..."
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={row.programacion}
                              onValueChange={(value) =>
                                updateManualRow(row.id, "programacion", value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {PROGRAMACIONES.map((prog) => (
                                  <SelectItem key={prog} value={prog}>
                                    {prog}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="time"
                              value={row.hora_partida}
                              onChange={(e) =>
                                updateManualRow(
                                  row.id,
                                  "hora_partida",
                                  e.target.value
                                )
                              }
                              disabled={isLoading}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={row.estado_programacion}
                              onValueChange={(value) =>
                                updateManualRow(
                                  row.id,
                                  "estado_programacion",
                                  value
                                )
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ESTADOS.map((estado) => (
                                  <SelectItem key={estado} value={estado}>
                                    {estado}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <RutaDialog
                              buttonText={
                                row.punto_partida_ubigeo &&
                                row.punto_llegada_ubigeo
                                  ? "Editar Ruta"
                                  : "Configurar Ruta"
                              }
                              currentPartidaUbigeo={row.punto_partida_ubigeo}
                              currentPartidaDireccion={
                                row.punto_partida_direccion
                              }
                              currentLlegadaUbigeo={row.punto_llegada_ubigeo}
                              currentLlegadaDireccion={
                                row.punto_llegada_direccion
                              }
                              onAccept={(
                                partidaUbigeo,
                                partidaDireccion,
                                llegadaUbigeo,
                                llegadaDireccion
                              ) => {
                                updateManualRowMultiple(row.id, {
                                  punto_partida_ubigeo: partidaUbigeo,
                                  punto_partida_direccion: partidaDireccion,
                                  punto_llegada_ubigeo: llegadaUbigeo,
                                  punto_llegada_direccion: llegadaDireccion,
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="text"
                              value={row.comentarios}
                              onChange={(e) =>
                                updateManualRow(
                                  row.id,
                                  "comentarios",
                                  e.target.value
                                )
                              }
                              placeholder="Comentarios..."
                              disabled={isLoading}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </TabsContent>

        {/* Pestaña de Registros */}
        <TabsContent value="registros" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <span>Registros de Programación</span>
                {totalItems > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {totalItems} total
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por proveedor, conductor, proyecto..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-10 bg-white w-72"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleAbrirExportModal}
                  className="bg-white hover:bg-green-50 text-green-700 border-green-300"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
                {selectedPdfs.size > 0 && (
                  <Button
                    onClick={handleCombinePdfs}
                    disabled={isCombiningPdfs}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Combinar {selectedPdfs.size} PDF{selectedPdfs.size > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTecnica ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : dataTecnica.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron registros con ese criterio" : "No hay registros disponibles"}
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              dataTecnica.filter((item) => item.enlace_del_pdf).length > 0 &&
                              selectedPdfs.size === dataTecnica.filter((item) => item.enlace_del_pdf).length
                            }
                            onCheckedChange={handleSelectAllPdfs}
                            disabled={dataTecnica.filter((item) => item.enlace_del_pdf).length === 0}
                          />
                        </TableHead>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead className="w-[100px]">Fecha</TableHead>
                        <TableHead className="min-w-[120px]">Unidad</TableHead>
                        <TableHead className="min-w-[150px]">Origen</TableHead>
                        <TableHead className="min-w-[180px]">
                          Apellidos y Nombres
                        </TableHead>
                        <TableHead className="min-w-[150px]">Proyectos</TableHead>
                        <TableHead className="w-[120px]">Programación</TableHead>
                        <TableHead className="w-[80px]">H.P</TableHead>
                        <TableHead className="w-[120px]">Estado</TableHead>
                        <TableHead className="w-[80px]">M3</TableHead>
                        <TableHead className="w-[100px]">Cant. Viaje</TableHead>
                        <TableHead className="w-[100px] text-center">
                          Archivo
                        </TableHead>
                        <TableHead className="w-[130px] text-center">
                          Viaje
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataTecnica.map((item) => (
                        <TableRow
                          key={item.id}
                          className={
                            hasArchivosGenerados(item)
                              ? "bg-green-100 hover:bg-green-200 border-l-4 border-green-500"
                              : hasGuiaEnProceso(item)
                              ? "bg-cyan-100 hover:bg-cyan-200 border-l-4 border-cyan-500"
                              : ""
                          }
                        >
                          <TableCell>
                            <div className={!item.enlace_del_pdf ? "opacity-30 cursor-not-allowed" : ""}>
                              <Checkbox
                                checked={selectedPdfs.has(item.id)}
                                onCheckedChange={() => handleSelectPdf(item.id, !!item.enlace_del_pdf)}
                                disabled={!item.enlace_del_pdf}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>
                            {formatDatePeru(item.fecha)}
                          </TableCell>
                          <TableCell className="min-w-24">
                            <div
                              className={
                                (item.unidad?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }
                            >
                              {item.unidad || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-32">
                            <div
                              className={
                                (item.proveedor?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }
                            >
                              {item.proveedor || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={
                                (item.apellidos_nombres?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }
                            >
                              {item.apellidos_nombres || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={
                                (item.proyectos?.length || 0) > 30
                                  ? "whitespace-normal break-words"
                                  : "whitespace-nowrap"
                              }
                            >
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
                            <span
                              className={
                                item.programacion === "AFIRMADO"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                                  : item.programacion === "ELIMINACION"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
                                  : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
                              }
                            >
                              {item.programacion || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm font-medium text-blue-700">
                              {formatTimePeru(item.hora_partida)}
                            </span>
                          </TableCell>
                          <TableCell className="min-w-32">
                            <span
                              className={
                                item.estado_programacion === "OK"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm whitespace-nowrap"
                                  : item.estado_programacion === "NO EJECUTADO"
                                  ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm whitespace-nowrap"
                                  : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-sm whitespace-nowrap"
                              }
                            >
                              {item.estado_programacion || "-"}
                            </span>
                          </TableCell>
                          <TableCell>{item.m3 || "-"}</TableCell>
                          <TableCell>{item.cantidad_viaje || "-"}</TableCell>
                          <TableCell className="text-center">
                            {item.enlace_del_pdf ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(item.enlace_del_pdf!, "_blank")
                                }
                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 px-2 py-1 h-7 text-xs"
                              >
                                PDF
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleViajeActivoRegistro(item.id, item.numero_orden ?? null)}
                                className={`h-7 w-7 p-0 ${viajeActivoRegistros.has(item.id) ? 'text-orange-600 bg-orange-50' : item.numero_orden ? 'text-orange-400' : 'text-gray-400'}`}
                                title={item.numero_orden ? `N° Orden: ${item.numero_orden}` : "Activar viaje"}
                              >
                                <Truck className="h-4 w-4" />
                              </Button>
                              {viajeActivoRegistros.has(item.id) && (
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="N° Orden"
                                    value={numeroOrdenRegistros.get(item.id) ?? item.numero_orden ?? ""}
                                    onChange={(e) => setNumeroOrdenRegistros((m) => new Map(m).set(item.id, e.target.value))}
                                    className="h-6 text-xs w-20 px-1"
                                  />
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                                    onClick={() => saveNumeroOrdenRegistro(item.id)}
                                  >
                                    OK
                                  </Button>
                                </div>
                              )}
                              {!viajeActivoRegistros.has(item.id) && item.numero_orden && (
                                <span className="text-xs text-orange-600 font-mono">{item.numero_orden}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isLoadingTecnica}
                  >
                    ← Anterior
                  </Button>
                  <span className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || isLoadingTecnica}
                  >
                    Siguiente →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Exportar a Excel */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-green-600" />
              Exportar Registros a Excel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Filtro por Proveedor */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Proveedor</p>
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedExportProveedores(new Set(uniqueExportProveedores))}>Todas</Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedExportProveedores(new Set())}>Ninguna</Button>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto border rounded-md p-3 bg-slate-50">
                {uniqueExportProveedores.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-1">Sin datos cargados</p>
                ) : (
                  uniqueExportProveedores.map(p => (
                    <div key={p} className="flex items-center gap-2">
                      <Checkbox
                        id={`exp-prov-${p}`}
                        checked={selectedExportProveedores.has(p)}
                        onCheckedChange={(checked) => {
                          setSelectedExportProveedores(prev => {
                            const next = new Set(prev);
                            if (checked) next.add(p); else next.delete(p);
                            return next;
                          });
                        }}
                      />
                      <label htmlFor={`exp-prov-${p}`} className="text-sm cursor-pointer flex-1 leading-tight">{p}</label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Filtro por Unidad */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Unidad (Placa)</p>
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedExportUnidades(new Set(uniqueExportUnidades))}>Todas</Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedExportUnidades(new Set())}>Ninguna</Button>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto border rounded-md p-3 bg-slate-50">
                {uniqueExportUnidades.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-1">Sin datos cargados</p>
                ) : (
                  uniqueExportUnidades.map(u => (
                    <div key={u} className="flex items-center gap-2">
                      <Checkbox
                        id={`exp-uni-${u}`}
                        checked={selectedExportUnidades.has(u)}
                        onCheckedChange={(checked) => {
                          setSelectedExportUnidades(prev => {
                            const next = new Set(prev);
                            if (checked) next.add(u); else next.delete(u);
                            return next;
                          });
                        }}
                      />
                      <label htmlFor={`exp-uni-${u}`} className="text-sm cursor-pointer flex-1 leading-tight">{u}</label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Filtro por Fecha */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Rango de Fechas</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Desde</Label>
                  <Input
                    type="date"
                    value={exportFechaDesde}
                    onChange={(e) => setExportFechaDesde(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Hasta</Label>
                  <Input
                    type="date"
                    value={exportFechaHasta}
                    onChange={(e) => setExportFechaHasta(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {selectedExportProveedores.size === 0 && selectedExportUnidades.size === 0
                ? "⚠️ Selecciona al menos un proveedor o unidad"
                : `${selectedExportProveedores.size} proveedor(es) · ${selectedExportUnidades.size} unidad(es)${exportFechaDesde || exportFechaHasta ? ` · Fecha filtrada` : ''}`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModalOpen(false)} disabled={exportando}>
              Cancelar
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={exportando || (selectedExportProveedores.size === 0 && selectedExportUnidades.size === 0)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {exportando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
