// Simulación de datos de la tabla personal
export interface PersonalData {
  id: number
  nombre: string
  cargo: string
  activo: boolean
}

// Datos simulados de la tabla personal
export const personalData: PersonalData[] = [
  { id: 1, nombre: "Juan Carlos Pérez", cargo: "Operador", activo: true },
  { id: 2, nombre: "María Elena González", cargo: "Operador", activo: true },
  { id: 3, nombre: "Carlos Alberto Ruiz", cargo: "Operador", activo: true },
  { id: 4, nombre: "Ana Patricia López", cargo: "Vigía", activo: true },
  { id: 5, nombre: "Roberto Miguel Torres", cargo: "Vigía", activo: true },
  { id: 6, nombre: "Carmen Rosa Díaz", cargo: "Vigía", activo: true },
  { id: 7, nombre: "Luis Fernando Castro", cargo: "Vigía", activo: true },
  { id: 8, nombre: "Sandra Beatriz Morales", cargo: "Mantero", activo: true },
  { id: 9, nombre: "Pedro Antonio Vargas", cargo: "Mantero", activo: true },
  { id: 10, nombre: "Rosa María Herrera", cargo: "Mantero", activo: true },
  { id: 11, nombre: "Jorge Eduardo Silva", cargo: "Controlador", activo: true },
  { id: 12, nombre: "Patricia Isabel Ramos", cargo: "Controlador", activo: true },
  { id: 13, nombre: "Miguel Ángel Flores", cargo: "Controlador", activo: true },
  { id: 14, nombre: "Gloria Esperanza Mendoza", cargo: "Capataz", activo: true },
  { id: 15, nombre: "Fernando José Guerrero", cargo: "Capataz", activo: true },
  { id: 16, nombre: "Lucía Alejandra Vega", cargo: "Capataz", activo: true },
  { id: 17, nombre: "Ricardo Daniel Ortiz", cargo: "Supervisor", activo: true },
  { id: 18, nombre: "Elena Victoria Campos", cargo: "Supervisor", activo: true },
  { id: 19, nombre: "Andrés Felipe Rojas", cargo: "Supervisor", activo: true },
  { id: 20, nombre: "Mónica Cristina Jiménez", cargo: "Jefe de Obra", activo: true },
]

// Funciones para filtrar personal por cargo
export const getPersonalByCargo = (cargo: string): PersonalData[] => {
  return personalData.filter((person) => person.cargo === cargo && person.activo)
}

export const getAllPersonal = (): PersonalData[] => {
  return personalData.filter((person) => person.activo)
}

export const getPersonalById = (id: number): PersonalData | undefined => {
  return personalData.find((person) => person.id === id)
}
