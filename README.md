# Sistema de Reportes - Maquinarias Ayala

Sistema web completo para la gestión de reportes diarios de trabajo desarrollado con Next.js, TypeScript y tecnologías modernas. El sistema permite la creación, gestión y seguimiento de reportes de trabajo para diferentes tipos de operaciones en la empresa Maquinarias Ayala.

## 🚀 Características Principales

- **Dashboard Interactivo**: Panel de control con estadísticas en tiempo real y resumen de actividades
- **Gestión de Reportes**: Tres tipos principales de reportes con formularios específicos
- **Interfaz Moderna**: UI responsive construida con shadcn/ui y Tailwind CSS
- **Exportación de Datos**: Capacidad de exportar reportes a Excel
- **Validación en Tiempo Real**: Formularios con validación usando React Hook Form y Zod
- **Sistema de Notificaciones**: Feedback inmediato al usuario con Sonner
- **Búsqueda y Filtrado**: Componentes de selección inteligentes para personal, proyectos y equipos

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto

```
src/
├── app/                        # App Router de Next.js
│   ├── dashboard/              # Panel principal del sistema
│   ├── home/                   # Página de inicio con redirección
│   ├── reporte-operadores/     # Reportes de operadores de maquinaria
│   ├── reporte-plantilleros/   # Reportes de trabajo de plantilleros
│   ├── reporte-viajes/         # Reportes de viajes de eliminación
│   ├── globals.css            # Estilos globales
│   ├── layout.tsx             # Layout principal
│   └── page.tsx               # Página raíz
├── components/                 # Componentes reutilizables
│   ├── ui/                    # Componentes base de shadcn/ui
│   ├── app-sidebar.tsx        # Navegación lateral (futuro)
│   ├── equipo-select.tsx      # Selector de equipos/maquinaria
│   ├── etapa-select.tsx       # Selector de etapas de proyecto
│   ├── frente-select.tsx      # Selector de frentes de trabajo
│   ├── maquinaria-select.tsx  # Selector de maquinaria
│   ├── personal-select.tsx    # Selector de personal
│   ├── proyecto-select.tsx    # Selector de proyectos
│   └── theme-provider.tsx     # Provider de temas
├── data/                      # Datos estáticos y configuraciones
│   ├── maquinaria.ts          # Catálogo de maquinaria
│   ├── personal.ts            # Catálogo de personal
│   └── proyectos.ts           # Catálogo de proyectos
├── hooks/                     # Hooks personalizados
│   ├── use-mobile.tsx         # Hook para detección de dispositivos móviles
│   └── use-toast.ts           # Hook para notificaciones toast
└── lib/                       # Utilidades y configuraciones
    ├── connections.ts         # APIs y conexiones al backend
    └── utils.ts              # Funciones utilitarias
```

### Tipos de Reportes

1. **Reportes de Operadores** (`/reporte-operadores`)
   - Registro diario de operaciones de maquinaria
   - Control de horómetros y producción
   - Seguimiento de personal de vigilancia
   - Detalle de producción por actividad

2. **Reportes de Plantilleros** (`/reporte-plantilleros`)
   - Control de actividades del personal plantillero
   - Registro de materiales utilizados
   - Asignación de maquinaria y sectores
   - Seguimiento de horarios de trabajo

3. **Reportes de Viajes de Eliminación** (`/reporte-viajes`)
   - Control de viajes de eliminación de material
   - Seguimiento de conductores y vehículos
   - Registro de ubicaciones y rutas
   - Control de personal especializado

## 📋 Características Técnicas

### Frontend
- **Next.js 15.4.7** - Framework React con App Router
- **React 19.1.0** - Biblioteca de interfaz de usuario
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4** - Framework de estilos utilitarios
- **shadcn/ui** - Componentes de UI modulares y accesibles

### Librerías de UI y UX
- **Radix UI** - Componentes primitivos accesibles
- **Lucide React** - Iconos modernos y consistentes
- **React Hook Form** - Manejo eficiente de formularios
- **Zod** - Validación de esquemas TypeScript-first
- **Sonner** - Sistema de notificaciones toast
- **XLSX** - Exportación de datos a Excel

### Comunicación con Backend
- **Axios** - Cliente HTTP con interceptors
- **API REST** - Comunicación con backend Node.js/Express
- **Error Handling** - Manejo robusto de errores de red

## 🛠️ Scripts de Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start

# Ejecutar linter
npm run lint
```

## 🌐 Configuración del Entorno

El sistema se conecta automáticamente al backend mediante variables de entorno:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Por defecto, si no se especifica la variable, utilizará `http://localhost:3001/api`.

## 📊 Funcionalidades del Dashboard

El dashboard principal (`/dashboard`) incluye:

- **Estadísticas en Tiempo Real**: Métricas de reportes generados
- **Gráficos de Actividad**: Visualización de tendencias semanales
- **Accesos Rápidos**: Navegación directa a formularios de reporte
- **Tablas de Reportes Recientes**: Vista previa de los últimos reportes
- **Contadores de Recursos**: Personal activo, proyectos y equipos disponibles

## 🔧 Componentes Principales

### Selectores Inteligentes
- **PersonalSelect**: Búsqueda y selección de personal por nombre
- **ProyectoSelect**: Selección de proyectos con carga de etapas relacionadas
- **EquipoSelect**: Selección de equipos y maquinaria
- **EtapaSelect**: Selección de etapas basada en proyecto seleccionado

### Sistema de Formularios
- Validación en tiempo real con React Hook Form
- Esquemas de validación con Zod
- Manejo de estados de carga y error
- Guardado automático de borradores

### Exportación de Datos
- Generación de archivos Excel con formato personalizado
- Preservación de estilos y estructura de datos
- Exportación de datos filtrados

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Backend API ejecutándose en `http://localhost:3001`

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd ayala_front
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env.local
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

5. **Acceder al sistema**
   - Abrir [http://localhost:3000](http://localhost:3000)
   - El sistema redirigirá automáticamente al dashboard

## 📁 Estructura de Datos

### Entidades Principales
- **Personal**: Trabajadores con roles específicos
- **Proyectos**: Proyectos de construcción con etapas y sectores
- **Equipos**: Maquinaria y equipos de trabajo
- **Reportes**: Tres tipos principales con estructuras master-detail

### APIs Disponibles
- `/api/personal` - Gestión de personal
- `/api/proyectos` - Gestión de proyectos
- `/api/equipos` - Gestión de equipos
- `/api/reportes-operadores` - Reportes de operadores
- `/api/reportes-plantilleros` - Reportes de plantilleros
- `/api/viajes-eliminacion` - Reportes de viajes
- `/api/dashboard` - Estadísticas del dashboard

## 🎨 Diseño y UX

### Paleta de Colores
- **Azul Principal**: Identidad corporativa y elementos primarios
- **Verde**: Reportes de plantilleros y estados positivos
- **Púrpura**: Reportes de operadores
- **Naranja**: Proyectos y alertas
- **Gradientes**: Fondos suaves y elementos decorativos

### Responsive Design
- Diseño mobile-first con Tailwind CSS
- Breakpoints adaptables para tablets y desktop
- Navegación optimizada para dispositivos táctiles

### Accesibilidad
- Componentes basados en Radix UI (WAI-ARIA compliant)
- Contraste de colores optimizado
- Navegación por teclado completa
- Textos alternativos en elementos visuales

## 🔄 Estados y Validaciones

### Validaciones de Formulario
- Campos obligatorios claramente marcados
- Validación en tiempo real con feedback visual
- Mensajes de error contextuales
- Prevención de envío de datos incompletos

### Estados de la Aplicación
- **Cargando**: Indicadores visuales durante operaciones async
- **Error**: Manejo graceful de errores con opciones de recuperación
- **Éxito**: Confirmación de operaciones completadas
- **Vacío**: Estados por defecto con guías de acción

## 🚀 Próximas Funcionalidades

- **Sistema de Autenticación**: Login y roles de usuario
- **Reportes Avanzados**: Gráficos y analytics detallados
- **Notificaciones Push**: Alertas en tiempo real
- **Modo Offline**: Funcionalidad sin conexión
- **App Móvil**: Versión nativa para dispositivos móviles
- **Integración con ERP**: Conexión con sistemas empresariales

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre el sistema:
- Consultar documentación del código
- Revisar logs de errores en consola del navegador
- Verificar conectividad con el backend API

---

**Desarrollado para Maquinarias Ayala** - Sistema de Gestión de Reportes Diarios v1.0
