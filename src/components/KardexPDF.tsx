import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Interfaces
interface KardexHeader {
  empresa: string
  fechaKardex: string
  condicion: string
  stockInicial: string | number
  stockActual: string | number
  lugar: string
}

interface KardexRow {
  ITM: string | number
  FECHA: string
  SEM: string | number
  CONDICION: string
  'Nª Comprobante': string
  'H/KM': string | number
  DETALLE: string
  TARIFA: string | number
  'COSTO INGRESO': string | number
  'COSTO SALIDA': string | number
  Ingreso: string | number
  Salida: string | number
  SALDO: string | number
}

interface KardexData {
  header: KardexHeader
  rows: KardexRow[]
}

interface MetodoPromedioRow {
  Periodo: string | number
  FECHA: string
  'Nª Comprobante': string
  'H/KM': string | number
  DETALLE: string
  'Entradas.Cant': string | number
  'Entradas.Cu': string | number
  'Entradas.C.Total': string | number
  'Salidas.Cant': string | number
  'Salidas.Cu': string | number
  'Salidas.C.Total': string | number
  'Saldos.Cant': string | number
  'Saldos.Cu': string | number
  'Saldos.C.Total': string | number
}

interface InitialInventory {
  fecha: string
  Cant: string | number
  Cu: string | number
  'C.Total': string | number
}

interface Summary {
  inventarioInicial: string | number
  compras: string | number
  inventarioFinal: string | number
  costoDeVentas: string | number
}

interface MetodoPromedioHeader {
  empresa: string
  condicion: string
  lugar: string
}

interface MetodoPromedioData {
  header: MetodoPromedioHeader
  initialInventory: InitialInventory
  rows: MetodoPromedioRow[]
  summary: Summary
}

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 10,
    borderBottom: 2,
    borderBottomColor: '#000',
    paddingBottom: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  headerValue: {
    fontSize: 9,
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    breakInside: 'auto',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 18,
    breakInside: 'avoid',
  },
  tableRowNoBorder: {
    flexDirection: 'row',
    minHeight: 18,
    breakInside: 'avoid',
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
    fontSize: 7,
  },
  tableCell: {
    padding: 3,
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
    justifyContent: 'center',
  },
  tableCellLast: {
    padding: 3,
    fontSize: 7,
    textAlign: 'center',
    justifyContent: 'center',
  },
  ingresoRow: {
    backgroundColor: '#d4edda',
  },
  salidaRow: {
    backgroundColor: '#ffffff',
  },
  stockInfo: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#000',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  stockLabel: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  stockValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Estilos para Método Promedio
  tableHeaderDouble: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
    fontSize: 6,
  },
  entradasHeader: {
    backgroundColor: '#d4edda',
  },
  salidasHeader: {
    backgroundColor: '#f8d7da',
  },
  saldosHeader: {
    backgroundColor: '#d1ecf1',
  },
  summary: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#000',
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 7,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  verification: {
    marginTop: 8,
    padding: 5,
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  verificationText: {
    fontSize: 7,
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    fontSize: 8,
  },
})

interface KardexPDFProps {
  kardexLAR: KardexData
  metodoPromedioLAR: MetodoPromedioData
}

export const KardexPDF = ({ kardexLAR, metodoPromedioLAR }: KardexPDFProps) => (
  <Document>
    {/* Página 1: Kardex LAR */}
    <Page size="LEGAL" orientation="landscape" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{kardexLAR.header.empresa}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Empresa: <Text style={styles.headerValue}>{kardexLAR.header.empresa}</Text></Text>
          <Text style={styles.headerLabel}>FECHA: <Text style={styles.headerValue}>{kardexLAR.header.fechaKardex}</Text></Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Condicion: <Text style={styles.headerValue}>{kardexLAR.header.condicion}</Text></Text>
          <Text style={styles.headerLabel}>Inicio: <Text style={styles.headerValue}>{kardexLAR.header.stockInicial}</Text></Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Lugar: <Text style={styles.headerValue}>{kardexLAR.header.lugar}</Text></Text>
          <Text style={styles.headerLabel}>Stock: <Text style={styles.headerValue}>{kardexLAR.header.stockActual}</Text></Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Condicion: <Text style={styles.headerValue}>{kardexLAR.header.condicion}</Text></Text>
          <Text style={styles.headerLabel}>Actual: <Text style={styles.headerValue}>{kardexLAR.header.stockActual}</Text></Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Mes: <Text style={styles.headerValue}>Mes</Text></Text>
        </View>
      </View>

      {/* Tabla Kardex LAR */}
      <View style={styles.table}>
        {/* Header de la tabla */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCell, { width: '3%' }]}>
            <Text>ITM</Text>
          </View>
          <View style={[styles.tableCell, { width: '6%' }]}>
            <Text>FECHA</Text>
          </View>
          <View style={[styles.tableCell, { width: '4%' }]}>
            <Text>SEM</Text>
          </View>
          <View style={[styles.tableCell, { width: '7%' }]}>
            <Text>CONDICION</Text>
          </View>
          <View style={[styles.tableCell, { width: '8%' }]}>
            <Text>Comprobante</Text>
          </View>
          <View style={[styles.tableCell, { width: '6%' }]}>
            <Text>H/KM</Text>
          </View>
          <View style={[styles.tableCell, { width: '24%' }]}>
            <Text>DETALLE</Text>
          </View>
          <View style={[styles.tableCell, { width: '6%' }]}>
            <Text>TARIFA</Text>
          </View>
          <View style={[styles.tableCell, { width: '8%' }]}>
            <Text>COSTO INGRESO</Text>
          </View>
          <View style={[styles.tableCell, { width: '8%' }]}>
            <Text>COSTO SALIDA</Text>
          </View>
          <View style={[styles.tableCell, { width: '6%' }]}>
            <Text>Ingreso</Text>
          </View>
          <View style={[styles.tableCell, { width: '6%' }]}>
            <Text>Salida</Text>
          </View>
          <View style={[styles.tableCellLast, { width: '8%' }]}>
            <Text>SALDO</Text>
          </View>
        </View>

        {/* Filas de datos */}
        {kardexLAR.rows.map((row: KardexRow, index: number) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              row.CONDICION === 'INGRESO' ? styles.ingresoRow : styles.salidaRow,
            ]}
          >
            <View style={[styles.tableCell, { width: '3%' }]}>
              <Text>{row.ITM}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row.FECHA}</Text>
            </View>
            <View style={[styles.tableCell, { width: '4%' }]}>
              <Text>{row.SEM}</Text>
            </View>
            <View style={[styles.tableCell, { width: '7%' }]}>
              <Text>{row.CONDICION}</Text>
            </View>
            <View style={[styles.tableCell, { width: '8%' }]}>
              <Text>{row['Nª Comprobante']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['H/KM']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '24%', textAlign: 'left' }]}>
              <Text>{row.DETALLE}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row.TARIFA}</Text>
            </View>
            <View style={[styles.tableCell, { width: '8%' }]}>
              <Text>{row['COSTO INGRESO']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '8%' }]}>
              <Text>{row['COSTO SALIDA']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row.Ingreso}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row.Salida}</Text>
            </View>
            <View style={[styles.tableCellLast, { width: '8%' }]}>
              <Text>{row.SALDO}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Información de stock */}
      <View style={styles.stockInfo}>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Cant Galones:</Text>
          <Text style={styles.stockValue}>{kardexLAR.header.stockActual}</Text>
        </View>
      </View>

      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `Página ${pageNumber} de ${totalPages}`
      )} fixed />
    </Page>

    {/* Página 2: Método Promedio LAR */}
    <Page size="LEGAL" orientation="landscape" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{metodoPromedioLAR.header.empresa}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Empresa: <Text style={styles.headerValue}>{metodoPromedioLAR.header.empresa}</Text></Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Condicion: <Text style={styles.headerValue}>{metodoPromedioLAR.header.condicion}</Text></Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Lugar: <Text style={styles.headerValue}>{metodoPromedioLAR.header.lugar}</Text></Text>
        </View>
      </View>

      {/* Tabla Método Promedio */}
      <View style={styles.table}>
        {/* Headers */}
        <View style={styles.tableRowNoBorder}>
          <View style={[styles.tableCell, styles.tableHeader, { width: '5%' }]}>
            <Text>Periodo</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, { width: '7%' }]}>
            <Text>FECHA</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, { width: '8%' }]}>
            <Text>Comprobante</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, { width: '6%' }]}>
            <Text>H/KM</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, { width: '20%' }]}>
            <Text>DETALLE</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.entradasHeader, { width: '6%' }]}>
            <Text>Cant</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.entradasHeader, { width: '6%' }]}>
            <Text>Cu</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.entradasHeader, { width: '6%' }]}>
            <Text>C.Total</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.salidasHeader, { width: '6%' }]}>
            <Text>Cant</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.salidasHeader, { width: '6%' }]}>
            <Text>Cu</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.salidasHeader, { width: '6%' }]}>
            <Text>C.Total</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.saldosHeader, { width: '6%' }]}>
            <Text>Cant</Text>
          </View>
          <View style={[styles.tableCell, styles.tableHeader, styles.saldosHeader, { width: '6%' }]}>
            <Text>Cu</Text>
          </View>
          <View style={[styles.tableCellLast, styles.tableHeader, styles.saldosHeader, { width: '6%' }]}>
            <Text>C.Total</Text>
          </View>
        </View>

        {/* Inventario Inicial */}
        <View style={[styles.tableRow, { backgroundColor: '#fff8dc' }]}>
          <View style={[styles.tableCell, { width: '5%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '7%' }]}><Text>{metodoPromedioLAR.initialInventory.fecha}</Text></View>
          <View style={[styles.tableCell, { width: '8%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '20%', textAlign: 'left' }]}><Text>Inventario Inicial {metodoPromedioLAR.initialInventory.fecha}</Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text></Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text>{metodoPromedioLAR.initialInventory.Cant}</Text></View>
          <View style={[styles.tableCell, { width: '6%' }]}><Text>{metodoPromedioLAR.initialInventory.Cu}</Text></View>
          <View style={[styles.tableCellLast, { width: '6%' }]}><Text>{metodoPromedioLAR.initialInventory['C.Total']}</Text></View>
        </View>

        {/* Filas de datos */}
        {metodoPromedioLAR.rows.map((row: MetodoPromedioRow, index: number) => (
          <View key={index} style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '5%' }]}>
              <Text>{row.Periodo}</Text>
            </View>
            <View style={[styles.tableCell, { width: '7%' }]}>
              <Text>{row.FECHA}</Text>
            </View>
            <View style={[styles.tableCell, { width: '8%' }]}>
              <Text>{row['Nª Comprobante']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['H/KM']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '20%', textAlign: 'left' }]}>
              <Text>{row.DETALLE}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Entradas.Cant']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Entradas.Cu']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Entradas.C.Total']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Salidas.Cant']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Salidas.Cu']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Salidas.C.Total']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Saldos.Cant']}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text>{row['Saldos.Cu']}</Text>
            </View>
            <View style={[styles.tableCellLast, { width: '6%' }]}>
              <Text>{row['Saldos.C.Total']}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Resumen Final */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumen Final</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>(+) Inv Inicial</Text>
            <Text style={styles.summaryValue}>$ {metodoPromedioLAR.summary.inventarioInicial}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>(+) Compras</Text>
            <Text style={styles.summaryValue}>$ {metodoPromedioLAR.summary.compras}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>(-) Inv Final</Text>
            <Text style={styles.summaryValue}>$ {metodoPromedioLAR.summary.inventarioFinal}</Text>
          </View>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Costo de Ventas</Text>
            <Text style={styles.summaryValue}>$ {metodoPromedioLAR.summary.costoDeVentas}</Text>
          </View>
        </View>
        <View style={styles.verification}>
          <Text style={styles.verificationText}>
            Verificación: {metodoPromedioLAR.summary.inventarioInicial} + {metodoPromedioLAR.summary.compras} - {metodoPromedioLAR.summary.costoDeVentas} = {metodoPromedioLAR.summary.inventarioFinal}
          </Text>
        </View>
      </View>

      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `Página ${pageNumber} de ${totalPages}`
      )} fixed />
    </Page>
  </Document>
)
