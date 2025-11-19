"use client";

import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * PRODUCTOS - Catálogo de productos
 *
 * Estructura de datos:
 * - referencia (código): Código único del producto (ej: T001, A001)
 * - nombre: Descripción del producto
 */

interface Producto {
  id?: number;
  referencia: string;
  nombre: string;
}

export function ProductosTab() {
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, referencia: "T001", nombre: 'TORNILLOS DE 1/2"' },
    { id: 2, referencia: "T002", nombre: 'TORNILLOS DE 1 1/4"' },
    { id: 3, referencia: "A001", nombre: 'ARANDELAS DE 1/2"' },
    { id: 4, referencia: "A002", nombre: 'ARANDELAS DE 1/4"' },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Producto>({
    referencia: "",
    nombre: "",
  });

  // Limpiar formulario
  const resetForm = () => {
    setFormData({ referencia: "", nombre: "" });
    setEditingId(null);
  };

  // Abrir diálogo para nuevo producto
  const handleNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Abrir diálogo para editar
  const handleEdit = (producto: Producto) => {
    setFormData(producto);
    setEditingId(producto.id || null);
    setIsDialogOpen(true);
  };

  // Guardar producto (nuevo o editado)
  const handleSave = () => {
    // Validaciones
    if (!formData.referencia.trim()) {
      toast.error("El código es obligatorio");
      return;
    }
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    // Verificar que el código no esté duplicado
    const existingProduct = productos.find(
      (p) => p.referencia === formData.referencia && p.id !== editingId
    );
    if (existingProduct) {
      toast.error("Ya existe un producto con ese código");
      return;
    }

    if (editingId) {
      // Editar existente
      setProductos(
        productos.map((p) =>
          p.id === editingId ? { ...formData, id: editingId } : p
        )
      );
      toast.success("Producto actualizado");
    } else {
      // Crear nuevo
      const newId = Math.max(0, ...productos.map((p) => p.id || 0)) + 1;
      setProductos([...productos, { ...formData, id: newId }]);
      toast.success("Producto creado");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  // Eliminar producto
  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar este producto?")) {
      setProductos(productos.filter((p) => p.id !== id));
      toast.success("Producto eliminado");
    }
  };

  return (
    <div className="space-y-4">
      {/* Descripción */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Catálogo de Productos</h3>
          <p className="text-sm text-muted-foreground">
            Registre los productos que se manejarán en el inventario
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
              <DialogDescription>
                Complete la información del producto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="referencia">Código *</Label>
                <Input
                  id="referencia"
                  placeholder="Ej: T001, A001"
                  value={formData.referencia}
                  onChange={(e) =>
                    setFormData({ ...formData, referencia: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Código único del producto
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre/Descripción *</Label>
                <Input
                  id="nombre"
                  placeholder='Ej: TORNILLOS DE 1/2"'
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
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

      {/* Tabla de productos */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Código</TableHead>
              <TableHead>Nombre/Descripción</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No hay productos registrados
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-mono font-semibold">
                    {producto.referencia}
                  </TableCell>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(producto)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(producto.id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Nota:</strong> El código es un identificador único que identifica cada producto.
          Se utilizará para relacionar las entradas y salidas en el kardex.
        </p>
      </div>
    </div>
  );
}
