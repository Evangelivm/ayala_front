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
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { camionesApi, type EmpresaData } from "@/lib/connections";

interface AddCamionDialogProps {
  empresas: EmpresaData[];
  onCamionAdded?: () => void;
  buttonText?: string;
}

export function AddCamionDialog({
  empresas,
  onCamionAdded,
  buttonText = "Agregar Unidad/Maquinaria",
}: AddCamionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    año: "",
    capacidad_tanque: "",
    dni: "",
    nombre_chofer: "",
    apellido_chofer: "",
    empresa: "",
    tipo: "" as "CAMION" | "MAQUINARIA" | "",
  });

  const handleInputChange = (field: string, value: string) => {
    // Validaciones según el campo
    if (field === "dni") {
      // Solo números en DNI, máximo 8 dígitos
      value = value.replace(/\D/g, "").slice(0, 8);
    } else if (field === "nombre_chofer" || field === "apellido_chofer") {
      // Solo letras, espacios, tildes, guiones y apóstrofes en nombres
      value = value.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]/g, "");
    } else if (field === "placa") {
      // Formato XXX-XXX para placa, convertir a mayúsculas
      value = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      // Limitar a 7 caracteres (incluyendo el guion)
      if (value.length > 7) value = value.slice(0, 7);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      placa: "",
      marca: "",
      año: "",
      capacidad_tanque: "",
      dni: "",
      nombre_chofer: "",
      apellido_chofer: "",
      empresa: "",
      tipo: "",
    });
  };

  const validateForm = () => {
    // Validar placa
    if (!formData.placa.trim()) {
      toast.error("La placa es obligatoria");
      return false;
    }

    // Validar formato de placa XXX-XXX
    const placaRegex = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;
    if (!placaRegex.test(formData.placa)) {
      toast.error("La placa debe tener el formato XXX-XXX (ej: ABC-123)");
      return false;
    }

    // Validar marca
    if (!formData.marca.trim()) {
      toast.error("La marca es obligatoria");
      return false;
    }

    // Validar año
    if (!formData.año) {
      toast.error("El año es obligatorio");
      return false;
    }

    // Validar capacidad de tanque
    if (!formData.capacidad_tanque) {
      toast.error("La capacidad de tanque es obligatoria");
      return false;
    }

    // Validar DNI
    if (!formData.dni.trim()) {
      toast.error("El DNI del chofer es obligatorio");
      return false;
    }

    if (formData.dni.length !== 8) {
      toast.error("El DNI debe tener 8 dígitos");
      return false;
    }

    // Validar nombres del chofer
    if (!formData.nombre_chofer.trim()) {
      toast.error("Los nombres del chofer son obligatorios");
      return false;
    }

    // Validar apellidos del chofer
    if (!formData.apellido_chofer.trim()) {
      toast.error("Los apellidos del chofer son obligatorios");
      return false;
    }

    // Validar empresa
    if (!formData.empresa) {
      toast.error("Debes seleccionar una empresa");
      return false;
    }

    // Validar tipo
    if (!formData.tipo) {
      toast.error("Debes seleccionar el tipo (Camión o Maquinaria)");
      return false;
    }

    return true;
  };

  // Función helper para normalizar espacios (trim + múltiples espacios a uno solo)
  const normalizeSpaces = (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Aplicar trim y normalizar espacios a todos los campos de texto
      const dniTrimmed = formData.dni.trim();
      const nombreNormalized = normalizeSpaces(formData.nombre_chofer);
      const apellidoNormalized = normalizeSpaces(formData.apellido_chofer);
      const marcaNormalized = normalizeSpaces(formData.marca);

      // Preparar datos para enviar (todos los campos son obligatorios)
      const dataToSend = {
        placa: formData.placa.trim(), // Ya está en mayúsculas por handleInputChange
        marca: marcaNormalized.toUpperCase(),
        año: parseInt(formData.año),
        capacidad_tanque: parseFloat(formData.capacidad_tanque),
        dni: dniTrimmed,
        nombre_chofer: nombreNormalized.toUpperCase(),
        apellido_chofer: apellidoNormalized.toUpperCase(),
        numero_licencia: `Q${dniTrimmed}`, // Q + DNI
        empresa: formData.empresa.trim(),
        tipo: formData.tipo as "CAMION" | "MAQUINARIA", // "CAMION" sin tilde o "MAQUINARIA"
        id_tipo_combustible_preferido: 1, // Siempre 1
        activo: true, // Siempre activo
      };

      await camionesApi.create(dataToSend);

      toast.success("Unidad/Maquinaria agregada exitosamente");
      resetForm();
      setOpen(false);

      // Llamar callback si existe
      if (onCamionAdded) {
        onCamionAdded();
      }
    } catch (error: unknown) {
      console.error("Error al agregar unidad/maquinaria:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Error al agregar unidad/maquinaria";
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Unidad/Maquinaria</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar una nueva unidad o maquinaria.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Fila 1: Placa y Marca */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placa">
                Placa <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Formato: XXX-XXX)
                </span>
              </Label>
              <Input
                id="placa"
                value={formData.placa}
                onChange={(e) => handleInputChange("placa", e.target.value)}
                placeholder="Ej: ABC-123"
                disabled={isLoading}
                maxLength={7}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marca">
                Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => handleInputChange("marca", e.target.value)}
                placeholder="Ej: Toyota"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Fila 2: Año y Capacidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="año">
                Año <span className="text-red-500">*</span>
              </Label>
              <Input
                id="año"
                type="number"
                value={formData.año}
                onChange={(e) => handleInputChange("año", e.target.value)}
                placeholder="Ej: 2020"
                disabled={isLoading}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacidad_tanque">
                Capacidad de Tanque (m³) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacidad_tanque"
                type="number"
                step="0.01"
                value={formData.capacidad_tanque}
                onChange={(e) =>
                  handleInputChange("capacidad_tanque", e.target.value)
                }
                placeholder="Ej: 15.50"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Fila 3: DNI */}
          <div className="space-y-2">
            <Label htmlFor="dni">
              DNI del Chofer <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                (8 dígitos - Licencia se generará como Q + DNI)
              </span>
            </Label>
            <Input
              id="dni"
              type="text"
              inputMode="numeric"
              value={formData.dni}
              onChange={(e) => handleInputChange("dni", e.target.value)}
              placeholder="Ej: 12345678"
              disabled={isLoading}
              maxLength={8}
            />
            {formData.dni && formData.dni.length === 8 && (
              <p className="text-xs text-muted-foreground">
                Número de Licencia: Q{formData.dni}
              </p>
            )}
          </div>

          {/* Fila 4: Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_chofer">
                Nombres del Chofer <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Solo texto)
                </span>
              </Label>
              <Input
                id="nombre_chofer"
                type="text"
                value={formData.nombre_chofer}
                onChange={(e) =>
                  handleInputChange("nombre_chofer", e.target.value)
                }
                placeholder="Ej: Juan Carlos"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido_chofer">
                Apellidos del Chofer <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Solo texto)
                </span>
              </Label>
              <Input
                id="apellido_chofer"
                type="text"
                value={formData.apellido_chofer}
                onChange={(e) =>
                  handleInputChange("apellido_chofer", e.target.value)
                }
                placeholder="Ej: Pérez García"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Fila 5: Empresa */}
          <div className="space-y-2">
            <Label htmlFor="empresa">
              Empresa <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.empresa}
              onValueChange={(value) => handleInputChange("empresa", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.codigo} value={empresa.codigo}>
                    {`(${empresa.nro_documento}) - ${empresa.razon_social}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fila 6: Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">
              Tipo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "CAMION" | "MAQUINARIA") =>
                handleInputChange("tipo", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMION">CAMIÓN</SelectItem>
                <SelectItem value="MAQUINARIA">MAQUINARIA</SelectItem>
              </SelectContent>
            </Select>
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
