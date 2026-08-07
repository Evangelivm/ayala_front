"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { registroComprasApi, type MasivoRow } from "@/lib/connections";

// Posiciones (1-based, tal como en el Excel de Registro de Compras SUNAT/PLE)
// de las columnas que se leen del archivo, en el orden en que se guardan
// dentro de `rowValues`.
const COLUMN_INDICES_1BASED = [
  5, // 0 Fecha de emision
  6, // 1 Fecha de vencimiento
  7, // 2 Tipo CP
  8, // 3 Serie CDP
  10, // 4 Numero CP
  13, // 5 Numero de identidad
  14, // 6 Apellidos y nombres / razon social
  15, // 7 BI Gravado DG
  16, // 8 IGV/IPM DG
  25, // 9 Total CP
  26, // 10 Moneda
  27, // 11 Tipo de cambio
  21, // 12 Valor adquirido (no gravado)
  24, // 13 Otros tributos
  17, // 14 BI Gravado DGNG
  18, // 15 IGV/IPM DGNG
  19, // 16 BI Gravado DNG
  20, // 17 IGV/IPM DNG
  22, // 18 ISC
  23, // 19 ICBPER
];

const CODIGO_TIPO_CP: Record<number, string> = {
  5: "BA",
  3: "BV",
  6: "CP",
  1: "FT",
  9: "GS",
  13: "LB",
  4: "LQ",
  7: "NA",
  87: "NC",
  8: "ND",
  11: "PB",
  10: "RA",
  14: "RC",
  2: "RH",
  50: "RL",
  37: "RV",
  12: "TK",
};

const CUENTA_OTROS_TRIBUTOS = "641901";
const CUENTA_POR_PAGAR_PEN = "421201";
const CUENTA_POR_PAGAR_USD = "421202";

const MESES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

type RowValues = unknown[];

interface CuentasConfig {
  subdiario: string;
  cuentaGasto: string;
  cuentaIgv: string;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Fecha serial de Excel
    return new Date((value - 25569) * 86400 * 1000);
  }
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function nombreTruncado(value: unknown): string {
  if (typeof value === "string") return value.substring(0, 40);
  if (typeof value === "number") return value.toString().substring(0, 40);
  return "Dato inválido";
}

function montoConvertido(
  value: unknown,
  moneda: unknown,
  tipoCambio: unknown
): number {
  const num = Number(value) || 0;
  if (moneda === "USD") {
    return parseFloat((num / (Number(tipoCambio) || 1)).toFixed(2));
  }
  return num;
}

// Construye las líneas de asiento (debe/haber) de UNA fila del Excel,
// replicando la lógica de la herramienta original (herramienta_excel).
function buildLineasParaFila(
  rowValues: RowValues,
  campo: number,
  numeroComprobante: string,
  cuentas: CuentasConfig
): MasivoRow[] {
  const fechaEmision = toDate(rowValues[0]);
  const fechaEmisionIso = toIso(fechaEmision);
  const tipoCp = CODIGO_TIPO_CP[Number(rowValues[2])] ?? String(rowValues[2] ?? "");
  const serie = `${rowValues[3]}-${String(rowValues[4] ?? "").padStart(8, "0")}`;
  const identificacion = String(rowValues[5] ?? "");
  const nombre = nombreTruncado(rowValues[6]);
  const moneda = rowValues[10];
  const tipoCambio = rowValues[11];
  const codMoneda = moneda === "PEN" ? "MN" : "US";

  const divisionResult = (
    (Number(rowValues[8]) / Number(rowValues[7])) *
    100
  ).toFixed(0);
  const igvValue =
    divisionResult === "18" ? "18" : divisionResult === "10" ? "10" : "";

  const base = {
    sub_diario: Number(cuentas.subdiario) || 11,
    num_comprobante: numeroComprobante,
    fecha_documento: fechaEmisionIso,
    fecha_vencimiento: fechaEmisionIso,
    tipo_documento: tipoCp,
    numero_documento: serie,
    codigo_anexo: identificacion,
    glosa_principal: nombre,
    cod_moneda: codMoneda,
    tasa_igv: igvValue,
    tipo_conversion: "V",
    flag_conversion: "S",
  };

  // Líneas "D" (debe): cada una condicionada a que el importe de esa
  // columna no sea 0 — igual que el original.
  const lineasDebe: Array<{ valor: unknown; cuenta: string }> = [
    { valor: rowValues[7], cuenta: cuentas.cuentaGasto }, // BI Gravado DG
    { valor: rowValues[8], cuenta: cuentas.cuentaIgv }, // IGV/IPM DG
    { valor: rowValues[14], cuenta: cuentas.cuentaGasto }, // BI Gravado DGNG
    { valor: rowValues[15], cuenta: cuentas.cuentaIgv }, // IGV/IPM DGNG
    { valor: rowValues[16], cuenta: cuentas.cuentaGasto }, // BI Gravado DNG
    { valor: rowValues[17], cuenta: cuentas.cuentaIgv }, // IGV/IPM DNG
    { valor: rowValues[12], cuenta: cuentas.cuentaGasto }, // Valor adquirido
    { valor: rowValues[18], cuenta: cuentas.cuentaGasto }, // ISC
    { valor: rowValues[19], cuenta: cuentas.cuentaGasto }, // ICBPER
    { valor: rowValues[13], cuenta: CUENTA_OTROS_TRIBUTOS }, // Otros tributos
  ];

  const lineas: MasivoRow[] = [];
  for (const { valor, cuenta } of lineasDebe) {
    if (valor !== 0) {
      lineas.push({
        ...base,
        campo,
        importe_original: montoConvertido(valor, moneda, tipoCambio),
        debe_haber: "D",
        cuenta_contable: cuenta,
        codigo_auxiliar: "",
        tipo_doc_referencia: "",
        num_doc_referencia: "",
        fecha_doc_referencia: null,
      });
    }
  }

  // Línea "H" (haber): el total del comprobante, cuenta por pagar.
  lineas.push({
    ...base,
    campo,
    importe_original: montoConvertido(rowValues[9], moneda, tipoCambio),
    debe_haber: "H",
    cuenta_contable: moneda === "PEN" ? CUENTA_POR_PAGAR_PEN : CUENTA_POR_PAGAR_USD,
    codigo_auxiliar: "SAT",
    tipo_doc_referencia: "",
    num_doc_referencia: "",
    fecha_doc_referencia: null,
  });

  // La primera línea del comprobante lleva la referencia a la orden de compra.
  lineas[0] = {
    ...lineas[0],
    tipo_doc_referencia: "OC",
    num_doc_referencia: "SN",
    fecha_doc_referencia: fechaEmisionIso,
  };

  return lineas;
}

export default function RegistroComprasPage() {
  const [columnData, setColumnData] = useState<RowValues[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [isFileGenerating, setIsFileGenerating] = useState(false);
  const [isDataGenerating, setIsDataGenerating] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [cuentas, setCuentas] = useState<CuentasConfig>({
    subdiario: "11",
    cuentaGasto: "603219",
    cuentaIgv: "401111",
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const mesesConEtiqueta = useMemo(() => {
    const filtered =
      currentMonth === 1 || currentMonth === 2
        ? [
            { value: "12", label: "Diciembre", year: currentYear - 1 },
            ...MESES.filter((m) => parseInt(m.value) <= currentMonth).map(
              (m) => ({ ...m, year: currentYear })
            ),
          ]
        : MESES.filter((m) => parseInt(m.value) <= currentMonth).map((m) => ({
            ...m,
            year: currentYear,
          }));

    return filtered.map((m) =>
      parseInt(m.value) === currentMonth && m.year === currentYear
        ? { ...m, label: `${m.label} (Actual)` }
        : m
    );
  }, [currentMonth, currentYear]);

  const subCompInicial = showInput ? parseInt(inputValue) || 0 : 1;
  const subCompValue = String(inputValue || "").padStart(4, "0");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Selecciona un archivo Excel válido (.xlsx o .xls)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as RowValues[];

        const values = rows
          .slice(1) // fila 1 = encabezados
          .filter((row) => row.some((v) => v !== null && v !== undefined))
          .map((row) => COLUMN_INDICES_1BASED.map((n) => row[n - 1]));

        setColumnData(values);
        setButtonDisabled(false);
        toast.success(`Se procesaron ${values.length} comprobantes`);
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
        toast.error("No se pudo procesar el archivo. Verifica el formato.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleSelectMes = (value: string) => {
    setSelectedMonth(value);
  };

  const construirTodasLasLineas = (): MasivoRow[] => {
    let campo = 1;
    let subComp = subCompInicial;
    const lineas: MasivoRow[] = [];

    for (const rowValues of columnData) {
      const numeroComprobante = `${selectedMonth}${String(subComp).padStart(
        4,
        "0"
      )}`;
      lineas.push(
        ...buildLineasParaFila(rowValues, campo, numeroComprobante, cuentas)
      );
      campo++;
      subComp++;
    }

    return lineas;
  };

  const handleGenerarXlsx = () => {
    if (!selectedMonth) {
      toast.error("Selecciona el mes del número de comprobante");
      return;
    }
    setIsFileGenerating(true);
    try {
      const lineas = construirTodasLasLineas();

      const aoa = [
        [
          "campo",
          "sub diario",
          "numero de comprobante",
          "fecha de emision",
          "fecha de vencimiento",
          "tipo cp",
          "serie",
          "identificacion",
          "nombre",
          "monto",
          "debe/haber",
          "moneda",
          "igv",
          "cuenta contable",
        ],
        ...lineas.map((l) => [
          l.campo,
          l.sub_diario,
          l.num_comprobante,
          l.fecha_documento,
          l.fecha_vencimiento,
          l.tipo_documento,
          l.numero_documento,
          l.codigo_anexo,
          l.glosa_principal,
          l.importe_original,
          l.debe_haber,
          l.cod_moneda,
          l.tasa_igv,
          l.cuenta_contable,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");

      const now = new Date();
      const fecha = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(now.getDate()).padStart(2, "0")}`;
      const hora = `${String(now.getHours()).padStart(2, "0")}.${String(
        now.getMinutes()
      ).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;

      XLSX.writeFile(workbook, `documento_${fecha}_${hora}.xlsx`);
      toast.success("Archivo creado con éxito");
    } catch (error) {
      console.error("Error al generar el archivo:", error);
      toast.error("Error al generar el archivo Excel");
    } finally {
      setIsFileGenerating(false);
    }
  };

  const handleEnviarABaseDeDatos = async () => {
    if (!selectedMonth) {
      toast.error("Selecciona el mes del número de comprobante");
      return;
    }
    setIsDataGenerating(true);
    try {
      const lineas = construirTodasLasLineas();
      const result = await registroComprasApi.createBatch(lineas);
      toast.success(
        `Datos enviados con éxito. Último número de registro: ${result.last_reg}`
      );
    } catch (error) {
      console.error("Error al enviar datos:", error);
      toast.error("Error al enviar datos");
    } finally {
      setIsDataGenerating(false);
    }
  };

  const handleConsultarUltimoRegistro = async () => {
    setIsQuerying(true);
    try {
      const result = await registroComprasApi.getUltimoNumero();
      toast.info(`El número de registro más reciente es: ${result.nextId}`);
    } catch (error) {
      console.error("Error al consultar el último registro:", error);
      toast.error("Hubo un error, inténtalo más tarde.");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Registro de Compras → Asientos Contables</CardTitle>
          <CardDescription>
            Sube el Excel de Registro de Compras y genera los asientos
            (debe/haber) listos para el sistema contable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center py-2">
              <h4 className="text-base font-medium leading-none">
                1. Subir archivo
              </h4>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Parámetros</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Configuración de Parámetros</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subdiario">Subdiario</Label>
                      <Input
                        id="subdiario"
                        className="col-span-3"
                        value={cuentas.subdiario}
                        onChange={(e) =>
                          setCuentas((c) => ({
                            ...c,
                            subdiario: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cuenta-contable">Cuenta Contable</Label>
                      <Input
                        id="cuenta-contable"
                        className="col-span-3"
                        value={cuentas.cuentaGasto}
                        onChange={(e) =>
                          setCuentas((c) => ({
                            ...c,
                            cuentaGasto: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cuenta-igv">Cuenta IGV</Label>
                      <Input
                        id="cuenta-igv"
                        className="col-span-3"
                        value={cuentas.cuentaIgv}
                        onChange={(e) =>
                          setCuentas((c) => ({
                            ...c,
                            cuentaIgv: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Separator />
            <div className="py-4">
              <Label htmlFor="excel">Seleccionar Archivo</Label>
              <Input
                id="excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <h4 className="text-base font-medium leading-none py-2">
              2. Vista previa
            </h4>
            <Separator />
            <div className="py-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>BI</TableHead>
                    <TableHead>IGV</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Moneda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnData.slice(0, 4).map((rowValues, index) => (
                    <TableRow key={index}>
                      <TableCell>{String(rowValues[5] ?? "")}</TableCell>
                      <TableCell>{String(rowValues[6] ?? "")}</TableCell>
                      <TableCell>{String(rowValues[7] ?? "")}</TableCell>
                      <TableCell>{String(rowValues[8] ?? "")}</TableCell>
                      <TableCell>{String(rowValues[9] ?? "")}</TableCell>
                      <TableCell>
                        {rowValues[10] === "PEN" ? "MN" : "US"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {columnData.length > 4 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Mostrando 4 de {columnData.length} comprobantes.
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-base font-medium leading-none py-2">
              3. Envíos
            </h4>
            <Separator />
            <div className="py-4 space-y-2">
              <Label>3.1. Escoger mes del número de comprobante</Label>
              <Select onValueChange={handleSelectMes}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Seleccione un mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {mesesConEtiqueta.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="pb-4">
              <RadioGroup defaultValue="option-one">
                <Label className="block pb-2">
                  3.2. Escoger número de comprobante
                </Label>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="option-one"
                    id="option-one"
                    onClick={() => setShowInput(false)}
                  />
                  <Label htmlFor="option-one">Empezar desde 0 (0001)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="option-two"
                    id="option-two"
                    onClick={() => setShowInput(true)}
                  />
                  <Label htmlFor="option-two">
                    Asignar número (usa el botón &quot;Número de registro
                    reciente&quot;)
                  </Label>
                </div>
                {showInput && (
                  <div className="pt-2">
                    <Input
                      type="number"
                      placeholder="Número"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="max-w-[200px]"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Debe colocar el número que continúa al número de
                      registro reciente.
                    </p>
                  </div>
                )}
                <Label className="block pt-2">
                  Ejemplo: {selectedMonth}
                  {showInput ? subCompValue : "0001"}
                </Label>
              </RadioGroup>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleGenerarXlsx}
                className="bg-green-700 text-white hover:bg-green-600"
                disabled={buttonDisabled || isFileGenerating}
              >
                {isFileGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando
                  </>
                ) : (
                  "Generar XLSX"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleEnviarABaseDeDatos}
                className="bg-sky-700 text-white hover:bg-sky-600"
                disabled={buttonDisabled || isDataGenerating}
              >
                {isDataGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando
                  </>
                ) : (
                  "Enviar a Base de Datos"
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleConsultarUltimoRegistro}
              className="bg-red-700 text-white hover:bg-red-600"
              disabled={isQuerying}
            >
              {isQuerying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando
                </>
              ) : (
                "Número de registro reciente"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
