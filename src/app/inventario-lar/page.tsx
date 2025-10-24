"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText } from "lucide-react"
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer"
import { KardexPDF } from "@/components/KardexPDF"
import kardexData from "@/data/kardex.json"

export default function InventarioLARPage() {
  const { kardexLAR, metodoPromedioLAR } = kardexData
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Inventario LAR</h1>
              <p className="text-sm text-muted-foreground">Control de inventario de combustible</p>
            </div>

            {/* Botón para generar PDF */}
            <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Generar PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl h-[95vh]">
                <DialogHeader>
                  <DialogTitle>Vista Previa del Kardex</DialogTitle>
                  <DialogDescription>
                    Revisa el documento antes de descargarlo
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden" style={{ height: 'calc(95vh - 180px)' }}>
                  <PDFViewer width="100%" height="100%" className="border rounded">
                    <KardexPDF kardexLAR={kardexLAR} metodoPromedioLAR={metodoPromedioLAR} />
                  </PDFViewer>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setPdfPreviewOpen(false)}>
                    Cerrar
                  </Button>
                  <PDFDownloadLink
                    document={<KardexPDF kardexLAR={kardexLAR} metodoPromedioLAR={metodoPromedioLAR} />}
                    fileName={`Kardex_LAR_${new Date().toISOString().split('T')[0]}.pdf`}
                  >
                    {({ loading }) => (
                      <Button disabled={loading}>
                        {loading ? 'Preparando...' : 'Descargar PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="w-full p-4 md:p-8 space-y-4">
          <Tabs defaultValue="kardex" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="kardex">Kardex LAR</TabsTrigger>
              <TabsTrigger value="metodo-promedio">Método Promedio</TabsTrigger>
            </TabsList>

            {/* Tab de Kardex LAR */}
            <TabsContent value="kardex">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{kardexLAR.header.empresa}</CardTitle>
                  <CardDescription>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha del kardex</p>
                        <p className="text-lg font-semibold">{kardexLAR.header.fechaKardex}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Condición</p>
                        <p className="text-lg font-semibold">{kardexLAR.header.condicion}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lugar</p>
                        <p className="text-lg font-semibold">{kardexLAR.header.lugar}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Stock Inicial</p>
                        <p className="text-lg font-semibold text-blue-600">{kardexLAR.header.stockInicial}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Stock Actual</p>
                      <p className="text-2xl font-bold text-green-600">{kardexLAR.header.stockActual}</p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          {kardexLAR.columns.map((column, index) => (
                            <TableHead key={index} className="whitespace-nowrap font-semibold">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kardexLAR.rows.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.ITM}</TableCell>
                            <TableCell>{row.FECHA}</TableCell>
                            <TableCell>{row.SEM}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  row.CONDICION === "INGRESO"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.CONDICION}
                              </span>
                            </TableCell>
                            <TableCell>{row["Nª Comprobante"]}</TableCell>
                            <TableCell>{row["H/KM"]}</TableCell>
                            <TableCell className="max-w-xs truncate" title={row.DETALLE}>
                              {row.DETALLE}
                            </TableCell>
                            <TableCell className="text-right">{row.TARIFA}</TableCell>
                            <TableCell className="text-right">{row["COSTO INGRESO"]}</TableCell>
                            <TableCell className="text-right">{row["COSTO SALIDA"]}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {row.Ingreso}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              {row.Salida}
                            </TableCell>
                            <TableCell className="text-right font-bold">{row.SALDO}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Método Promedio LAR */}
            <TabsContent value="metodo-promedio">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{metodoPromedioLAR.header.empresa}</CardTitle>
                  <CardDescription>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Condición</p>
                        <p className="text-lg font-semibold">{metodoPromedioLAR.header.condicion}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lugar</p>
                        <p className="text-lg font-semibold">{metodoPromedioLAR.header.lugar}</p>
                      </div>
                    </div>

                    {/* Inventario Inicial */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Inventario Inicial - {metodoPromedioLAR.initialInventory.fecha}</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Cantidad</p>
                          <p className="text-lg font-semibold">{metodoPromedioLAR.initialInventory.Cant} GLN</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Costo Unitario</p>
                          <p className="text-lg font-semibold">$ {metodoPromedioLAR.initialInventory.Cu}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Costo Total</p>
                          <p className="text-lg font-semibold text-blue-600">$ {metodoPromedioLAR.initialInventory["C.Total"]}</p>
                        </div>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead rowSpan={2} className="border-r font-semibold">Periodo</TableHead>
                          <TableHead rowSpan={2} className="border-r font-semibold">FECHA</TableHead>
                          <TableHead rowSpan={2} className="border-r font-semibold">Nª Comprobante</TableHead>
                          <TableHead rowSpan={2} className="border-r font-semibold">H/KM</TableHead>
                          <TableHead rowSpan={2} className="border-r font-semibold">DETALLE</TableHead>
                          <TableHead colSpan={3} className="text-center border-r bg-green-50 font-semibold">ENTRADAS</TableHead>
                          <TableHead colSpan={3} className="text-center border-r bg-red-50 font-semibold">SALIDAS</TableHead>
                          <TableHead colSpan={3} className="text-center bg-blue-50 font-semibold">SALDOS</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead className="text-center bg-green-50">Cant</TableHead>
                          <TableHead className="text-center bg-green-50">Cu</TableHead>
                          <TableHead className="text-center border-r bg-green-50">C.Total</TableHead>
                          <TableHead className="text-center bg-red-50">Cant</TableHead>
                          <TableHead className="text-center bg-red-50">Cu</TableHead>
                          <TableHead className="text-center border-r bg-red-50">C.Total</TableHead>
                          <TableHead className="text-center bg-blue-50">Cant</TableHead>
                          <TableHead className="text-center bg-blue-50">Cu</TableHead>
                          <TableHead className="text-center bg-blue-50">C.Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metodoPromedioLAR.rows.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium border-r">{row.Periodo}</TableCell>
                            <TableCell className="border-r">{row.FECHA}</TableCell>
                            <TableCell className="border-r">{row["Nª Comprobante"]}</TableCell>
                            <TableCell className="border-r">{row["H/KM"]}</TableCell>
                            <TableCell className="border-r max-w-xs truncate" title={row.DETALLE}>
                              {row.DETALLE}
                            </TableCell>
                            {/* Entradas */}
                            <TableCell className="text-right bg-green-50/30">{row["Entradas.Cant"]}</TableCell>
                            <TableCell className="text-right bg-green-50/30">{row["Entradas.Cu"]}</TableCell>
                            <TableCell className="text-right border-r bg-green-50/30 font-semibold">
                              {row["Entradas.C.Total"]}
                            </TableCell>
                            {/* Salidas */}
                            <TableCell className="text-right bg-red-50/30">{row["Salidas.Cant"]}</TableCell>
                            <TableCell className="text-right bg-red-50/30">{row["Salidas.Cu"]}</TableCell>
                            <TableCell className="text-right border-r bg-red-50/30 font-semibold">
                              {row["Salidas.C.Total"]}
                            </TableCell>
                            {/* Saldos */}
                            <TableCell className="text-right bg-blue-50/30 font-semibold">
                              {row["Saldos.Cant"]}
                            </TableCell>
                            <TableCell className="text-right bg-blue-50/30">{row["Saldos.Cu"]}</TableCell>
                            <TableCell className="text-right bg-blue-50/30 font-bold">
                              {row["Saldos.C.Total"]}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Resumen Final */}
                  <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Resumen Final</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">Inventario Inicial</p>
                        <p className="text-xl font-bold text-blue-600">$ {metodoPromedioLAR.summary.inventarioInicial}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">Compras</p>
                        <p className="text-xl font-bold text-green-600">$ {metodoPromedioLAR.summary.compras}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">Costo de Ventas</p>
                        <p className="text-xl font-bold text-red-600">$ {metodoPromedioLAR.summary.costoDeVentas}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">Inventario Final</p>
                        <p className="text-xl font-bold text-purple-600">$ {metodoPromedioLAR.summary.inventarioFinal}</p>
                      </div>
                    </div>

                    {/* Verificación */}
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Verificación: {metodoPromedioLAR.summary.inventarioInicial} + {metodoPromedioLAR.summary.compras} - {metodoPromedioLAR.summary.costoDeVentas} = {metodoPromedioLAR.summary.inventarioFinal}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  )
}
