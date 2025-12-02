"use client";

import { useState } from "react";
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

// Tipos de detracción según SUNAT
const tiposDetraccion = [
  { codigo: "001", producto: "Azúcar y melaza de caña", porcentaje: 10.0 },
  { codigo: "003", producto: "Alcohol etílico", porcentaje: 10.0 },
  { codigo: "004", producto: "Recursos hidrobiológicos", porcentaje: 4.0 },
  { codigo: "005", producto: "Maíz amarillo duro", porcentaje: 4.0 },
  { codigo: "007", producto: "Caña de azúcar", porcentaje: 10.0 },
  { codigo: "008", producto: "Madera", porcentaje: 4.0 },
  { codigo: "009", producto: "Arena y piedra", porcentaje: 10.0 },
  {
    codigo: "010",
    producto: "Residuos, subproductos, desechos, y formas derivadas",
    porcentaje: 15.0,
  },
  {
    codigo: "011",
    producto: "Bienes gravados con el IGV, por renuncia a la exoneración",
    porcentaje: 12.0,
  },
  {
    codigo: "012",
    producto: "Intermediación laboral y tercerización",
    porcentaje: 12.0,
  },
  { codigo: "014", producto: "Carne y despojos comestibles", porcentaje: 4.0 },
  { codigo: "016", producto: "Aceite de pescado", porcentaje: 10.0 },
  {
    codigo: "017",
    producto: "Harina, polvo y pellets de pescado y demás invertebrados",
    porcentaje: 4.0,
  },
  { codigo: "019", producto: "Arrendamiento de bienes", porcentaje: 10.0 },
  {
    codigo: "020",
    producto: "Mantenimiento y reparación de bienes muebles",
    porcentaje: 12.0,
  },
  { codigo: "021", producto: "Movimiento de carga", porcentaje: 10.0 },
  {
    codigo: "023",
    producto: "Otros servicios empresariales",
    porcentaje: 12.0,
  },
  { codigo: "024", producto: "Comisión mercantil", porcentaje: 10.0 },
  {
    codigo: "025",
    producto: "Fabricación de bienes por encargo",
    porcentaje: 10.0,
  },
  {
    codigo: "026",
    producto: "Servicio de transporte de personas",
    porcentaje: 10.0,
  },
  { codigo: "027", producto: "Servicio de transporte de bienes", porcentaje: 4.0 },
  { codigo: "030", producto: "Contratos de construcción", porcentaje: 4.0 },
  { codigo: "031", producto: "Oro gravado con el IGV", porcentaje: 10.0 },
  {
    codigo: "032",
    producto: "Páprika y otros frutos de los géneros capsicum",
    porcentaje: 10.0,
  },
  {
    codigo: "034",
    producto: "Minerales metálicos no auríferos",
    porcentaje: 10.0,
  },
  { codigo: "035", producto: "Bienes exonerados del IGV", porcentaje: 1.5 },
  {
    codigo: "036",
    producto: "Oro y demás minerales metálicos exonerados del IGV",
    porcentaje: 1.5,
  },
  {
    codigo: "037",
    producto: "Demás servicios gravados con el IGV",
    porcentaje: 12.0,
  },
  { codigo: "039", producto: "Minerales no metálicos", porcentaje: 10.0 },
  {
    codigo: "040",
    producto: "Bien inmueble gravado con IGV por renuncia a la exoneración",
    porcentaje: 4.0,
  },
  { codigo: "0", producto: "NO APLICA", porcentaje: 0.0 },
];

interface DetraccionSelectDialogProps {
  onSelect: (porcentaje: number, codigo: string, descripcion: string) => void;
  currentPorcentaje?: number;
  buttonText?: string;
  buttonClassName?: string;
}

export function DetraccionSelectDialog({
  onSelect,
  currentPorcentaje,
  buttonText = "Seleccionar tipo de detracción",
  buttonClassName = "",
}: DetraccionSelectDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);

  // Filtrar tipos de detracción según búsqueda
  const tiposFiltrados = tiposDetraccion.filter((tipo) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      tipo.codigo.toLowerCase().includes(query) ||
      tipo.producto.toLowerCase().includes(query) ||
      tipo.porcentaje.toString().includes(query)
    );
  });

  const handleSelectTipo = () => {
    if (selectedCodigo) {
      const tipo = tiposDetraccion.find((t) => t.codigo === selectedCodigo);
      if (tipo) {
        onSelect(tipo.porcentaje, tipo.codigo, tipo.producto);
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
          {currentPorcentaje !== undefined
            ? `${currentPorcentaje}% - ${
                tiposDetraccion.find((t) => t.porcentaje === currentPorcentaje)
                  ?.producto || "Seleccionado"
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
                {tiposFiltrados.length === 0 ? (
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
                      key={tipo.codigo}
                      className={`cursor-pointer transition-colors ${
                        selectedCodigo === tipo.codigo
                          ? "bg-purple-200 hover:bg-purple-300"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleRowClick(tipo.codigo)}
                    >
                      <TableCell className="text-xs text-center font-mono font-semibold">
                        {tipo.codigo}
                      </TableCell>
                      <TableCell className="text-xs">{tipo.producto}</TableCell>
                      <TableCell className="text-xs text-center font-semibold text-purple-700">
                        {tipo.porcentaje.toFixed(2)}%
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
