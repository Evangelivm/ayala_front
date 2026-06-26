"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, X, Check, Building2, Search, Loader2 } from "lucide-react";
import { empresasApi, type EmpresaData } from "@/lib/connections";

interface EditEmpresasDialogProps {
  onEmpresaUpdated: () => void;
}

export function EditEmpresasDialog({ onEmpresaUpdated }: EditEmpresasDialogProps) {
  const [open, setOpen] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCodigo, setEditingCodigo] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmpresaData>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadEmpresas = async () => {
    setIsLoadingEmpresas(true);
    try {
      const data = await empresasApi.getAll();
      setEmpresas(data);
    } catch {
      toast.error("Error al cargar empresas");
    } finally {
      setIsLoadingEmpresas(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadEmpresas();
      setSearchTerm("");
      setEditingCodigo(null);
      setEditForm({});
    }
  }, [open]);

  const filteredEmpresas = empresas.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      (e.razon_social || "").toLowerCase().includes(term) ||
      (e.nro_documento || "").toLowerCase().includes(term) ||
      (e.codigo || "").toLowerCase().includes(term)
    );
  });

  const startEdit = (empresa: EmpresaData) => {
    setEditingCodigo(empresa.codigo);
    setEditForm({
      razon_social: empresa.razon_social || "",
      nro_documento: empresa.nro_documento || "",
      tipo: empresa.tipo || "",
      direccion: empresa.direccion || "",
    });
  };

  const cancelEdit = () => {
    setEditingCodigo(null);
    setEditForm({});
  };

  const saveEdit = async (codigo: string) => {
    if (!editForm.razon_social?.trim()) {
      toast.error("La razón social es obligatoria");
      return;
    }
    setIsSaving(true);
    try {
      await empresasApi.update(codigo, editForm);
      toast.success("Empresa actualizada");
      setEditingCodigo(null);
      setEditForm({});
      await loadEmpresas();
      onEmpresaUpdated();
    } catch {
      toast.error("Error al actualizar empresa");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) cancelEdit();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Building2 className="h-4 w-4 mr-2" />
          Editar Empresas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-600" />
            Gestión de Empresas
            {empresas.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({empresas.length} empresas)
              </span>
            )}
          </DialogTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por razón social, RUC o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {isLoadingEmpresas ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredEmpresas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No se encontraron empresas con ese criterio" : "No hay empresas registradas"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Código</TableHead>
                  <TableHead className="w-[140px]">RUC / Documento</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead className="w-[90px]">Tipo</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="w-[90px] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => {
                  const isEditing = editingCodigo === empresa.codigo;
                  return (
                    <TableRow
                      key={empresa.codigo}
                      className={isEditing ? "bg-orange-50 border-l-4 border-orange-400" : ""}
                    >
                      <TableCell className="font-mono text-xs text-slate-500">
                        {empresa.codigo}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm.nro_documento || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, nro_documento: e.target.value }))
                            }
                            className="h-8 text-sm"
                            maxLength={20}
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="font-mono text-sm">{empresa.nro_documento || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm.razon_social || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, razon_social: e.target.value }))
                            }
                            className="h-8 text-sm font-medium"
                            maxLength={255}
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="font-medium text-sm">{empresa.razon_social || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm.tipo || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, tipo: e.target.value }))
                            }
                            className="h-8 text-sm"
                            maxLength={50}
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="text-sm text-slate-600">{empresa.tipo || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm.direccion || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, direccion: e.target.value }))
                            }
                            className="h-8 text-sm"
                            maxLength={255}
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="text-sm text-slate-600 line-clamp-2">
                            {empresa.direccion || "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                              onClick={() => saveEdit(empresa.codigo)}
                              disabled={isSaving}
                              title="Guardar"
                            >
                              {isSaving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                              onClick={cancelEdit}
                              disabled={isSaving}
                              title="Cancelar"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-orange-600"
                            onClick={() => startEdit(empresa)}
                            disabled={!!editingCodigo}
                            title="Editar"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
