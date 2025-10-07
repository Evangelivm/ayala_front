"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { ubigeosLima } from "@/lib/ubigeos-lima";

interface UbigeoDialogProps {
  title: string;
  description?: string;
  onAccept: (ubigeo: string, direccion: string) => void;
  buttonText?: string;
  currentUbigeo?: string;
  currentDireccion?: string;
}

export function UbigeoDialog({
  title,
  description,
  onAccept,
  buttonText = "Seleccionar",
  currentUbigeo = "",
  currentDireccion = "",
}: UbigeoDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUbigeo, setSelectedUbigeo] = useState(currentUbigeo);
  const [direccion, setDireccion] = useState(currentDireccion);

  const handleAccept = () => {
    if (selectedUbigeo && direccion.trim()) {
      onAccept(selectedUbigeo, direccion.trim());
      setOpen(false);
    }
  };

  // Resetear valores cuando se abre el diálogo
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSelectedUbigeo(currentUbigeo);
      setDireccion(currentDireccion);
    }
  };

  const selectedDistrito = ubigeosLima.find(
    (u) => u.codigo === selectedUbigeo
  )?.distrito;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <MapPin className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ubigeo">Distrito *</Label>
            <Select value={selectedUbigeo} onValueChange={setSelectedUbigeo}>
              <SelectTrigger id="ubigeo">
                <SelectValue placeholder="Seleccione un distrito" />
              </SelectTrigger>
              <SelectContent>
                {ubigeosLima.map((ubigeo) => (
                  <SelectItem key={ubigeo.codigo} value={ubigeo.codigo}>
                    {ubigeo.distrito}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUbigeo && (
              <p className="text-xs text-gray-500">
                Ubigeo: {selectedUbigeo} - {selectedDistrito}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ingrese la dirección completa"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAccept}
            disabled={!selectedUbigeo || !direccion.trim()}
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
