import { api, API_BASE_URL, uploadFileWithRetry } from "./client";
import { SearchResult } from "./search";

// ============ CONTABILIDAD (Importación de asientos contables) ============
export interface OpcionCatalogo {
  codigo: string;
  descripcion: string;
}

export interface CatalogosContabilidad {
  modulo: OpcionCatalogo[];
  fuente: OpcionCatalogo[];
  moneda: OpcionCatalogo[];
  tipoDocIdentidad: OpcionCatalogo[];
  formaPago: OpcionCatalogo[];
  medioPago: OpcionCatalogo[];
  indicadorAfecto: OpcionCatalogo[];
  conceptoFlujoEfectivo: OpcionCatalogo[];
}

// Una fila del voucher (columnas D:BX de la hoja CONTABILIDAD del Excel
// original). Acepta claves extra: el backend las descarta (.strip()).
export interface AsientoContableRowInput {
  correlativo: number | string;
  relacionado: number | string;
  codigo_tipo_medio_pago?: string;
  ejercicio: string;
  periodo: string;
  cod_modulo: string;
  modulo: string;
  fuente: string;
  numero_cuenta: string;
  codigo_tipo_documento?: string;
  numero_serie?: string;
  numero_documento?: string;
  concepto_fec?: number | string;
  glosa?: string;
  codigo_moneda_origen: string;
  codigo_moneda_registro: string;
  codigo_centro_costo: string;
  codigo_sub_centro_costo: string;
  codigo_sub_sub_centro_costo: string;
  codigo_forma_provision?: string;
  codigo_forma_pago_cobro?: string;
  codigo_area: string;
  identificador_ctr_mda?: string;
  identificador_tip_afecto?: string;
  nro_cheque?: string;
  grdo?: string;
  fecha_emision_doc?: string;
  fecha_vencimiento_doc?: string;
  fecha_movimiento?: string;
  fecha_cbr?: string;
  fecha_registro?: string;
  fecha_conc?: string;
  fecha_dif?: string;
  cod_tip_doc_ident_clt?: string;
  nro_doc_clt?: string;
  razon_social_1?: string;
  cod_tip_doc_ident_prov?: string;
  nro_doc_prov?: string;
  razon_social_2?: string;
  cod_tip_doc_ident_trab?: string;
  nro_doc_trab?: string;
  razon_social_3?: string;
  monto_debe: number | string;
  monto_haber: number | string;
  monto_debe_me?: number | string;
  monto_haber_me?: number | string;
  cambio_moneda: number | string;
  es_cancelado?: boolean | number | string;
  es_conciliado?: boolean | number | string;
  es_provision?: boolean | number | string;
  es_anulado?: boolean | number | string;
  es_destino?: boolean | number | string;
  doc_ref_fecha_emision?: string;
  doc_ref_cod_tip_doc?: string;
  doc_ref_nro_serie?: string;
  doc_ref_nro_doc?: string;
  numero_detraccion?: string;
  fecha_pago_detraccion?: string;
  ca01?: string;
  ca02?: string;
  ca03?: string;
  ca04?: string;
  ca05?: string;
  ca06?: string;
  ca07?: string;
  ca08?: string;
  ca09?: string;
  ca10?: string;
  ca11?: string;
  ca12?: string;
  ca13?: string;
  ca14?: string;
  ca15?: string;
  [key: string]: unknown;
}

export interface AsientoContableData extends AsientoContableRowInput {
  id: number;
  id_lote: number;
  creado_en: string;
  deleted_at?: string | null;
  lote?: { nombre_archivo: string | null; creado_en: string };
}

export interface FilaValidadaContabilidad {
  fila: number;
  valida: boolean;
  datos: AsientoContableRowInput | null;
  errores: string[];
}

export interface ResultadoValidacionContabilidad {
  totalFilas: number;
  filasValidas: number;
  filasError: number;
  resultados: FilaValidadaContabilidad[];
}

export const contabilidadApi = {
  getCatalogos: async (): Promise<CatalogosContabilidad> => {
    const response = await api.get("/contabilidad/catalogos");
    return response.data;
  },

  preview: async (
    filas: AsientoContableRowInput[],
    nombreArchivo?: string
  ): Promise<ResultadoValidacionContabilidad> => {
    const response = await api.post("/contabilidad/import/preview", {
      filas,
      nombreArchivo,
    });
    return response.data;
  },

  confirmar: async (
    filas: AsientoContableRowInput[],
    nombreArchivo?: string
  ): Promise<{
    success: boolean;
    message: string;
    loteId: number;
    totalFilas: number;
    filasValidas: number;
    filasError: number;
  }> => {
    const response = await api.post("/contabilidad/import/confirm", {
      filas,
      nombreArchivo,
    });
    return response.data;
  },

  list: async (
    q: string,
    page: number,
    limit: number
  ): Promise<SearchResult<AsientoContableData>> => {
    const params = new URLSearchParams({
      q,
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/contabilidad?${params}`);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/contabilidad/${id}`);
  },

  restore: async (id: number): Promise<void> => {
    await api.patch(`/contabilidad/${id}/restore`);
  },
};

// ============ REGISTRO DE COMPRAS -> ASIENTOS (tabla masivo) ============
export interface MasivoRow {
  campo: number;
  sub_diario: number;
  num_comprobante: string;
  fecha_documento: string;
  fecha_vencimiento: string;
  tipo_documento?: string;
  numero_documento?: string;
  codigo_anexo?: string;
  glosa_principal?: string;
  importe_original: number;
  debe_haber: "D" | "H";
  cod_moneda: string;
  tasa_igv?: string;
  cuenta_contable: string;
  codigo_auxiliar?: string;
  tipo_doc_referencia?: string;
  num_doc_referencia?: string;
  fecha_doc_referencia?: string | null;
  tipo_conversion?: string;
  flag_conversion?: string;
}

export interface MasivoBatchResponse {
  message: string;
  totalRecords: number;
  successCount: number;
  processingTime: number;
  first_reg: number | null;
  last_reg: number | null;
}

export const registroComprasApi = {
  // Insertar líneas de asiento en lote (arreglo ya desdoblado en debe/haber)
  createBatch: async (data: MasivoRow[]): Promise<MasivoBatchResponse> => {
    const response = await api.post("/registro-compras", { data });
    return response.data;
  },

  // Último número de registro (id) insertado en la tabla masivo
  getUltimoNumero: async (): Promise<{ nextId: number }> => {
    const response = await api.get("/registro-compras/ultimo-numero");
    return response.data;
  },
};

export interface ReciboOcrLine {
  text: string;
  confidence: number;
  box: number[][];
}

export interface CamposRecibo {
  ruc: string | null;
  tipoComprobante: "FACTURA" | "BOLETA" | "TICKET" | "NOTA_VENTA" | null;
  serie: string | null;
  correlativo: string | null;
  fecha: string | null;
  moneda: "PEN" | "USD" | null;
  subtotal: number | null;
  igv: number | null;
  total: number | null;
}

export interface ReciboOcrResult {
  texto: string;
  lines: ReciboOcrLine[];
  campos: CamposRecibo;
}

export const reciboOcrApi = {
  // Envía la foto de un recibo/boleta al backend, que a su vez la manda al
  // servicio de OCR y devuelve el texto reconocido + los campos extraídos.
  extraer: async (file: File): Promise<ReciboOcrResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await uploadFileWithRetry(
      `${API_BASE_URL}/recibo-ocr/extraer`,
      formData,
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || "Error al extraer datos del recibo");
    }

    return response.json();
  },
};
