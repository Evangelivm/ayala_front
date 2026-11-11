"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ordenesCompraApi, ordenesServicioApi } from "@/lib/connections";
import { useToast } from "@/hooks/use-toast";

type Firma = "sin" | "vladimir" | "raul";

interface OrdenPdfFirmaProps {
  // URL base del PDF. "#" si no hay orden.
  href: string;
  tipo: "compra" | "servicio";
  idOrden?: number | null;
  // Firma guardada en la orden (columna firma_genera)
  firmaGuardada?: string | null;
}

const normalizar = (v?: string | null): Firma =>
  v === "vladimir" || v === "raul" ? v : "sin";

// Botón PDF + menú "Firma". La elección se guarda en la orden (BD) y el PDF
// la usa automáticamente. Con firma el botón dice "PDF con firma".
export default function OrdenPdfFirma({
  href,
  tipo,
  idOrden,
  firmaGuardada,
}: OrdenPdfFirmaProps) {
  const { toast } = useToast();
  const [firma, setFirma] = useState<Firma>(normalizar(firmaGuardada));
  const conFirma = firma !== "sin";

  // Si la orden se recarga (p. ej. por websocket) se sincroniza con la BD
  useEffect(() => {
    setFirma(normalizar(firmaGuardada));
  }, [firmaGuardada]);

  const cambiarFirma = async (nueva: Firma) => {
    if (!idOrden) return;
    const anterior = firma;
    setFirma(nueva);
    try {
      const api = tipo === "compra" ? ordenesCompraApi : ordenesServicioApi;
      await api.actualizarFirma(idOrden, nueva === "sin" ? null : nueva);
    } catch {
      setFirma(anterior);
      toast({
        title: "No se pudo guardar la firma",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
      >
        <FileText className="h-3 w-3" />
        {conFirma ? "PDF con firma" : "PDF"}
      </a>
      <Menubar className="h-auto p-0 border-0 bg-transparent shadow-none space-x-0">
        <MenubarMenu>
          <MenubarTrigger className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
            Firma
          </MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup
              value={firma}
              onValueChange={(v) => cambiarFirma(v as Firma)}
            >
              <MenubarRadioItem value="vladimir">Vladimir</MenubarRadioItem>
              <MenubarRadioItem value="raul">Raul</MenubarRadioItem>
              <MenubarRadioItem value="sin">Sin firma</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
