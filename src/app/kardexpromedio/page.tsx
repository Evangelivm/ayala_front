"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductosTab } from "@/components/kardex/ProductosTab";
import { EntradasTab } from "@/components/kardex/EntradasTab";
import { SalidasTab } from "@/components/kardex/SalidasTab";
import { KardexTab } from "@/components/kardex/KardexTab";
import { Package, ArrowDownCircle, ArrowUpCircle, FileText } from "lucide-react";

/**
 * KARDEX VALORIZADO CON COSTO PROMEDIO
 *
 * Sistema de control de inventario que implementa el método de costo promedio ponderado.
 *
 * ESTRUCTURA:
 * 1. PRODUCTOS: Catálogo de productos con referencias y descripciones
 * 2. ENTRADAS: Registro de compras/ingresos al inventario
 * 3. SALIDAS: Registro de ventas/egresos del inventario
 * 4. KARDEX: Resumen consolidado con cálculos automáticos
 *
 * MÉTODO: Costo Promedio Ponderado
 * - Cada entrada/salida tiene su propio costo unitario
 * - El saldo se calcula automáticamente: Entradas - Salidas
 * - El costo promedio se recalcula con cada movimiento
 */
export default function KardexPromedioPage() {
  const [activeTab, setActiveTab] = useState("productos");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Kardex Valorizado</h1>
        <p className="text-muted-foreground">
          Sistema de control de inventario con método de costo promedio ponderado
        </p>
      </div>

      {/* Tarjetas informativas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Catálogo de productos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Registro de ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salidas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Registro de egresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kardex</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Resumen consolidado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="productos" className="gap-2">
                <Package className="h-4 w-4" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="entradas" className="gap-2">
                <ArrowDownCircle className="h-4 w-4" />
                Entradas
              </TabsTrigger>
              <TabsTrigger value="salidas" className="gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Salidas
              </TabsTrigger>
              <TabsTrigger value="kardex" className="gap-2">
                <FileText className="h-4 w-4" />
                Kardex
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="productos" className="space-y-4">
                <ProductosTab />
              </TabsContent>

              <TabsContent value="entradas" className="space-y-4">
                <EntradasTab />
              </TabsContent>

              <TabsContent value="salidas" className="space-y-4">
                <SalidasTab />
              </TabsContent>

              <TabsContent value="kardex" className="space-y-4">
                <KardexTab />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Información del método */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Método de Valorización</CardTitle>
          <CardDescription>
            Este sistema utiliza el método de <strong>Costo Promedio Ponderado</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-semibold mb-1">Entradas</p>
              <p className="text-muted-foreground text-xs">
                Se registra la cantidad y costo de cada compra. El sistema suma todas las entradas por producto.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Salidas</p>
              <p className="text-muted-foreground text-xs">
                Se registra la cantidad y costo de cada salida. El sistema suma todas las salidas por producto.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Saldo</p>
              <p className="text-muted-foreground text-xs">
                Se calcula automáticamente: <strong>Entradas - Salidas</strong>. El costo promedio se obtiene dividiendo el valor total entre la cantidad.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
