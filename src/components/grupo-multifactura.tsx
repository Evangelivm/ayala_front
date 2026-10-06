"use client";

import type { ReactNode } from "react";
import { ExternalLink, Plus, Upload } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Campos mínimos de una orden para poder agruparla en un listado
export type OrdenGrupable = {
  grupo_id?: string | null;
  grupo_codigo?: string | null; // MF-000045
  numero_orden: string;
  fecha_orden: string;
  nombre_proveedor?: string | null;
  moneda: string;
  total: number | string;
  estado: string;
  url_cotizacion?: string | null;
  deleted_at?: string | null;
};

// Agrupa las órdenes que comparten grupo_id (multifactura) en el lugar de la
// primera que aparece; las demás quedan como grupos de una sola orden.
export function agruparOrdenes<T extends OrdenGrupable>(ordenes: T[]): T[][] {
  const resultado: T[][] = [];
  const porGrupo = new Map<string, T[]>();
  for (const orden of ordenes) {
    if (!orden.grupo_id) {
      resultado.push([orden]);
      continue;
    }
    let grupo = porGrupo.get(orden.grupo_id);
    if (!grupo) {
      grupo = [];
      porGrupo.set(orden.grupo_id, grupo);
      resultado.push(grupo);
    }
    grupo.push(orden);
  }
  resultado.forEach((g) => g.sort((a, b) => a.numero_orden.localeCompare(b.numero_orden)));
  return resultado;
}

interface GrupoMultifacturaItemProps<T extends OrdenGrupable> {
  grupo: T[];
  tipo: "compra" | "servicio";
  getId: (orden: T) => number | undefined;
  // Detalle completo de una orden (el mismo que se ve cuando está sola)
  renderDetalle: (orden: T) => ReactNode;
  // Sube la cotización compartida (se sube a una orden y el sistema la copia al resto)
  onSubirCotizacion: (ordenId: number) => void;
  // Crear una orden nueva dentro de este grupo (recibe una orden del grupo como base)
  onAgregarOrden: (orden: T) => void;
}

// Fila del listado para un grupo de multifactura: un solo desplegable con una
// tab por orden y la cotización compartida arriba.
export function GrupoMultifacturaItem<T extends OrdenGrupable>({
  grupo,
  tipo,
  getId,
  renderDetalle,
  onSubirCotizacion,
  onAgregarOrden,
}: GrupoMultifacturaItemProps<T>) {
  const grupoId = grupo[0].grupo_id as string;
  const colorNumero = tipo === "compra" ? "text-red-700" : "text-green-700";
  const totales = grupo.reduce<Record<string, number>>((acc, o) => {
    acc[o.moneda] = (acc[o.moneda] || 0) + Number(o.total || 0);
    return acc;
  }, {});
  const proveedores = [...new Set(grupo.map((o) => o.nombre_proveedor).filter(Boolean))];
  const estados = [...new Set(grupo.map((o) => o.estado))];
  const urlCotizacion = grupo.find((o) => o.url_cotizacion)?.url_cotizacion;
  const primeraId = getId(grupo[0]);

  return (
    <AccordionItem
      value={`grupo-${grupoId}`}
      className="border border-teal-300 rounded-lg overflow-hidden"
    >
      <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-slate-50">
        <div className="flex items-center w-full gap-4 pr-4 flex-wrap">
          <div className="flex flex-col items-start min-w-[140px]">
            <span className="text-xs text-slate-500 font-medium">
              Multifactura{grupo[0].grupo_codigo ? ` ${grupo[0].grupo_codigo}` : ""} · {grupo.length} órdenes
            </span>
            <span className={`text-sm font-mono font-bold ${colorNumero}`}>
              {grupo.map((o) => o.numero_orden).join(", ")}
            </span>
          </div>
          <div className="flex flex-col items-start min-w-[100px]">
            <span className="text-xs text-slate-500 font-medium">Fecha</span>
            <span className="text-sm">{grupo[0].fecha_orden}</span>
          </div>
          <div className="flex flex-col items-start flex-1 min-w-[180px]">
            <span className="text-xs text-slate-500 font-medium">Proveedor</span>
            <span className="text-sm font-medium truncate max-w-full">
              {proveedores.length > 0 ? (
                proveedores.join(", ")
              ) : (
                <span className="text-slate-400 italic">-</span>
              )}
            </span>
          </div>
          <div className="flex flex-col items-start min-w-[80px]">
            <span className="text-xs text-slate-500 font-medium">Total</span>
            <span className="text-sm font-bold font-mono">
              {Object.entries(totales)
                .map(
                  ([m, v]) =>
                    `${m === "DOLARES" ? "$" : "S/"} ${v.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
                )
                .join(" + ")}
            </span>
          </div>
          <div className="flex flex-col items-start min-w-[100px]">
            <span className="text-xs text-slate-500 font-medium">Estado</span>
            <span className="flex gap-1 flex-wrap">
              {estados.map((e) => (
                <Badge key={e} className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs">
                  {e}
                </Badge>
              ))}
            </span>
            <Badge className="mt-1 bg-teal-100 text-teal-800 hover:bg-teal-100 text-xs">
              Multifactura
            </Badge>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 pt-2">
          {/* Cotización: una sola para todo el grupo */}
          <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
            <h4 className="text-xs font-bold text-slate-700">Cotización del grupo</h4>
            {urlCotizacion ? (
              <a
                href={urlCotizacion}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Ver cotización
              </a>
            ) : (
              <span className="text-xs text-slate-500">Sin cotización</span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAgregarOrden(grupo[0])}
              className="ml-auto border-teal-400 text-teal-700 hover:bg-teal-50 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar orden nueva
            </Button>
            <Button
              size="sm"
              onClick={() => primeraId && onSubirCotizacion(primeraId)}
              disabled={!primeraId}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
            >
              <Upload className="h-3.5 w-3.5" />
              {urlCotizacion ? "Reemplazar cotización" : "Subir cotización"}
            </Button>
          </div>

          <Tabs defaultValue={`orden-${primeraId}`}>
            <TabsList className="flex flex-wrap h-auto justify-start">
              {grupo.map((o) => (
                <TabsTrigger
                  key={getId(o)}
                  value={`orden-${getId(o)}`}
                  className="font-mono text-xs"
                >
                  {o.numero_orden}
                </TabsTrigger>
              ))}
            </TabsList>
            {grupo.map((o) => (
              <TabsContent key={getId(o)} value={`orden-${getId(o)}`}>
                {renderDetalle(o)}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
