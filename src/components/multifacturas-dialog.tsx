"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ordenesCompraApi,
  ordenesServicioApi,
  type MultifacturaDetalle,
} from "@/lib/connections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, X } from "lucide-react";

type MultifacturaRow = {
  id_detalle?: number;
  nro_serie: string;
  nro_factura: string;
  galones: string;
  proyecto: string;
  url_factura?: string | null;
  url_guia?: string | null;
  file_factura?: File | null;
  file_guia?: File | null;
  dragging_factura?: boolean;
  dragging_guia?: boolean;
};

const emptyRow = (): MultifacturaRow => ({
  nro_serie: "",
  nro_factura: "",
  galones: "",
  proyecto: "",
});

interface MultifacturasDialogProps {
  ordenId: number | null;
  tipo: "compra" | "servicio" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultifacturasDialog({
  ordenId,
  tipo,
  open,
  onOpenChange,
}: MultifacturasDialogProps) {
  const [rows, setRows] = useState<MultifacturaRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !ordenId || !tipo) return;
    setLoading(true);
    const api = tipo === "compra" ? ordenesCompraApi : ordenesServicioApi;
    api
      .getMultifacturas(ordenId)
      .then((data: MultifacturaDetalle[]) => {
        if (data && data.length > 0) {
          setRows(
            data.map((d) => ({
              id_detalle: d.id_detalle,
              nro_serie: d.nro_serie || "",
              nro_factura: d.nro_factura || "",
              galones: d.galones || "",
              proyecto: d.proyecto || "",
              url_factura: d.url_factura,
              url_guia: d.url_guia,
            }))
          );
        } else {
          setRows([emptyRow()]);
        }
      })
      .catch(() => setRows([emptyRow()]))
      .finally(() => setLoading(false));
  }, [open, ordenId, tipo]);

  const handleSave = async () => {
    if (!ordenId || !tipo) return;
    setSaving(true);
    try {
      const api = tipo === "compra" ? ordenesCompraApi : ordenesServicioApi;
      const saved = await api.saveMultifacturas(
        ordenId,
        rows.map((r) => ({
          id_detalle: r.id_detalle,
          nro_serie: r.nro_serie,
          nro_factura: r.nro_factura,
          galones: r.galones,
          proyecto: r.proyecto,
        }))
      );

      const updatedRows = await Promise.all(
        rows.map(async (row, i) => {
          const detalleId = saved[i]?.id_detalle ?? row.id_detalle;
          let url_factura = row.url_factura;
          let url_guia = row.url_guia;

          if (row.file_factura && detalleId) {
            const fd = new FormData();
            fd.append("file", row.file_factura);
            const res = await api.uploadMultifacturaFactura(ordenId, detalleId, fd);
            url_factura = res.fileUrl;
          }
          if (row.file_guia && detalleId) {
            const fd = new FormData();
            fd.append("file", row.file_guia);
            const res = await api.uploadMultifacturaGuia(ordenId, detalleId, fd);
            url_guia = res.fileUrl;
          }

          return {
            ...row,
            id_detalle: detalleId,
            url_factura,
            url_guia,
            file_factura: null,
            file_guia: null,
          };
        })
      );

      setRows(updatedRows);
      toast.success("Guardado exitosamente");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const pickFile = (idx: number, field: "file_factura" | "file_guia") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: file } : r)));
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Multifacturas</DialogTitle>
          <DialogDescription>
            Orden {tipo === "compra" ? "de Compra" : "de Servicio"} #{ordenId}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            Cargando registros...
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap">Nro serie</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap">Nro factura</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap">Galones</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap">Proyecto</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap min-w-[150px]">Factura</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap min-w-[150px]">Guía</th>
                  <th className="border border-gray-300 px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {(["nro_serie", "nro_factura", "galones", "proyecto"] as const).map((field) => (
                      <td key={field} className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={row[field]}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, [field]: e.target.value } : r))
                            )
                          }
                          className="w-full h-7 px-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-teal-400"
                        />
                      </td>
                    ))}

                    {/* Columna Factura */}
                    <td className="border border-gray-300 p-1">
                      {row.url_factura && !row.file_factura ? (
                        <div className="flex items-center gap-1">
                          <a href={row.url_factura} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 truncate">
                            <ExternalLink className="h-3 w-3 shrink-0" /> Ver factura
                          </a>
                          <button title="Reemplazar" onClick={() => pickFile(idx, "file_factura")}
                            className="text-blue-400 hover:text-blue-600 shrink-0 text-xs px-1 border border-blue-200 rounded">↺</button>
                        </div>
                      ) : row.url_factura && row.file_factura ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 line-through truncate text-xs flex-1">actual</span>
                            <button onClick={() => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, file_factura: null } : r))}
                              className="text-gray-300 hover:text-red-400 shrink-0 text-xs" title="Cancelar reemplazo">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="inline-flex items-center gap-1 px-1 py-0.5 bg-amber-100 text-amber-700 rounded text-xs truncate w-full">
                            <FileText className="h-3 w-3 shrink-0" />{row.file_factura.name}
                          </span>
                        </div>
                      ) : row.file_factura ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex-1 truncate">
                            <FileText className="h-3 w-3 shrink-0" />{row.file_factura.name}
                          </span>
                          <button onClick={() => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, file_factura: null } : r))}
                            className="text-gray-400 hover:text-red-500 shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`h-10 border-2 border-dashed rounded flex items-center justify-center text-xs cursor-pointer transition-colors ${
                            row.dragging_factura ? "border-teal-400 bg-teal-50 text-teal-600" : "border-gray-300 text-gray-400 hover:border-teal-300 hover:text-teal-500"
                          }`}
                          onDragOver={(e) => { e.preventDefault(); setRows((prev) => prev.map((r, i) => i === idx ? { ...r, dragging_factura: true } : r)); }}
                          onDragLeave={() => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, dragging_factura: false } : r))}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) setRows((prev) => prev.map((r, i) => i === idx ? { ...r, file_factura: file, dragging_factura: false } : r));
                          }}
                          onClick={() => pickFile(idx, "file_factura")}
                        >
                          Arrastra o haz clic
                        </div>
                      )}
                    </td>

                    {/* Columna Guía */}
                    <td className="border border-gray-300 p-1">
                      {row.url_guia && !row.file_guia ? (
                        <div className="flex items-center gap-1">
                          <a href={row.url_guia} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 truncate">
                            <ExternalLink className="h-3 w-3 shrink-0" /> Ver guía
                          </a>
                          <button title="Reemplazar" onClick={() => pickFile(idx, "file_guia")}
                            className="text-blue-400 hover:text-blue-600 shrink-0 text-xs px-1 border border-blue-200 rounded">↺</button>
                        </div>
                      ) : row.url_guia && row.file_guia ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 line-through truncate text-xs flex-1">actual</span>
                            <button onClick={() => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, file_guia: null } : r))}
                              className="text-gray-300 hover:text-red-400 shrink-0 text-xs" title="Cancelar reemplazo">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="inline-flex items-center gap-1 px-1 py-0.5 bg-amber-100 text-amber-700 rounded text-xs truncate w-full">
                            <FileText className="h-3 w-3 shrink-0" />{row.file_guia.name}
                          </span>
                        </div>
                      ) : row.file_guia ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex-1 truncate">
                            <FileText className="h-3 w-3 shrink-0" />{row.file_guia.name}
                          </span>
                          <button onClick={() => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, file_guia: null } : r))}
                            className="text-gray-400 hover:text-red-500 shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`h-10 border-2 border-dashed rounded flex items-center justify-center text-xs cursor-pointer transition-colors ${
                            row.dragging_guia ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500"
                          }`}
                          onDragOver={(e) => { e.preventDefault(); setRows((prev) => prev.map((r, i) => i === idx ? { ...r, dragging_guia: true } : r)); }}
                          onDragLeave={() => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, dragging_guia: false } : r))}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) setRows((prev) => prev.map((r, i) => i === idx ? { ...r, file_guia: file, dragging_guia: false } : r));
                          }}
                          onClick={() => pickFile(idx, "file_guia")}
                        >
                          Arrastra o haz clic
                        </div>
                      )}
                    </td>

                    <td className="border border-gray-300 p-1 text-center">
                      <button
                        onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                        className="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold mx-auto"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            className="text-xs"
            disabled={loading || saving}
          >
            + Agregar fila
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={saving || loading || !ordenId}
              onClick={handleSave}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
