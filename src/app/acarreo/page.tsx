"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { Trash2, Save, Plus, X, Truck } from "lucide-react";
import {
  acarreoApi,
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
import {
  getManualRowsAcarreo,
  saveManualRowsAcarreo,
  clearManualRowsAcarreo,
  migrateFromLocalStorage,
  type ManualRowAcarreo,
} from "@/lib/indexeddb";

// Opciones para los selects
const PROGRAMACIONES = ["AFIRMADO", "ELIMINACION", "SUB BASE", "1 INTERNOS"];
const ESTADOS = ["OK", "EN PROCESO", "NO EJECUTADO"];

export default function AcarreoPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Estado para entrada manual
  const [manualRows, setManualRows] = useState<ManualRowAcarreo[]>([]);

  // Estado para camiones
  const [camiones, setCamiones] = useState<CamionData[]>([]);

  // Estado para empresas (proveedores)
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);

  // Estado para proyectos
  const [proyectos, setProyectos] = useState<ProyectoData[]>([]);

  // Cargar datos de IndexedDB al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Intentar migrar datos de localStorage si existen
        const migratedCount = await migrateFromLocalStorage(
          "acarreo_manual_data"
        );
        if (migratedCount > 0) {
          toast.info(
            `Se migraron ${migratedCount} registros de localStorage a IndexedDB`
          );
        }

        // Cargar datos de IndexedDB
        const rows = await getManualRowsAcarreo();
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

  // Cargar camiones al montar el componente
  useEffect(() => {
    loadCamiones();
  }, []);

  // Cargar empresas (proveedores) al montar el componente
  useEffect(() => {
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

  // Guardar en IndexedDB cada vez que cambien las filas manuales
  useEffect(() => {
    const saveData = async () => {
      if (manualRows.length > 0) {
        try {
          await saveManualRowsAcarreo(manualRows);
        } catch (error) {
          console.error("Error al guardar en IndexedDB:", error);
        }
      }
    };

    saveData();
  }, [manualRows]);

  // Funciones para entrada manual
  const addManualRow = () => {
    const newRow: ManualRowAcarreo = {
      id: Date.now().toString(),
      fecha: new Date().toISOString().split("T")[0],
      unidad: "",
      unidad_id: 0,
      proveedor: "",
      proveedor_id: "",
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
    console.log("Camión seleccionado:", camion);

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
            // Autocompletar proveedor si el camión tiene empresa asignada
            proveedor: camion.razon_social_empresa || row.proveedor,
            proveedor_id: camion.empresa || row.proveedor_id,
          };

          console.log("Fila actualizada:", updatedRow);

          return updatedRow;
        }
        return row;
      })
    );
  };

  const updateManualRow = (
    id: string,
    field: keyof ManualRowAcarreo,
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
  const updateManualRowMultiple = (id: string, updates: Partial<ManualRowAcarreo>) => {
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
      await clearManualRowsAcarreo();
      setManualRows([]);
      toast.success("Datos limpiados exitosamente");
    } catch (error) {
      console.error("Error al limpiar datos:", error);
      toast.error("Error al limpiar datos");
    }
  };

  // Función para verificar si una fila está completa
  const isRowComplete = (row: ManualRowAcarreo) => {
    const basicFieldsComplete =
      row.fecha &&
      row.unidad &&
      row.unidad_id > 0 &&
      row.proveedor &&
      row.proveedor_id &&
      row.programacion &&
      row.hora_partida &&
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
      // Convertir ManualRowAcarreo a AcarreoData con IDs
      const dataToSend = manualRows.map((row) => ({
        fecha: new Date(row.fecha),
        unidad: row.unidad_id,
        proveedor: row.proveedor_id,
        programacion: row.programacion,
        hora_partida: `${row.hora_partida}:00`,
        estado_programacion: row.estado_programacion,
        comentarios: row.comentarios,
        punto_partida_ubigeo: row.punto_partida_ubigeo,
        punto_partida_direccion: row.punto_partida_direccion,
        punto_llegada_ubigeo: row.punto_llegada_ubigeo,
        punto_llegada_direccion: row.punto_llegada_direccion,
        peso: row.peso,
        id_proyecto: row.proyecto_id > 0 ? row.proyecto_id : undefined,
        id_subproyecto: row.subproyecto_id > 0 ? row.subproyecto_id : undefined,
      }));

      const result = await acarreoApi.createBatch(dataToSend);

      toast.success(
        `${result.successCount} registros guardados exitosamente en ${result.processingTime}ms`
      );

      // Limpiar datos después de enviar exitosamente
      clearManualData();

      toast.success("¡Información de acarreo subida exitosamente!");
    } catch (error) {
      toast.error("Error al guardar los datos");
      console.error("Error saving manual data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-700">
                  Acarreo
                </h1>
                <p className="text-sm text-slate-600">
                  Ingresar datos de acarreo
                </p>
              </div>
            </div>
            <AddCamionDialog
              empresas={empresas}
              onCamionAdded={loadCamiones}
              buttonText="Agregar Maquinaria"
            />
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="mx-auto px-4 sm:px-6 pb-8 space-y-6">
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
                <div className="rounded-md border">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[180px]">Fecha</TableHead>
                        <TableHead className="w-[140px]">Maquinaria</TableHead>
                        <TableHead className="w-[280px]">Proveedor</TableHead>
                        <TableHead className="w-[220px]">
                          Apellidos y Nombres
                        </TableHead>
                        <TableHead className="w-[200px]">Proyecto</TableHead>
                        <TableHead className="w-[180px]">
                          Programación
                        </TableHead>
                        <TableHead className="w-[140px]">H.P</TableHead>
                        <TableHead className="w-[180px]">Estado</TableHead>
                        <TableHead className="w-[240px]">
                          Ruta (Partida - Llegada)
                        </TableHead>
                        <TableHead className="min-w-[300px]">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeManualRow(row.id)}
                              disabled={isLoading}
                              className="h-9 w-9 p-0"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
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
                              buttonText="Seleccionar Maquinaria"
                              dialogTitle="Seleccionar Maquinaria"
                              dialogDescription="Selecciona una maquinaria de la lista. Puedes buscar por placa, DNI, nombre del chofer o proveedor."
                              emptyMessage="maquinarias"
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
                                // Actualizar solo el nombre del proyecto/subproyecto
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
      </div>
    </div>
  );
}
