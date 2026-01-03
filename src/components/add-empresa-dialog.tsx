"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { proveedoresApi } from "@/lib/connections";

interface AddEmpresaDialogProps {
  onEmpresaAdded?: () => void;
  buttonText?: string;
}

export function AddEmpresaDialog({
  onEmpresaAdded,
  buttonText = "Agregar Empresa",
}: AddEmpresaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_proveedor: "",
    ruc: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    entidad_bancaria: "",
    numero_cuenta_bancaria: "",
    retencion: "" as "Si" | "No" | "",
    es_agente_retencion: "" as "Si" | "No" | "",
  });

  const handleInputChange = (field: string, value: string) => {
    // Validaciones según el campo
    if (field === "ruc") {
      // Solo números en RUC, máximo 11 dígitos
      value = value.replace(/\D/g, "").slice(0, 11);
    } else if (field === "telefono") {
      // Solo números y guiones en teléfono
      value = value.replace(/[^0-9-]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre_proveedor: "",
      ruc: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
      entidad_bancaria: "",
      numero_cuenta_bancaria: "",
      retencion: "",
      es_agente_retencion: "",
    });
  };

  const validateForm = () => {
    // Validar nombre
    if (!formData.nombre_proveedor.trim()) {
      toast.error("El nombre de la empresa es obligatorio");
      return false;
    }

    // Validar RUC
    if (!formData.ruc.trim()) {
      toast.error("El RUC es obligatorio");
      return false;
    }

    if (formData.ruc.length !== 11) {
      toast.error("El RUC debe tener 11 dígitos");
      return false;
    }

    // Validar email si se proporciona
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("El email no tiene un formato válido");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Preparar datos para enviar (sin codigo_proveedor, se genera en el backend)
      const dataToSend = {
        nombre_proveedor: formData.nombre_proveedor.trim(),
        ruc: formData.ruc.trim(),
        contacto: formData.contacto.trim() || null,
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        direccion: formData.direccion.trim() || null,
        entidad_bancaria: formData.entidad_bancaria.trim() || null,
        numero_cuenta_bancaria: formData.numero_cuenta_bancaria.trim() || null,
        retencion: formData.retencion || null,
        es_agente_retencion: formData.es_agente_retencion ? (formData.es_agente_retencion === "Si" ? "1" : "0") : null,
        activo: true,
      };

      await proveedoresApi.create(dataToSend);

      toast.success("Empresa agregada exitosamente");
      resetForm();
      setOpen(false);

      // Llamar callback si existe
      if (onEmpresaAdded) {
        onEmpresaAdded();
      }
    } catch (error: unknown) {
      console.error("Error al agregar empresa:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Error al agregar empresa";
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(
        apiError.response?.data?.message || errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Empresa</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar una nueva empresa (proveedor). El código de proveedor se generará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Fila 1: RUC */}
          <div className="space-y-2">
            <Label htmlFor="ruc">
              RUC <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ruc"
              type="text"
              inputMode="numeric"
              value={formData.ruc}
              onChange={(e) => handleInputChange("ruc", e.target.value)}
              placeholder="Ej: 20123456789"
              disabled={isLoading}
              maxLength={11}
            />
          </div>

          {/* Fila 2: Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="nombre_proveedor">
              Nombre de la Empresa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_proveedor"
              value={formData.nombre_proveedor}
              onChange={(e) => handleInputChange("nombre_proveedor", e.target.value)}
              placeholder="Ej: EMPRESA SAC"
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          {/* Fila 3: Contacto y Teléfono */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto">Persona de Contacto</Label>
              <Input
                id="contacto"
                value={formData.contacto}
                onChange={(e) => handleInputChange("contacto", e.target.value)}
                placeholder="Ej: Juan Pérez"
                disabled={isLoading}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="text"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                placeholder="Ej: 999-888-777"
                disabled={isLoading}
                maxLength={50}
              />
            </div>
          </div>

          {/* Fila 4: Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Ej: contacto@empresa.com"
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          {/* Fila 5: Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => handleInputChange("direccion", e.target.value)}
              placeholder="Ej: Av. Principal 123, Lima"
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Fila 6: Datos bancarios */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entidad_bancaria">Entidad Bancaria</Label>
              <Input
                id="entidad_bancaria"
                value={formData.entidad_bancaria}
                onChange={(e) => handleInputChange("entidad_bancaria", e.target.value)}
                placeholder="Ej: BCP, BBVA, etc."
                disabled={isLoading}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_cuenta_bancaria">Número de Cuenta Bancaria</Label>
              <Input
                id="numero_cuenta_bancaria"
                value={formData.numero_cuenta_bancaria}
                onChange={(e) => handleInputChange("numero_cuenta_bancaria", e.target.value)}
                placeholder="Ej: 191-1234567890"
                disabled={isLoading}
                maxLength={255}
              />
            </div>
          </div>

          {/* Fila 7: Retención y Agente de Retención */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retencion">Retención</Label>
              <Select
                value={formData.retencion}
                onValueChange={(value: "Si" | "No") =>
                  handleInputChange("retencion", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Si">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="es_agente_retencion">Es Agente de Retención</Label>
              <Select
                value={formData.es_agente_retencion}
                onValueChange={(value: "Si" | "No") =>
                  handleInputChange("es_agente_retencion", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Si">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
