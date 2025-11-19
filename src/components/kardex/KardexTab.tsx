"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

/**
 * KARDEX CONSOLIDADO - Resumen valorizado del inventario
 *
 * Este componente replica la funcionalidad del archivo Excel, calculando automáticamente:
 *
 * ENTRADAS (por producto):
 * - Cantidad total de entradas (SUMIF de la hoja ENTRADAS)
 * - Costo promedio de entrada (Total / Cantidad)
 * - Valor total de entradas (SUMIF del total en ENTRADAS)
 *
 * SALIDAS (por producto):
 * - Cantidad total de salidas (SUMIF de la hoja SALIDAS)
 * - Costo promedio de salida (Total / Cantidad)
 * - Valor total de salidas (SUMIF del total en SALIDAS)
 *
 * SALDO (inventario actual):
 * - Cantidad en stock = Cantidad entradas - Cantidad salidas
 * - Valor del stock = Valor entradas - Valor salidas
 * - Costo promedio del saldo = Valor stock / Cantidad stock
 *
 * Usa IFERROR para evitar divisiones por cero
 */

// Interfaces
interface Producto {
  id: number;
  referencia: string;
  nombre: string;
}

interface Entrada {
  id: number;
  documento: string;
  fecha: string;
  referencia: string;
  detalle: string;
  cantidad: number;
  costo: number;
  total: number;
}

interface Salida {
  id: number;
  documento: string;
  fecha: string;
  referencia: string;
  detalle: string;
  cantidad: number;
  costo: number;
  total: number;
}

interface KardexRow {
  referencia: string;
  nombre: string;
  // Entradas
  cantidadEntrada: number;
  costoEntrada: number;
  totalEntrada: number;
  // Salidas
  cantidadSalida: number;
  costoSalida: number;
  totalSalida: number;
  // Saldo
  cantidadSaldo: number;
  costoSaldo: number;
  totalSaldo: number;
}

// Datos de ejemplo (en producción vendrían de un estado global o API)
const PRODUCTOS: Producto[] = [
  { id: 1, referencia: "T001", nombre: 'TORNILLOS DE 1/2"' },
  { id: 2, referencia: "T002", nombre: 'TORNILLOS DE 1 1/4"' },
  { id: 3, referencia: "A001", nombre: 'ARANDELAS DE 1/2"' },
  { id: 4, referencia: "A002", nombre: 'ARANDELAS DE 1/4"' },
];

const ENTRADAS: Entrada[] = [
  {
    id: 1,
    documento: "FC01-123",
    fecha: "2025-11-01",
    referencia: "T001",
    detalle: "COMPRA DE CONTADO",
    cantidad: 2,
    costo: 2.5,
    total: 5.0,
  },
  {
    id: 2,
    documento: "F001-54",
    fecha: "2025-11-02",
    referencia: "T001",
    detalle: "COMPRA DE CONTADO",
    cantidad: 4,
    costo: 3.0,
    total: 12.0,
  },
];

const SALIDAS: Salida[] = [
  {
    id: 1,
    documento: "0001-1",
    fecha: "2025-11-01",
    referencia: "T001",
    detalle: "TRANSFERENCIA OBRA LAR",
    cantidad: 1,
    costo: 2.5,
    total: 2.5,
  },
];

export function KardexTab() {
  /**
   * FUNCIÓN SUMIF
   * Replica la función SUMIF de Excel
   * Suma valores de un array donde una condición se cumple
   */
  const sumif = <T,>(
    array: T[],
    criterioField: keyof T,
    criterioValue: T[keyof T],
    sumField: keyof T
  ): number => {
    return array
      .filter((item) => item[criterioField] === criterioValue)
      .reduce((sum, item) => sum + Number(item[sumField]), 0);
  };

  /**
   * FUNCIÓN IFERROR
   * Replica la función IFERROR de Excel
   * Retorna el valor o 0 si hay error (división por cero, NaN, Infinity)
   */
  const iferror = (value: number, defaultValue: number = 0): number => {
    if (isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return value;
  };

  /**
   * CALCULAR KARDEX
   * Genera el resumen consolidado por producto
   */
  const kardexData = useMemo<KardexRow[]>(() => {
    return PRODUCTOS.map((producto) => {
      // ENTRADAS - SUMIF desde la hoja ENTRADAS
      const cantidadEntrada = sumif(
        ENTRADAS,
        "referencia",
        producto.referencia,
        "cantidad"
      );
      const totalEntrada = sumif(
        ENTRADAS,
        "referencia",
        producto.referencia,
        "total"
      );
      const costoEntrada = iferror(totalEntrada / cantidadEntrada);

      // SALIDAS - SUMIF desde la hoja SALIDAS
      const cantidadSalida = sumif(
        SALIDAS,
        "referencia",
        producto.referencia,
        "cantidad"
      );
      const totalSalida = sumif(
        SALIDAS,
        "referencia",
        producto.referencia,
        "total"
      );
      const costoSalida = iferror(totalSalida / cantidadSalida);

      // SALDO - Diferencia entre entradas y salidas
      const cantidadSaldo = cantidadEntrada - cantidadSalida;
      const totalSaldo = totalEntrada - totalSalida;
      const costoSaldo = iferror(totalSaldo / cantidadSaldo);

      return {
        referencia: producto.referencia,
        nombre: producto.nombre,
        cantidadEntrada,
        costoEntrada,
        totalEntrada,
        cantidadSalida,
        costoSalida,
        totalSalida,
        cantidadSaldo,
        costoSaldo,
        totalSaldo,
      };
    });
  }, []);

  // Calcular totales generales
  const totales = useMemo(() => {
    return kardexData.reduce(
      (acc, row) => ({
        cantidadEntrada: acc.cantidadEntrada + row.cantidadEntrada,
        totalEntrada: acc.totalEntrada + row.totalEntrada,
        cantidadSalida: acc.cantidadSalida + row.cantidadSalida,
        totalSalida: acc.totalSalida + row.totalSalida,
        cantidadSaldo: acc.cantidadSaldo + row.cantidadSaldo,
        totalSaldo: acc.totalSaldo + row.totalSaldo,
      }),
      {
        cantidadEntrada: 0,
        totalEntrada: 0,
        cantidadSalida: 0,
        totalSalida: 0,
        cantidadSaldo: 0,
        totalSaldo: 0,
      }
    );
  }, [kardexData]);

  // Exportar a Excel (simulado)
  const handleExportExcel = () => {
    toast.success("Función de exportación en desarrollo");
    // En producción: usar biblioteca como xlsx o ExcelJS
  };

  // Exportar a PDF (simulado)
  const handleExportPDF = () => {
    toast.success("Función de exportación en desarrollo");
    // En producción: usar biblioteca como jsPDF o react-pdf
  };

  return (
    <div className="space-y-4">
      {/* Descripción y botones de exportación */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kardex Valorizado - Resumen</h3>
          <p className="text-sm text-muted-foreground">
            Resumen consolidado automático con método de costo promedio ponderado
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Grid de productos - Un card por producto */}
      <div className="space-y-6">
        {kardexData.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        ) : (
          <>
            {kardexData.map((row) => (
              <div key={row.referencia} className="border rounded-lg overflow-hidden">
                {/* Encabezado del producto */}
                <div className="bg-muted/50 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="font-mono bg-primary/10 px-2 py-1 rounded text-primary">
                          {row.referencia}
                        </span>
                        <span>{row.nombre}</span>
                      </h4>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Stock Actual: </span>
                      <span className={`font-bold text-lg ${
                        row.cantidadSaldo > 0 ? 'text-blue-600' :
                        row.cantidadSaldo < 0 ? 'text-red-600' :
                        'text-muted-foreground'
                      }`}>
                        {row.cantidadSaldo > 0 ? row.cantidadSaldo : row.cantidadSaldo < 0 ? row.cantidadSaldo : '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabla del producto */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Concepto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Costo Promedio</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Entradas */}
                    <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                      <TableCell className="font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600">↓</span>
                          ENTRADAS
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.cantidadEntrada > 0 ? row.cantidadEntrada : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.costoEntrada > 0 ? `S/ ${row.costoEntrada.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.totalEntrada > 0 ? (
                          <span className="text-green-600">S/ {row.totalEntrada.toFixed(2)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Salidas */}
                    <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                      <TableCell className="font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="text-red-600">↑</span>
                          SALIDAS
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.cantidadSalida > 0 ? row.cantidadSalida : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.costoSalida > 0 ? `S/ ${row.costoSalida.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.totalSalida > 0 ? (
                          <span className="text-red-600">S/ {row.totalSalida.toFixed(2)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Saldo */}
                    <TableRow className="bg-blue-50/50 dark:bg-blue-950/20 font-semibold">
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="text-blue-600">=</span>
                          SALDO (STOCK)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.cantidadSaldo > 0 ? (
                          <span className="font-semibold">{row.cantidadSaldo}</span>
                        ) : row.cantidadSaldo < 0 ? (
                          <span className="font-semibold text-red-600">{row.cantidadSaldo}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.costoSaldo > 0 ? `S/ ${row.costoSaldo.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.totalSaldo > 0 ? (
                          <span className="text-blue-600">S/ {row.totalSaldo.toFixed(2)}</span>
                        ) : row.totalSaldo < 0 ? (
                          <span className="text-red-600">S/ {row.totalSaldo.toFixed(2)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ))}

            {/* Totales generales */}
            <div className="border-2 border-primary rounded-lg overflow-hidden">
              <div className="bg-primary/10 p-4 border-b border-primary">
                <h4 className="font-bold text-lg">TOTALES GENERALES</h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Concepto</TableHead>
                    <TableHead className="text-right">Cantidad Total</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                    <TableCell className="font-semibold">
                      <span className="flex items-center gap-2">
                        <span className="text-green-600">↓</span>
                        TOTAL ENTRADAS
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {totales.cantidadEntrada}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      S/ {totales.totalEntrada.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                    <TableCell className="font-semibold">
                      <span className="flex items-center gap-2">
                        <span className="text-red-600">↑</span>
                        TOTAL SALIDAS
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {totales.cantidadSalida}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      S/ {totales.totalSalida.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50/50 dark:bg-blue-950/20 font-bold text-lg">
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="text-blue-600">=</span>
                        SALDO TOTAL
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {totales.cantidadSaldo}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      S/ {totales.totalSaldo.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Explicación de los cálculos */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold text-green-600">Entradas</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Cantidad: Suma de todas las entradas del producto</li>
              <li>• Costo: Total ÷ Cantidad</li>
              <li>• Total: Suma del valor de todas las entradas</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-red-600">Salidas</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Cantidad: Suma de todas las salidas del producto</li>
              <li>• Costo: Total ÷ Cantidad</li>
              <li>• Total: Suma del valor de todas las salidas</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-blue-600">Saldo (Stock Actual)</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Cantidad: Entradas - Salidas</li>
              <li>• Costo Promedio: Total Saldo ÷ Cantidad Saldo</li>
              <li>• Total: Valor total del inventario</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground border-t pt-3">
          <strong>Método de valorización:</strong> Costo Promedio Ponderado.
          Los cálculos replican exactamente las fórmulas del archivo Excel original usando SUMIF e IFERROR.
        </p>
      </div>
    </div>
  );
}
