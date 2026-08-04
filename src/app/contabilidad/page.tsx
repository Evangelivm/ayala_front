"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Search,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Pencil,
  X,
  Save,
} from "lucide-react";
import {
  contabilidadApi,
  type AsientoContableRowInput,
  type AsientoContableData,
  type ResultadoValidacionContabilidad,
  type CatalogosContabilidad,
} from "@/lib/connections";
import {
  AsientoContableFormDialog,
  filaAsientoCompleta,
} from "@/components/asiento-contable-form-dialog";

// Orden de las columnas D:BX de la hoja "CONTABILIDAD" del Excel original
// (ver ESPECIFICACION_IMPORTACION_CONTABILIDAD.txt, sección 3). Los datos
// empiezan en la fila 9 (las filas 6-8 son encabezados técnicos).
const FILA_INICIO_DATOS = 8; // índice 0-based -> fila 9
const COLUMNA_INICIO = 3; // índice 0-based -> columna D

const CAMPOS_ORDEN: string[] = [
  "correlativo", "relacionado", "codigo_tipo_medio_pago", "ejercicio", "periodo",
  "cod_modulo", "modulo", "fuente", "numero_cuenta", "codigo_tipo_documento",
  "numero_serie", "numero_documento", "concepto_fec", "glosa",
  "codigo_moneda_origen", "codigo_moneda_registro", "codigo_centro_costo",
  "codigo_sub_centro_costo", "codigo_sub_sub_centro_costo", "codigo_forma_provision",
  "codigo_forma_pago_cobro", "codigo_area", "identificador_ctr_mda",
  "identificador_tip_afecto", "nro_cheque", "grdo",
  "fecha_emision_doc", "fecha_vencimiento_doc", "fecha_movimiento", "fecha_cbr",
  "fecha_registro", "fecha_conc", "fecha_dif",
  "cod_tip_doc_ident_clt", "nro_doc_clt", "razon_social_1",
  "cod_tip_doc_ident_prov", "nro_doc_prov", "razon_social_2",
  "cod_tip_doc_ident_trab", "nro_doc_trab", "razon_social_3",
  "monto_debe", "monto_haber", "monto_debe_me", "monto_haber_me", "cambio_moneda",
  "es_cancelado", "es_conciliado", "es_provision", "es_anulado", "es_destino",
  "doc_ref_fecha_emision", "doc_ref_cod_tip_doc", "doc_ref_nro_serie", "doc_ref_nro_doc",
  "numero_detraccion", "fecha_pago_detraccion",
  "ca01", "ca02", "ca03", "ca04", "ca05", "ca06", "ca07", "ca08",
  "ca09", "ca10", "ca11", "ca12", "ca13", "ca14", "ca15",
];

const CAMPOS_FECHA = new Set([
  "fecha_emision_doc", "fecha_vencimiento_doc", "fecha_movimiento", "fecha_cbr",
  "fecha_registro", "fecha_conc", "fecha_dif", "doc_ref_fecha_emision",
]);

const CAMPOS_NUMERO = new Set([
  "correlativo", "relacionado", "concepto_fec",
  "monto_debe", "monto_haber", "monto_debe_me", "monto_haber_me", "cambio_moneda",
]);

function excelValueToISODate(v: unknown): string | undefined {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().split("T")[0];
  }
  if (typeof v === "number") {
    const d = new Date((v - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? undefined : d.toISOString().split("T")[0];
  }
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString().split("T")[0];
  }
  return undefined;
}

function parseHojaContabilidad(rows: unknown[][]): AsientoContableRowInput[] {
  return rows
    .slice(FILA_INICIO_DATOS)
    .filter((row) => row && row[COLUMNA_INICIO] !== undefined && row[COLUMNA_INICIO] !== "")
    .map((row) => {
      const obj: Record<string, unknown> = {};
      CAMPOS_ORDEN.forEach((campo, i) => {
        const raw = row[COLUMNA_INICIO + i];
        if (raw === undefined || raw === null || raw === "") return;

        if (CAMPOS_FECHA.has(campo)) {
          const iso = excelValueToISODate(raw);
          if (iso) obj[campo] = iso;
        } else if (CAMPOS_NUMERO.has(campo)) {
          obj[campo] = typeof raw === "number" ? raw : Number(raw);
        } else {
          obj[campo] = String(raw).trim();
        }
      });
      return obj as AsientoContableRowInput;
    });
}

interface ManualAsientoRow extends AsientoContableRowInput {
  _id: string;
}

export default function ContabilidadPage() {
  // ---- Catálogos (compartidos por Entrada Manual e Importar) ----
  const [catalogos, setCatalogos] = useState<CatalogosContabilidad | null>(null);

  useEffect(() => {
    contabilidadApi
      .getCatalogos()
      .then(setCatalogos)
      .catch(() => toast.error("Error al cargar los catálogos"));
  }, []);

  // ---- Tab Entrada Manual ----
  const [manualRows, setManualRows] = useState<ManualAsientoRow[]>([]);
  const [manualErrores, setManualErrores] = useState<Record<string, string[]>>({});
  const [isSavingManual, setIsSavingManual] = useState(false);

  const nuevoAsientoVacio = (): AsientoContableRowInput => {
    const now = new Date();
    const correlativo = manualRows.length
      ? Math.max(...manualRows.map((r) => Number(r.correlativo) || 0)) + 1
      : 1;
    return {
      correlativo,
      relacionado: correlativo,
      ejercicio: String(now.getFullYear()),
      periodo: String(now.getMonth() + 1).padStart(2, "0"),
      cod_modulo: "",
      modulo: "",
      fuente: "",
      numero_cuenta: "",
      codigo_moneda_origen: "01",
      codigo_moneda_registro: "01",
      codigo_centro_costo: "",
      codigo_sub_centro_costo: "",
      codigo_sub_sub_centro_costo: "",
      codigo_area: "",
      monto_debe: 0,
      monto_haber: 0,
      cambio_moneda: 1,
      glosa: "",
    };
  };

  const handleAgregarAsiento = (values: AsientoContableRowInput) => {
    const _id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setManualRows((prev) => [{ _id, ...values }, ...prev]);
  };

  const handleEditarAsiento = (id: string, values: AsientoContableRowInput) => {
    setManualRows((prev) =>
      prev.map((row) => (row._id === id ? { _id: id, ...values } : row))
    );
    setManualErrores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleEliminarAsiento = (id: string) => {
    setManualRows((prev) => prev.filter((row) => row._id !== id));
    setManualErrores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleGuardarManual = async () => {
    if (manualRows.length === 0) return;
    setIsSavingManual(true);
    try {
      const filas = manualRows.map(({ _id, ...rest }) => rest);
      const result = await contabilidadApi.confirmar(filas);
      toast.success(result.message);
      setManualRows([]);
      setManualErrores({});
      setCurrentPage(1);
      await fetchRegistros(searchTerm, 1);
    } catch (error) {
      const data = (
        error as {
          response?: {
            data?: {
              resultados?: {
                fila: number;
                valida: boolean;
                errores: string[];
              }[];
              filasError?: number;
            };
          };
        }
      )?.response?.data;

      if (data?.resultados) {
        const erroresPorId: Record<string, string[]> = {};
        data.resultados.forEach((r, idx) => {
          if (!r.valida) {
            const row = manualRows[idx];
            if (row) erroresPorId[row._id] = r.errores;
          }
        });
        setManualErrores(erroresPorId);
        toast.error(
          `${data.filasError ?? "Algunas"} fila(s) con errores. Revísalas y vuelve a intentar.`
        );
      } else {
        toast.error("Error al guardar los asientos contables");
      }
    } finally {
      setIsSavingManual(false);
    }
  };

  // ---- Tab Importar ----
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<AsientoContableRowInput[]>([]);
  const [validacion, setValidacion] = useState<ResultadoValidacionContabilidad | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // ---- Tab Registros ----
  const [registros, setRegistros] = useState<AsientoContableData[]>([]);
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const fetchRegistros = useCallback(async (q: string, page: number) => {
    setIsLoadingRegistros(true);
    try {
      const result = await contabilidadApi.list(q, page, PAGE_SIZE);
      setRegistros(result.data);
      setTotalItems(result.total);
    } catch (error) {
      console.error("Error al cargar asientos contables:", error);
      toast.error("Error al cargar los registros");
    } finally {
      setIsLoadingRegistros(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRegistros(searchTerm, currentPage);
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, fetchRegistros]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|xlsm)$/i)) {
      toast.error("Por favor selecciona un archivo Excel válido (.xlsx, .xls, .xlsm)");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. Máximo 10MB permitido.");
      return;
    }

    setFile(selectedFile);
    setValidacion(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames.includes("CONTABILIDAD")
          ? "CONTABILIDAD"
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        const filas = parseHojaContabilidad(rows);

        if (filas.length === 0) {
          toast.error("No se encontraron filas de datos a partir de la fila 9, columna D");
          setIsParsing(false);
          return;
        }

        setParsedRows(filas);
        toast.info(`Se leyeron ${filas.length} filas. Validando...`);

        const resultado = await contabilidadApi.preview(filas);
        setValidacion(resultado);

        if (resultado.filasError > 0) {
          toast.error(`${resultado.filasError} fila(s) con errores de validación`);
        } else {
          toast.success(`${resultado.filasValidas} filas listas para importar`);
        }
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        toast.error("Error al procesar el archivo Excel");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDiscard = () => {
    setFile(null);
    setParsedRows([]);
    setValidacion(null);
    const fileInput = document.getElementById("contabilidad-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleConfirmar = async () => {
    if (!validacion || validacion.filasError > 0 || parsedRows.length === 0) return;

    setIsConfirming(true);
    try {
      const result = await contabilidadApi.confirmar(parsedRows, file?.name);
      toast.success(result.message);
      handleDiscard();
      setCurrentPage(1);
      await fetchRegistros(searchTerm, 1);
    } catch (error) {
      console.error("Error al confirmar la importación:", error);
      toast.error("Error al confirmar la importación. Revisa la consola para más detalle.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await contabilidadApi.remove(id);
      toast.success("Asiento contable eliminado");
      await fetchRegistros(searchTerm, currentPage);
    } catch {
      toast.error("Error al eliminar el asiento contable");
    }
  };

  const handleRestaurar = async (id: number) => {
    try {
      await contabilidadApi.restore(id);
      toast.success("Asiento contable restaurado");
      await fetchRegistros(searchTerm, currentPage);
    } catch {
      toast.error("Error al restaurar el asiento contable");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-700">
                  Importación de Contabilidad
                </h1>
                <p className="text-sm text-slate-600">
                  Importar asientos contables (voucher de partida doble)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 pb-8 space-y-6 max-w-7xl">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
            <TabsTrigger value="importar">Importar Excel</TabsTrigger>
            <TabsTrigger value="registros">Registros</TabsTrigger>
          </TabsList>

          {/* ─────────────── TAB ENTRADA MANUAL ─────────────── */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-3">
                <CardTitle>
                  <div className="flex flex-col gap-1">
                    <span>Entrada Manual de Asientos</span>
                    {manualRows.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {manualRows.filter(filaAsientoCompleta).length} de {manualRows.length} filas completas
                      </span>
                    )}
                  </div>
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <AsientoContableFormDialog
                    catalogos={catalogos}
                    current={nuevoAsientoVacio()}
                    onAccept={handleAgregarAsiento}
                    title="Nuevo asiento contable"
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Asiento
                      </Button>
                    }
                  />
                  {manualRows.length > 0 && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => { setManualRows([]); setManualErrores({}); }}
                        disabled={isSavingManual}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar Todo
                      </Button>
                      <Button
                        onClick={handleGuardarManual}
                        disabled={isSavingManual || !manualRows.every(filaAsientoCompleta)}
                      >
                        {isSavingManual ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Guardar en BD
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {manualRows.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay asientos agregados. Haz clic en &quot;Agregar Asiento&quot; para comenzar.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[110px]">Acciones</TableHead>
                          <TableHead>Correlativo</TableHead>
                          <TableHead>Ejer/Per</TableHead>
                          <TableHead>Cuenta</TableHead>
                          <TableHead className="min-w-[200px]">Glosa</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Haber</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualRows.map((row) => {
                          const completa = filaAsientoCompleta(row);
                          const errores = manualErrores[row._id];
                          return (
                            <TableRow
                              key={row._id}
                              className={errores ? "bg-red-50" : completa ? "bg-green-50" : ""}
                            >
                              <TableCell className="p-2">
                                <div className="flex gap-1">
                                  <AsientoContableFormDialog
                                    catalogos={catalogos}
                                    current={row}
                                    onAccept={(values) => handleEditarAsiento(row._id, values)}
                                    title="Editar asiento contable"
                                    trigger={
                                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0" title="Editar">
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0"
                                    onClick={() => handleEliminarAsiento(row._id)}
                                    title="Eliminar"
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{row.correlativo}</TableCell>
                              <TableCell>{row.ejercicio}-{row.periodo}</TableCell>
                              <TableCell>{row.numero_cuenta || "-"}</TableCell>
                              <TableCell className="max-w-[250px] truncate">{row.glosa || ""}</TableCell>
                              <TableCell className="text-right">{row.monto_debe}</TableCell>
                              <TableCell className="text-right">{row.monto_haber}</TableCell>
                              <TableCell>
                                {errores ? (
                                  <Badge
                                    className="bg-red-100 text-red-800 hover:bg-red-100"
                                    title={errores.join("; ")}
                                  >
                                    Con error
                                  </Badge>
                                ) : completa ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    Completo
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Incompleto</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─────────────── TAB IMPORTAR ─────────────── */}
          <TabsContent value="importar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cargar archivo de importación</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sube el Excel con el mismo layout de la hoja &quot;CONTABILIDAD&quot;
                  (datos desde la fila 9, columna D en adelante). Cada fila se valida
                  contra el schema y los catálogos antes de poder confirmar la importación
                  — no se guarda nada hasta que confirmes.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    id="contabilidad-file"
                    type="file"
                    accept=".xlsx,.xls,.xlsm"
                    onChange={handleFileChange}
                    disabled={isParsing || isConfirming}
                    className="max-w-md"
                  />
                  {file && (
                    <Button variant="outline" onClick={handleDiscard} disabled={isParsing || isConfirming}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Descartar
                    </Button>
                  )}
                </div>

                {isParsing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Leyendo y validando archivo...
                  </div>
                )}

                {validacion && (
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant="outline" className="text-sm">
                      Total: {validacion.totalFilas}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Válidas: {validacion.filasValidas}
                    </Badge>
                    {validacion.filasError > 0 && (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        Con error: {validacion.filasError}
                      </Badge>
                    )}
                    <Button
                      onClick={handleConfirmar}
                      disabled={validacion.filasError > 0 || isConfirming}
                      className="ml-auto"
                    >
                      {isConfirming ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Importación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {validacion && validacion.resultados.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previsualización</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Fila</TableHead>
                          <TableHead className="w-[60px]">Estado</TableHead>
                          <TableHead>Correlativo</TableHead>
                          <TableHead>Ejer/Per</TableHead>
                          <TableHead>Cuenta</TableHead>
                          <TableHead className="min-w-[200px]">Glosa</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Haber</TableHead>
                          <TableHead className="min-w-[250px]">Errores</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validacion.resultados.map((r) => (
                          <TableRow
                            key={r.fila}
                            className={r.valida ? "bg-green-50" : "bg-red-50"}
                          >
                            <TableCell>{r.fila}</TableCell>
                            <TableCell>
                              {r.valida ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell>{r.datos?.correlativo ?? "-"}</TableCell>
                            <TableCell>
                              {r.datos ? `${r.datos.ejercicio}-${r.datos.periodo}` : "-"}
                            </TableCell>
                            <TableCell>{r.datos?.numero_cuenta ?? "-"}</TableCell>
                            <TableCell className="max-w-[250px] truncate">
                              {r.datos?.glosa ?? ""}
                            </TableCell>
                            <TableCell className="text-right">
                              {r.datos?.monto_debe ?? "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {r.datos?.monto_haber ?? "-"}
                            </TableCell>
                            <TableCell className="text-xs text-red-700">
                              {r.errores.join("; ")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─────────────── TAB REGISTROS ─────────────── */}
          <TabsContent value="registros" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <span>Asientos Contables Importados</span>
                  {totalItems > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {totalItems} total
                    </span>
                  )}
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por cuenta, glosa, documento..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-10 bg-white w-72"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRegistros ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : registros.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron registros con ese criterio" : "No hay asientos contables importados"}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[70px]">ID</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Ejer/Per</TableHead>
                          <TableHead>Cuenta</TableHead>
                          <TableHead className="min-w-[200px]">Glosa</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Haber</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead className="w-[100px] text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registros.map((item) => (
                          <TableRow key={item.id} className={item.deleted_at ? "opacity-50" : ""}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.lote?.nombre_archivo || `Lote #${item.id_lote}`}
                            </TableCell>
                            <TableCell>{item.ejercicio}-{item.periodo}</TableCell>
                            <TableCell>{item.numero_cuenta}</TableCell>
                            <TableCell className="max-w-[250px] truncate">{item.glosa}</TableCell>
                            <TableCell className="text-right">{item.monto_debe}</TableCell>
                            <TableCell className="text-right">{item.monto_haber}</TableCell>
                            <TableCell>{item.codigo_moneda_registro}</TableCell>
                            <TableCell className="text-center">
                              {item.deleted_at ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRestaurar(item.id)}
                                  title="Restaurar"
                                >
                                  <RotateCcw className="h-4 w-4 text-blue-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEliminar(item.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1 || isLoadingRegistros}
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
                      disabled={currentPage >= totalPages || isLoadingRegistros}
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
    </div>
  );
}
