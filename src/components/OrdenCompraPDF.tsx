"use client";

import React, { useMemo, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  pdf,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import "dayjs/locale/es";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Configurar plugins de dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Configurar dayjs para usar español y timezone de Perú
dayjs.locale("es");
dayjs.tz.setDefault("America/Lima");

// Interfaces para los datos de la orden de compra
interface OrdenCompraDetalle {
  numero: number;
  descripcion: string;
  ot: string;
  unidadMedida: string;
  cantidad: number;
  valorUnitario: number;
  subTotal: number;
}

interface OrdenCompraData {
  numeroOrden: string;
  fechaEmision: string;
  proveedor: {
    empresa: string;
    ruc: string;
    atencion: string;
    telefono: string;
  };
  direccion: string;
  condicion: string;
  moneda: string;
  observacion: string;
  detalles: OrdenCompraDetalle[];
  subtotal: number;
  igvTotal: number;
  total: number;
}

// Interfaces para props
interface OrdenCompraPDFProps {
  className?: string;
  datosOrden?: OrdenCompraData;
}

// Datos de empresa (fijos)
const datosEmpresa = {
  razonSocial: "MAQUINARIAS AYALA S.A.C",
  ruc: "20603739061",
  sucursal: "PRINCIPAL",
  direccion: "CAL LOS ANDES NRO. 155 URB. SAN GREGORIO, LIMA - LIMA - ATE",
};

// Datos de ejemplo para la orden de compra
const datosOrdenEjemplo: OrdenCompraData = {
  numeroOrden: "OC 00000923",
  fechaEmision: "21/04/2025",
  proveedor: {
    empresa: "MULTISERV RYB E.I.R.L.",
    ruc: "20451499603",
    atencion: "",
    telefono: "",
  },
  direccion: "CAL LOS ANDES NRO. 155 URB. SAN GREGORIO LIMA - LIMA - ATE",
  condicion: "",
  moneda: "S/",
  observacion: "",
  detalles: [
    {
      numero: 1,
      descripcion: "WAIPE",
      ot: "25OT041056",
      unidadMedida: "UNIDAD",
      cantidad: 1.0,
      valorUnitario: 7.63,
      subTotal: 7.63,
    },
  ],
  subtotal: 7.63,
  igvTotal: 1.37,
  total: 9.0,
};

// Estilos del PDF con color verde
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  headerContainer: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  maquinariasTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  empresaRuc: {
    fontSize: 9,
  },
  ordenTitleCenter: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 3,
    color: "#16a34a", // Verde
  },
  ordenNumber: {
    fontSize: 10,
    textAlign: "center",
    color: "#16a34a", // Verde
  },
  fechaSection: {
    fontSize: 8,
    textAlign: "right",
  },
  proveedorSection: {
    marginBottom: 15,
    border: "1px solid #16a34a", // Verde
    padding: 8,
  },
  proveedorTitle: {
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: "#dcfce7", // Verde claro
    padding: 3,
    marginBottom: 5,
    color: "#16a34a", // Verde
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: 80,
  },
  infoValue: {
    fontSize: 8,
    flex: 1,
  },
  datosOrdenSection: {
    marginBottom: 15,
    border: "1px solid #16a34a", // Verde
    padding: 8,
  },
  datosOrdenTitle: {
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: "#dcfce7", // Verde claro
    padding: 3,
    marginBottom: 5,
    color: "#16a34a", // Verde
  },
  tablaContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#dcfce7", // Verde claro
    border: "1px solid #16a34a", // Verde
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
  },
  tablaRow: {
    flexDirection: "row",
    border: "1px solid #16a34a", // Verde
    borderTop: "none",
    padding: 3,
    fontSize: 7,
  },
  col1: { width: "9%", textAlign: "center" }, // N°
  col2: { width: "50%", paddingLeft: 4 }, // DESCRIPCIÓN
  col3: { width: "9%", textAlign: "center" }, // OT
  col4: { width: "9%", textAlign: "center" }, // U/M
  col5: { width: "8%", textAlign: "center" }, // CANT
  col6: { width: "9%", textAlign: "center" }, // VALOR UNIT
  col7: { width: "9%", textAlign: "center" }, // SUB TOTAL
  totalesSection: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalesContainer: {
    width: "40%",
    border: "1px solid #16a34a", // Verde
  },
  totalRow: {
    flexDirection: "row",
    borderBottom: "1px solid #16a34a", // Verde
    padding: 3,
  },
  totalRowLast: {
    flexDirection: "row",
    padding: 3,
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: "60%",
    paddingLeft: 4,
  },
  totalValue: {
    fontSize: 8,
    width: "40%",
    textAlign: "right",
    paddingRight: 4,
  },
  firmasSection: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  firmaContainer: {
    width: "30%",
    alignItems: "center",
  },
  firmaLinea: {
    width: "100%",
    borderBottom: "1px solid #000",
    height: 40,
    marginBottom: 5,
  },
  firmaTexto: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  netoAPagar: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  netoTexto: {
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 10,
  },
  netoValor: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#000",
    color: "#fff",
    padding: 3,
    paddingLeft: 8,
    paddingRight: 8,
  },
});

// Componente del documento PDF
interface OrdenCompraDocumentProps {
  datos?: OrdenCompraData;
}

const OrdenCompraDocument = ({ datos }: OrdenCompraDocumentProps) => {
  const datosOrden = datos || datosOrdenEjemplo;

  return (
    <Document title={`Orden de Compra - ${datosOrden.numeroOrden}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          {/* Izquierda - Maquinarias Ayala */}
          <View style={styles.headerLeft}>
            <Text style={styles.maquinariasTitle}>MAQUINARIAS AYALA S.A.C</Text>
            <Text style={styles.empresaRuc}>MOVIMIENTO DE TIERRAS</Text>
            <Text style={styles.empresaRuc}>{datosEmpresa.ruc}</Text>
          </View>

          {/* Centro - Orden de Compra */}
          <View style={styles.headerCenter}>
            <Text style={styles.ordenTitleCenter}>ORDEN DE COMPRA</Text>
            <Text style={styles.ordenNumber}>{datosOrden.numeroOrden}</Text>
          </View>

          {/* Derecha - Fecha */}
          <View style={styles.headerRight}>
            <Text style={styles.fechaSection}>Página 1 de 1</Text>
            <Text style={styles.fechaSection}>
              Fecha de emisión: {datosOrden.fechaEmision}
            </Text>
          </View>
        </View>

        {/* Datos del Proveedor */}
        <View style={styles.proveedorSection}>
          <Text style={styles.proveedorTitle}>DATOS DEL PROVEEDOR</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMPRESA:</Text>
            <Text style={styles.infoValue}>{datosOrden.proveedor.empresa}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RUC:</Text>
            <Text style={styles.infoValue}>{datosOrden.proveedor.ruc}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ATENCIÓN:</Text>
            <Text style={styles.infoValue}>
              {datosOrden.proveedor.atencion}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TELÉFONO:</Text>
            <Text style={styles.infoValue}>
              {datosOrden.proveedor.telefono}
            </Text>
          </View>
        </View>

        {/* Datos Orden de Compra */}
        <View style={styles.datosOrdenSection}>
          <Text style={styles.datosOrdenTitle}>DATOS ORDEN DE COMPRA</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DIRECCIÓN:</Text>
            <Text style={styles.infoValue}>{datosOrden.direccion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CONDICIÓN:</Text>
            <Text style={styles.infoValue}>{datosOrden.condicion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>MONEDA:</Text>
            <Text style={styles.infoValue}>{datosOrden.moneda}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>OBSERVACIÓN:</Text>
            <Text style={styles.infoValue}>{datosOrden.observacion}</Text>
          </View>
        </View>

        {/* Detalle de la Orden de Compra */}
        <View style={styles.tablaContainer}>
          <Text style={[styles.datosOrdenTitle, { marginBottom: 5 }]}>
            DETALLE DE LA ORDEN DE COMPRA
          </Text>
          <View style={styles.tablaHeader}>
            <Text style={styles.col1}>N°</Text>
            <Text style={styles.col2}>DESCRIPCIÓN</Text>
            <Text style={styles.col3}>OT</Text>
            <Text style={styles.col4}>U/M</Text>
            <Text style={styles.col5}>CANT.</Text>
            <Text style={styles.col6}>VALOR UNIT</Text>
            <Text style={styles.col7}>SUB TOTAL</Text>
          </View>

          {datosOrden.detalles.map((detalle, index) => (
            <View key={index} style={styles.tablaRow}>
              <Text style={styles.col1}>{detalle.numero}</Text>
              <Text style={styles.col2}>{detalle.descripcion}</Text>
              <Text style={styles.col3}>{detalle.ot}</Text>
              <Text style={styles.col4}>{detalle.unidadMedida}</Text>
              <Text style={styles.col5}>{detalle.cantidad.toFixed(2)}</Text>
              <Text style={styles.col6}>
                {detalle.valorUnitario.toLocaleString("es-PE", {
                  minimumFractionDigits: 4,
                })}
              </Text>
              <Text style={styles.col7}>
                {detalle.subTotal.toLocaleString("es-PE", {
                  minimumFractionDigits: 4,
                })}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalesSection}>
          <View style={styles.totalesContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {datosOrden.moneda} {datosOrden.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Igvtotal:</Text>
              <Text style={styles.totalValue}>
                {datosOrden.moneda} {datosOrden.igvTotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRowLast}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {datosOrden.moneda} {datosOrden.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Neto a pagar */}
        <View style={styles.netoAPagar}>
          <Text style={styles.netoTexto}>Neto a pagar :</Text>
          <Text style={styles.netoValor}>
            {datosOrden.moneda} {datosOrden.total.toFixed(2)}
          </Text>
        </View>

        {/* Sección de firmas */}
        <View style={styles.firmasSection}>
          <View style={styles.firmaContainer}>
            <View style={styles.firmaLinea}></View>
            <Text style={styles.firmaTexto}>GENERA ORDEN</Text>
          </View>
          <View style={styles.firmaContainer}>
            <View style={styles.firmaLinea}></View>
            <Text style={styles.firmaTexto}>JEFE DE COMPRAS</Text>
          </View>
          <View style={styles.firmaContainer}>
            <View style={styles.firmaLinea}></View>
            <Text style={styles.firmaTexto}>GERENCIA</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar el nombre del archivo con fecha y hora
const generarNombreArchivo = () => {
  const ahora = dayjs().tz("America/Lima");
  const fecha = ahora.format("DD-MM-YYYY");
  const hora = ahora.format("HH-mm-ss");

  return `Orden_Compra_${fecha}_${hora}.pdf`;
};

// Función para descargar el PDF
export const descargarOrdenCompraPDF = async (datos?: OrdenCompraData) => {
  try {
    const pdfDocument = <OrdenCompraDocument datos={datos} />;
    const asPdf = pdf(pdfDocument);
    const blob = await asPdf.toBlob();

    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = generarNombreArchivo();
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error al descargar PDF:", error);
    return false;
  }
};

const OrdenCompraPDF: React.FC<OrdenCompraPDFProps> = ({
  className,
  datosOrden,
}) => {
  // Usar useMemo para evitar re-renderizados innecesarios del documento
  const document = useMemo(
    () => <OrdenCompraDocument datos={datosOrden} />,
    [datosOrden]
  );

  // Referencia al contenedor del PDFViewer
  const pdfViewerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", minHeight: "600px" }}
    >
      {/* PDF Viewer con toolbar nativo */}
      <div ref={pdfViewerRef} style={{ width: "100%", height: "100%" }}>
        <PDFViewer width="100%" height="100%" showToolbar={true}>
          {document}
        </PDFViewer>
      </div>
    </div>
  );
};

export default React.memo(OrdenCompraPDF);
export type { OrdenCompraData, OrdenCompraDetalle };
