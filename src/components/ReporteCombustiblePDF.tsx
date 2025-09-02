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

// Datos de ejemplo basados en la imagen
const datosEmpresa = {
  razonSocial: "ARIAS AYALA S.A.C",
  ruc: "20439061",
  usuario: "RAYALA",
  sucursal: "PRINCIPAL",
  guiaRemision: "EG07-00008355",
  direccion: "CAL LOS ANDES NRO. 155 URB. SAN GREGORIO, LIMA - LIMA - ATE",
};

const datosReporte = {
  codigo: "MA010171O",
  fecha: "11/08/2025 11:46:48",
  almacen: "SUB ALMACEN ALAMEDA RTL",
  clienteOP: "F001-000015705 26/08/2025",
  referencia: "D & B COMBUSTIBLES DEL PERU SOCIEDAD ANONIMA",
  consumoCombustible: "0100001019",
  valor: 2281.58,
  igv: 410.68,
  total: 2692.26,
};

const detalleCombustible = [
  {
    codVale: "00002",
    codEquipo: "EN-003",
    cantidad: 41.0,
    unidadMedida: "GALON",
    descripcion: "DIESEL B5 S50 EN-003",
    kilometraje: 3035.0,
    horometro: 3035.0,
    valorUnitario: 3035.0,
    importeTotal: 621.56,
  },
  {
    codVale: "00002",
    codEquipo: "EQ-002",
    cantidad: 66.5,
    unidadMedida: "GALON",
    descripcion: "DIESEL B5 S50 EQ-002",
    kilometraje: 734.7,
    horometro: 734.7,
    valorUnitario: 3065.0,
    importeTotal: 242.56,
  },
  {
    codVale: "00002",
    codEquipo: "EN-004",
    cantidad: 16.0,
    unidadMedida: "GALON",
    descripcion: "DIESEL B5 S50 EN-004",
    kilometraje: 3065.0,
    horometro: 3065.0,
    valorUnitario: 2755.8,
    importeTotal: 151.6,
  },
  {
    codVale: "00002",
    codEquipo: "MC-003",
    cantidad: 10.0,
    unidadMedida: "GALON",
    descripcion: "DIESEL B5 S50 MC-003",
    kilometraje: 2755.8,
    horometro: 2755.8,
    valorUnitario: 7425.1,
    importeTotal: 257.72,
  },
  {
    codVale: "00002",
    codEquipo: "RE-005",
    cantidad: 17.0,
    unidadMedida: "GALON",
    descripcion: "DIESEL B5 S50 RE-005",
    kilometraje: 7425.1,
    horometro: 7425.1,
    valorUnitario: null,
    importeTotal: 2281.58,
  },
];

// Estilos del PDF
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
  },
  maquinariasTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  empresaRuc: {
    fontSize: 9,
  },
  consumoTitleCenter: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 3,
  },
  consumoNumber: {
    fontSize: 10,
    textAlign: "center",
  },
  infoMainSection: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 20,
  },
  infoLeft: {
    flex: 1,
  },
  infoRight: {
    flex: 1,
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
  tablaContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    border: "1px solid #000",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
  },
  tablaRow: {
    flexDirection: "row",
    border: "1px solid #000",
    borderTop: "none",
    padding: 3,
    fontSize: 7,
  },
  col1: { width: "9%", textAlign: "center" },
  col2: { width: "9%", textAlign: "center" },
  col3: { width: "9%", textAlign: "center" },
  col4: { width: "9%", textAlign: "center" },
  col5: { width: "35%", paddingLeft: 4 },
  col6: { width: "7%", textAlign: "center" },
  col7: { width: "9%", textAlign: "center" },
  col8: { width: "9%", textAlign: "center" },
  col9: { width: "7%", textAlign: "center" },
  totalesSection: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalesLeft: {
    fontSize: 8,
  },
  totalesRight: {
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "bold",
    width: 80,
    textAlign: "right",
    marginRight: 10,
  },
  totalValue: {
    fontSize: 9,
    fontWeight: "bold",
    width: 60,
    textAlign: "right",
  },
});

// Componente del documento PDF
const ReporteCombustibleDocument = () => (
  <Document title={generarNombreArchivo().replace(".pdf", "")}>
    <Page size="A4" style={styles.page}>
      {/* Header con información reorganizada */}
      <View style={styles.headerContainer}>
        {/* Izquierda - Maquinarias Ayala */}
        <View style={styles.headerLeft}>
          <Text style={styles.maquinariasTitle}>MAQUINARIAS AYALA S.A.C</Text>
          <Text style={styles.empresaRuc}>{datosEmpresa.ruc}</Text>
        </View>

        {/* Centro - Consumo Combustible */}
        <View style={styles.headerCenter}>
          <Text style={styles.consumoTitleCenter}>CONSUMO COMBUSTIBLE</Text>
          <Text style={styles.consumoNumber}>
            {datosReporte.consumoCombustible}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Espacio para el lado derecho si es necesario */}
        </View>
      </View>

      {/* Sección de información reorganizada */}
      <View style={styles.infoMainSection}>
        {/* Columna Izquierda */}
        <View style={styles.infoLeft}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha y hora:</Text>
            <Text style={styles.infoValue}>{datosReporte.fecha}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Almacén:</Text>
            <Text style={styles.infoValue}>{datosReporte.almacen}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente de OP:</Text>
            <Text style={styles.infoValue}>{datosReporte.clienteOP}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Referencia:</Text>
            <Text style={styles.infoValue}>{datosReporte.referencia}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Glosa:</Text>
            <Text style={styles.infoValue}>RIMAC / MAQUINAS</Text>
          </View>
        </View>

        {/* Columna Derecha */}
        <View style={styles.infoRight}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Guía R.:</Text>
            <Text style={styles.infoValue}>{datosEmpresa.guiaRemision}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entidad:</Text>
            <Text style={styles.infoValue}>MAQUINARIAS AYALA S.A.C.</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dirección:</Text>
            <Text style={styles.infoValue}>{datosEmpresa.direccion}</Text>
          </View>
        </View>
      </View>

      {/* Tabla de combustibles */}
      <View style={styles.tablaContainer}>
        <View style={styles.tablaHeader}>
          <Text style={styles.col1}>COD. VALE</Text>
          <Text style={styles.col2}>COD. EQUIPO</Text>
          <Text style={styles.col3}>CANTIDAD</Text>
          <Text style={styles.col4}>U/MEDIDA</Text>
          <Text style={styles.col5}>DESCRIPCIÓN</Text>
          <Text style={styles.col6}>KM</Text>
          <Text style={styles.col7}>HOROMETRO</Text>
          <Text style={styles.col8}>VAL/UNIT</Text>
          <Text style={styles.col9}>IMP. TOTAL</Text>
        </View>

        {detalleCombustible.map((item, index) => (
          <View key={index} style={styles.tablaRow}>
            <Text style={styles.col1}>{item.codVale}</Text>
            <Text style={styles.col2}>{item.codEquipo}</Text>
            <Text style={styles.col3}>{item.cantidad.toFixed(2)}</Text>
            <Text style={styles.col4}>{item.unidadMedida}</Text>
            <Text style={styles.col5}>{item.descripcion}</Text>
            <Text style={styles.col6}>
              {item.kilometraje
                ? `${item.kilometraje.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}`
                : ""}
            </Text>
            <Text style={styles.col7}>
              {item.horometro
                ? `${item.horometro.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}`
                : ""}
            </Text>
            <Text style={styles.col8}>
              {item.valorUnitario
                ? item.valorUnitario.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })
                : ""}
            </Text>
            <Text style={styles.col9}>
              {item.importeTotal.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totalesSection}>
        <View style={styles.totalesLeft}></View>

        <View style={styles.totalesRight}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>
              {datosReporte.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

// Componente principal para mostrar el PDF
interface ReporteCombustiblePDFProps {
  className?: string;
}

// Función para generar el nombre del archivo con fecha y hora
const generarNombreArchivo = () => {
  const ahora = new Date();
  const fecha = ahora
    .toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");

  const hora = ahora
    .toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/:/g, "-");

  return `Reporte_Combustible_${fecha}_${hora}.pdf`;
};

// Función para descargar el PDF
export const descargarReportePDF = async () => {
  try {
    const pdfDocument = <ReporteCombustibleDocument />;
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

const ReporteCombustiblePDF: React.FC<ReporteCombustiblePDFProps> = ({
  className,
}) => {
  // Usar useMemo para evitar re-renderizados innecesarios del documento
  const document = useMemo(() => <ReporteCombustibleDocument />, []);

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

export default React.memo(ReporteCombustiblePDF);
