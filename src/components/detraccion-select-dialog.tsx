"use client";

import { useState, useEffect } from "react";
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
import { Search } from "lucide-react";

interface TipoDetraccion {
  id_tipo_detraccion: string;
  tipo_detraccion: string;
  porcentaje_detraccion: number;
}

interface DetraccionSelectDialogProps {
  onSelect: (porcentaje: number, codigo: string, descripcion: string) => void;
  currentPorcentaje?: number;
  currentCodigo?: string; // Código del tipo de detracción actualmente seleccionado
  buttonText?: string;
  buttonClassName?: string;
}

export function DetraccionSelectDialog({
  onSelect,
  currentPorcentaje,
  currentCodigo,
  buttonText = "Seleccionar tipo de detracción",
  buttonClassName = "",
}: DetraccionSelectDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);
  const [tiposDetraccion, setTiposDetraccion] = useState<TipoDetraccion[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar tipos de detracción desde la API
  useEffect(() => {
    const fetchTiposDetraccion = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tipo-detraccion`
        );
        if (response.ok) {
          const data = await response.json();
          setTiposDetraccion(data);
        }
      } catch (error) {
        console.error("Error al cargar tipos de detracción:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTiposDetraccion();
  }, []);

  // Filtrar tipos de detracción según búsqueda
  const tiposFiltrados = tiposDetraccion.filter((tipo) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      tipo.id_tipo_detraccion.toLowerCase().includes(query) ||
      tipo.tipo_detraccion.toLowerCase().includes(query) ||
      tipo.porcentaje_detraccion.toString().includes(query)
    );
  });

  const handleSelectTipo = () => {
    if (selectedCodigo) {
      const tipo = tiposDetraccion.find(
        (t) => t.id_tipo_detraccion === selectedCodigo
      );
      if (tipo) {
        onSelect(
          parseFloat(tipo.porcentaje_detraccion.toString()),
          tipo.id_tipo_detraccion,
          tipo.tipo_detraccion
        );
        setOpen(false);
        setSelectedCodigo(null);
        setSearchQuery("");
      }
    }
  };

  const handleRowClick = (codigo: string) => {
    setSelectedCodigo(codigo);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-start text-left font-normal ${buttonClassName}`}
        >
          {currentCodigo
            ? `${currentPorcentaje}% - ${
                tiposDetraccion.find(
                  (t) => t.id_tipo_detraccion === currentCodigo
                )?.tipo_detraccion || "Seleccionado"
              }`
            : buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Seleccionar Tipo de Detracción</DialogTitle>
          <DialogDescription>
            Seleccione el tipo de bien o servicio sujeto a detracción según
            SUNAT
          </DialogDescription>
        </DialogHeader>

        {/* Buscador */}
        <div className="flex gap-2 items-center px-4 pt-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="Buscar por código, producto o porcentaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de tipos de detracción - con scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-purple-100 z-10">
                <TableRow>
                  <TableHead className="text-xs font-bold text-center w-24">
                    CÓD
                  </TableHead>
                  <TableHead className="text-xs font-bold">PRODUCTO</TableHead>
                  <TableHead className="text-xs font-bold text-center w-24">
                    %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-gray-400"
                    >
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : tiposFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-gray-400"
                    >
                      No se encontraron resultados
                    </TableCell>
                  </TableRow>
                ) : (
                  tiposFiltrados.map((tipo) => (
                    <TableRow
                      key={tipo.id_tipo_detraccion}
                      className={`cursor-pointer transition-colors ${
                        selectedCodigo === tipo.id_tipo_detraccion
                          ? "bg-purple-200 hover:bg-purple-300"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleRowClick(tipo.id_tipo_detraccion)}
                    >
                      <TableCell className="text-xs text-center font-mono font-semibold">
                        {tipo.id_tipo_detraccion}
                      </TableCell>
                      <TableCell className="text-xs">
                        {tipo.tipo_detraccion}
                      </TableCell>
                      <TableCell className="text-xs text-center font-semibold text-purple-700">
                        {parseFloat(tipo.porcentaje_detraccion.toString()).toFixed(
                          2
                        )}
                        %
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Botones fijos en la parte inferior */}
        <div className="flex gap-2 justify-start p-4 border-t bg-white flex-shrink-0">
          <Button
            className="h-9 px-4 text-xs bg-purple-600 hover:bg-purple-700"
            onClick={handleSelectTipo}
            disabled={!selectedCodigo}
          >
            Seleccionar
          </Button>
          <Button
            variant="outline"
            className="h-9 px-4 text-xs"
            onClick={() => {
              setOpen(false);
              setSelectedCodigo(null);
              setSearchQuery("");
            }}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
