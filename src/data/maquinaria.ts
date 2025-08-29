// Simulación de datos de la tabla maquinaria pesada
export interface MaquinariaData {
  id: number
  nombre: string
  tipo: string
  modelo: string
  activo: boolean
}

// Datos simulados de la tabla maquinaria pesada
export const maquinariaData: MaquinariaData[] = [
  {
    id: 1,
    nombre: "Excavadora CAT 320D",
    tipo: "Excavadora",
    modelo: "320D",
    activo: true,
  },
  {
    id: 2,
    nombre: "Bulldozer CAT D6T",
    tipo: "Bulldozer",
    modelo: "D6T",
    activo: true,
  },
  {
    id: 3,
    nombre: "Cargador Frontal CAT 950M",
    tipo: "Cargador Frontal",
    modelo: "950M",
    activo: true,
  },
  {
    id: 4,
    nombre: "Retroexcavadora JCB 3CX",
    tipo: "Retroexcavadora",
    modelo: "3CX",
    activo: true,
  },
  {
    id: 5,
    nombre: "Motoniveladora CAT 140M",
    tipo: "Motoniveladora",
    modelo: "140M",
    activo: true,
  },
  {
    id: 6,
    nombre: "Compactadora CAT CS56B",
    tipo: "Compactadora",
    modelo: "CS56B",
    activo: true,
  },
  {
    id: 7,
    nombre: "Excavadora Komatsu PC200",
    tipo: "Excavadora",
    modelo: "PC200",
    activo: true,
  },
  {
    id: 8,
    nombre: "Volquete Volvo FMX",
    tipo: "Volquete",
    modelo: "FMX",
    activo: true,
  },
  {
    id: 9,
    nombre: "Grúa Móvil Liebherr LTM 1050",
    tipo: "Grúa Móvil",
    modelo: "LTM 1050",
    activo: true,
  },
  {
    id: 10,
    nombre: "Pala Cargadora CAT 966M",
    tipo: "Pala Cargadora",
    modelo: "966M",
    activo: true,
  },
  {
    id: 11,
    nombre: "Rodillo Compactador CAT CB54B",
    tipo: "Rodillo Compactador",
    modelo: "CB54B",
    activo: true,
  },
  {
    id: 12,
    nombre: "Minicargadora Bobcat S650",
    tipo: "Minicargadora",
    modelo: "S650",
    activo: true,
  },
]

// Funciones para obtener datos de maquinaria
export const getAllMaquinaria = (): MaquinariaData[] => {
  return maquinariaData.filter((maquina) => maquina.activo)
}

export const getMaquinariaById = (id: number): MaquinariaData | undefined => {
  return maquinariaData.find((maquina) => maquina.id === id)
}

export const getMaquinariaByNombre = (nombre: string): MaquinariaData | undefined => {
  return maquinariaData.find((maquina) => maquina.nombre === nombre && maquina.activo)
}
