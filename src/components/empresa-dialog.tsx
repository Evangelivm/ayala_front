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
import { Building2 } from "lucide-react";
import { empresasApi, type EmpresaData } from "@/lib/connections";
import { toast } from "sonner";

interface EmpresaDialogProps {
  onAccept: (empresaData: {
    numeroDocumento: string;
    razonSocial: string;
    direccion: string;
  }) => void;
  buttonText?: string;
}

export function EmpresaDialog({
  onAccept,
  buttonText = "Seleccionar Empresa",
}: EmpresaDialogProps) {
  const [open, setOpen] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);
  const [selectedEmpresaCodigo, setSelectedEmpresaCodigo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cargar empresas cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      fetchEmpresas();
    }
  }, [open]);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresasApi.getAll();
      // Filtrar solo empresas con datos completos
      const empresasCompletas = data.filter(
        (e) =>
          e.N__documento &&
          e.Raz_n_social &&
          e.Direcci_n
      );
      setEmpresas(empresasCompletas);
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.error("Error al cargar la lista de empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    const selectedEmpresa = empresas.find(
      (e) => e.C_digo === selectedEmpresaCodigo
    );

    if (selectedEmpresa) {
      onAccept({
        numeroDocumento: selectedEmpresa.N__documento || "",
        razonSocial: selectedEmpresa.Raz_n_social || "",
        direccion: selectedEmpresa.Direcci_n || "",
      });
      setOpen(false);
      setSelectedEmpresaCodigo("");
    }
  };

  // Resetear valores cuando se cierra el diálogo
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedEmpresaCodigo("");
    }
  };

  const selectedEmpresa = empresas.find(
    (e) => e.C_digo === selectedEmpresaCodigo
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Empresa</DialogTitle>
          <DialogDescription>
            Seleccione una empresa para auto-completar los datos del destinatario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select
              value={selectedEmpresaCodigo}
              onValueChange={setSelectedEmpresaCodigo}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading
                      ? "Cargando empresas..."
                      : "Seleccione una empresa"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem
                    key={empresa.C_digo}
                    value={empresa.C_digo}
                  >
                    {`(${empresa.N__documento}) - ${empresa.Raz_n_social}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEmpresa && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md space-y-2">
              <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                Datos seleccionados:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    N° Documento:
                  </span>
                  <p className="text-green-900 dark:text-green-100">
                    {selectedEmpresa.N__documento}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Razón Social:
                  </span>
                  <p className="text-green-900 dark:text-green-100">
                    {selectedEmpresa.Raz_n_social}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Dirección:
                  </span>
                  <p className="text-green-900 dark:text-green-100">
                    {selectedEmpresa.Direcci_n}
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
            disabled={!selectedEmpresaCodigo}
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
