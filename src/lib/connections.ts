// Punto de entrada único: reexporta los módulos de lib/api/ (cada dominio vive en su archivo)
export * from "./api/ordenes";
export * from "./api/personal";
export * from "./api/proyectos";
export * from "./api/reportes";
export * from "./api/sistema";
export * from "./api/gre";
export * from "./api/flota";
export * from "./api/dashboard";
export * from "./api/combustible";
export * from "./api/programacion";
export * from "./api/catalogos";
export * from "./api/factura";
export * from "./api/search";
export * from "./api/contabilidad";
export { api } from "./api/client";
