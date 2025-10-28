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

interface RutaDialogProps {
  onAccept: (partidaUbigeo: string, partidaDireccion: string, llegadaUbigeo: string, llegadaDireccion: string) => void;
  buttonText?: string;
  currentPartidaUbigeo?: string;
  currentPartidaDireccion?: string;
  currentLlegadaUbigeo?: string;
  currentLlegadaDireccion?: string;
}

export function RutaDialog({
  onAccept,
  buttonText = "Seleccionar Ruta",
  currentPartidaUbigeo = "",
  currentPartidaDireccion = "",
  currentLlegadaUbigeo = "",
  currentLlegadaDireccion = "",
}: RutaDialogProps) {
  const [open, setOpen] = useState(false);

  // Estados para punto de partida
  const [partidaUbigeo, setPartidaUbigeo] = useState(currentPartidaUbigeo);
  const [partidaDireccion, setPartidaDireccion] = useState(currentPartidaDireccion);

  // Estados para punto de llegada
  const [llegadaUbigeo, setLlegadaUbigeo] = useState(currentLlegadaUbigeo);
  const [llegadaDireccion, setLlegadaDireccion] = useState(currentLlegadaDireccion);

  const handleAccept = () => {
    if (partidaUbigeo && partidaDireccion.trim() && llegadaUbigeo && llegadaDireccion.trim()) {
      onAccept(
        partidaUbigeo,
        partidaDireccion.trim(),
        llegadaUbigeo,
        llegadaDireccion.trim()
      );
      setOpen(false);
    }
  };

  // Resetear valores cuando se abre el diálogo
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPartidaUbigeo(currentPartidaUbigeo);
      setPartidaDireccion(currentPartidaDireccion);
      setLlegadaUbigeo(currentLlegadaUbigeo);
      setLlegadaDireccion(currentLlegadaDireccion);
    }
  };

  const partidaDistrito = ubigeosLima.find(
    (u) => u.codigo === partidaUbigeo
  )?.distrito;

  const llegadaDistrito = ubigeosLima.find(
    (u) => u.codigo === llegadaUbigeo
  )?.distrito;

  const isComplete = partidaUbigeo && partidaDireccion.trim() && llegadaUbigeo && llegadaDireccion.trim();
  const hasData = currentPartidaUbigeo || currentLlegadaUbigeo;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={hasData ? "default" : "outline"}
          size="sm"
          className={hasData ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Ruta</DialogTitle>
          <DialogDescription>
            Seleccione los distritos y direcciones de partida y llegada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Punto de Partida */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Punto de Partida
            </h3>

            <div className="space-y-2">
              <Label htmlFor="partida-ubigeo">Distrito *</Label>
              <Select value={partidaUbigeo} onValueChange={setPartidaUbigeo}>
                <SelectTrigger id="partida-ubigeo">
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
              {partidaUbigeo && (
                <p className="text-xs text-gray-500">
                  Ubigeo: {partidaUbigeo} - {partidaDistrito}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="partida-direccion">Dirección *</Label>
              <Input
                id="partida-direccion"
                value={partidaDireccion}
                onChange={(e) => setPartidaDireccion(e.target.value)}
                placeholder="Ingrese la dirección de partida"
              />
            </div>
          </div>

          {/* Punto de Llegada */}
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Punto de Llegada
            </h3>

            <div className="space-y-2">
              <Label htmlFor="llegada-ubigeo">Distrito *</Label>
              <Select value={llegadaUbigeo} onValueChange={setLlegadaUbigeo}>
                <SelectTrigger id="llegada-ubigeo">
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
              {llegadaUbigeo && (
                <p className="text-xs text-gray-500">
                  Ubigeo: {llegadaUbigeo} - {llegadaDistrito}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="llegada-direccion">Dirección *</Label>
              <Input
                id="llegada-direccion"
                value={llegadaDireccion}
                onChange={(e) => setLlegadaDireccion(e.target.value)}
                placeholder="Ingrese la dirección de llegada"
              />
            </div>
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
            disabled={!isComplete}
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
