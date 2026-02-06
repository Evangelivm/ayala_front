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
import type { CamionData, EmpresaData } from "@/lib/connections";
import { EditCamionDialog } from "@/components/edit-camion-dialog";

interface CamionSelectDialogProps {
  camiones: CamionData[];
  onSelect: (camion: CamionData) => void;
  buttonText?: string;
  currentPlaca?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  emptyMessage?: string;
  empresas?: EmpresaData[];
  onCamionUpdated?: () => void;
}

export function CamionSelectDialog({
  camiones,
  onSelect,
  buttonText = "Seleccionar Unidad",
  currentPlaca = "",
  dialogTitle = "Seleccionar Unidad (Camión)",
  dialogDescription = "Selecciona un camión de la lista. Puedes buscar por placa, DNI, nombre del chofer o proveedor.",
  emptyMessage = "camiones",
  empresas = [],
  onCamionUpdated,
}: CamionSelectDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'CAMION' | 'MAQUINARIA'>('TODOS');

  // Función helper para capitalizar texto
  const capitalizeText = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filtrar camiones según el término de búsqueda y tipo
  const filteredCamiones = camiones.filter((camion) => {
    const searchLower = searchTerm.toLowerCase();
    const nombreCompleto = camion.nombre_chofer && camion.apellido_chofer
      ? `${camion.nombre_chofer} ${camion.apellido_chofer}`.toLowerCase()
      : "";

    // Filtro de búsqueda
    const matchesSearch = (
      camion.placa.toLowerCase().includes(searchLower) ||
      camion.dni?.toLowerCase().includes(searchLower) ||
      nombreCompleto.includes(searchLower) ||
      camion.razon_social_empresa?.toLowerCase().includes(searchLower)
    );

    // Filtro de tipo
    const matchesTipo = tipoFiltro === 'TODOS' || camion.tipo === tipoFiltro;

    return matchesSearch && matchesTipo;
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
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
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

        {/* Filtro por tipo */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tipoFiltro === 'TODOS' ? 'default' : 'outline'}
              onClick={() => setTipoFiltro('TODOS')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={tipoFiltro === 'CAMION' ? 'default' : 'outline'}
              onClick={() => setTipoFiltro('CAMION')}
            >
              Camiones
            </Button>
            <Button
              size="sm"
              variant={tipoFiltro === 'MAQUINARIA' ? 'default' : 'outline'}
              onClick={() => setTipoFiltro('MAQUINARIA')}
            >
              Maquinarias
            </Button>
          </div>
        </div>

        {/* Tabla de camiones */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-[120px]">Placa</TableHead>
                <TableHead className="w-[120px]">Tipo</TableHead>
                <TableHead className="w-[140px]">Capacidad (m³)</TableHead>
                <TableHead className="w-[120px]">DNI</TableHead>
                <TableHead className="w-[240px]">Chofer</TableHead>
                <TableHead className="min-w-[250px]">Proveedor</TableHead>
                <TableHead className="w-[180px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCamiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm || tipoFiltro !== 'TODOS'
                      ? `No se encontraron ${emptyMessage} con ese criterio de búsqueda`
                      : `No hay ${emptyMessage} disponibles`}
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
                      className="hover:bg-blue-50"
                    >
                      <TableCell className="font-mono font-semibold">
                        {camion.placa}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            camion.tipo === 'CAMION'
                              ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                              : camion.tipo === 'MAQUINARIA'
                              ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800"
                              : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800"
                          }
                        >
                          {camion.tipo || "N/A"}
                        </span>
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
                        <div className="flex gap-2">
                          {empresas.length > 0 && (
                            <EditCamionDialog
                              camion={camion}
                              empresas={empresas}
                              onCamionUpdated={onCamionUpdated}
                              buttonText=""
                            />
                          )}
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCamion(camion);
                            }}
                          >
                            Seleccionar
                          </Button>
                        </div>
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
          Mostrando {filteredCamiones.length} de {camiones.length} {emptyMessage}
        </div>
      </DialogContent>
    </Dialog>
  );
}
