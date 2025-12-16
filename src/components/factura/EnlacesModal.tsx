import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FileCode,
  FileCheck2,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

interface EnlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  factura: {
    id: number;
    numero_factura: string;
    proveedor: string;
    total: number;
    enlace_pdf?: string | null;
    enlace_xml?: string | null;
    enlace_cdr?: string | null;
    aceptada_por_sunat?: boolean | null;
    sunat_description?: string | null;
    sunat_note?: string | null;
  } | null;
}

export function EnlacesModal({ isOpen, onClose, factura }: EnlacesModalProps) {
  if (!factura) {
    console.log("⚠️ EnlacesModal: No hay factura para mostrar");
    return null;
  }

  console.log("📄 EnlacesModal renderizando con factura:", {
    id: factura.id,
    numero_factura: factura.numero_factura,
    proveedor: factura.proveedor,
    total: factura.total,
    enlaces: {
      pdf: factura.enlace_pdf,
      xml: factura.enlace_xml,
      cdr: factura.enlace_cdr,
    },
    sunat: {
      aceptada: factura.aceptada_por_sunat,
      description: factura.sunat_description,
      note: factura.sunat_note,
    }
  });

  const hasAnyEnlace = factura.enlace_pdf || factura.enlace_xml || factura.enlace_cdr;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Detalles de Factura {factura.numero_factura || "N/A"}
          </DialogTitle>
          <DialogDescription>
            Proveedor: {factura.proveedor || "Sin proveedor"} | Total: S/ {Number(factura.total || 0).toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Estado SUNAT */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Estado SUNAT
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-32">Aceptación:</span>
                {factura.aceptada_por_sunat === true && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Aceptada por SUNAT
                  </Badge>
                )}
                {factura.aceptada_por_sunat === false && (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Rechazada por SUNAT
                  </Badge>
                )}
                {factura.aceptada_por_sunat === null && (
                  <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Sin información
                  </Badge>
                )}
              </div>

              {factura.sunat_description && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-600 w-32 flex-shrink-0">Descripción:</span>
                  <p className="text-sm text-gray-800 flex-1">{factura.sunat_description}</p>
                </div>
              )}

              {factura.sunat_note && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-600 w-32 flex-shrink-0">Nota:</span>
                  <p className="text-sm text-gray-800 flex-1">{factura.sunat_note}</p>
                </div>
              )}

              {!factura.sunat_description && !factura.sunat_note && (
                <p className="text-sm text-gray-500 italic">
                  No hay información adicional de SUNAT disponible
                </p>
              )}
            </div>
          </div>

          {/* Enlaces de Descarga */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Archivos Disponibles
            </h3>

            {!hasAnyEnlace && (
              <p className="text-sm text-gray-500 italic">
                No hay archivos disponibles para esta factura aún.
                Los archivos se generarán automáticamente cuando SUNAT procese el comprobante.
              </p>
            )}

            {hasAnyEnlace && (
              <div className="space-y-2">
                {factura.enlace_pdf && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => window.open(factura.enlace_pdf!, "_blank")}
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Representación Impresa (PDF)</p>
                      <p className="text-xs text-gray-500">Documento visual del comprobante</p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                )}

                {factura.enlace_xml && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => window.open(factura.enlace_xml!, "_blank")}
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded">
                      <FileCode className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Comprobante Electrónico (XML)</p>
                      <p className="text-xs text-gray-500">Archivo estructurado para SUNAT</p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                )}

                {factura.enlace_cdr && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => window.open(factura.enlace_cdr!, "_blank")}
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded">
                      <FileCheck2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Constancia de Recepción (CDR)</p>
                      <p className="text-xs text-gray-500">Validación oficial de SUNAT</p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
