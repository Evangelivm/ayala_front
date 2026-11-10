"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface OrdenPdfFirmaProps {
  // URL base del PDF (sin parámetro de firma). "#" si no hay orden.
  href: string;
}

// Botón PDF + menú "Firma". Con "Vladimir" el PDF se pide con ?firma=vladimir
// y el botón pasa a decir "PDF con firma"; con "Sin firma" dice solo "PDF".
export default function OrdenPdfFirma({ href }: OrdenPdfFirmaProps) {
  const [firma, setFirma] = useState<"sin" | "vladimir">("sin");
  const conFirma = firma === "vladimir";
  const url =
    href === "#" ? "#" : conFirma ? `${href}?firma=vladimir` : href;

  return (
    <div className="inline-flex items-center gap-1">
      <a
        href={url}
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
              onValueChange={(v) => setFirma(v as "sin" | "vladimir")}
            >
              <MenubarRadioItem value="vladimir">Vladimir</MenubarRadioItem>
              <MenubarRadioItem value="sin">Sin firma</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
