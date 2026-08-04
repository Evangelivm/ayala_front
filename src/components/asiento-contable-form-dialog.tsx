"use client";

import { useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CatalogosContabilidad, AsientoContableRowInput } from "@/lib/connections";

interface Props {
  catalogos: CatalogosContabilidad | null;
  current: AsientoContableRowInput;
  onAccept: (values: AsientoContableRowInput) => void;
  trigger: ReactNode;
  title?: string;
}

// Campos marcados "SI" (obligatorio) en la sección 3 del spec.
const CAMPOS_OBLIGATORIOS: (keyof AsientoContableRowInput)[] = [
  "correlativo", "relacionado", "ejercicio", "periodo", "cod_modulo", "modulo",
  "fuente", "numero_cuenta", "codigo_moneda_origen", "codigo_moneda_registro",
  "codigo_centro_costo", "codigo_sub_centro_costo", "codigo_sub_sub_centro_costo",
  "codigo_area", "monto_debe", "monto_haber", "cambio_moneda",
];

export function filaAsientoCompleta(row: AsientoContableRowInput): boolean {
  return CAMPOS_OBLIGATORIOS.every((campo) => {
    const v = row[campo];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
}

export function AsientoContableFormDialog({
  catalogos,
  current,
  onAccept,
  trigger,
  title = "Asiento contable",
}: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<AsientoContableRowInput>(current);

  const set = (field: keyof AsientoContableRowInput, value: unknown) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) setValues(current);
  };

  const handleAccept = () => {
    onAccept(values);
    setOpen(false);
  };

  const val = (field: keyof AsientoContableRowInput) => {
    const v = values[field];
    return v === undefined || v === null ? "" : String(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios (sección 3 de la especificación).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Información general (obligatoria) */}
          <section className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              Información General
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Correlativo *</Label>
                <Input type="number" value={val("correlativo")} onChange={(e) => set("correlativo", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Relacionado *</Label>
                <Input type="number" value={val("relacionado")} onChange={(e) => set("relacionado", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ejercicio *</Label>
                <Input value={val("ejercicio")} maxLength={4} placeholder="2026" onChange={(e) => set("ejercicio", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Periodo *</Label>
                <Input value={val("periodo")} maxLength={2} placeholder="01" onChange={(e) => set("periodo", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Módulo *</Label>
                <Select value={val("cod_modulo") || undefined} onValueChange={(v) => set("cod_modulo", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.modulo.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Módulo (nombre corto) *</Label>
                <Input value={val("modulo")} maxLength={4} placeholder="Ej: CT" onChange={(e) => set("modulo", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fuente *</Label>
                <Select value={val("fuente") || undefined} onValueChange={(v) => set("fuente", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.fuente.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>N° Cuenta *</Label>
                <Input value={val("numero_cuenta")} maxLength={50} onChange={(e) => set("numero_cuenta", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Moneda Origen *</Label>
                <Select value={val("codigo_moneda_origen") || undefined} onValueChange={(v) => set("codigo_moneda_origen", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.moneda.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Moneda Registro *</Label>
                <Select value={val("codigo_moneda_registro") || undefined} onValueChange={(v) => set("codigo_moneda_registro", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.moneda.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Centro Costo *</Label>
                <Input value={val("codigo_centro_costo")} maxLength={8} onChange={(e) => set("codigo_centro_costo", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Sub Centro Costo *</Label>
                <Input value={val("codigo_sub_centro_costo")} maxLength={8} onChange={(e) => set("codigo_sub_centro_costo", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Sub Sub Centro Costo *</Label>
                <Input value={val("codigo_sub_sub_centro_costo")} maxLength={8} onChange={(e) => set("codigo_sub_sub_centro_costo", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Área *</Label>
                <Input value={val("codigo_area")} maxLength={6} onChange={(e) => set("codigo_area", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Monto Debe *</Label>
                <Input type="number" step="0.01" value={val("monto_debe")} onChange={(e) => set("monto_debe", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Monto Haber *</Label>
                <Input type="number" step="0.01" value={val("monto_haber")} onChange={(e) => set("monto_haber", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Cambio Moneda *</Label>
                <Input type="number" step="0.001" value={val("cambio_moneda")} onChange={(e) => set("cambio_moneda", e.target.value)} />
              </div>
              <div className="space-y-1 col-span-2 md:col-span-4">
                <Label>Glosa</Label>
                <Textarea value={val("glosa")} maxLength={500} onChange={(e) => set("glosa", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Información adicional (opcional) */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">Información adicional</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Medio de Pago</Label>
                <Select value={val("codigo_tipo_medio_pago") || undefined} onValueChange={(v) => set("codigo_tipo_medio_pago", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.medioPago.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cod. Tipo Documento</Label>
                <Input value={val("codigo_tipo_documento")} maxLength={2} onChange={(e) => set("codigo_tipo_documento", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>N° Serie</Label>
                <Input value={val("numero_serie")} maxLength={20} onChange={(e) => set("numero_serie", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>N° Documento</Label>
                <Input value={val("numero_documento")} maxLength={20} onChange={(e) => set("numero_documento", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Concepto Flujo Efectivo</Label>
                <Select value={val("concepto_fec") || undefined} onValueChange={(v) => set("concepto_fec", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.conceptoFlujoEfectivo.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cod. Forma Provisión</Label>
                <Input value={val("codigo_forma_provision")} maxLength={2} onChange={(e) => set("codigo_forma_provision", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Forma de Pago/Cobro</Label>
                <Select value={val("codigo_forma_pago_cobro") || undefined} onValueChange={(v) => set("codigo_forma_pago_cobro", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.formaPago.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Identificador Ctr. Mda.</Label>
                <Input value={val("identificador_ctr_mda")} maxLength={1} onChange={(e) => set("identificador_ctr_mda", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Indicador Afecto</Label>
                <Select value={val("identificador_tip_afecto") || undefined} onValueChange={(v) => set("identificador_tip_afecto", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {catalogos?.indicadorAfecto.map((o) => (
                      <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>N° Cheque</Label>
                <Input value={val("nro_cheque")} maxLength={30} onChange={(e) => set("nro_cheque", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Grdo</Label>
                <Input value={val("grdo")} maxLength={100} onChange={(e) => set("grdo", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Fechas */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">Fechas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                ["fecha_emision_doc", "Emisión Doc."],
                ["fecha_vencimiento_doc", "Vencimiento Doc."],
                ["fecha_movimiento", "Movimiento"],
                ["fecha_cbr", "Cbr."],
                ["fecha_registro", "Registro"],
                ["fecha_conc", "Conciliación"],
                ["fecha_dif", "Diferimiento"],
              ] as const).map(([field, label]) => (
                <div className="space-y-1" key={field}>
                  <Label>{label}</Label>
                  <Input type="date" value={val(field)} onChange={(e) => set(field, e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* Auxiliares */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">
              Auxiliares (Cliente / Proveedor / Trabajador)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                ["cod_tip_doc_ident_clt", "nro_doc_clt", "razon_social_1", "Cliente"],
                ["cod_tip_doc_ident_prov", "nro_doc_prov", "razon_social_2", "Proveedor"],
                ["cod_tip_doc_ident_trab", "nro_doc_trab", "razon_social_3", "Trabajador"],
              ] as const).map(([campoTipo, campoNro, campoRazon, label]) => (
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border" key={label}>
                  <p className="text-xs font-medium text-slate-600">{label}</p>
                  <Select value={val(campoTipo) || undefined} onValueChange={(v) => set(campoTipo, v)}>
                    <SelectTrigger><SelectValue placeholder="Tipo Doc." /></SelectTrigger>
                    <SelectContent>
                      {catalogos?.tipoDocIdentidad.map((o) => (
                        <SelectItem key={o.codigo} value={o.codigo}>{o.codigo} - {o.descripcion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="N° Documento" value={val(campoNro)} maxLength={10} onChange={(e) => set(campoNro, e.target.value)} />
                  <Input placeholder="Razón Social" value={val(campoRazon)} onChange={(e) => set(campoRazon, e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* Montos en moneda extranjera + Indicadores */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">
              Montos en Moneda Extranjera e Indicadores
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Monto Debe ME</Label>
                <Input type="number" step="0.01" value={val("monto_debe_me")} onChange={(e) => set("monto_debe_me", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Monto Haber ME</Label>
                <Input type="number" step="0.01" value={val("monto_haber_me")} onChange={(e) => set("monto_haber_me", e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-4 col-span-2">
                {([
                  ["es_cancelado", "Cancelado"],
                  ["es_conciliado", "Conciliado"],
                  ["es_provision", "Provisión"],
                  ["es_anulado", "Anulado"],
                  ["es_destino", "Destino"],
                ] as const).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={values[field] === true}
                      onCheckedChange={(checked) => set(field, checked === true)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Documento de referencia */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">Documento de Referencia</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Fecha Emisión</Label>
                <Input type="date" value={val("doc_ref_fecha_emision")} onChange={(e) => set("doc_ref_fecha_emision", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Cod. Tipo Doc.</Label>
                <Input value={val("doc_ref_cod_tip_doc")} maxLength={2} onChange={(e) => set("doc_ref_cod_tip_doc", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>N° Serie</Label>
                <Input value={val("doc_ref_nro_serie")} maxLength={4} onChange={(e) => set("doc_ref_nro_serie", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>N° Documento</Label>
                <Input value={val("doc_ref_nro_doc")} maxLength={8} onChange={(e) => set("doc_ref_nro_doc", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>N° Detracción</Label>
                <Input value={val("numero_detraccion")} maxLength={8} onChange={(e) => set("numero_detraccion", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fecha Pago Detracción</Label>
                <Input value={val("fecha_pago_detraccion")} maxLength={8} onChange={(e) => set("fecha_pago_detraccion", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Campos adicionales */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">
              Campos Adicionales (uso libre CA01-CA15)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Array.from({ length: 15 }, (_, i) => {
                const field = `ca${String(i + 1).padStart(2, "0")}` as keyof AsientoContableRowInput;
                return (
                  <div className="space-y-1" key={field}>
                    <Label>CA{String(i + 1).padStart(2, "0")}</Label>
                    <Input value={val(field)} onChange={(e) => set(field, e.target.value)} />
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleAccept}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
