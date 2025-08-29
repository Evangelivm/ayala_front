// Simulación de datos de la tabla proyectos
export interface ProyectoData {
  id: number
  nombre: string
  cliente: string
  ubicacion: string
  activo: boolean
  etapas: string[]
}

// Datos simulados de la tabla proyectos
export const proyectosData: ProyectoData[] = [
  {
    id: 1,
    nombre: "Construcción Centro Comercial Plaza Norte",
    cliente: "Inmobiliaria del Norte S.A.C.",
    ubicacion: "Lima Norte - Independencia",
    activo: true,
    etapas: ["Excavación", "Cimentación", "Estructura", "Acabados"],
  },
  {
    id: 2,
    nombre: "Ampliación Carretera Panamericana Sur",
    cliente: "Ministerio de Transportes y Comunicaciones",
    ubicacion: "Km 45 - Lurín",
    activo: true,
    etapas: ["Movimiento de Tierras", "Pavimentación", "Señalización"],
  },
  {
    id: 3,
    nombre: "Complejo Habitacional Los Jardines",
    cliente: "Constructora Horizonte S.A.",
    ubicacion: "San Juan de Lurigancho",
    activo: true,
    etapas: ["Preparación del Terreno", "Cimentación", "Construcción", "Urbanización"],
  },
  {
    id: 4,
    nombre: "Planta Industrial Textil",
    cliente: "Textiles Peruanos S.A.C.",
    ubicacion: "Ate Vitarte",
    activo: true,
    etapas: ["Excavación", "Cimentación", "Estructura Metálica", "Instalaciones"],
  },
  {
    id: 5,
    nombre: "Remodelación Hospital Nacional",
    cliente: "ESSALUD",
    ubicacion: "Cercado de Lima",
    activo: true,
    etapas: ["Demolición", "Reforzamiento", "Construcción Nueva", "Equipamiento"],
  },
  {
    id: 6,
    nombre: "Túnel Vial Santa Rosa",
    cliente: "Municipalidad de Lima",
    ubicacion: "Santa Rosa - Ancón",
    activo: true,
    etapas: ["Excavación", "Revestimiento", "Instalaciones", "Acabados"],
  },
  {
    id: 7,
    nombre: "Edificio Corporativo Torre Azul",
    cliente: "Grupo Empresarial del Pacífico",
    ubicacion: "San Isidro",
    activo: true,
    etapas: ["Excavación Profunda", "Cimentación", "Estructura", "Fachada", "Acabados"],
  },
  {
    id: 8,
    nombre: "Puente Vehicular Rímac",
    cliente: "Gobierno Regional de Lima",
    ubicacion: "Distrito del Rímac",
    activo: true,
    etapas: ["Cimentación", "Pilares", "Superestructura", "Acabados"],
  },
]

// Funciones para obtener datos de proyectos
export const getAllProyectos = (): ProyectoData[] => {
  return proyectosData.filter((proyecto) => proyecto.activo)
}

export const getProyectoById = (id: number): ProyectoData | undefined => {
  return proyectosData.find((proyecto) => proyecto.id === id)
}

export const getProyectoByNombre = (nombre: string): ProyectoData | undefined => {
  return proyectosData.find((proyecto) => proyecto.nombre === nombre && proyecto.activo)
}
