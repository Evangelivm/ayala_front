"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Truck, Search } from "lucide-react";
import type { CamionData } from "@/lib/connections";

interface CamionSelectDialogProps {
  camiones: CamionData[];
  onSelect: (camion: CamionData) => void;
  buttonText?: string;
  currentPlaca?: string;
}

export function CamionSelectDialog({
  camiones,
  onSelect,
  buttonText = "Seleccionar Unidad",
  currentPlaca = "",
}: CamionSelectDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Función helper para capitalizar texto
  const capitalizeText = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filtrar camiones según el término de búsqueda
  const filteredCamiones = camiones.filter((camion) => {
    const searchLower = searchTerm.toLowerCase();
    const nombreCompleto = camion.nombre_chofer && camion.apellido_chofer
      ? `${camion.nombre_chofer} ${camion.apellido_chofer}`.toLowerCase()
      : "";

    return (
      camion.placa.toLowerCase().includes(searchLower) ||
      camion.dni?.toLowerCase().includes(searchLower) ||
      nombreCompleto.includes(searchLower) ||
      camion.razon_social_empresa?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectCamion = (camion: CamionData) => {
    console.log("Camión seleccionado en diálogo:", {
      placa: camion.placa,
      empresa: camion.empresa,
      razon_social_empresa: camion.razon_social_empresa,
      camion_completo: camion
    });
    onSelect(camion);
    setOpen(false);
    setSearchTerm(""); // Limpiar búsqueda al cerrar
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={currentPlaca ? "outline" : "default"}
          className="w-full"
        >
          <Truck className="h-4 w-4 mr-2" />
          {currentPlaca || buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Seleccionar Unidad (Camión)
          </DialogTitle>
          <DialogDescription>
            Selecciona un camión de la lista. Puedes buscar por placa, DNI, nombre del chofer o proveedor.
          </DialogDescription>
        </DialogHeader>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por placa, DNI, chofer o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabla de camiones */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-[120px]">Placa</TableHead>
                <TableHead className="w-[140px]">Capacidad (m³)</TableHead>
                <TableHead className="w-[120px]">DNI</TableHead>
                <TableHead className="w-[240px]">Chofer</TableHead>
                <TableHead className="min-w-[250px]">Proveedor</TableHead>
                <TableHead className="w-[100px]">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCamiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron camiones con ese criterio de búsqueda"
                      : "No hay camiones disponibles"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCamiones.map((camion) => {
                  const nombreCompleto =
                    camion.nombre_chofer && camion.apellido_chofer
                      ? `${capitalizeText(camion.nombre_chofer)} ${capitalizeText(camion.apellido_chofer)}`
                      : "N/A";

                  return (
                    <TableRow
                      key={camion.id_camion}
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => handleSelectCamion(camion)}
                    >
                      <TableCell className="font-mono font-semibold">
                        {camion.placa}
                      </TableCell>
                      <TableCell>
                        {camion.capacidad_tanque
                          ? `${camion.capacidad_tanque} m³`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {camion.dni || "N/A"}
                      </TableCell>
                      <TableCell>{nombreCompleto}</TableCell>
                      <TableCell>
                        {camion.razon_social_empresa || (
                          <span className="text-muted-foreground italic">
                            Sin proveedor asignado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCamion(camion);
                          }}
                        >
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer con información */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredCamiones.length} de {camiones.length} camiones
        </div>
      </DialogContent>
    </Dialog>
  );
}
