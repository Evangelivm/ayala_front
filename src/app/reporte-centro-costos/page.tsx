"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ShoppingCart,
  Wrench,
  ExternalLink,
  FolderKanban,
  Inbox,
} from "lucide-react";
import { reporteCentroCostosApi, type CentroCostoRow } from "@/lib/connections";

const PAGE_SIZE = 20;

type TipoOrdenFiltro = "todos" | "compra" | "servicio";

function formatFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

export default function ReporteCentroCostosPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoOrden, setTipoOrden] = useState<TipoOrdenFiltro>("todos");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CentroCostoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce del texto de búsqueda (400ms), igual que en el resto del módulo
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Volver a la página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, tipoOrden]);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    reporteCentroCostosApi
      .getAll(
        searchTerm,
        page,
        PAGE_SIZE,
        tipoOrden === "todos" ? undefined : tipoOrden
      )
      .then((result) => {
        if (cancelado) return;
        setData(result.data);
        setTotal(result.total);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("Error cargando reporte de centro de costos:", err);
        setError("No se pudo cargar el reporte. Intenta nuevamente.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [searchTerm, tipoOrden, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-700" />
                Reporte de Centro de Costos
              </h1>
              <p className="text-xs text-slate-500">
                N° de factura, comprobante y centro de costo por ítem — órdenes de compra y servicio
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-4">
        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por N° orden, N° factura, centro de costo, ítem..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={tipoOrden}
                onValueChange={(value) => setTipoOrden(value as TipoOrdenFiltro)}
              >
                <SelectTrigger className="w-full sm:w-48 cursor-pointer">
                  <SelectValue placeholder="Tipo de orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="compra">Órdenes de Compra</SelectItem>
                  <SelectItem value="servicio">Órdenes de Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Resultados
            </CardTitle>
            {!loading && (
              <Badge variant="secondary" className="font-mono">
                {total} {total === 1 ? "registro" : "registros"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setPage((p) => p)}
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>N° Orden</TableHead>
                    <TableHead>N° Factura</TableHead>
                    <TableHead>Centro Costo 1</TableHead>
                    <TableHead>Centro Costo 2</TableHead>
                    <TableHead>Centro Costo 3</TableHead>
                    <TableHead>Código Ítem</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>C. Costo Ítem</TableHead>
                    <TableHead className="text-right">Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array.from({ length: 11 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full max-w-[120px]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11}>
                        <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
                          <Inbox className="h-8 w-8" />
                          <p className="text-sm">
                            {searchTerm || tipoOrden !== "todos"
                              ? "No hay resultados que coincidan con los filtros"
                              : "No hay registros disponibles"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={`${row.tipo_orden}-${row.id_detalle}`}>
                        <TableCell>
                          {row.tipo_orden === "compra" ? (
                            <Badge className="bg-blue-600 text-white hover:bg-blue-600 border-transparent gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              Compra
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-600 text-white hover:bg-orange-600 border-transparent gap-1">
                              <Wrench className="h-3 w-3" />
                              Servicio
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatFecha(row.fecha_orden)}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {row.numero_orden}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {row.nro_factura || (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.centro_costo_nivel1 || (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.centro_costo_nivel2 || (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.centro_costo_nivel3 || (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {row.codigo_item}
                        </TableCell>
                        <TableCell
                          className="text-xs max-w-[420px] truncate"
                          title={row.descripcion_item}
                        >
                          {row.descripcion_item}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.centro_costo_item || (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.url ? (
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                            >
                              Ver
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Anterior
                </Button>
                <span className="text-sm text-slate-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
