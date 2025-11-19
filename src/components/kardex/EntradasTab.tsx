"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * ENTRADAS - Registro de ingresos al inventario
 *
 * Estructura de datos:
 * - documento: Número de factura o comprobante (ej: FC01-123)
 * - fecha: Fecha de la entrada
 * - referencia: Código del producto (debe existir en Productos)
 * - detalle: Descripción de la transacción
 * - cantidad: Unidades que ingresan
 * - costo: Costo unitario de compra
 * - total: cantidad × costo (calculado automáticamente)
 */

interface Entrada {
  id?: number;
  documento: string;
  fecha: string;
  referencia: string;
  detalle: string;
  cantidad: number;
  costo: number;
  total: number;
}

// Productos de ejemplo (en producción vendrían de una API)
const PRODUCTOS_DISPONIBLES = [
  { referencia: "T001", nombre: 'TORNILLOS DE 1/2"' },
  { referencia: "T002", nombre: 'TORNILLOS DE 1 1/4"' },
  { referencia: "A001", nombre: 'ARANDELAS DE 1/2"' },
  { referencia: "A002", nombre: 'ARANDELAS DE 1/4"' },
];

export function EntradasTab() {
  const [entradas, setEntradas] = useState<Entrada[]>([
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
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Entrada>({
    documento: "",
    fecha: new Date().toISOString().split("T")[0],
    referencia: "",
    detalle: "",
    cantidad: 0,
    costo: 0,
    total: 0,
  });

  // Calcular total automáticamente
  const calcularTotal = (cantidad: number, costo: number) => {
    return Number((cantidad * costo).toFixed(2));
  };

  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      documento: "",
      fecha: new Date().toISOString().split("T")[0],
      referencia: "",
      detalle: "",
      cantidad: 0,
      costo: 0,
      total: 0,
    });
    setEditingId(null);
  };

  // Abrir diálogo para nueva entrada
  const handleNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Abrir diálogo para editar
  const handleEdit = (entrada: Entrada) => {
    setFormData(entrada);
    setEditingId(entrada.id || null);
    setIsDialogOpen(true);
  };

  // Guardar entrada
  const handleSave = () => {
    // Validaciones
    if (!formData.documento.trim()) {
      toast.error("El número de documento es obligatorio");
      return;
    }
    if (!formData.fecha) {
      toast.error("La fecha es obligatoria");
      return;
    }
    if (!formData.referencia) {
      toast.error("Debe seleccionar un producto");
      return;
    }
    if (formData.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    if (formData.costo <= 0) {
      toast.error("El costo debe ser mayor a 0");
      return;
    }

    const total = calcularTotal(formData.cantidad, formData.costo);

    if (editingId) {
      // Editar existente
      setEntradas(
        entradas.map((e) =>
          e.id === editingId ? { ...formData, id: editingId, total } : e
        )
      );
      toast.success("Entrada actualizada");
    } else {
      // Crear nueva
      const newId = Math.max(0, ...entradas.map((e) => e.id || 0)) + 1;
      setEntradas([...entradas, { ...formData, id: newId, total }]);
      toast.success("Entrada registrada");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  // Eliminar entrada
  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar esta entrada?")) {
      setEntradas(entradas.filter((e) => e.id !== id));
      toast.success("Entrada eliminada");
    }
  };

  // Obtener nombre del producto por referencia
  const getProductoNombre = (referencia: string) => {
    const producto = PRODUCTOS_DISPONIBLES.find((p) => p.referencia === referencia);
    return producto ? producto.nombre : referencia;
  };

  // Calcular totales
  const totalCantidad = entradas.reduce((sum, e) => sum + e.cantidad, 0);
  const totalValor = entradas.reduce((sum, e) => sum + e.total, 0);

  return (
    <div className="space-y-4">
      {/* Descripción y botón */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Registro de Entradas</h3>
          <p className="text-sm text-muted-foreground">
            Registre las compras e ingresos de productos al inventario
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Entrada" : "Nueva Entrada"}
              </DialogTitle>
              <DialogDescription>
                Complete la información de la entrada al inventario
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="documento">N° Documento *</Label>
                <Input
                  id="documento"
                  placeholder="Ej: FC01-123"
                  value={formData.documento}
                  onChange={(e) =>
                    setFormData({ ...formData, documento: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="referencia">Producto *</Label>
                <Select
                  value={formData.referencia}
                  onValueChange={(value) =>
                    setFormData({ ...formData, referencia: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTOS_DISPONIBLES.map((producto) => (
                      <SelectItem
                        key={producto.referencia}
                        value={producto.referencia}
                      >
                        {producto.referencia} - {producto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="detalle">Detalle</Label>
                <Input
                  id="detalle"
                  placeholder="Ej: COMPRA DE CONTADO"
                  value={formData.detalle}
                  onChange={(e) =>
                    setFormData({ ...formData, detalle: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.cantidad || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidad: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costo">Costo Unitario *</Label>
                <Input
                  id="costo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costo || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, costo: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Total Calculado</Label>
                <div className="text-2xl font-bold text-green-600">
                  S/ {calcularTotal(formData.cantidad, formData.costo).toFixed(2)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de entradas */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Documento</TableHead>
              <TableHead className="w-[110px]">Fecha</TableHead>
              <TableHead className="w-[100px]">Ref.</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="text-right w-[80px]">Cant.</TableHead>
              <TableHead className="text-right w-[100px]">Costo</TableHead>
              <TableHead className="text-right w-[100px]">Total</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No hay entradas registradas
                </TableCell>
              </TableRow>
            ) : (
              <>
                {entradas.map((entrada) => (
                  <TableRow key={entrada.id}>
                    <TableCell className="font-mono">{entrada.documento}</TableCell>
                    <TableCell>
                      {new Date(entrada.fecha + "T00:00:00").toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {entrada.referencia}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getProductoNombre(entrada.referencia)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entrada.detalle}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {entrada.cantidad}
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {entrada.costo.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      S/ {entrada.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(entrada)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entrada.id!)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fila de totales */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={5} className="text-right">
                    TOTALES:
                  </TableCell>
                  <TableCell className="text-right">{totalCantidad}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right text-green-600">
                    S/ {totalValor.toFixed(2)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
