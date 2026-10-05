"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import {
  searchApi,
  ordenesCompraApi,
  ordenesServicioApi,
  type OrdenCompraData,
  type OrdenServicioData,
} from "@/lib/connections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type OrdenAny = OrdenCompraData & OrdenServicioData;

interface ConvertirMultifacturaDialogProps {
  orden: OrdenCompraData | OrdenServicioData | null;
  tipo: "compra" | "servicio";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Se llama tras agrupar / sacar del grupo, para recargar el listado
  onDone: () => void;
  // Abre el formulario de orden nueva (modo "nueva-en-grupo") junto a esta orden
  onCrearNueva: () => void;
}

type Modo = "existentes" | "grupo" | "nueva";

const moneda = (m: string | undefined) => (m === "DOLARES" ? "$" : "S/");

const mensajeDeError = (error: unknown): string => {
  if (error && typeof error === "object") {
    // @ts-expect-error - error de Axios
    const data = error.response?.data;
    if (data?.message) return Array.isArray(data.message) ? data.message.join(", ") : data.message;
    if (error instanceof Error) return error.message;
  }
  return "Error desconocido";
};

export function ConvertirMultifacturaDialog(props: ConvertirMultifacturaDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <ContenidoConvertir {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ContenidoConvertir({
  orden,
  tipo,
  onOpenChange,
  onDone,
  onCrearNueva,
}: ConvertirMultifacturaDialogProps) {
  const o = orden as OrdenAny | null;
  const yaEnGrupo = !!o?.grupo_id;
  const [modo, setModo] = useState<Modo>(yaEnGrupo ? "nueva" : "existentes");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<OrdenAny[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [grupoElegido, setGrupoElegido] = useState<string | null>(null);

  const baseId = o ? (tipo === "compra" ? o.id_orden_compra : o.id_orden_servicio) : undefined;
  const idDe = (x: OrdenAny) => (tipo === "compra" ? x.id_orden_compra : x.id_orden_servicio);
  const api = tipo === "compra" ? ordenesCompraApi : ordenesServicioApi;

  // Búsqueda (con retraso al escribir) para los modos que listan órdenes
  useEffect(() => {
    if (yaEnGrupo || modo === "nueva") return;
    let cancelado = false;
    const timer = setTimeout(
      () => {
        setCargando(true);
        const buscar = tipo === "compra" ? searchApi.ordenesCompra : searchApi.ordenesServicio;
        // En "grupo" se piden también las hermanas para ver cada multifactura completa
        buscar(busqueda, 1, 50, { agrupar: modo === "grupo" })
          .then((r) => {
            if (!cancelado) setResultados(r.data as OrdenAny[]);
          })
          .catch(() => {
            if (!cancelado) toast.error("Error al buscar órdenes");
          })
          .finally(() => {
            if (!cancelado) setCargando(false);
          });
      },
      busqueda ? 400 : 0
    );
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [yaEnGrupo, modo, busqueda, tipo]);

  // Órdenes que se pueden juntar: otras, vigentes y que no estén ya en una multifactura
  const candidatas = resultados.filter((x) => idDe(x) !== baseId && !x.deleted_at);

  // Multifacturas existentes que aparecen en el resultado
  const grupos = useMemo(() => {
    const mapa = new Map<string, OrdenAny[]>();
    for (const x of resultados) {
      if (!x.grupo_id || x.deleted_at) continue;
      mapa.set(x.grupo_id, [...(mapa.get(x.grupo_id) ?? []), x]);
    }
    return [...mapa.entries()].map(([id, ordenes]) => ({
      id,
      ordenes: ordenes.sort((a, b) => a.numero_orden.localeCompare(b.numero_orden)),
    }));
  }, [resultados]);

  const alternarSeleccion = (id: number) =>
    setSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const avisarCotizacion = (reemplazadas: string[]) => {
    if (reemplazadas.length > 0) {
      toast.warning("Se usó la cotización del grupo", {
        description: `Estas órdenes tenían otra cotización y ahora usan la del grupo: ${reemplazadas.join(", ")}`,
        duration: 10000,
      });
    }
  };

  const confirmar = async () => {
    if (!baseId || guardando) return;
    try {
      if (modo === "nueva") {
        onOpenChange(false);
        onCrearNueva();
        return;
      }
      setGuardando(true);
      if (modo === "existentes") {
        const r = await api.agrupar([baseId, ...seleccionadas]);
        toast.success(`Multifactura creada con ${r.ordenes.length} órdenes`, {
          description: r.ordenes.map((x) => x.numero_orden).join(", "),
        });
        avisarCotizacion(r.cotizacion_reemplazada);
      } else {
        if (!grupoElegido) return;
        const r = await api.agrupar([baseId], grupoElegido);
        toast.success("Orden agregada a la multifactura", {
          description: r.ordenes.map((x) => x.numero_orden).join(", "),
        });
        avisarCotizacion(r.cotizacion_reemplazada);
      }
      onDone();
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo convertir en multifactura", {
        description: mensajeDeError(error),
        duration: 8000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const sacarDelGrupo = async () => {
    if (!baseId || guardando) return;
    if (!window.confirm(`¿Sacar la orden ${o?.numero_orden} de su multifactura?`)) return;
    setGuardando(true);
    try {
      await api.desagrupar(baseId);
      toast.success("Orden sacada de la multifactura");
      onDone();
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo sacar la orden del grupo", { description: mensajeDeError(error) });
    } finally {
      setGuardando(false);
    }
  };

  const botonModo = (valor: Modo, titulo: string, detalle: string) => (
    <button
      type="button"
      onClick={() => setModo(valor)}
      className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
        modo === valor ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <p className="text-sm font-semibold">{titulo}</p>
      <p className="text-xs text-slate-500">{detalle}</p>
    </button>
  );

  const puedeConfirmar =
    modo === "nueva" ||
    (modo === "existentes" && seleccionadas.length > 0) ||
    (modo === "grupo" && !!grupoElegido);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogHeader>
          <DialogTitle>
            Convertir en multifactura — Orden de {tipo === "compra" ? "Compra" : "Servicio"}{" "}
            {o?.numero_orden}
          </DialogTitle>
          <DialogDescription>
            Una multifactura agrupa varias órdenes: cada una conserva su número y su factura, y
            comparten una sola cotización.
          </DialogDescription>
        </DialogHeader>

        {yaEnGrupo ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm">
              Esta orden ya pertenece a una multifactura. Puedes crear una orden nueva en ese mismo
              grupo, o sacarla del grupo.
            </div>
            <div className="flex gap-2">
              {botonModo("nueva", "Con una orden nueva", "Crear otra orden dentro de este grupo")}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            {botonModo("existentes", "Juntar con órdenes existentes", "Elige otras órdenes ya creadas")}
            {botonModo("grupo", "Agregar a una multifactura", "Súmala a un grupo que ya existe")}
            {botonModo("nueva", "Con una orden nueva", "Crea una orden nueva junto a esta")}
          </div>
        )}

        {!yaEnGrupo && modo !== "nueva" && (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por número, proveedor, estado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="min-h-[160px] flex-1 overflow-y-auto rounded-lg border">
              {cargando ? (
                <p className="p-4 text-center text-sm text-slate-500">Buscando...</p>
              ) : modo === "existentes" ? (
                candidatas.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">No hay órdenes para mostrar</p>
                ) : (
                  candidatas.map((x) => {
                    const id = idDe(x)!;
                    const bloqueada = !!x.grupo_id;
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 ${
                          bloqueada ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={bloqueada}
                          checked={seleccionadas.includes(id)}
                          onChange={() => alternarSeleccion(id)}
                          className="h-4 w-4"
                        />
                        <span className="w-32 font-mono font-bold">{x.numero_orden}</span>
                        <span className="flex-1 truncate">{x.nombre_proveedor || "Sin proveedor"}</span>
                        <span className="font-mono">
                          {moneda(x.moneda)} {Number(x.total).toFixed(2)}
                        </span>
                        {bloqueada ? (
                          <Badge variant="outline" className="text-xs">Ya en multifactura</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-xs text-slate-700 hover:bg-slate-100">
                            {x.estado}
                          </Badge>
                        )}
                      </label>
                    );
                  })
                )
              ) : grupos.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">
                  No se encontraron multifacturas. Prueba buscando por el número de una de sus órdenes.
                </p>
              ) : (
                grupos.map((g) => (
                  <label
                    key={g.id}
                    className={`flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-slate-50 ${
                      grupoElegido === g.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="grupo-multifactura"
                      checked={grupoElegido === g.id}
                      onChange={() => setGrupoElegido(g.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-mono font-bold">
                        {g.ordenes.map((x) => x.numero_orden).join(", ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[...new Set(g.ordenes.map((x) => x.nombre_proveedor).filter(Boolean))].join(", ") ||
                          "Sin proveedor"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{g.ordenes.length} órdenes</Badge>
                  </label>
                ))
              )}
            </div>

            {modo === "existentes" && (
              <p className="text-xs text-slate-500">
                {seleccionadas.length === 0
                  ? "Marca al menos una orden para juntarla con esta."
                  : `${seleccionadas.length + 1} órdenes formarán la multifactura (esta y ${seleccionadas.length} más).`}
              </p>
            )}
          </div>
        )}

        {modo === "nueva" && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Se abrirá el formulario de una orden nueva con su número ya reservado. Al guardarla,
            quedará junto a la orden {o?.numero_orden} en la misma multifactura.
          </p>
        )}

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <div>
            {yaEnGrupo && (
              <Button
                variant="outline"
                onClick={sacarDelGrupo}
                disabled={guardando}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Sacar de la multifactura
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={confirmar}
              disabled={!puedeConfirmar || guardando}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {guardando ? "Guardando..." : modo === "nueva" ? "Continuar" : "Convertir"}
            </Button>
          </div>
        </div>
    </div>
  );
}
