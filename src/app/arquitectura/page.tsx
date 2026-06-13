"use client";

import { useState } from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type BaseDatos = "principal" | "terciaria" | "secundaria";

interface TablaConexion {
  db: BaseDatos;
  tabla: string;
  descripcion: string;
}

interface Pagina {
  id: string;
  ruta: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tablas: TablaConexion[];
}

// ─── Mapa de arquitectura ─────────────────────────────────────────────────────

const PAGINAS: Pagina[] = [
  // ── Programación ──────────────────────────────────────────────────────────
  {
    id: "programacion-admin",
    ruta: "/programacion-admin",
    nombre: "Programación Admin",
    descripcion:
      "Gestión completa de programación técnica, órdenes de compra vinculadas, carga de guías y facturas.",
    categoria: "Programación",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo diario por camión" },
      { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas contratistas" },
      { db: "terciaria", tabla: "ordenes_compra", descripcion: "Órdenes vinculadas al programa" },
      { db: "terciaria", tabla: "guias_remision_extendido", descripcion: "Guías de remisión" },
    ],
  },
  {
    id: "programacion",
    ruta: "/programacion",
    nombre: "Programación",
    descripcion: "Vista de programación para el equipo operativo.",
    categoria: "Programación",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo" },
      { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas contratistas" },
    ],
  },
  {
    id: "prog-tecnica",
    ruta: "/prog-tecnica",
    nombre: "Prog. Técnica",
    descripcion: "Vista técnica de la programación para operadores.",
    categoria: "Programación",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo" },
      { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
    ],
  },
  {
    id: "programacion-extendida",
    ruta: "/programacion-extendida",
    nombre: "Prog. Extendida",
    descripcion: "Vista extendida con campos adicionales de programación.",
    categoria: "Programación",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros extendidos" },
      { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas contratistas" },
    ],
  },
  {
    id: "programacion-mixta",
    ruta: "/programacion-mixta",
    nombre: "Prog. Mixta",
    descripcion: "Programación mixta combinando tipos de trabajo.",
    categoria: "Programación",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de trabajo" },
      { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas" },
    ],
  },
  {
    id: "acarreo",
    ruta: "/acarreo",
    nombre: "Acarreo",
    descripcion: "Gestión de programación de acarreo de material.",
    categoria: "Programación",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de acarreo" },
      { db: "principal", tabla: "camiones", descripcion: "Flota de vehículos" },
    ],
  },
  {
    id: "guia-remision",
    ruta: "/guia-remision",
    nombre: "Guía de Remisión",
    descripcion: "Creación y gestión de guías de remisión electrónicas.",
    categoria: "Programación",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Datos del programa asociado" },
      { db: "terciaria", tabla: "guias_remision_extendido", descripcion: "Guías generadas" },
    ],
  },

  // ── Órdenes & Facturación ─────────────────────────────────────────────────
  {
    id: "orden-compra-servicio",
    ruta: "/orden-compra-servicio",
    nombre: "Órdenes de Compra y Servicio",
    descripcion:
      "Creación, edición y seguimiento de órdenes de compra y órdenes de servicio con sus detalles, cotizaciones y archivos.",
    categoria: "Órdenes & Facturación",
    tablas: [
      { db: "terciaria", tabla: "ordenes_compra", descripcion: "Cabecera de órdenes de compra" },
      { db: "terciaria", tabla: "detalles_orden_compra", descripcion: "Ítems de cada orden de compra" },
      { db: "terciaria", tabla: "ordenes_servicio", descripcion: "Cabecera de órdenes de servicio" },
      { db: "terciaria", tabla: "detalles_orden_servicio", descripcion: "Ítems de cada orden de servicio" },
      { db: "terciaria", tabla: "listado_items_2025", descripcion: "Catálogo de productos/servicios" },
      { db: "terciaria", tabla: "proveedores", descripcion: "Proveedores del sistema" },
      { db: "principal", tabla: "centros_de_costos_2025", descripcion: "Catálogo de centros de costo" },
      { db: "principal", tabla: "camiones", descripcion: "Vehículos (para órdenes de servicio)" },
    ],
  },
  {
    id: "factura",
    ruta: "/factura",
    nombre: "Facturas Electrónicas",
    descripcion:
      "Generación, seguimiento y consulta de facturas electrónicas enviadas a Nubefact/SUNAT. Incluye PDF, XML y CDR.",
    categoria: "Órdenes & Facturación",
    tablas: [
      { db: "terciaria", tabla: "factura", descripcion: "Cabecera de cada factura electrónica" },
      { db: "terciaria", tabla: "factura_item", descripcion: "Líneas/ítems de cada factura" },
      { db: "terciaria", tabla: "factura_guia", descripcion: "Guías relacionadas a la factura" },
      { db: "terciaria", tabla: "factura_venta_credito", descripcion: "Cuotas en ventas a crédito" },
      { db: "terciaria", tabla: "listado_items_2025", descripcion: "Catálogo de productos (selector de ítems)" },
      { db: "terciaria", tabla: "proveedores", descripcion: "Proveedor emisor de la factura" },
    ],
  },

  // ── Inventario ─────────────────────────────────────────────────────────────
  {
    id: "inventario-lar",
    ruta: "/inventario-lar",
    nombre: "Inventario LAR",
    descripcion: "Reporte de kardex e inventario valorizado para LAR.",
    categoria: "Inventario",
    tablas: [
      { db: "terciaria", tabla: "listado_items_2025", descripcion: "Catálogo de productos" },
      { db: "terciaria", tabla: "stock_almacenes", descripcion: "Stock por almacén" },
      { db: "terciaria", tabla: "movimientos_inventario", descripcion: "Entradas y salidas" },
      { db: "terciaria", tabla: "almacenes", descripcion: "Almacenes del sistema" },
    ],
  },
  {
    id: "kardexpromedio",
    ruta: "/kardexpromedio",
    nombre: "Kardex Promedio",
    descripcion: "Cálculo y visualización del kardex por costo promedio ponderado.",
    categoria: "Inventario",
    tablas: [
      { db: "terciaria", tabla: "listado_items_2025", descripcion: "Productos del kardex" },
      { db: "terciaria", tabla: "movimientos_inventario", descripcion: "Movimientos de inventario" },
      { db: "terciaria", tabla: "balances_iniciales", descripcion: "Saldos iniciales" },
      { db: "terciaria", tabla: "almacenes", descripcion: "Almacenes" },
    ],
  },

  // ── Combustible ────────────────────────────────────────────────────────────
  {
    id: "combustible",
    ruta: "/combustible",
    nombre: "Combustible",
    descripcion: "Control de consumo de combustible por vehículo y centro de costo.",
    categoria: "Combustible",
    tablas: [
      { db: "secundaria", tabla: "fuel_invoices", descripcion: "Facturas de combustible" },
      { db: "secundaria", tabla: "cost_centers", descripcion: "Centros de costo (combustible)" },
    ],
  },

  // ── Proyectos ──────────────────────────────────────────────────────────────
  {
    id: "proyectos",
    ruta: "/proyectos",
    nombre: "Proyectos",
    descripcion: "Gestión de proyectos y centros de costo.",
    categoria: "Proyectos",
    tablas: [
      { db: "principal", tabla: "centros_de_costos_2025", descripcion: "Catálogo de centros de costo" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas vinculadas a proyectos" },
    ],
  },

  // ── Reportes ───────────────────────────────────────────────────────────────
  {
    id: "reporte-operadores",
    ruta: "/reporte-operadores",
    nombre: "Reporte Operadores",
    descripcion: "Reporte de horas y trabajo por operador.",
    categoria: "Reportes",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Datos de trabajo por operador" },
      { db: "principal", tabla: "camiones", descripcion: "Equipos asignados" },
    ],
  },
  {
    id: "reporte-plantilleros",
    ruta: "/reporte-plantilleros",
    nombre: "Reporte Plantilleros",
    descripcion: "Reporte de plantilleros y asistencia.",
    categoria: "Reportes",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros de plantilleros" },
    ],
  },
  {
    id: "reporte-viajes",
    ruta: "/reporte-viajes",
    nombre: "Reporte Viajes",
    descripcion: "Reporte de viajes realizados por vehículo.",
    categoria: "Reportes",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Viajes registrados" },
      { db: "principal", tabla: "camiones", descripcion: "Vehículos" },
    ],
  },

  // ── Registros por rol ──────────────────────────────────────────────────────
  {
    id: "registro-administracion",
    ruta: "/registro-administracion",
    nombre: "Registro Administración",
    descripcion: "Vista de programación técnica para el área de administración.",
    categoria: "Registros",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Programación (solo lectura)" },
      { db: "principal", tabla: "camiones", descripcion: "Equipos" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas" },
    ],
  },
  {
    id: "registro-finanzas",
    ruta: "/registro-finanzas",
    nombre: "Registro Finanzas",
    descripcion: "Vista de programación para el área de finanzas.",
    categoria: "Registros",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Programación financiera" },
      { db: "principal", tabla: "camiones", descripcion: "Equipos" },
    ],
  },
  {
    id: "registro-jefe-proyecto",
    ruta: "/registro-jefe-proyecto",
    nombre: "Registro Jefe Proyecto",
    descripcion: "Vista de programación para jefes de proyecto.",
    categoria: "Registros",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Programación por proyecto" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Proyectos/Empresas" },
    ],
  },
  {
    id: "registro-gerencia",
    ruta: "/registro-gerencia",
    nombre: "Registro Gerencia",
    descripcion: "Vista ejecutiva de programación para gerencia.",
    categoria: "Registros",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Programación (vista gerencial)" },
      { db: "principal", tabla: "camiones", descripcion: "Flota completa" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas" },
    ],
  },
  {
    id: "registro-contabilidad",
    ruta: "/registro-contabilidad",
    nombre: "Registro Contabilidad",
    descripcion: "Vista de programación para el área contable.",
    categoria: "Registros",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Datos contables de programación" },
    ],
  },

  // ── Control ────────────────────────────────────────────────────────────────
  {
    id: "control-aprobados",
    ruta: "/control-aprobados",
    nombre: "Control Aprobados",
    descripcion: "Control y aprobación de registros de programación.",
    categoria: "Control",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "Registros pendientes de aprobación" },
      { db: "principal", tabla: "camiones", descripcion: "Equipos" },
      { db: "principal", tabla: "empresas_2025", descripcion: "Empresas" },
    ],
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    ruta: "/dashboard",
    nombre: "Dashboard",
    descripcion: "Panel principal con resúmenes y métricas del sistema.",
    categoria: "Dashboard",
    tablas: [
      { db: "principal", tabla: "programacion_tecnica", descripcion: "KPIs de programación" },
      { db: "principal", tabla: "camiones", descripcion: "Estado de la flota" },
      { db: "terciaria", tabla: "ordenes_compra", descripcion: "Resumen de órdenes" },
      { db: "terciaria", tabla: "factura", descripcion: "Resumen de facturas" },
    ],
  },
];

// ─── Configuración visual de bases de datos ───────────────────────────────────

const DB_CONFIG: Record<BaseDatos, { nombre: string; color: string; badge: string; dot: string }> = {
  principal: {
    nombre: "DB Principal",
    color: "border-blue-400 bg-blue-50",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    dot: "bg-blue-500",
  },
  terciaria: {
    nombre: "DB Terciaria",
    color: "border-emerald-400 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
  },
  secundaria: {
    nombre: "DB Secundaria",
    color: "border-orange-400 bg-orange-50",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    dot: "bg-orange-500",
  },
};

const DB_NOMBRES: Record<BaseDatos, string> = {
  principal: "ayala2025",
  terciaria: "inventariosayala2025",
  secundaria: "fuel_kardex_system",
};

const CATEGORIA_ICONOS: Record<string, string> = {
  Programación: "⚙️",
  "Órdenes & Facturación": "📄",
  Inventario: "📦",
  Combustible: "⛽",
  Proyectos: "🏗️",
  Reportes: "📊",
  Registros: "📋",
  Control: "✅",
  Dashboard: "🏠",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ArquitecturaPage() {
  const [paginaSeleccionada, setPaginaSeleccionada] = useState<Pagina>(PAGINAS[0]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas");

  const categorias = ["Todas", ...Array.from(new Set(PAGINAS.map((p) => p.categoria)))];

  const paginasFiltradas =
    categoriaFiltro === "Todas"
      ? PAGINAS
      : PAGINAS.filter((p) => p.categoria === categoriaFiltro);

  // Agrupar tablas por base de datos para la página seleccionada
  const tablasPorDB: Record<BaseDatos, TablaConexion[]> = {
    principal: [],
    terciaria: [],
    secundaria: [],
  };
  paginaSeleccionada.tablas.forEach((t) => {
    tablasPorDB[t.db].push(t);
  });

  const dbsUsadas = (Object.keys(tablasPorDB) as BaseDatos[]).filter(
    (db) => tablasPorDB[db].length > 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Arquitectura del Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mapa visual de qué páginas se conectan a qué tablas de base de datos
        </p>
      </div>

      {/* Leyenda */}
      <div className="px-6 py-3 bg-white border-b flex flex-wrap gap-4 items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Base de datos:</span>
        {(Object.keys(DB_CONFIG) as BaseDatos[]).map((db) => (
          <div key={db} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${DB_CONFIG[db].dot}`} />
            <span className="text-xs font-medium text-gray-700">
              {DB_CONFIG[db].nombre}
              <span className="ml-1 text-gray-400 font-normal">({DB_NOMBRES[db]})</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Panel izquierdo: lista de páginas */}
        <div className="w-72 bg-white border-r overflow-y-auto flex-shrink-0">
          {/* Filtro por categoría */}
          <div className="p-3 border-b sticky top-0 bg-white z-10">
            <select
              className="w-full text-sm border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c === "Todas" ? "📂 Todas las categorías" : `${CATEGORIA_ICONOS[c] ?? "•"} ${c}`}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de páginas agrupadas */}
          {categorias
            .filter((c) => c !== "Todas")
            .filter((c) => categoriaFiltro === "Todas" || c === categoriaFiltro)
            .map((categoria) => {
              const pagsCat = paginasFiltradas.filter((p) => p.categoria === categoria);
              if (pagsCat.length === 0) return null;
              return (
                <div key={categoria}>
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {CATEGORIA_ICONOS[categoria]} {categoria}
                    </span>
                  </div>
                  {pagsCat.map((pagina) => (
                    <button
                      key={pagina.id}
                      onClick={() => setPaginaSeleccionada(pagina)}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-l-2 ${
                        paginaSeleccionada.id === pagina.id
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                          : "border-transparent text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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

        {/* Panel principal: diagrama */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Card de la página */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-5 mb-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{CATEGORIA_ICONOS[paginaSeleccionada.categoria] ?? "📄"}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">{paginaSeleccionada.nombre}</h2>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono border">
                    {paginaSeleccionada.categoria}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 font-mono">{paginaSeleccionada.ruta}</p>
                <p className="text-sm text-gray-600 mt-2">{paginaSeleccionada.descripcion}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {paginaSeleccionada.tablas.map((t) => (
                    <span
                      key={`${t.db}-${t.tabla}`}
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DB_CONFIG[t.db].badge}`}
                    >
                      {t.tabla}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Flecha hacia abajo */}
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-gray-300" />
              <svg className="text-gray-400" width="16" height="10" viewBox="0 0 16 10">
                <path d="M8 10 L0 0 L16 0 Z" fill="currentColor" />
              </svg>
              <span className="text-xs text-gray-400 mt-1 font-medium">usa las tablas</span>
            </div>
          </div>

          {/* Tarjetas de bases de datos */}
          <div
            className={`grid gap-4 max-w-5xl mx-auto ${
              dbsUsadas.length === 1
                ? "grid-cols-1"
                : dbsUsadas.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            {dbsUsadas.map((db) => (
              <div
                key={db}
                className={`rounded-xl border-2 p-4 ${DB_CONFIG[db].color}`}
              >
                {/* Header de la DB */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${DB_CONFIG[db].dot}`} />
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{DB_CONFIG[db].nombre}</div>
                    <div className="text-xs text-gray-500 font-mono">{DB_NOMBRES[db]}</div>
                  </div>
                </div>

                {/* Tablas */}
                <div className="space-y-2">
                  {tablasPorDB[db].map((t) => (
                    <div
                      key={t.tabla}
                      className="bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm"
                    >
                      <div className="font-mono text-sm font-semibold text-gray-800">{t.tabla}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.descripcion}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Estadísticas */}
          <div className="mt-8 max-w-5xl mx-auto grid grid-cols-3 gap-3">
            {(Object.keys(tablasPorDB) as BaseDatos[]).map((db) => (
              <div key={db} className="bg-white rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{tablasPorDB[db].length}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  tabla{tablasPorDB[db].length !== 1 ? "s" : ""} en {DB_CONFIG[db].nombre}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel de resumen total (footer sticky) */}
      <div className="fixed bottom-0 right-0 left-72 bg-white border-t px-6 py-2 flex gap-6 text-xs text-gray-500">
        <span>
          <strong className="text-gray-700">{PAGINAS.length}</strong> páginas en total
        </span>
        <span>
          <strong className="text-gray-700">
            {Array.from(new Set(PAGINAS.flatMap((p) => p.tablas.map((t) => `${t.db}:${t.tabla}`)))).length}
          </strong>{" "}
          tablas distintas referenciadas
        </span>
        <span>
          <strong className="text-gray-700">3</strong> bases de datos
        </span>
      </div>
    </div>
  );
}
