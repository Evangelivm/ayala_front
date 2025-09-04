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
import { InformeConsumoCombustibleResponse, InformeConsumoCombustibleDetalle } from "@/lib/connections";
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

// Interfaces para props
interface ReporteCombustiblePDFProps {
  className?: string;
  datosReporte?: InformeConsumoCombustibleResponse[];
  mostrarTodosLosRegistros?: boolean;
}

// Datos de empresa (fijos)
const datosEmpresa = {
  razonSocial: "MAQUINARIAS AYALA S.A.C",
  ruc: "20603739061",
  sucursal: "PRINCIPAL",
  direccion: "CAL LOS ANDES NRO. 155 URB. SAN GREGORIO, LIMA - LIMA - ATE",
};

// Funciones para procesar datos dinámicos
const generarDatosReporte = (datos: InformeConsumoCombustibleResponse[]) => {
  if (!datos || datos.length === 0) return null;
  
  const primerRegistro = datos[0];
  // Calcular el total sumando todos los detalles de todas las facturas
  const totalGeneral = datos.reduce((sum, factura) => {
    const totalFactura = factura.detalles.reduce((sumDetalle, detalle) => sumDetalle + detalle.total, 0);
    return sum + totalFactura;
  }, 0);
  
  // Calcular el total de galones sumando todas las cantidades
  const totalGalones = datos.reduce((sum, factura) => {
    const totalGalonesFactura = factura.detalles.reduce((sumDetalle, detalle) => sumDetalle + (detalle.cantidad || 0), 0);
    return sum + totalGalonesFactura;
  }, 0);
  
  // Obtener el primer código de vale del primer detalle
  const primerCodigoVale = primerRegistro.detalles?.[0]?.codigo_vale || "N/A";
  
  return {
    codigo: primerCodigoVale,
    fecha: dayjs(primerRegistro.fecha_emision).tz("America/Lima").format("DD/MM/YYYY HH:mm:ss"),
    almacen: primerRegistro.almacenes || "N/A",
    clienteOP: `${primerRegistro.numero_factura} ${dayjs(primerRegistro.fecha_emision).tz("America/Lima").format("DD/MM/YYYY")}`,
    referencia: primerRegistro.nombre || "N/A",
    guia_remision: primerRegistro.guia_remision || "N/A",
    consumoCombustible: primerCodigoVale,
    glosa: primerRegistro.glosa || "RIMAC / MAQUINAS",
    total: totalGeneral,
    totalGalones: totalGalones,
  };
};

const generarDetalleCombustible = (datos: InformeConsumoCombustibleResponse[]) => {
  if (!datos || datos.length === 0) return [];
  
  // Aplanar todos los detalles de todas las facturas en una sola lista
  const todosLosDetalles: InformeConsumoCombustibleDetalle[] = [];
  
  datos.forEach(factura => {
    if (factura.detalles && Array.isArray(factura.detalles)) {
      todosLosDetalles.push(...factura.detalles);
    }
  });
  
  return todosLosDetalles.map(detalle => ({
    codVale: detalle.codigo_vale || "N/A",
    codEquipo: detalle.placa || "N/A",
    cantidad: detalle.cantidad || 0,
    unidadMedida: "GALON",
    descripcion: detalle.descripcion || "N/A",
    kilometraje: detalle.km || 0,
    horometro: detalle.odometro || 0,
    valorUnitario: detalle.val_unit || 0,
    importeTotal: detalle.total || 0,
  }));
};

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
interface ReporteCombustibleDocumentProps {
  datos?: InformeConsumoCombustibleResponse[];
}

const ReporteCombustibleDocument = ({ datos }: ReporteCombustibleDocumentProps) => {
  const datosReporte = generarDatosReporte(datos || []);
  const detalleCombustible = generarDetalleCombustible(datos || []);
  
  // Si no hay datos, mostrar mensaje
  if (!datosReporte) {
    return (
      <Document title="Reporte Combustible - Sin Datos">
        <Page size="A4" style={styles.page}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, textAlign: 'center' }}>
              No hay datos disponibles para generar el reporte
            </Text>
          </View>
        </Page>
      </Document>
    );
  }
  
  return (
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
            <Text style={styles.infoValue}>{datosReporte.glosa}</Text>
          </View>
        </View>

        {/* Columna Derecha */}
        <View style={styles.infoRight}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Guía R.:</Text>
            <Text style={styles.infoValue}>{datosReporte.guia_remision}</Text>
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
            <Text style={styles.totalLabel}>TOTAL GALONES:</Text>
            <Text style={styles.totalValue}>
              {datosReporte.totalGalones.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>
              {datosReporte.total.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
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

  return `Reporte_Combustible_${fecha}_${hora}.pdf`;
};

// Función para descargar el PDF
export const descargarReportePDF = async (datos?: InformeConsumoCombustibleResponse[]) => {
  try {
    const pdfDocument = <ReporteCombustibleDocument datos={datos} />;
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
  datosReporte,
  mostrarTodosLosRegistros = false,
}) => {
  // Usar useMemo para evitar re-renderizados innecesarios del documento
  const document = useMemo(() => <ReporteCombustibleDocument datos={datosReporte} />, [datosReporte]);

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
