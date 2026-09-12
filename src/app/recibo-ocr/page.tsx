"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Camera,
  Coins,
  FileText,
  Hash,
  Loader2,
  Receipt,
  ScanText,
  UploadCloud,
  X,
} from "lucide-react";
import {
  reciboOcrApi,
  type CamposRecibo,
  type ReciboOcrResult,
} from "@/lib/connections";
import { cn } from "@/lib/utils";

const TIPOS_ACEPTADOS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const TAMANO_MAXIMO_MB = 10;

const ETIQUETAS_TIPO: Record<string, string> = {
  FACTURA: "Factura",
  BOLETA: "Boleta de venta",
  TICKET: "Ticket",
  NOTA_VENTA: "Nota de venta",
};

function formatearMonto(valor: number | null, moneda: CamposRecibo["moneda"]) {
  if (valor === null) return "—";
  const simbolo = moneda === "USD" ? "US$" : "S/";
  return `${simbolo} ${valor.toFixed(2)}`;
}

interface CampoTileProps {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}

function CampoTile({ icono, etiqueta, valor, destacado }: CampoTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm backdrop-blur-xl transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
        destacado && "border-blue-200 bg-blue-50/70",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {icono}
        {etiqueta}
      </div>
      <p
        className={cn(
          "mt-1.5 truncate text-lg font-semibold text-gray-900",
          destacado && "text-blue-700",
        )}
        title={valor}
      >
        {valor}
      </p>
    </div>
  );
}

export default function ReciboOcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ReciboOcrResult | null>(null);
  const [mostrarTexto, setMostrarTexto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const seleccionarArchivo = useCallback((selected: File | undefined | null) => {
    if (!selected) return;

    if (!TIPOS_ACEPTADOS.includes(selected.type)) {
      toast.error("Formato no permitido. Usa una foto JPG, PNG o WEBP");
      return;
    }
    if (selected.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      toast.error(`La imagen supera el tamaño máximo (${TAMANO_MAXIMO_MB} MB)`);
      return;
    }

    setFile(selected);
    setResultado(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }, []);

  const limpiar = useCallback(() => {
    setFile(null);
    setResultado(null);
    setMostrarTexto(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setArrastrando(false);
      seleccionarArchivo(e.dataTransfer.files?.[0]);
    },
    [seleccionarArchivo],
  );

  const extraerDatos = useCallback(async () => {
    if (!file) return;
    setCargando(true);
    try {
      const data = await reciboOcrApi.extraer(file);
      setResultado(data);
      if (!data.campos.total && !data.campos.ruc) {
        toast.warning("Se leyó la imagen, pero no se reconocieron campos claros");
      } else {
        toast.success("Datos extraídos del recibo");
      }
    } catch (error) {
      console.error("Error extrayendo recibo:", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo procesar la imagen",
      );
    } finally {
      setCargando(false);
    }
  }, [file]);

  const campos = resultado?.campos;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="active:scale-90 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
              Extractor de Recibos
            </h1>
            <p className="text-sm text-gray-500">
              Sube la foto de una boleta o factura y extrae sus datos automáticamente
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* Columna de carga */}
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-6 text-center backdrop-blur-xl transition-colors duration-200 ease-out",
                arrastrando && "border-blue-400 bg-blue-50/60",
                previewUrl && "border-solid border-gray-200 p-0",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept={TIPOS_ACEPTADOS.join(",")}
                onChange={(e) => seleccionarArchivo(e.target.files?.[0])}
                className="hidden"
              />

              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Vista previa del recibo"
                    className="max-h-[420px] w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      limpiar();
                    }}
                    className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur transition-transform duration-150 ease-out active:scale-90 hover:bg-black/75"
                    aria-label="Quitar imagen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:bg-blue-50 group-hover:text-blue-500">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Arrastra la foto del recibo aquí
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    o haz clic para seleccionarla · JPG, PNG o WEBP · máx. {TAMANO_MAXIMO_MB} MB
                  </p>
                </>
              )}
            </div>

            <Button
              onClick={extraerDatos}
              disabled={!file || cargando}
              className="w-full gap-2 transition-transform duration-150 ease-out active:scale-[0.97]"
              size="lg"
            >
              {cargando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Leyendo recibo…
                </>
              ) : (
                <>
                  <ScanText className="h-4 w-4" />
                  Extraer datos
                </>
              )}
            </Button>

            {!file && (
              <p className="flex items-start gap-2 text-xs text-gray-400">
                <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Consejo: toma la foto con buena luz y evita reflejos para que el
                reconocimiento de texto sea más preciso.
              </p>
            )}
          </div>

          {/* Columna de resultados */}
          <div className="min-h-[280px]">
            {!resultado && !cargando && (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/40 p-8 text-center text-gray-400">
                <Receipt className="mb-3 h-10 w-10" />
                <p className="text-sm">
                  Los campos detectados aparecerán aquí después de procesar la imagen
                </p>
              </div>
            )}

            {cargando && (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white/60 p-8 text-center backdrop-blur-xl">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">
                  Reconociendo el texto de la imagen…
                </p>
              </div>
            )}

            {resultado && campos && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <CampoTile
                    icono={<Building2 className="h-3.5 w-3.5" />}
                    etiqueta="RUC"
                    valor={campos.ruc ?? "No detectado"}
                  />
                  <CampoTile
                    icono={<FileText className="h-3.5 w-3.5" />}
                    etiqueta="Comprobante"
                    valor={
                      campos.tipoComprobante
                        ? ETIQUETAS_TIPO[campos.tipoComprobante]
                        : "No detectado"
                    }
                  />
                  <CampoTile
                    icono={<Hash className="h-3.5 w-3.5" />}
                    etiqueta="Serie-Correlativo"
                    valor={
                      campos.serie && campos.correlativo
                        ? `${campos.serie}-${campos.correlativo}`
                        : "No detectado"
                    }
                  />
                  <CampoTile
                    icono={<Calendar className="h-3.5 w-3.5" />}
                    etiqueta="Fecha"
                    valor={campos.fecha ?? "No detectada"}
                  />
                  <CampoTile
                    icono={<Coins className="h-3.5 w-3.5" />}
                    etiqueta="Moneda"
                    valor={campos.moneda ?? "No detectada"}
                  />
                  <CampoTile
                    icono={<Coins className="h-3.5 w-3.5" />}
                    etiqueta="Subtotal"
                    valor={formatearMonto(campos.subtotal, campos.moneda)}
                  />
                  <CampoTile
                    icono={<Coins className="h-3.5 w-3.5" />}
                    etiqueta="IGV"
                    valor={formatearMonto(campos.igv, campos.moneda)}
                  />
                  <CampoTile
                    icono={<Coins className="h-3.5 w-3.5" />}
                    etiqueta="Total"
                    valor={formatearMonto(campos.total, campos.moneda)}
                    destacado
                  />
                </div>

                <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => setMostrarTexto((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Texto reconocido por el OCR
                    <span className="text-xs text-gray-400">
                      {mostrarTexto ? "Ocultar" : "Ver"}
                    </span>
                  </button>
                  {mostrarTexto && (
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-black/5 px-4 py-3 text-xs text-gray-500">
                      {resultado.texto || "Sin texto reconocido"}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
