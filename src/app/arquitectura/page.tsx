"use client";

import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

type BaseDatos = "principal" | "terciaria" | "secundaria";
type Modo = "paginas" | "esquema";

interface TablaConexion { db: BaseDatos; tabla: string; descripcion: string; }
interface Pagina { id: string; ruta: string; nombre: string; descripcion: string; categoria: string; tablas: TablaConexion[]; }

interface Campo {
  nombre: string;
  tipo: string;
  nulo: boolean;
  pk?: boolean;
  default?: string;
  fk?: { db: BaseDatos; tabla: string; campo: string };
  enum?: string[];
  nota?: string;
}
interface EsquemaTabla { tabla: string; db: BaseDatos; descripcion: string; campos: Campo[]; }

// ═══════════════════════════════════════════════════════════════
// DATOS – MODO PÁGINAS
// ═══════════════════════════════════════════════════════════════

const PAGINAS: Pagina[] = [
  { id: "programacion-admin", ruta: "/programacion-admin", nombre: "Programación Admin", descripcion: "Gestión completa de programación técnica, órdenes de compra vinculadas, carga de guías y facturas.", categoria: "Programación", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo diario por camión" },
    { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
    { db: "principal", tabla: "empresas_2025", descripcion: "Empresas contratistas" },
    { db: "terciaria", tabla: "ordenes_compra", descripcion: "Órdenes vinculadas al programa" },
  ]},
  { id: "programacion", ruta: "/programacion", nombre: "Programación", descripcion: "Vista de programación para el equipo operativo.", categoria: "Programación", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo" },
    { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
    { db: "principal", tabla: "empresas_2025", descripcion: "Empresas contratistas" },
  ]},
  { id: "prog-tecnica", ruta: "/prog-tecnica", nombre: "Prog. Técnica", descripcion: "Vista técnica de la programación para operadores.", categoria: "Programación", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo" },
    { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
  ]},
  { id: "programacion-extendida", ruta: "/programacion-extendida", nombre: "Prog. Extendida", descripcion: "Vista extendida con campos adicionales de programación.", categoria: "Programación", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros extendidos" },
    { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
    { db: "principal", tabla: "empresas_2025", descripcion: "Empresas contratistas" },
  ]},
  { id: "programacion-mixta", ruta: "/programacion-mixta", nombre: "Prog. Mixta", descripcion: "Programación mixta combinando tipos de trabajo.", categoria: "Programación", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo" },
    { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
    { db: "principal", tabla: "empresas_2025", descripcion: "Empresas" },
  ]},
  { id: "acarreo", ruta: "/acarreo", nombre: "Acarreo", descripcion: "Gestión de programación de acarreo de material.", categoria: "Programación", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de acarreo" },
    { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
  ]},
  { id: "guia-remision", ruta: "/guia-remision", nombre: "Guía de Remisión", descripcion: "Creación y gestión de guías de remisión electrónicas.", categoria: "Programación", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "Datos del programa asociado" },
    { db: "principal", tabla: "guia_remision", descripcion: "Guías generadas" },
  ]},
  { id: "orden-compra-servicio", ruta: "/orden-compra-servicio", nombre: "Órdenes de Compra y Servicio", descripcion: "Creación, edición y seguimiento de órdenes de compra y órdenes de servicio.", categoria: "Órdenes & Facturación", tablas: [
    { db: "terciaria", tabla: "ordenes_compra", descripcion: "Cabecera de órdenes de compra" },
    { db: "terciaria", tabla: "detalles_orden_compra", descripcion: "Ítems de cada orden de compra" },
    { db: "terciaria", tabla: "ordenes_servicio", descripcion: "Cabecera de órdenes de servicio" },
    { db: "terciaria", tabla: "detalles_orden_servicio", descripcion: "Ítems de cada orden de servicio" },
    { db: "terciaria", tabla: "listado_items_2025", descripcion: "Catálogo de productos/servicios" },
    { db: "terciaria", tabla: "proveedores", descripcion: "Proveedores del sistema" },
    { db: "terciaria", tabla: "multifactura_detalle", descripcion: "Múltiples facturas por orden" },
  ]},
  { id: "factura", ruta: "/factura", nombre: "Facturas Electrónicas", descripcion: "Generación, seguimiento y consulta de facturas electrónicas enviadas a Nubefact/SUNAT.", categoria: "Órdenes & Facturación", tablas: [
    { db: "terciaria", tabla: "factura", descripcion: "Cabecera de cada factura electrónica" },
    { db: "terciaria", tabla: "factura_item", descripcion: "Líneas/ítems de cada factura" },
    { db: "terciaria", tabla: "factura_guia", descripcion: "Guías relacionadas a la factura" },
    { db: "terciaria", tabla: "factura_venta_credito", descripcion: "Cuotas en ventas a crédito" },
    { db: "terciaria", tabla: "proveedores", descripcion: "Proveedor emisor de la factura" },
  ]},
  { id: "registro-administracion", ruta: "/registro-administracion", nombre: "Registro Administración", descripcion: "Vista de órdenes de compra/servicio con N° Factura para administración.", categoria: "Registros", tablas: [
    { db: "terciaria", tabla: "ordenes_compra", descripcion: "Órdenes de compra" },
    { db: "terciaria", tabla: "ordenes_servicio", descripcion: "Órdenes de servicio" },
    { db: "terciaria", tabla: "multifactura_detalle", descripcion: "Números de factura" },
  ]},
  { id: "inventario-lar", ruta: "/inventario-lar", nombre: "Inventario LAR", descripcion: "Reporte de kardex e inventario valorizado para LAR.", categoria: "Inventario", tablas: [
    { db: "terciaria", tabla: "listado_items_2025", descripcion: "Catálogo de productos" },
    { db: "terciaria", tabla: "stock_almacenes", descripcion: "Stock por almacén" },
    { db: "terciaria", tabla: "movimientos_inventario", descripcion: "Entradas y salidas" },
    { db: "terciaria", tabla: "almacenes", descripcion: "Almacenes del sistema" },
  ]},
  { id: "kardexpromedio", ruta: "/kardexpromedio", nombre: "Kardex Promedio", descripcion: "Cálculo y visualización del kardex por costo promedio ponderado.", categoria: "Inventario", tablas: [
    { db: "terciaria", tabla: "listado_items_2025", descripcion: "Productos del kardex" },
    { db: "terciaria", tabla: "movimientos_inventario", descripcion: "Movimientos de inventario" },
    { db: "terciaria", tabla: "balances_iniciales", descripcion: "Saldos iniciales" },
    { db: "terciaria", tabla: "almacenes", descripcion: "Almacenes" },
  ]},
  { id: "combustible", ruta: "/combustible", nombre: "Combustible", descripcion: "Control de consumo de combustible por vehículo y centro de costo.", categoria: "Combustible", tablas: [
    { db: "secundaria", tabla: "fuel_invoices", descripcion: "Facturas de combustible" },
    { db: "secundaria", tabla: "cost_centers", descripcion: "Centros de costo (combustible)" },
  ]},
  { id: "proyectos", ruta: "/proyectos", nombre: "Proyectos", descripcion: "Gestión de proyectos y centros de costo.", categoria: "Proyectos", tablas: [
    { db: "principal", tabla: "proyecto", descripcion: "Proyectos" },
    { db: "principal", tabla: "empresas_2025", descripcion: "Empresas vinculadas a proyectos" },
  ]},
  { id: "dashboard", ruta: "/dashboard", nombre: "Dashboard", descripcion: "Panel principal con resúmenes y métricas del sistema.", categoria: "Dashboard", tablas: [
    { db: "principal", tabla: "programacion_tecnica", descripcion: "KPIs de programación" },
    { db: "principal", tabla: "camiones", descripcion: "Estado de la flota" },
    { db: "terciaria", tabla: "ordenes_compra", descripcion: "Resumen de órdenes" },
    { db: "terciaria", tabla: "factura", descripcion: "Resumen de facturas" },
  ]},
];

const DB_CONFIG: Record<BaseDatos, { nombre: string; color: string; badge: string; dot: string; header: string }> = {
  principal:  { nombre: "DB Principal",  color: "border-blue-400 bg-blue-50",    badge: "bg-blue-100 text-blue-800 border-blue-300",     dot: "bg-blue-500",    header: "bg-blue-600" },
  terciaria:  { nombre: "DB Terciaria",  color: "border-emerald-400 bg-emerald-50", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500", header: "bg-emerald-600" },
  secundaria: { nombre: "DB Secundaria", color: "border-orange-400 bg-orange-50",badge: "bg-orange-100 text-orange-800 border-orange-300",  dot: "bg-orange-500",  header: "bg-orange-600" },
};
const DB_NOMBRES: Record<BaseDatos, string> = { principal: "ayala2025", terciaria: "inventariosayala2025", secundaria: "fuel_kardex_system" };
const CATEGORIA_ICONOS: Record<string, string> = { "Programación": "⚙️", "Órdenes & Facturación": "📄", "Inventario": "📦", "Combustible": "⛽", "Proyectos": "🏗️", "Reportes": "📊", "Registros": "📋", "Control": "✅", "Dashboard": "🏠" };

// ═══════════════════════════════════════════════════════════════
// DATOS – MODO ESQUEMA
// ═══════════════════════════════════════════════════════════════

const ESQUEMAS: EsquemaTabla[] = [
  // ─────────────────────────────────────────────────────────────
  // DB PRINCIPAL (ayala2025)
  // ─────────────────────────────────────────────────────────────
  {
    tabla: "programacion_tecnica", db: "principal",
    descripcion: "Registro de trabajo diario. Tabla central del sistema operativo. Soft delete con deleted_at.",
    campos: [
      { nombre: "id", tipo: "Int", nulo: false, pk: true },
      { nombre: "fecha", tipo: "Date", nulo: true },
      { nombre: "unidad", tipo: "Int", nulo: true, nota: "Número de camión — sin FK formal, referencia a camiones.id_camion" },
      { nombre: "proveedor", tipo: "VarChar(255)", nulo: true, nota: "Nombre de la empresa (texto libre)" },
      { nombre: "programacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "hora_partida", tipo: "Time", nulo: true },
      { nombre: "estado_programacion", tipo: "VarChar(255)", nulo: true, nota: "Valores típicos: PENDIENTE · VALIDADO · APROBADO" },
      { nombre: "comentarios", tipo: "Text", nulo: true },
      { nombre: "validacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "identificador_unico", tipo: "VarChar(255)", nulo: true },
      { nombre: "km_del_dia", tipo: "VarChar(255)", nulo: true },
      { nombre: "mes", tipo: "VarChar(255)", nulo: true },
      { nombre: "num_semana", tipo: "VarChar(255)", nulo: true },
      { nombre: "m3", tipo: "Decimal(12,10)", nulo: true },
      { nombre: "cantidad_viaje", tipo: "VarChar(255)", nulo: true },
      { nombre: "kilom_final", tipo: "VarChar(255)", nulo: true },
      { nombre: "peso_bruto_total", tipo: "Decimal(12,10)", nulo: true },
      { nombre: "galones", tipo: "VarChar(255)", nulo: true },
      { nombre: "hora_inicio", tipo: "VarChar(255)", nulo: true },
      { nombre: "hora_final", tipo: "VarChar(255)", nulo: true },
      { nombre: "kilom_consumo", tipo: "VarChar(255)", nulo: true },
      { nombre: "kilom_galon", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_tipo_documento", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_numero_documento", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_destinatario_denominacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_destinatario_direccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_traslado_motivo", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_traslado_bultos", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_traslado_tipo_transporte", tipo: "VarChar(255)", nulo: true },
      { nombre: "guia_traslado_fecha_inicio", tipo: "Date", nulo: true },
      { nombre: "guia_traslado_peso_bruto", tipo: "VarChar(2)", nulo: true },
      { nombre: "guia_traslado_unidad_medida", tipo: "VarChar(10)", nulo: true },
      { nombre: "guia_traslado_vehiculo_placa", tipo: "VarChar(10)", nulo: true },
      { nombre: "punto_partida_direccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "punto_partida_ubigeo", tipo: "VarChar(255)", nulo: true },
      { nombre: "punto_llegada_direccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "punto_llegada_ubigeo", tipo: "VarChar(255)", nulo: true },
      { nombre: "id_proyecto", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "proyecto", campo: "id_proyecto" } },
      { nombre: "id_etapa", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "etapas", campo: "id_etapa" } },
      { nombre: "id_frente", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "frente", campo: "id_frente" } },
      { nombre: "id_sector", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "sector", campo: "id_sector" } },
      { nombre: "id_partida", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "partida", campo: "id_partida" } },
      { nombre: "id_subproyecto", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "subproyectos", campo: "id_subproyecto" } },
      { nombre: "id_subetapa", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "sub_etapas", campo: "id_sub_etapa" } },
      { nombre: "id_subfrente", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "subfrente", campo: "id_subfrente" } },
      { nombre: "id_subsector", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "subsector", campo: "id_subsector" } },
      { nombre: "id_subpartida", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "subpartida", campo: "id_subpartida" } },
      { nombre: "hora_registro", tipo: "DateTime", nulo: true },
      { nombre: "deleted_at", tipo: "Timestamp", nulo: true, nota: "Soft delete — si no es null, el registro está eliminado" },
      { nombre: "backend_logs", tipo: "LongText", nulo: true },
      { nombre: "numero_orden", tipo: "VarChar(100)", nulo: true },
    ],
  },
  {
    tabla: "camiones", db: "principal",
    descripcion: "Flota de vehículos y maquinaria. El campo 'tipo' distingue camión de maquinaria.",
    campos: [
      { nombre: "id_camion", tipo: "Int", nulo: false, pk: true },
      { nombre: "placa", tipo: "VarChar(10)", nulo: false, nota: "Único (uk_placa)" },
      { nombre: "marca", tipo: "VarChar(50)", nulo: true },
      { nombre: "modelo", tipo: "VarChar(50)", nulo: true },
      { nombre: "año", tipo: "Year", nulo: true },
      { nombre: "capacidad_tanque", tipo: "Decimal(10,2)", nulo: true },
      { nombre: "id_tipo_combustible_preferido", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "tipos_combustible", campo: "id_tipo_combustible" } },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "fecha_registro", tipo: "Timestamp", nulo: true, default: "now()" },
      { nombre: "dni", tipo: "VarChar(255)", nulo: true },
      { nombre: "nombre_chofer", tipo: "VarChar(255)", nulo: true },
      { nombre: "apellido_chofer", tipo: "VarChar(255)", nulo: true },
      { nombre: "numero_licencia", tipo: "VarChar(255)", nulo: true },
      { nombre: "empresa", tipo: "VarChar(255)", nulo: true },
      { nombre: "tipo", tipo: "Enum", nulo: false, enum: ["CAMION", "MAQUINARIA"] },
    ],
  },
  {
    tabla: "empresas_2025", db: "principal",
    descripcion: "Directorio de empresas contratistas. PK = codigo (RUC). Usado en selectores de empresa/proyecto. FK destino de proyecto.cliente.",
    campos: [
      { nombre: "codigo", tipo: "VarChar(255)", nulo: false, pk: true, nota: "RUC de la empresa" },
      { nombre: "razon_social", tipo: "VarChar(255)", nulo: true },
      { nombre: "nro_documento", tipo: "VarChar(255)", nulo: true },
      { nombre: "tipo", tipo: "VarChar(255)", nulo: true, nota: "Ej: CLIENTE · PROVEEDOR · CONTRATISTA" },
      { nombre: "direccion", tipo: "VarChar(255)", nulo: true },
    ],
  },
  {
    tabla: "proyecto", db: "principal",
    descripcion: "Proyectos de obra. Jerarquía: proyecto → etapas → sector → frente → partida.",
    campos: [
      { nombre: "id_proyecto", tipo: "Int", nulo: false, pk: true },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "fecha_inicio", tipo: "Date", nulo: true },
      { nombre: "fecha_fin", tipo: "Date", nulo: true },
      { nombre: "estado", tipo: "Enum", nulo: true, default: "activo", enum: ["activo", "inactivo", "finalizado"] },
      { nombre: "cliente", tipo: "VarChar(200)", nulo: true, fk: { db: "principal", tabla: "empresas_2025", campo: "codigo" } },
      { nombre: "ubicacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "created_at", tipo: "Timestamp", nulo: true, default: "now()" },
      { nombre: "updated_at", tipo: "Timestamp", nulo: true, default: "now()" },
    ],
  },
  {
    tabla: "etapas", db: "principal",
    descripcion: "Etapas dentro de un proyecto. Hijo de proyecto, padre de sector.",
    campos: [
      { nombre: "id_etapa", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_proyecto", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "proyecto", campo: "id_proyecto" } },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
      { nombre: "updated_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "sector", db: "principal",
    descripcion: "Sectores dentro de una etapa. Hijo de etapas, padre de frente.",
    campos: [
      { nombre: "id_sector", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_etapa", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "etapas", campo: "id_etapa" } },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "ubicacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
      { nombre: "updated_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "frente", db: "principal",
    descripcion: "Frentes dentro de un sector. Hijo de sector, padre de partida.",
    campos: [
      { nombre: "id_frente", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_sector", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "sector", campo: "id_sector" } },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "responsable", tipo: "VarChar(100)", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "partida", db: "principal",
    descripcion: "Partidas dentro de un frente. Nivel hoja de la jerarquía clásica.",
    campos: [
      { nombre: "id_partida", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_frente", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "frente", campo: "id_frente" } },
      { nombre: "codigo", tipo: "VarChar(50)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: false },
      { nombre: "unidad_medida", tipo: "VarChar(20)", nulo: true },
      { nombre: "cantidad", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "precio_unitario", tipo: "Decimal(12,2)", nulo: true, default: "0.00" },
      { nombre: "total", tipo: "Decimal(12,2)", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
    ],
  },
  {
    tabla: "subproyectos", db: "principal",
    descripcion: "Sub-proyectos. Jerarquía alternativa: subproyecto → sub_etapas → subsector → subfrente → subpartida.",
    campos: [
      { nombre: "id_subproyecto", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_proyecto", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "proyecto", campo: "id_proyecto" } },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "sub_etapas", db: "principal",
    descripcion: "Sub-etapas. Hijo de subproyectos, padre de subsector.",
    campos: [
      { nombre: "id_sub_etapa", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_subproyecto", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "subproyectos", campo: "id_subproyecto" } },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "subsector", db: "principal",
    descripcion: "Sub-sectores. Hijo de sub_etapas, padre de subfrente.",
    campos: [
      { nombre: "id_subsector", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_sub_etapa", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "sub_etapas", campo: "id_sub_etapa" } },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "ubicacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "subfrente", db: "principal",
    descripcion: "Sub-frentes. Hijo de subsector, padre de subpartida.",
    campos: [
      { nombre: "id_subfrente", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_subsector", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "subsector", campo: "id_subsector" } },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "responsable", tipo: "VarChar(100)", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "subpartida", db: "principal",
    descripcion: "Sub-partidas. Nivel hoja de la jerarquía alternativa.",
    campos: [
      { nombre: "id_subpartida", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_subfrente", tipo: "Int", nulo: false, fk: { db: "principal", tabla: "subfrente", campo: "id_subfrente" } },
      { nombre: "codigo", tipo: "VarChar(50)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: false },
      { nombre: "unidad_medida", tipo: "VarChar(20)", nulo: true },
      { nombre: "cantidad", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "precio_unitario", tipo: "Decimal(12,2)", nulo: true, default: "0.00" },
      { nombre: "total", tipo: "Decimal(12,2)", nulo: true },
      { nombre: "orden", tipo: "Int", nulo: true, default: "1" },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
    ],
  },
  {
    tabla: "personal", db: "principal",
    descripcion: "Personal de obra (operadores, vigías, etc.). Usado en reportes_operadores y viajes_eliminacion.",
    campos: [
      { nombre: "id_personal", tipo: "Int", nulo: false, pk: true },
      { nombre: "nombres", tipo: "VarChar(100)", nulo: false },
      { nombre: "apellidos", tipo: "VarChar(100)", nulo: false },
      { nombre: "dni", tipo: "VarChar(20)", nulo: false, nota: "Único (uk_dni_personal)" },
      { nombre: "telefono", tipo: "VarChar(20)", nulo: true },
      { nombre: "correo", tipo: "VarChar(100)", nulo: true },
      { nombre: "fecha_ingreso", tipo: "Date", nulo: false },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "observaciones", tipo: "Text", nulo: true },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
      { nombre: "updated_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "equipos", db: "principal",
    descripcion: "Equipos pesados (excavadoras, cargadores, etc.). Usado en reportes_operadores.",
    campos: [
      { nombre: "id_equipo", tipo: "Int", nulo: false, pk: true },
      { nombre: "tipo_equipo", tipo: "Enum", nulo: false, enum: ["EXCAVADORA","CARGADOR","MINICARGADOR","MOTONIVELADORA","PAVIMENTADORA","RODILLO","VIBROAPRISIONADOR","FLETE_TRANSPORTE","COMPRESOR","GRUA","PLATAFORMA_ELEVADORA","SERVICIO_PERSONAL","SERVICIO_ESPECIALIZADO","HERRAMIENTA_MANUAL","EQUIPO_TOPOGRAFIA"] },
      { nombre: "marca", tipo: "VarChar(100)", nulo: false },
      { nombre: "modelo", tipo: "VarChar(100)", nulo: false },
      { nombre: "placa", tipo: "VarChar(45)", nulo: true },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "unidad", tipo: "VarChar(50)", nulo: false },
      { nombre: "precio_referencial", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
      { nombre: "updated_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "ingresos_materiales", db: "principal",
    descripcion: "Ingresos de material a cantera. Tipos: AFIRMADO, SUBBASE, BASE, PROPIO, MEJORADO.",
    campos: [
      { nombre: "id", tipo: "Int", nulo: false, pk: true },
      { nombre: "codigo", tipo: "VarChar(50)", nulo: false, nota: "Único" },
      { nombre: "fecha", tipo: "Date", nulo: false },
      { nombre: "placa", tipo: "VarChar(20)", nulo: false },
      { nombre: "guia_remision", tipo: "VarChar(50)", nulo: false },
      { nombre: "guia_transportista", tipo: "VarChar(50)", nulo: false },
      { nombre: "tipo_material", tipo: "Enum", nulo: false, enum: ["AFIRMADO","SUBBASE","BASE","PROPIO","MEJORADO"] },
      { nombre: "toneladas", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "precio_unitario", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "costo_total", tipo: "Decimal(12,2)", nulo: true },
      { nombre: "productor_id", tipo: "Int", nulo: true, fk: { db: "principal", tabla: "productores", campo: "id" } },
      { nombre: "autorizacion", tipo: "Enum", nulo: true, default: "PENDIENTE", enum: ["PENDIENTE","APROBADO","RECHAZADO"] },
      { nombre: "observaciones", tipo: "Text", nulo: true },
    ],
  },
  {
    tabla: "nombres_proveedores", db: "principal",
    descripcion: "Proveedores del módulo de combustible (DB principal). Tabla diferente a proveedores en terciaria.",
    campos: [
      { nombre: "id_proveedor", tipo: "Int", nulo: false, pk: true },
      { nombre: "codigo", tipo: "VarChar(20)", nulo: true, nota: "Único (uk_codigo)" },
      { nombre: "razon_social", tipo: "VarChar(255)", nulo: true },
      { nombre: "numero_documento", tipo: "VarChar(20)", nulo: true, nota: "Único (uk_numero_documento)" },
      { nombre: "tipo_proveedor", tipo: "VarChar(50)", nulo: true },
      { nombre: "direccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "telefono", tipo: "VarChar(20)", nulo: true },
      { nombre: "correo", tipo: "VarChar(100)", nulo: true },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "fecha_registro", tipo: "Timestamp", nulo: true },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // DB TERCIARIA (inventariosayala2025)
  // ─────────────────────────────────────────────────────────────
  {
    tabla: "ordenes_compra", db: "terciaria",
    descripcion: "Órdenes de compra. Soft delete con deleted_at. Flujo de aprobación: registrado_por → jefe_proyecto → auto_administrador → auto_contabilidad. Estado firma: PENDIENTE → FIRMADA.",
    campos: [
      { nombre: "id_orden_compra", tipo: "Int", nulo: false, pk: true },
      { nombre: "numero_orden", tipo: "VarChar(50)", nulo: false, nota: "Único (uk_numero_orden)" },
      { nombre: "id_proveedor", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "proveedores", campo: "id_proveedor" } },
      { nombre: "fecha_orden", tipo: "Date", nulo: false },
      { nombre: "fecha_entrega_prevista", tipo: "Date", nulo: true },
      { nombre: "subtotal", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "igv", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "total", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "estado", tipo: "Enum", nulo: true, default: "PENDIENTE", enum: ["PENDIENTE","APROBADA","PARCIALMENTE_RECEPCIONADA","COMPLETADA","CANCELADA","FIRMADA"] },
      { nombre: "observaciones", tipo: "Text", nulo: true },
      { nombre: "fecha_registro", tipo: "Timestamp", nulo: true, default: "now()" },
      { nombre: "registrado_por", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "usuarios", campo: "id" } },
      { nombre: "tiene_anticipo", tipo: "VarChar(255)", nulo: true, nota: "Flag texto Si/No" },
      { nombre: "procede_pago", tipo: "VarChar(255)", nulo: true },
      { nombre: "fecha_procede_pago", tipo: "DateTime", nulo: true },
      { nombre: "auto_administrador", tipo: "Boolean", nulo: true, default: "false", nota: "Aprobación administrador" },
      { nombre: "fecha_auto_administrador", tipo: "DateTime", nulo: true },
      { nombre: "auto_contabilidad", tipo: "Boolean", nulo: true, default: "false", nota: "Aprobación contabilidad" },
      { nombre: "fecha_auto_contabilidad", tipo: "DateTime", nulo: true },
      { nombre: "jefe_proyecto", tipo: "Boolean", nulo: true, default: "false", nota: "Aprobación jefe proyecto" },
      { nombre: "fecha_jefe_proyecto", tipo: "DateTime", nulo: true },
      { nombre: "has_anticipo", tipo: "Boolean", nulo: true, default: "false" },
      { nombre: "direccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "centro_costo_nivel1", tipo: "VarChar(255)", nulo: true },
      { nombre: "centro_costo_nivel2", tipo: "VarChar(255)", nulo: true },
      { nombre: "centro_costo_nivel3", tipo: "VarChar(255)", nulo: true },
      { nombre: "condicion", tipo: "VarChar(255)", nulo: true, nota: "Condición de pago" },
      { nombre: "moneda", tipo: "VarChar(255)", nulo: true, nota: "Ej: PEN · USD" },
      { nombre: "tipo_cambio", tipo: "Decimal(10,3)", nulo: true, default: "0.000" },
      { nombre: "hora_firma", tipo: "DateTime", nulo: true },
      { nombre: "usuario_firma", tipo: "Int", nulo: true, nota: "ID usuario que firmó" },
      { nombre: "estado_firma", tipo: "Enum", nulo: true, default: "PENDIENTE", enum: ["PENDIENTE","FIRMADA"] },
      { nombre: "ruta_pdf", tipo: "VarChar(500)", nulo: true },
      { nombre: "retencion", tipo: "VarChar(45)", nulo: true, nota: "Si · No" },
      { nombre: "porcentaje_valor_retencion", tipo: "VarChar(255)", nulo: true },
      { nombre: "valor_retencion", tipo: "Decimal(10,3)", nulo: true, default: "0.000" },
      { nombre: "detraccion", tipo: "VarChar(45)", nulo: true, nota: "Si · No" },
      { nombre: "porcentaje_valor_detraccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "valor_detraccion", tipo: "Decimal(10,3)", nulo: true, default: "0.000" },
      { nombre: "tipo_detraccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "id_camion", tipo: "Int", nulo: true, nota: "Vehículo asociado (sin FK formal)" },
      { nombre: "almacen_central", tipo: "VarChar(45)", nulo: true },
      { nombre: "url", tipo: "VarChar(255)", nulo: true, nota: "URL documento principal" },
      { nombre: "url_cotizacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "url_factura", tipo: "VarChar(255)", nulo: true },
      { nombre: "nro_factura", tipo: "VarChar(45)", nulo: true },
      { nombre: "url_comprobante_retencion", tipo: "VarChar(255)", nulo: true },
      { nombre: "nro_serie", tipo: "VarChar(255)", nulo: true, nota: "Serie de la factura (Ej: F001)" },
      { nombre: "deleted_at", tipo: "Timestamp", nulo: true, nota: "Soft delete" },
      { nombre: "backend_logs", tipo: "LongText", nulo: true },
      { nombre: "editado_por", tipo: "Int", nulo: true },
      { nombre: "fecha_edicion", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "ordenes_servicio", db: "terciaria",
    descripcion: "Órdenes de servicio. Estructura idéntica a ordenes_compra. Soft delete con deleted_at.",
    campos: [
      { nombre: "id_orden_servicio", tipo: "Int", nulo: false, pk: true },
      { nombre: "numero_orden", tipo: "VarChar(50)", nulo: false, nota: "Único" },
      { nombre: "id_proveedor", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "proveedores", campo: "id_proveedor" } },
      { nombre: "fecha_orden", tipo: "Date", nulo: false },
      { nombre: "fecha_entrega_prevista", tipo: "Date", nulo: true },
      { nombre: "subtotal", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "igv", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "total", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "estado", tipo: "Enum", nulo: true, default: "PENDIENTE", enum: ["PENDIENTE","APROBADA","PARCIALMENTE_RECEPCIONADA","COMPLETADA","CANCELADA","FIRMADA"] },
      { nombre: "observaciones", tipo: "Text", nulo: true },
      { nombre: "fecha_registro", tipo: "Timestamp", nulo: true, default: "now()" },
      { nombre: "registrado_por", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "usuarios", campo: "id" } },
      { nombre: "tiene_anticipo", tipo: "VarChar(255)", nulo: true },
      { nombre: "procede_pago", tipo: "VarChar(255)", nulo: true },
      { nombre: "fecha_procede_pago", tipo: "DateTime", nulo: true },
      { nombre: "auto_administrador", tipo: "Boolean", nulo: true, default: "false" },
      { nombre: "fecha_auto_administrador", tipo: "DateTime", nulo: true },
      { nombre: "jefe_proyecto", tipo: "Boolean", nulo: true, default: "false" },
      { nombre: "fecha_jefe_proyecto", tipo: "DateTime", nulo: true },
      { nombre: "auto_contabilidad", tipo: "Boolean", nulo: true, default: "false" },
      { nombre: "fecha_auto_contabilidad", tipo: "DateTime", nulo: true },
      { nombre: "has_anticipo", tipo: "Boolean", nulo: true, default: "false" },
      { nombre: "direccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "centro_costo_nivel1", tipo: "VarChar(255)", nulo: true },
      { nombre: "centro_costo_nivel2", tipo: "VarChar(255)", nulo: true },
      { nombre: "centro_costo_nivel3", tipo: "VarChar(255)", nulo: true },
      { nombre: "condicion", tipo: "VarChar(255)", nulo: true },
      { nombre: "moneda", tipo: "VarChar(255)", nulo: true },
      { nombre: "tipo_cambio", tipo: "Decimal(10,3)", nulo: true, default: "0.000" },
      { nombre: "hora_firma", tipo: "DateTime", nulo: true },
      { nombre: "usuario_firma", tipo: "Int", nulo: true },
      { nombre: "estado_firma", tipo: "Enum", nulo: true, default: "PENDIENTE", enum: ["PENDIENTE","FIRMADA"] },
      { nombre: "ruta_pdf", tipo: "VarChar(500)", nulo: true },
      { nombre: "detraccion", tipo: "VarChar(45)", nulo: true },
      { nombre: "porcentaje_valor_detraccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "valor_detraccion", tipo: "Decimal(10,3)", nulo: true, default: "0.000" },
      { nombre: "tipo_detraccion", tipo: "VarChar(255)", nulo: true },
      { nombre: "retencion", tipo: "VarChar(45)", nulo: true },
      { nombre: "porcentaje_valor_retencion", tipo: "VarChar(255)", nulo: true },
      { nombre: "valor_retencion", tipo: "Decimal(10,3)", nulo: true, default: "0.000" },
      { nombre: "id_camion", tipo: "Int", nulo: true },
      { nombre: "almacen_central", tipo: "VarChar(45)", nulo: true },
      { nombre: "url", tipo: "VarChar(255)", nulo: true },
      { nombre: "url_cotizacion", tipo: "VarChar(255)", nulo: true },
      { nombre: "url_factura", tipo: "VarChar(255)", nulo: true },
      { nombre: "nro_factura", tipo: "VarChar(45)", nulo: true },
      { nombre: "url_comprobante_retencion", tipo: "VarChar(255)", nulo: true },
      { nombre: "nro_serie", tipo: "VarChar(255)", nulo: true },
      { nombre: "deleted_at", tipo: "Timestamp", nulo: true, nota: "Soft delete" },
      { nombre: "backend_logs", tipo: "LongText", nulo: true },
      { nombre: "editado_por", tipo: "Int", nulo: true },
      { nombre: "fecha_edicion", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "multifactura_detalle", db: "terciaria",
    descripcion: "Múltiples facturas vinculadas a una orden de compra o servicio. Formato mostrado: 'nro_serie - nro_factura'.",
    campos: [
      { nombre: "id_detalle", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_orden_compra", tipo: "Int", nulo: true, fk: { db: "terciaria", tabla: "ordenes_compra", campo: "id_orden_compra" } },
      { nombre: "id_orden_servicio", tipo: "Int", nulo: true, fk: { db: "terciaria", tabla: "ordenes_servicio", campo: "id_orden_servicio" } },
      { nombre: "nro_serie", tipo: "VarChar(50)", nulo: true, nota: "Serie (Ej: F001)" },
      { nombre: "nro_factura", tipo: "VarChar(100)", nulo: true, nota: "Número de factura (Ej: 00001234)" },
      { nombre: "galones", tipo: "VarChar(50)", nulo: true },
      { nombre: "proyecto", tipo: "VarChar(255)", nulo: true },
      { nombre: "url_factura", tipo: "VarChar(500)", nulo: true },
      { nombre: "url_guia", tipo: "VarChar(500)", nulo: true },
      { nombre: "fecha_registro", tipo: "Timestamp", nulo: true, default: "now()" },
    ],
  },
  {
    tabla: "detalles_orden_compra", db: "terciaria",
    descripcion: "Líneas de detalle de una orden de compra. Cada línea es un ítem del catálogo.",
    campos: [
      { nombre: "id_detalle", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_orden_compra", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "ordenes_compra", campo: "id_orden_compra" } },
      { nombre: "codigo_item", tipo: "VarChar(255)", nulo: false, fk: { db: "terciaria", tabla: "listado_items_2025", campo: "codigo" } },
      { nombre: "descripcion_item", tipo: "Text", nulo: false },
      { nombre: "cantidad_solicitada", tipo: "Decimal(10,3)", nulo: false },
      { nombre: "cantidad_recibida", tipo: "Int", nulo: true, default: "0" },
      { nombre: "precio_unitario", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "subtotal", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "centro_costo", tipo: "VarChar(255)", nulo: true },
      { nombre: "prorrateo", tipo: "Decimal(5,2)", nulo: true },
    ],
  },
  {
    tabla: "detalles_orden_servicio", db: "terciaria",
    descripcion: "Líneas de detalle de una orden de servicio.",
    campos: [
      { nombre: "id_detalle", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_orden_servicio", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "ordenes_servicio", campo: "id_orden_servicio" } },
      { nombre: "codigo_item", tipo: "VarChar(255)", nulo: false, fk: { db: "terciaria", tabla: "listado_items_2025", campo: "codigo" } },
      { nombre: "descripcion_item", tipo: "Text", nulo: false },
      { nombre: "cantidad_solicitada", tipo: "Int", nulo: false },
      { nombre: "cantidad_recibida", tipo: "Int", nulo: true, default: "0" },
      { nombre: "precio_unitario", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "subtotal", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "centro_costo", tipo: "VarChar(255)", nulo: true },
      { nombre: "prorrateo", tipo: "Decimal(5,2)", nulo: true },
    ],
  },
  {
    tabla: "proveedores", db: "terciaria",
    descripcion: "Proveedores del sistema de compras/servicios (DB terciaria). Diferente de nombres_proveedores en DB principal.",
    campos: [
      { nombre: "id_proveedor", tipo: "Int", nulo: false, pk: true },
      { nombre: "codigo_proveedor", tipo: "VarChar(50)", nulo: false, nota: "Único (código interno)" },
      { nombre: "nombre_proveedor", tipo: "VarChar(255)", nulo: false },
      { nombre: "contacto", tipo: "VarChar(255)", nulo: true },
      { nombre: "telefono", tipo: "VarChar(50)", nulo: true },
      { nombre: "email", tipo: "VarChar(100)", nulo: true },
      { nombre: "direccion", tipo: "Text", nulo: true },
      { nombre: "ruc", tipo: "VarChar(20)", nulo: true },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "fecha_registro", tipo: "Timestamp", nulo: true },
      { nombre: "fecha_actualizacion", tipo: "Timestamp", nulo: true },
      { nombre: "entidad_bancaria", tipo: "VarChar(255)", nulo: true },
      { nombre: "numero_cuenta_bancaria", tipo: "VarChar(255)", nulo: true },
      { nombre: "retencion", tipo: "Enum", nulo: true, enum: ["Si","No"] },
      { nombre: "es_agente_retencion", tipo: "VarChar(255)", nulo: true, nota: "1 = Sí, 0 = No (texto)" },
    ],
  },
  {
    tabla: "listado_items_2025", db: "terciaria",
    descripcion: "Catálogo de productos e ítems de inventario. Referenciado por detalles de órdenes y movimientos.",
    campos: [
      { nombre: "codigo", tipo: "VarChar(255)", nulo: false, pk: true },
      { nombre: "descripcion", tipo: "Text", nulo: false },
      { nombre: "id_familia", tipo: "Int", nulo: true, fk: { db: "terciaria", tabla: "familias_productos", campo: "id_familia" } },
      { nombre: "grupo", tipo: "VarChar(100)", nulo: true },
      { nombre: "u_m", tipo: "VarChar(50)", nulo: true, default: "UND", nota: "Unidad de medida" },
      { nombre: "precio_unitario", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "stock_minimo", tipo: "Int", nulo: true, default: "0" },
      { nombre: "stock_maximo", tipo: "Int", nulo: true, default: "0" },
      { nombre: "ubicacion", tipo: "VarChar(100)", nulo: true },
      { nombre: "marca", tipo: "VarChar(100)", nulo: true },
      { nombre: "modelo", tipo: "VarChar(100)", nulo: true },
      { nombre: "numero_serie", tipo: "VarChar(100)", nulo: true },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
    ],
  },
  {
    tabla: "factura", db: "terciaria",
    descripcion: "Facturas electrónicas (comprobantes emitidos vía Nubefact/SUNAT). tipo_de_comprobante: 1=Factura, 3=Boleta, 7=Nota Crédito, 8=Nota Débito.",
    campos: [
      { nombre: "id_factura", tipo: "Int", nulo: false, pk: true },
      { nombre: "estado_factura", tipo: "VarChar(20)", nulo: true, nota: "emitida · anulada · pendiente" },
      { nombre: "operacion", tipo: "VarChar(50)", nulo: false, default: "generar_comprobante" },
      { nombre: "tipo_de_comprobante", tipo: "Int", nulo: false, nota: "1=Factura · 3=Boleta · 7=Nota Crédito · 8=Nota Débito" },
      { nombre: "serie", tipo: "VarChar(4)", nulo: false, nota: "Ej: F001 · B001" },
      { nombre: "numero", tipo: "Int", nulo: false },
      { nombre: "sunat_transaction", tipo: "Int", nulo: false, default: "1" },
      { nombre: "id_proveedor", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "proveedores", campo: "id_proveedor" } },
      { nombre: "cliente_tipo_documento", tipo: "Int", nulo: false, default: "6", nota: "6=RUC · 1=DNI" },
      { nombre: "cliente_numero_documento", tipo: "VarChar(15)", nulo: false },
      { nombre: "cliente_denominacion", tipo: "VarChar(100)", nulo: false },
      { nombre: "cliente_direccion", tipo: "VarChar(100)", nulo: true },
      { nombre: "cliente_email", tipo: "VarChar(250)", nulo: true },
      { nombre: "fecha_emision", tipo: "Date", nulo: false },
      { nombre: "fecha_vencimiento", tipo: "Date", nulo: true },
      { nombre: "fecha_servicio", tipo: "Date", nulo: true },
      { nombre: "moneda", tipo: "Int", nulo: false, default: "1", nota: "1=PEN · 2=USD" },
      { nombre: "tipo_cambio", tipo: "Decimal(10,3)", nulo: true },
      { nombre: "porcentaje_igv", tipo: "Decimal(5,2)", nulo: false, default: "18.00" },
      { nombre: "total_gravada", tipo: "Decimal(12,2)", nulo: true },
      { nombre: "total_igv", tipo: "Decimal(12,2)", nulo: true },
      { nombre: "total", tipo: "Decimal(12,2)", nulo: false },
      { nombre: "aplicar_detraccion", tipo: "Boolean", nulo: false, default: "false" },
      { nombre: "detraccion_tipo", tipo: "Int", nulo: true },
      { nombre: "detraccion_porcentaje", tipo: "Decimal(5,2)", nulo: true },
      { nombre: "detraccion_total", tipo: "Decimal(12,2)", nulo: true },
      { nombre: "orden_compra_servicio", tipo: "VarChar(20)", nulo: true, nota: "Número de OC/OS relacionada" },
      { nombre: "observaciones", tipo: "Text", nulo: true },
      { nombre: "enlace_del_pdf", tipo: "VarChar(255)", nulo: true },
      { nombre: "enlace_del_xml", tipo: "VarChar(255)", nulo: true },
      { nombre: "enlace_del_cdr", tipo: "VarChar(255)", nulo: true },
      { nombre: "aceptada_por_sunat", tipo: "Boolean", nulo: true },
      { nombre: "sunat_description", tipo: "Text", nulo: true, nota: "Respuesta SUNAT" },
      { nombre: "condiciones_de_pago", tipo: "VarChar(250)", nulo: true },
      { nombre: "created_at", tipo: "Timestamp", nulo: false, default: "now()" },
      { nombre: "updated_at", tipo: "Timestamp", nulo: false },
    ],
  },
  {
    tabla: "factura_item", db: "terciaria",
    descripcion: "Líneas de detalle de una factura electrónica.",
    campos: [
      { nombre: "id_factura_item", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_factura", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "factura", campo: "id_factura" } },
      { nombre: "codigo_item", tipo: "VarChar(250)", nulo: true },
      { nombre: "codigo_producto_sunat", tipo: "VarChar(8)", nulo: true },
      { nombre: "descripcion_item", tipo: "VarChar(250)", nulo: false },
      { nombre: "unidad_medida", tipo: "VarChar(5)", nulo: false, nota: "Código SUNAT (Ej: NIU)" },
      { nombre: "cantidad", tipo: "Decimal(12,4)", nulo: false },
      { nombre: "valor_unitario", tipo: "Decimal(12,2)", nulo: false, nota: "Sin IGV" },
      { nombre: "precio_unitario", tipo: "Decimal(12,2)", nulo: false, nota: "Con IGV" },
      { nombre: "descuento", tipo: "Decimal(12,2)", nulo: true },
      { nombre: "subtotal", tipo: "Decimal(12,2)", nulo: false },
      { nombre: "tipo_de_igv", tipo: "Int", nulo: false, nota: "10=Gravado · 20=Exonerado · 30=Inafecto" },
      { nombre: "igv", tipo: "Decimal(12,2)", nulo: false },
      { nombre: "total", tipo: "Decimal(12,2)", nulo: false },
      { nombre: "created_at", tipo: "Timestamp", nulo: false },
    ],
  },
  {
    tabla: "movimientos_inventario", db: "terciaria",
    descripcion: "Entradas, salidas y transferencias de inventario. Estado: PENDIENTE → APROBADO. También puede ser ANULADO.",
    campos: [
      { nombre: "id_movimiento", tipo: "Int", nulo: false, pk: true },
      { nombre: "id_tipo_movimiento", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "tipos_movimiento", campo: "id_tipo_movimiento" } },
      { nombre: "codigo_item", tipo: "VarChar(255)", nulo: false, fk: { db: "terciaria", tabla: "listado_items_2025", campo: "codigo" } },
      { nombre: "cantidad", tipo: "Int", nulo: false },
      { nombre: "id_almacen_origen", tipo: "Int", nulo: true, fk: { db: "terciaria", tabla: "almacenes", campo: "id_almacen" } },
      { nombre: "id_almacen_destino", tipo: "Int", nulo: true, fk: { db: "terciaria", tabla: "almacenes", campo: "id_almacen" } },
      { nombre: "numero_documento", tipo: "VarChar(100)", nulo: true },
      { nombre: "fecha_movimiento", tipo: "Timestamp", nulo: true, default: "now()" },
      { nombre: "responsable", tipo: "VarChar(255)", nulo: true },
      { nombre: "observaciones", tipo: "Text", nulo: true },
      { nombre: "estado", tipo: "Enum", nulo: true, default: "PENDIENTE", enum: ["PENDIENTE","APROBADO","ANULADO"] },
      { nombre: "precio_unitario", tipo: "Decimal(10,2)", nulo: true },
      { nombre: "placa", tipo: "VarChar(50)", nulo: true },
    ],
  },
  {
    tabla: "almacenes", db: "terciaria",
    descripcion: "Almacenes del sistema de inventario. Soporta jerarquía padre-hijo via id_almacen_padre.",
    campos: [
      { nombre: "id_almacen", tipo: "Int", nulo: false, pk: true },
      { nombre: "codigo_almacen", tipo: "VarChar(50)", nulo: false, nota: "Único" },
      { nombre: "nombre_almacen", tipo: "VarChar(255)", nulo: false },
      { nombre: "descripcion", tipo: "Text", nulo: true },
      { nombre: "tipo_almacen", tipo: "Enum", nulo: false, enum: ["PRINCIPAL","AUXILIAR","SUB_ALMACEN"] },
      { nombre: "id_almacen_padre", tipo: "Int", nulo: true, fk: { db: "terciaria", tabla: "almacenes", campo: "id_almacen" } },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "fecha_creacion", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "stock_almacenes", db: "terciaria",
    descripcion: "Stock actual por ítem por almacén. Índice único: (codigo_item, id_almacen).",
    campos: [
      { nombre: "id_stock", tipo: "Int", nulo: false, pk: true },
      { nombre: "codigo_item", tipo: "VarChar(255)", nulo: false, fk: { db: "terciaria", tabla: "listado_items_2025", campo: "codigo" } },
      { nombre: "id_almacen", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "almacenes", campo: "id_almacen" } },
      { nombre: "cantidad", tipo: "Int", nulo: true, default: "0" },
      { nombre: "fecha_actualizacion", tipo: "Timestamp", nulo: true },
      { nombre: "ubicacion", tipo: "VarChar(255)", nulo: true },
    ],
  },
  {
    tabla: "balances_iniciales", db: "terciaria",
    descripcion: "Saldos iniciales de inventario por ítem y almacén. Índice único: (codigo_item, id_almacen).",
    campos: [
      { nombre: "id_balance_inicial", tipo: "Int", nulo: false, pk: true },
      { nombre: "codigo_item", tipo: "VarChar(255)", nulo: false, fk: { db: "terciaria", tabla: "listado_items_2025", campo: "codigo" } },
      { nombre: "id_almacen", tipo: "Int", nulo: false, fk: { db: "terciaria", tabla: "almacenes", campo: "id_almacen" } },
      { nombre: "cantidad_inicial", tipo: "Decimal(10,2)", nulo: false, default: "0.00" },
      { nombre: "costo_unitario", tipo: "Decimal(10,2)", nulo: false, default: "0.00" },
      { nombre: "fecha_registro", tipo: "Timestamp", nulo: true },
      { nombre: "fecha_inicio", tipo: "Date", nulo: false },
      { nombre: "registrado_por", tipo: "Int", nulo: true },
      { nombre: "observaciones", tipo: "Text", nulo: true },
      { nombre: "numero_factura", tipo: "VarChar(255)", nulo: true },
      { nombre: "estado", tipo: "Enum", nulo: true, default: "APROBADO", enum: ["PENDIENTE","APROBADO","ANULADO"] },
    ],
  },
  {
    tabla: "usuarios", db: "terciaria",
    descripcion: "Usuarios del sistema de inventario/compras. Rol controla acceso.",
    campos: [
      { nombre: "id", tipo: "Int", nulo: false, pk: true },
      { nombre: "usuario", tipo: "VarChar(50)", nulo: false, nota: "Único" },
      { nombre: "nombre", tipo: "VarChar(100)", nulo: false },
      { nombre: "password", tipo: "VarChar(255)", nulo: false },
      { nombre: "rol", tipo: "Enum", nulo: true, default: "USER", enum: ["ADMIN","ALMACENERO","AUXILIAR","USER"] },
      { nombre: "id_almacen", tipo: "Int", nulo: true, fk: { db: "terciaria", tabla: "almacenes", campo: "id_almacen" } },
      { nombre: "activo", tipo: "Boolean", nulo: true, default: "true" },
      { nombre: "fecha_creacion", tipo: "Timestamp", nulo: true },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // DB SECUNDARIA (fuel_kardex_system)
  // ─────────────────────────────────────────────────────────────
  {
    tabla: "fuel_invoices", db: "secundaria",
    descripcion: "Facturas de combustible. Relaciona el costo de combustible con centro de costo y tipo.",
    campos: [
      { nombre: "id", tipo: "Int", nulo: false, pk: true },
      { nombre: "invoice_number", tipo: "VarChar(50)", nulo: false },
      { nombre: "ruc_number", tipo: "VarChar(20)", nulo: false },
      { nombre: "invoice_date", tipo: "Date", nulo: false },
      { nombre: "service_order", tipo: "VarChar(50)", nulo: true },
      { nombre: "unit_value", tipo: "Decimal(10,2)", nulo: true },
      { nombre: "currency", tipo: "VarChar(3)", nulo: true, default: "PEN" },
      { nombre: "subtotal", tipo: "Decimal(10,2)", nulo: true },
      { nombre: "total", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "project", tipo: "VarChar(100)", nulo: true },
      { nombre: "fuel_quantity", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "cost_center_id", tipo: "Int", nulo: true, fk: { db: "secundaria", tabla: "cost_centers", campo: "id" } },
      { nombre: "invoice_type_id", tipo: "Int", nulo: true, fk: { db: "secundaria", tabla: "invoice_types", campo: "id" } },
      { nombre: "created_by", tipo: "Int", nulo: true, fk: { db: "secundaria", tabla: "users", campo: "id" } },
      { nombre: "producto", tipo: "VarChar(50)", nulo: true },
      { nombre: "equipo", tipo: "VarChar(255)", nulo: true },
    ],
  },
  {
    tabla: "fuel_distributions", db: "secundaria",
    descripcion: "Distribución de combustible a maquinaria. Registra voucher y horómetro.",
    campos: [
      { nombre: "id", tipo: "Int", nulo: false, pk: true },
      { nombre: "voucher_number", tipo: "VarChar(50)", nulo: false },
      { nombre: "code", tipo: "VarChar(50)", nulo: false },
      { nombre: "machinery_id", tipo: "Int", nulo: false, fk: { db: "secundaria", tabla: "machinery", campo: "id" } },
      { nombre: "hourmeter", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "distribution_date", tipo: "Date", nulo: false },
      { nombre: "fuel_amount", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "invoice_id", tipo: "Int", nulo: true, fk: { db: "secundaria", tabla: "fuel_invoices", campo: "id" } },
      { nombre: "distributed_by", tipo: "Int", nulo: true, fk: { db: "secundaria", tabla: "users", campo: "id" } },
      { nombre: "authorized_by", tipo: "Int", nulo: true, fk: { db: "secundaria", tabla: "users", campo: "id" } },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "machinery", db: "secundaria",
    descripcion: "Maquinaria registrada para control de combustible.",
    campos: [
      { nombre: "id", tipo: "Int", nulo: false, pk: true },
      { nombre: "code", tipo: "VarChar(50)", nulo: false, nota: "Único" },
      { nombre: "name", tipo: "VarChar(100)", nulo: false },
      { nombre: "description", tipo: "Text", nulo: true },
      { nombre: "current_hourmeter", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "created_at", tipo: "Timestamp", nulo: true },
    ],
  },
  {
    tabla: "fuel_reservations", db: "secundaria",
    descripcion: "Reservas de combustible. Estado: active → used | cancelled.",
    campos: [
      { nombre: "id", tipo: "Int", nulo: false, pk: true },
      { nombre: "reservation_number", tipo: "VarChar(50)", nulo: false },
      { nombre: "invoice_id", tipo: "Int", nulo: true, fk: { db: "secundaria", tabla: "fuel_invoices", campo: "id" } },
      { nombre: "reserved_fuel", tipo: "Decimal(10,2)", nulo: false },
      { nombre: "used_fuel", tipo: "Decimal(10,2)", nulo: true, default: "0.00" },
      { nombre: "reservation_date", tipo: "Date", nulo: false },
      { nombre: "expiry_date", tipo: "Date", nulo: true },
      { nombre: "status", tipo: "Enum", nulo: true, default: "active", enum: ["active","used","cancelled"] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────
const TIPO_COLOR: Record<string, string> = {
  Int: "bg-blue-100 text-blue-800",
  "Decimal": "bg-amber-100 text-amber-800",
  Boolean: "bg-green-100 text-green-800",
  Enum: "bg-orange-100 text-orange-800",
  Text: "bg-gray-100 text-gray-700",
  LongText: "bg-gray-100 text-gray-700",
  Date: "bg-purple-100 text-purple-800",
  DateTime: "bg-purple-100 text-purple-800",
  Timestamp: "bg-purple-100 text-purple-800",
  Time: "bg-purple-100 text-purple-800",
  Year: "bg-purple-100 text-purple-800",
};
function tipoColor(tipo: string): string {
  for (const key of Object.keys(TIPO_COLOR)) {
    if (tipo.startsWith(key)) return TIPO_COLOR[key];
  }
  return "bg-gray-100 text-gray-700";
}

const TABLAS_INDEX = new Set(ESQUEMAS.map((e) => e.tabla));

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function ArquitecturaPage() {
  const [modo, setModo] = useState<Modo>("paginas");

  // Estado modo páginas
  const [paginaSeleccionada, setPaginaSeleccionada] = useState<Pagina>(PAGINAS[0]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas");

  // Estado modo esquema
  const [tablaSeleccionada, setTablaSeleccionada] = useState<string>("programacion_tecnica");
  const [busqueda, setBusqueda] = useState<string>("");

  // ── Modo páginas: cálculos
  const categorias = ["Todas", ...Array.from(new Set(PAGINAS.map((p) => p.categoria)))];
  const paginasFiltradas = categoriaFiltro === "Todas" ? PAGINAS : PAGINAS.filter((p) => p.categoria === categoriaFiltro);
  const tablasPorDB: Record<BaseDatos, TablaConexion[]> = { principal: [], terciaria: [], secundaria: [] };
  paginaSeleccionada.tablas.forEach((t) => tablasPorDB[t.db].push(t));
  const dbsUsadas = (Object.keys(tablasPorDB) as BaseDatos[]).filter((db) => tablasPorDB[db].length > 0);

  // ── Modo esquema: cálculos
  const esquemasFiltrados = useMemo(() => {
    if (!busqueda.trim()) return ESQUEMAS;
    const q = busqueda.toLowerCase();
    return ESQUEMAS.filter(
      (e) => e.tabla.toLowerCase().includes(q) || e.descripcion.toLowerCase().includes(q) || e.campos.some((c) => c.nombre.toLowerCase().includes(q))
    );
  }, [busqueda]);

  const esquemaActual = ESQUEMAS.find((e) => e.tabla === tablaSeleccionada) ?? ESQUEMAS[0];

  const esquemasPorDB = useMemo(() => ({
    principal: esquemasFiltrados.filter((e) => e.db === "principal"),
    terciaria: esquemasFiltrados.filter((e) => e.db === "terciaria"),
    secundaria: esquemasFiltrados.filter((e) => e.db === "secundaria"),
  }), [esquemasFiltrados]);

  function navegarTabla(tabla: string) {
    if (TABLAS_INDEX.has(tabla)) {
      setTablaSeleccionada(tabla);
      setBusqueda("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 shadow-sm flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Arquitectura del Sistema</h1>
          <p className="text-xs text-gray-500 mt-0.5">Mapa de páginas, tablas y esquemas de las 3 bases de datos</p>
        </div>
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setModo("paginas")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${modo === "paginas" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            📄 Páginas → Tablas
          </button>
          <button
            onClick={() => setModo("esquema")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${modo === "esquema" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            🔍 Explorar Esquema
          </button>
        </div>
      </div>

      {/* Leyenda DB */}
      <div className="px-6 py-2 bg-white border-b flex flex-wrap gap-4 items-center flex-shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Base de datos:</span>
        {(Object.keys(DB_CONFIG) as BaseDatos[]).map((db) => (
          <div key={db} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${DB_CONFIG[db].dot}`} />
            <span className="text-xs text-gray-700 font-medium">{DB_CONFIG[db].nombre}</span>
            <span className="text-xs text-gray-400">({DB_NOMBRES[db]})</span>
          </div>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 overflow-hidden">
        {modo === "paginas" ? (
          <>
            {/* ── MODO PÁGINAS ── */}
            {/* Panel izquierdo */}
            <div className="w-72 bg-white border-r overflow-y-auto flex-shrink-0">
              <div className="p-3 border-b sticky top-0 bg-white z-10">
                <select
                  className="w-full text-sm border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>{c === "Todas" ? "📂 Todas las categorías" : `${CATEGORIA_ICONOS[c] ?? "•"} ${c}`}</option>
                  ))}
                </select>
              </div>
              {categorias.filter((c) => c !== "Todas").filter((c) => categoriaFiltro === "Todas" || c === categoriaFiltro).map((categoria) => {
                const pagsCat = paginasFiltradas.filter((p) => p.categoria === categoria);
                if (pagsCat.length === 0) return null;
                return (
                  <div key={categoria}>
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{CATEGORIA_ICONOS[categoria]} {categoria}</span>
                    </div>
                    {pagsCat.map((pagina) => (
                      <button
                        key={pagina.id}
                        onClick={() => setPaginaSeleccionada(pagina)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-l-2 ${
                          paginaSeleccionada.id === pagina.id
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                            : "border-transparent text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">{pagina.nombre}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{pagina.ruta}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Panel derecho */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-5 mb-6 max-w-3xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{CATEGORIA_ICONOS[paginaSeleccionada.categoria] ?? "📄"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-900">{paginaSeleccionada.nombre}</h2>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono border">{paginaSeleccionada.categoria}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 font-mono">{paginaSeleccionada.ruta}</p>
                    <p className="text-sm text-gray-600 mt-2">{paginaSeleccionada.descripcion}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {paginaSeleccionada.tablas.map((t) => (
                        <span key={`${t.db}-${t.tabla}`} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DB_CONFIG[t.db].badge}`}>{t.tabla}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-gray-300" />
                  <svg className="text-gray-400" width="16" height="10" viewBox="0 0 16 10"><path d="M8 10 L0 0 L16 0 Z" fill="currentColor" /></svg>
                  <span className="text-xs text-gray-400 mt-1 font-medium">usa las tablas</span>
                </div>
              </div>

              <div className={`grid gap-4 max-w-5xl mx-auto ${dbsUsadas.length === 1 ? "grid-cols-1" : dbsUsadas.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {dbsUsadas.map((db) => (
                  <div key={db} className={`rounded-xl border-2 p-4 ${DB_CONFIG[db].color}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${DB_CONFIG[db].dot}`} />
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{DB_CONFIG[db].nombre}</div>
                        <div className="text-xs text-gray-500 font-mono">{DB_NOMBRES[db]}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {tablasPorDB[db].map((t) => (
                        <div key={t.tabla} className="bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-mono text-sm font-semibold text-gray-800">{t.tabla}</div>
                            {TABLAS_INDEX.has(t.tabla) && (
                              <button
                                onClick={() => { setModo("esquema"); setTablaSeleccionada(t.tabla); }}
                                className="text-xs text-blue-500 hover:text-blue-700 font-medium shrink-0"
                                title="Ver esquema"
                              >
                                ver campos →
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{t.descripcion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── MODO ESQUEMA ── */}
            {/* Panel izquierdo: lista de tablas */}
            <div className="w-72 bg-white border-r overflow-y-auto flex-shrink-0 flex flex-col">
              <div className="p-3 border-b sticky top-0 bg-white z-10">
                <input
                  type="text"
                  placeholder="Buscar tabla o campo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full text-sm border rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                {busqueda && (
                  <div className="mt-1 text-xs text-gray-400">{esquemasFiltrados.length} resultado{esquemasFiltrados.length !== 1 ? "s" : ""}</div>
                )}
              </div>
              {(["principal", "terciaria", "secundaria"] as BaseDatos[]).map((db) => {
                const tablas = esquemasPorDB[db];
                if (tablas.length === 0) return null;
                return (
                  <div key={db}>
                    <div className={`px-3 py-1.5 flex items-center gap-2 ${DB_CONFIG[db].header} text-white text-xs font-semibold uppercase tracking-wide`}>
                      <span className="w-2 h-2 rounded-full bg-white opacity-70" />
                      {DB_CONFIG[db].nombre} · {DB_NOMBRES[db]}
                    </div>
                    {tablas.map((e) => (
                      <button
                        key={e.tabla}
                        onClick={() => setTablaSeleccionada(e.tabla)}
                        className={`w-full text-left px-3 py-2.5 text-sm border-l-2 transition-colors ${
                          tablaSeleccionada === e.tabla
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                            : "border-transparent text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-mono font-medium text-xs">{e.tabla}</div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">{e.campos.length} campos</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Panel derecho: detalle de tabla */}
            <div className="flex-1 overflow-y-auto">
              {esquemaActual && (
                <div className="p-6">
                  {/* Header de la tabla */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold font-mono text-gray-900">{esquemaActual.tabla}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DB_CONFIG[esquemaActual.db].badge}`}>
                          {DB_CONFIG[esquemaActual.db].nombre}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">({DB_NOMBRES[esquemaActual.db]})</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{esquemaActual.descripcion}</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-3 py-2 text-center shrink-0">
                      <div className="text-xl font-bold text-gray-700">{esquemaActual.campos.length}</div>
                      <div className="text-xs text-gray-500">campos</div>
                    </div>
                  </div>

                  {/* Leyenda de iconos */}
                  <div className="flex gap-4 text-xs text-gray-400 mb-3 flex-wrap">
                    <span className="flex items-center gap-1"><span className="text-amber-500 font-bold">🔑</span> Clave primaria</span>
                    <span className="flex items-center gap-1"><span className="text-blue-500">🔗</span> Clave foránea (clicable)</span>
                    <span className="flex items-center gap-1"><span className="text-red-400">✕</span> Requerido</span>
                    <span className="flex items-center gap-1"><span className="text-gray-400">?</span> Nulable</span>
                  </div>

                  {/* Tabla de campos */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                          <th className="px-4 py-2 text-left font-semibold w-6"></th>
                          <th className="px-4 py-2 text-left font-semibold">Campo</th>
                          <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                          <th className="px-4 py-2 text-center font-semibold w-12">Nulo</th>
                          <th className="px-4 py-2 text-left font-semibold">Default</th>
                          <th className="px-4 py-2 text-left font-semibold">Relación / Valores / Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {esquemaActual.campos.map((campo) => {
                          const isPK = campo.pk;
                          const isFK = !!campo.fk;
                          const fkExiste = campo.fk && TABLAS_INDEX.has(campo.fk.tabla);

                          return (
                            <tr
                              key={campo.nombre}
                              className={`${isPK ? "bg-amber-50" : ""} hover:bg-gray-50 transition-colors`}
                            >
                              {/* Icono PK/FK */}
                              <td className="px-2 py-2 text-center">
                                {isPK ? <span title="Clave primaria">🔑</span> : isFK ? <span title="Clave foránea" className="text-blue-400">🔗</span> : ""}
                              </td>

                              {/* Nombre campo */}
                              <td className="px-4 py-2">
                                <span className={`font-mono text-sm font-medium ${isPK ? "text-amber-700" : isFK ? "text-blue-700" : "text-gray-800"}`}>
                                  {campo.nombre}
                                </span>
                              </td>

                              {/* Tipo */}
                              <td className="px-4 py-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium ${tipoColor(campo.tipo)}`}>
                                  {campo.tipo}
                                </span>
                              </td>

                              {/* Nulo */}
                              <td className="px-4 py-2 text-center">
                                {campo.nulo
                                  ? <span className="text-gray-400 text-xs font-medium">?</span>
                                  : <span className="text-red-400 text-xs font-bold">✕</span>
                                }
                              </td>

                              {/* Default */}
                              <td className="px-4 py-2">
                                {campo.default ? (
                                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{campo.default}</span>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>

                              {/* Relación / Valores / Notas */}
                              <td className="px-4 py-2 max-w-xs">
                                {campo.fk && (
                                  <div className="mb-1">
                                    {fkExiste ? (
                                      <button
                                        onClick={() => navegarTabla(campo.fk!.tabla)}
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-mono font-medium"
                                        title={`Ir a tabla ${campo.fk.tabla}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${DB_CONFIG[campo.fk.db].dot}`} />
                                        → {campo.fk.tabla}.{campo.fk.campo}
                                      </button>
                                    ) : (
                                      <span className="text-xs text-gray-400 font-mono">→ {campo.fk.tabla}.{campo.fk.campo}</span>
                                    )}
                                  </div>
                                )}
                                {campo.enum && (
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {campo.enum.map((v) => (
                                      <span key={v} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded font-mono">{v}</span>
                                    ))}
                                  </div>
                                )}
                                {campo.nota && (
                                  <div className="text-xs text-gray-500 italic">{campo.nota}</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tablas que referencian a esta */}
                  {(() => {
                    const refs = ESQUEMAS.filter(
                      (e) => e.tabla !== esquemaActual.tabla && e.campos.some((c) => c.fk?.tabla === esquemaActual.tabla)
                    );
                    if (refs.length === 0) return null;
                    return (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Tablas que referencian a <span className="font-mono text-gray-800">{esquemaActual.tabla}</span>:</h3>
                        <div className="flex flex-wrap gap-2">
                          {refs.map((r) => (
                            <button
                              key={r.tabla}
                              onClick={() => setTablaSeleccionada(r.tabla)}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium ${DB_CONFIG[r.db].badge} hover:opacity-80`}
                            >
                              ← {r.tabla}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer stats */}
      <div className="bg-white border-t px-6 py-2 flex gap-6 text-xs text-gray-500 flex-shrink-0">
        <span><strong className="text-gray-700">{PAGINAS.length}</strong> páginas</span>
        <span><strong className="text-gray-700">{ESQUEMAS.length}</strong> tablas con esquema</span>
        <span><strong className="text-gray-700">{ESQUEMAS.reduce((acc, e) => acc + e.campos.length, 0)}</strong> campos documentados</span>
        <span><strong className="text-gray-700">3</strong> bases de datos</span>
        {modo === "esquema" && esquemaActual && (
          <span className="ml-auto text-blue-600 font-medium">
            {esquemaActual.tabla} · {esquemaActual.campos.length} campos · {DB_NOMBRES[esquemaActual.db]}
          </span>
        )}
      </div>
    </div>
  );
}
