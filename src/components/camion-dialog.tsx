"use client";

import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { camionesApi, type CamionData } from "@/lib/connections";
import { toast } from "sonner";

interface CamionDialogProps {
  onAccept: (camionData: {
    placa: string;
    dni: string;
    nombreChofer: string;
    apellidoChofer: string;
    numeroLicencia: string;
  }) => void;
  buttonText?: string;
}

export function CamionDialog({
  onAccept,
  buttonText = "Seleccionar Vehículo y Conductor",
}: CamionDialogProps) {
  const [open, setOpen] = useState(false);
  const [camiones, setCamiones] = useState<CamionData[]>([]);
  const [selectedCamionId, setSelectedCamionId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cargar camiones cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      fetchCamiones();
    }
  }, [open]);

  const fetchCamiones = async () => {
    try {
      setLoading(true);
      const data = await camionesApi.getAll();
      // Filtrar solo camiones activos y con datos de conductor completos
      const camionesActivos = data.filter(
        (c) =>
          c.activo !== false &&
          c.placa &&
          c.dni &&
          c.nombre_chofer &&
          c.apellido_chofer &&
          c.numero_licencia
      );
      setCamiones(camionesActivos);
    } catch (error) {
      console.error("Error cargando camiones:", error);
      toast.error("Error al cargar la lista de camiones");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    const selectedCamion = camiones.find(
      (c) => c.id_camion.toString() === selectedCamionId
    );

    if (selectedCamion) {
      onAccept({
        placa: selectedCamion.placa,
        dni: selectedCamion.dni || "",
        nombreChofer: selectedCamion.nombre_chofer || "",
        apellidoChofer: selectedCamion.apellido_chofer || "",
        numeroLicencia: selectedCamion.numero_licencia || "",
      });
      setOpen(false);
      setSelectedCamionId("");
    }
  };

  // Resetear valores cuando se cierra el diálogo
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedCamionId("");
    }
  };

  const selectedCamion = camiones.find(
    (c) => c.id_camion.toString() === selectedCamionId
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Truck className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Vehículo y Conductor</DialogTitle>
          <DialogDescription>
            Seleccione un vehículo para auto-completar los datos del conductor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select
              value={selectedCamionId}
              onValueChange={setSelectedCamionId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading
                      ? "Cargando camiones..."
                      : "Seleccione un vehículo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {camiones.map((camion) => (
                  <SelectItem
                    key={camion.id_camion}
                    value={camion.id_camion.toString()}
                  >
                    {`(${camion.placa}) - ${camion.nombre_chofer} ${camion.apellido_chofer} - ${camion.dni} - ${camion.numero_licencia}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCamion && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md space-y-2">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                Datos seleccionados:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Placa:
                  </span>
                  <p className="text-blue-900 dark:text-blue-100">
                    {selectedCamion.placa}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    DNI:
                  </span>
                  <p className="text-blue-900 dark:text-blue-100">
                    {selectedCamion.dni}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Conductor:
                  </span>
                  <p className="text-blue-900 dark:text-blue-100">
                    {selectedCamion.nombre_chofer} {selectedCamion.apellido_chofer}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Licencia:
                  </span>
                  <p className="text-blue-900 dark:text-blue-100">
                    {selectedCamion.numero_licencia}
                  </p>
                </div>
              </div>
            </div>
          )}
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
            disabled={!selectedCamionId}
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
