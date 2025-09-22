"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  Filter,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit,
  Layers,
  MapPin,
  GitBranch,
  List,
  Briefcase,
  User,
  ChevronDown,
  ChevronRight,
  Building,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import {
  proyectosApi,
  etapasApi,
  sectoresApi,
  frentesApi,
  partidasApi,
} from "@/lib/connections";
import type {
  ProyectoData,
  EtapaData,
  SectorData,
  FrenteData,
  PartidaData,
} from "@/lib/connections";

// Tipos TypeScript para compatibilidad con UI
interface Partida {
  id: number;
  name: string;
  status: string;
  progress: number;
}

interface Frente {
  id: number;
  name: string;
  status: string;
  progress: number;
  partidas: Partida[];
}

interface Sector {
  id: number;
  name: string;
  status: string;
  progress: number;
  frentes: Frente[];
}

interface Etapa {
  id: number;
  name: string;
  status: string;
  progress: number;
  statusColor?: string;
  sectores: Sector[];
}

interface Subproyecto {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  etapas: Etapa[];
}

interface Project {
  id: number;
  name: string;
  cliente: string;
  status: string;
  ubicacion: string;
  startDate: string;
  endDate: string;
  progress: number;
  statusColor: string;
  etapas: Etapa[];
  subproyectos: Subproyecto[];
}

// Interfaces para formularios
interface ProjectFormData {
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  cliente: string;
  ubicacion: string;
}

interface EtapaFormData {
  nombre: string;
  descripcion: string;
}

interface SectorFormData {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  id_etapa: string;
}

interface FrenteFormData {
  nombre: string;
  descripcion: string;
  responsable: string;
  id_etapa: string;
  id_sector: string;
}

interface PartidaFormData {
  codigo: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: string;
  precio_unitario: string;
  id_etapa: string;
  id_sector: string;
  id_frente: string;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Completado":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "En progreso":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "Pendiente":
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
    default:
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "Completado":
      return "default";
    case "En progreso":
      return "secondary";
    case "Pendiente":
      return "outline";
    default:
      return "destructive";
  }
}

// Componente para botones hexagonales más grandes
function HexagonButton({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`relative w-12 h-12 ${color} hover:opacity-80 transition-opacity duration-200 flex items-center justify-center shadow-sm`}
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            <Icon className="h-5 w-5 text-white" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para mostrar partidas
function PartidaItem({
  partida,
  onDelete,
}: {
  partida: Partida;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md">
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">{partida.name}</span>
        {getStatusIcon(partida.status)}
        <Badge
          variant={getStatusBadgeVariant(partida.status)}
          className="text-xs"
        >
          {partida.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-blue-500"
            style={{ width: `${partida.progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-10">
          {partida.progress}%
        </span>
        <button
          onClick={() => onDelete(partida.id)}
          className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
          title="Eliminar partida"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Componente para mostrar frentes
function FrenteItem({
  frente,
  onDelete,
  onDeletePartida,
}: {
  frente: Frente;
  onDelete: (id: number) => void;
  onDeletePartida: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors">
        <CollapsibleTrigger className="flex-1 flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <GitBranch className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium">{frente.name}</span>
          {getStatusIcon(frente.status)}
          <Badge
            variant={getStatusBadgeVariant(frente.status)}
            className="text-xs"
          >
            {frente.status}
          </Badge>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-orange-500"
              style={{ width: `${frente.progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10">
            {frente.progress}%
          </span>
          <button
            onClick={() => onDelete(frente.id)}
            className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
            title="Eliminar frente"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <CollapsibleContent className="pl-6 pt-2 space-y-2">
        <div className="text-xs font-semibold text-gray-600 mb-2">
          Partidas:
        </div>
        {frente.partidas.map((partida: Partida) => (
          <PartidaItem
            key={partida.id}
            partida={partida}
            onDelete={onDeletePartida}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Componente para mostrar sectores
function SectorItem({
  sector,
  onDelete,
  onDeleteFrente,
  onDeletePartida,
}: {
  sector: Sector;
  onDelete: (id: number) => void;
  onDeleteFrente: (id: number) => void;
  onDeletePartida: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
        <CollapsibleTrigger className="flex-1 flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">{sector.name}</span>
          {getStatusIcon(sector.status)}
          <Badge
            variant={getStatusBadgeVariant(sector.status)}
            className="text-xs"
          >
            {sector.status}
          </Badge>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${sector.progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10">
            {sector.progress}%
          </span>
          <button
            onClick={() => onDelete(sector.id)}
            className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
            title="Eliminar sector"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <CollapsibleContent className="pl-6 pt-2 space-y-2">
        <div className="text-xs font-semibold text-gray-600 mb-2">Frentes:</div>
        {sector.frentes.map((frente: Frente) => (
          <FrenteItem
            key={frente.id}
            frente={frente}
            onDelete={onDeleteFrente}
            onDeletePartida={onDeletePartida}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Componente para mostrar etapas
function EtapaItem({
  etapa,
  onDelete,
  onDeleteSector,
  onDeleteFrente,
  onDeletePartida,
}: {
  etapa: Etapa;
  onDelete: (id: number) => void;
  onDeleteSector: (id: number) => void;
  onDeleteFrente: (id: number) => void;
  onDeletePartida: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between py-3 px-4 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
        <CollapsibleTrigger className="flex-1 flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Layers className="h-4 w-4 text-purple-600" />
          <span className="font-medium">{etapa.name}</span>
          {getStatusIcon(etapa.status)}
          <Badge variant={getStatusBadgeVariant(etapa.status)}>
            {etapa.status}
          </Badge>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${etapa.statusColor}`}
              style={{ width: `${etapa.progress}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground w-12">
            {etapa.progress}%
          </span>
          <button
            onClick={() => onDelete(etapa.id)}
            className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
            title="Eliminar etapa"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <CollapsibleContent className="pl-6 pt-3 space-y-3">
        <div className="text-sm font-semibold text-gray-600 mb-2">
          Sectores:
        </div>
        {etapa.sectores.map((sector: Sector) => (
          <SectorItem
            key={sector.id}
            sector={sector}
            onDelete={onDeleteSector}
            onDeleteFrente={onDeleteFrente}
            onDeletePartida={onDeletePartida}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Componente para mostrar subproyectos
function SubproyectoItem({
  subproyecto,
  projectId,
  onDeleteEtapa,
  onDeleteSector,
  onDeleteFrente,
  onDeletePartida,
}: {
  subproyecto: Subproyecto;
  projectId: number;
  onDeleteEtapa: (id: number) => void;
  onDeleteSector: (id: number) => void;
  onDeleteFrente: (id: number) => void;
  onDeletePartida: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
        <CollapsibleTrigger className="flex-1 flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <div
            className={`w-3 h-3 rounded-sm ${
              subproyecto.progress === 100
                ? "bg-green-500"
                : subproyecto.progress > 0
                ? "bg-blue-500"
                : "bg-gray-400"
            }`}
          ></div>
          <Briefcase className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{subproyecto.name}</span>
          {getStatusIcon(subproyecto.status)}
          <Badge variant={getStatusBadgeVariant(subproyecto.status)}>
            {subproyecto.status}
          </Badge>
        </CollapsibleTrigger>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${subproyecto.progress}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground w-12">
              {subproyecto.progress}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                console.log("editar-subproyecto para proyecto " + projectId)
              }
              className={`relative w-8 h-8 bg-blue-600 hover:opacity-80 transition-opacity duration-200 flex items-center justify-center shadow-sm`}
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <Edit className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() =>
                console.log("etapas-subproyecto para proyecto " + projectId)
              }
              className={`relative w-8 h-8 bg-purple-600 hover:opacity-80 transition-opacity duration-200 flex items-center justify-center shadow-sm`}
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <Layers className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() =>
                console.log("sectores-subproyecto para proyecto " + projectId)
              }
              className={`relative w-8 h-8 bg-green-600 hover:opacity-80 transition-opacity duration-200 flex items-center justify-center shadow-sm`}
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <MapPin className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() =>
                console.log("frentes-subproyecto para proyecto " + projectId)
              }
              className={`relative w-8 h-8 bg-orange-600 hover:opacity-80 transition-opacity duration-200 flex items-center justify-center shadow-sm`}
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <GitBranch className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() =>
                console.log("partidas-subproyecto para proyecto " + projectId)
              }
              className={`relative w-8 h-8 bg-red-600 hover:opacity-80 transition-opacity duration-200 flex items-center justify-center shadow-sm`}
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <FileText className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      <CollapsibleContent className="pl-6 pt-3 space-y-3">
        {subproyecto.etapas.length === 0 ? (
          <p className="text-gray-500 italic">
            No hay etapas definidas para este subproyecto.
          </p>
        ) : (
          <div className="space-y-3">
            {subproyecto.etapas.map((etapa: Etapa) => (
              <EtapaItem
                key={etapa.id}
                etapa={etapa}
                onDelete={onDeleteEtapa}
                onDeleteSector={onDeleteSector}
                onDeleteFrente={onDeleteFrente}
                onDeletePartida={onDeletePartida}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ProyectosDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<number[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para controlar modales
  const [modals, setModals] = useState({
    newProject: false,
    editProject: false,
    createEtapa: false,
    createSector: false,
    createFrente: false,
    createPartida: false,
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedContext, setSelectedContext] = useState<{
    type: string;
  } | null>(null);

  // Estados para dropdowns dependientes
  const [selectedEtapaForSector, setSelectedEtapaForSector] = useState("");
  const [selectedEtapaForFrente, setSelectedEtapaForFrente] = useState("");
  const [selectedSectorForFrente, setSelectedSectorForFrente] = useState("");
  const [selectedEtapaForPartida, setSelectedEtapaForPartida] = useState("");
  const [selectedSectorForPartida, setSelectedSectorForPartida] = useState("");
  const [selectedFrenteForPartida, setSelectedFrenteForPartida] = useState("");

  // Datos de subproyectos mock (mantenemos estos como solicitaste)
  const mockSubproyectos = useMemo<Subproyecto[]>(
    () => [
      {
        id: 1,
        name: "Subproyecto A - Torre Norte",
        status: "En progreso",
        startDate: "05/07/2025",
        endDate: "20/08/2025",
        progress: 45,
        etapas: [
          {
            id: 1,
            name: "Cimentación Torre Norte",
            status: "En progreso",
            progress: 60,
            sectores: [
              {
                id: 1,
                name: "Sector A1 - Zapatas Norte",
                status: "En progreso",
                progress: 70,
                frentes: [
                  {
                    id: 1,
                    name: "Frente Norte-Este",
                    status: "En progreso",
                    progress: 80,
                    partidas: [
                      {
                        id: 1,
                        name: "Excavación",
                        status: "Completado",
                        progress: 100,
                      },
                      {
                        id: 2,
                        name: "Armado de acero",
                        status: "En progreso",
                        progress: 60,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 2,
        name: "Subproyecto B - Torre Sur",
        status: "Pendiente",
        startDate: "15/08/2025",
        endDate: "30/09/2025",
        progress: 0,
        etapas: [],
      },
    ],
    []
  );

  // Función para convertir ProyectoData a Project (para compatibilidad con UI)
  const convertProyectoToProject = useCallback(
    (proyecto: ProyectoData): Project => {
      return {
        id: proyecto.id,
        name: proyecto.nombre,
        cliente: proyecto.cliente || "",
        status: proyecto.activo ? "En progreso" : "Inactivo",
        ubicacion: proyecto.ubicacion || "",
        startDate: proyecto.fecha_inicio || "",
        endDate: proyecto.fecha_fin || "",
        progress: Math.floor(Math.random() * 100), // TODO: Calcular progreso real
        statusColor: proyecto.activo ? "bg-blue-500" : "bg-gray-400",
        etapas:
          proyecto.etapas?.map((etapa) => ({
            id: etapa.id,
            name: etapa.nombre,
            status: "En progreso", // TODO: Calcular estado real
            progress: Math.floor(Math.random() * 100), // TODO: Calcular progreso real
            statusColor: "bg-purple-500",
            sectores:
              etapa.sectores?.map((sector) => ({
                id: sector.id,
                name: sector.nombre,
                status: "En progreso", // TODO: Calcular estado real
                progress: Math.floor(Math.random() * 100), // TODO: Calcular progreso real
                frentes:
                  sector.frentes?.map((frente) => ({
                    id: frente.id,
                    name: frente.nombre,
                    status: "En progreso", // TODO: Calcular estado real
                    progress: Math.floor(Math.random() * 100), // TODO: Calcular progreso real
                    partidas:
                      frente.partidas?.map((partida) => ({
                        id: partida.id,
                        name: partida.descripcion,
                        status: "En progreso", // TODO: Calcular estado real
                        progress: Math.floor(Math.random() * 100), // TODO: Calcular progreso real
                      })) || [],
                  })) || [],
              })) || [],
          })) || [],
        subproyectos: mockSubproyectos, // Mantener subproyectos mock por ahora
      };
    },
    [mockSubproyectos]
  );

  // Cargar proyectos desde la API
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const proyectosData = await proyectosApi.getAll();
      const proyectosConverted = proyectosData.map(convertProyectoToProject);
      setProjects(proyectosConverted);
    } catch (err) {
      console.error("Error cargando proyectos:", err);
      setError("Error al cargar los proyectos");
      // Mantener proyectos vacíos en caso de error
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [convertProyectoToProject]);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Funciones para obtener listas filtradas
  const getEtapasForProject = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.etapas || [];
  };

  const getSectoresForEtapa = (projectId: number, etapaId: string) => {
    const etapas = getEtapasForProject(projectId);
    const etapa = etapas.find((e) => e.id.toString() === etapaId);
    return etapa?.sectores || [];
  };

  const getFrentesForSector = (
    projectId: number,
    etapaId: string,
    sectorId: string
  ) => {
    const sectores = getSectoresForEtapa(projectId, etapaId);
    const sector = sectores.find((s) => s.id.toString() === sectorId);
    return sector?.frentes || [];
  };

  // Funciones para abrir modales
  const openModal = (
    modalType: string,
    project?: Project,
    context?: { type: string }
  ) => {
    setModals((prev) => ({ ...prev, [modalType]: true }));
    if (project) setSelectedProject(project);
    if (context) setSelectedContext(context);
  };

  const closeModal = (modalType: string) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
    setSelectedProject(null);
    setSelectedContext(null);
  };

  // Forms
  const projectForm = useForm<ProjectFormData>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      fecha_inicio: "",
      fecha_fin: "",
      cliente: "",
      ubicacion: "",
    },
  });

  const etapaForm = useForm<EtapaFormData>({
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  const sectorForm = useForm<SectorFormData>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      ubicacion: "",
      id_etapa: "",
    },
  });

  const frenteForm = useForm<FrenteFormData>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      responsable: "",
      id_etapa: "",
      id_sector: "",
    },
  });

  const partidaForm = useForm<PartidaFormData>({
    defaultValues: {
      codigo: "",
      descripcion: "",
      unidad_medida: "",
      cantidad: "",
      precio_unitario: "",
      id_etapa: "",
      id_sector: "",
      id_frente: "",
    },
  });

  // Handlers para enviar formularios
  const onSubmitProject = async (data: ProjectFormData) => {
    try {
      const projectData: Omit<
        ProyectoData,
        "id" | "created_at" | "updated_at" | "etapas"
      > = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        cliente: data.cliente,
        ubicacion: data.ubicacion,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        estado: "activo",
        activo: true,
      };

      if (modals.editProject && selectedProject) {
        // Actualizar proyecto existente
        await proyectosApi.update(selectedProject.id, projectData);
      } else {
        // Crear nuevo proyecto
        await proyectosApi.create(projectData);
      }

      // Recargar la lista de proyectos
      await loadProjects();

      closeModal(modals.editProject ? "editProject" : "newProject");
      projectForm.reset();
    } catch (error) {
      console.error("Error al guardar proyecto:", error);
      setError("Error al guardar el proyecto");
    }
  };

  const onSubmitEtapa = async (data: EtapaFormData) => {
    try {
      if (!selectedProject) {
        setError("No hay proyecto seleccionado");
        return;
      }

      const etapaData: Omit<
        EtapaData,
        "id_etapa" | "created_at" | "updated_at"
      > = {
        id_proyecto: selectedProject.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: true,
      };

      await etapasApi.create(etapaData);

      // Recargar la lista de proyectos para ver los cambios
      await loadProjects();

      closeModal("createEtapa");
      etapaForm.reset();
    } catch (error) {
      console.error("Error al crear etapa:", error);
      setError("Error al crear la etapa - Endpoint no implementado en backend");
    }
  };

  const onSubmitSector = async (data: SectorFormData) => {
    try {
      const sectorData: Omit<
        SectorData,
        "id_sector" | "created_at" | "updated_at"
      > = {
        id_etapa: parseInt(data.id_etapa),
        nombre: data.nombre,
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        activo: true,
      };

      await sectoresApi.create(sectorData);

      // Recargar la lista de proyectos para ver los cambios
      await loadProjects();

      closeModal("createSector");
      sectorForm.reset();
      setSelectedEtapaForSector("");
    } catch (error) {
      console.error("Error al crear sector:", error);
      setError(
        "Error al crear el sector - Endpoint no implementado en backend"
      );
    }
  };

  const onSubmitFrente = async (data: FrenteFormData) => {
    try {
      const frenteData: Omit<
        FrenteData,
        "id_frente" | "created_at" | "updated_at"
      > = {
        id_sector: parseInt(data.id_sector),
        nombre: data.nombre,
        descripcion: data.descripcion,
        responsable: data.responsable,
        activo: true,
      };

      await frentesApi.create(frenteData);

      // Recargar la lista de proyectos para ver los cambios
      await loadProjects();

      closeModal("createFrente");
      frenteForm.reset();
      setSelectedEtapaForFrente("");
      setSelectedSectorForFrente("");
    } catch (error) {
      console.error("Error al crear frente:", error);
      setError(
        "Error al crear el frente - Endpoint no implementado en backend"
      );
    }
  };

  const onSubmitPartida = async (data: PartidaFormData) => {
    try {
      const partidaData: Omit<
        PartidaData,
        "id_partida" | "created_at" | "updated_at"
      > = {
        id_frente: parseInt(data.id_frente),
        codigo: data.codigo,
        descripcion: data.descripcion,
        unidad_medida: data.unidad_medida,
        cantidad: parseFloat(data.cantidad),
        precio_unitario: data.precio_unitario
          ? parseFloat(data.precio_unitario)
          : undefined,
        orden: undefined, // Se calculará automáticamente en el backend
        activo: true,
      };

      await partidasApi.create(partidaData);

      // Recargar la lista de proyectos para ver los cambios
      await loadProjects();

      closeModal("createPartida");
      partidaForm.reset();
      setSelectedEtapaForPartida("");
      setSelectedSectorForPartida("");
      setSelectedFrenteForPartida("");
    } catch (error) {
      console.error("Error al crear partida:", error);
      setError("Error al crear la partida");
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProject = async (projectId: number) => {
    if (
      window.confirm(
        "¿Está seguro de que desea eliminar este proyecto? Esta acción no se puede deshacer."
      )
    ) {
      try {
        await proyectosApi.delete(projectId);
        await loadProjects();
      } catch (error) {
        console.error("Error al eliminar proyecto:", error);
        setError("Error al eliminar el proyecto");
      }
    }
  };

  const handleDeleteEtapa = async (etapaId: number) => {
    if (
      window.confirm(
        "¿Está seguro de que desea eliminar esta etapa? Esta acción no se puede deshacer."
      )
    ) {
      try {
        await etapasApi.delete(etapaId);
        await loadProjects();
      } catch (error) {
        console.error("Error al eliminar etapa:", error);
        setError("Error al eliminar la etapa");
      }
    }
  };

  const handleDeleteSector = async (sectorId: number) => {
    if (
      window.confirm(
        "¿Está seguro de que desea eliminar este sector? Esta acción no se puede deshacer."
      )
    ) {
      try {
        await sectoresApi.delete(sectorId);
        await loadProjects();
      } catch (error) {
        console.error("Error al eliminar sector:", error);
        setError("Error al eliminar el sector");
      }
    }
  };

  const handleDeleteFrente = async (frenteId: number) => {
    if (
      window.confirm(
        "¿Está seguro de que desea eliminar este frente? Esta acción no se puede deshacer."
      )
    ) {
      try {
        await frentesApi.delete(frenteId);
        await loadProjects();
      } catch (error) {
        console.error("Error al eliminar frente:", error);
        setError("Error al eliminar el frente");
      }
    }
  };

  const handleDeletePartida = async (partidaId: number) => {
    if (
      window.confirm(
        "¿Está seguro de que desea eliminar esta partida? Esta acción no se puede deshacer."
      )
    ) {
      try {
        await partidasApi.delete(partidaId);
        await loadProjects();
      } catch (error) {
        console.error("Error al eliminar partida:", error);
        setError("Error al eliminar la partida");
      }
    }
  };

  const handleAction = (action: string, projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    switch (action) {
      case "editar":
        if (project) {
          projectForm.reset({
            nombre: project.name,
            cliente: project.cliente,
            ubicacion: project.ubicacion,
            fecha_inicio: project.startDate,
            fecha_fin: project.endDate,
            descripcion: "",
          });
        }
        openModal("editProject", project);
        break;
      case "eliminar":
        handleDeleteProject(projectId);
        break;
      case "etapas":
        openModal("createEtapa", project);
        break;
      case "sectores":
        openModal("createSector", project, { type: "project" });
        break;
      case "frentes":
        openModal("createFrente", project, { type: "project" });
        break;
      case "partidas":
        openModal("createPartida", project, { type: "project" });
        break;
    }
  };

  const toggleProject = (projectId: number) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-semibold">Gestión de Proyectos</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos, clientes o ubicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-80"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openModal("newProject")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando proyectos...</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Proyectos
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                Total de proyectos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter((p) => p.status === "En progreso").length}
              </div>
              <p className="text-xs text-muted-foreground">Proyectos activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter((p) => p.status === "Completado").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Proyectos finalizados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes Únicos
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(projects.map((p) => p.cliente).filter(Boolean)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Diferentes clientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Proyectos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Proyecto</TableHead>
                  <TableHead className="w-[200px]">Cliente</TableHead>
                  <TableHead className="w-[150px]">Estado</TableHead>
                  <TableHead className="w-[150px]">Ubicación</TableHead>
                  <TableHead className="w-[120px]">Fecha Inicio</TableHead>
                  <TableHead className="w-[120px]">Fecha Fin</TableHead>
                  <TableHead className="w-[150px]">Progreso</TableHead>
                  <TableHead className="w-[300px] text-center">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <React.Fragment key={project.id}>
                    <TableRow className="cursor-pointer hover:bg-gray-50">
                      <TableCell
                        className="font-medium"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedProjects.includes(project.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div
                            className={`w-3 h-3 rounded-sm ${
                              project.progress === 100
                                ? "bg-green-500"
                                : project.progress > 0
                                ? "bg-blue-500"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{project.cliente}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(project.status)}
                          <Badge
                            variant={getStatusBadgeVariant(project.status)}
                          >
                            {project.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{project.ubicacion}</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.startDate}</TableCell>
                      <TableCell>{project.endDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${project.statusColor}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {project.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <HexagonButton
                            icon={Edit}
                            label="Editar Proyecto"
                            color="bg-blue-600"
                            onClick={() => handleAction("editar", project.id)}
                          />
                          <HexagonButton
                            icon={Trash2}
                            label="Eliminar Proyecto"
                            color="bg-red-600"
                            onClick={() => handleAction("eliminar", project.id)}
                          />
                          <HexagonButton
                            icon={Layers}
                            label="Crear Etapas"
                            color="bg-purple-600"
                            onClick={() => handleAction("etapas", project.id)}
                          />
                          <HexagonButton
                            icon={MapPin}
                            label="Crear Sectores"
                            color="bg-green-600"
                            onClick={() => handleAction("sectores", project.id)}
                          />
                          <HexagonButton
                            icon={GitBranch}
                            label="Crear Frentes"
                            color="bg-orange-600"
                            onClick={() => handleAction("frentes", project.id)}
                          />
                          <HexagonButton
                            icon={FileText}
                            label="Crear Partidas"
                            color="bg-yellow-600"
                            onClick={() => handleAction("partidas", project.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Contenido expandible del proyecto */}
                    {expandedProjects.includes(project.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <div className="bg-gray-50 p-6 border-t">
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Etapas Del Proyecto
                              </h3>
                              {project.etapas.length === 0 ? (
                                <p className="text-gray-500 italic">
                                  No hay etapas definidas para este proyecto.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {project.etapas.map((etapa: Etapa) => (
                                    <EtapaItem
                                      key={etapa.id}
                                      etapa={etapa}
                                      onDelete={handleDeleteEtapa}
                                      onDeleteSector={handleDeleteSector}
                                      onDeleteFrente={handleDeleteFrente}
                                      onDeletePartida={handleDeletePartida}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            {project.subproyectos &&
                              project.subproyectos.length > 0 && (
                                <div className="mt-6">
                                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Subproyectos
                                  </h3>
                                  <div className="space-y-3">
                                    {project.subproyectos.map(
                                      (subproyecto: Subproyecto) => (
                                        <SubproyectoItem
                                          key={subproyecto.id}
                                          subproyecto={subproyecto}
                                          projectId={project.id}
                                          onDeleteEtapa={handleDeleteEtapa}
                                          onDeleteSector={handleDeleteSector}
                                          onDeleteFrente={handleDeleteFrente}
                                          onDeletePartida={handleDeletePartida}
                                        />
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Modal para Nuevo Proyecto */}
      <Dialog
        open={modals.newProject}
        onOpenChange={() => closeModal("newProject")}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          </DialogHeader>
          <Form {...projectForm}>
            <form
              onSubmit={projectForm.handleSubmit(onSubmitProject)}
              className="space-y-4"
            >
              <FormField
                control={projectForm.control}
                name="nombre"
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proyecto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: PROYECTO 4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="cliente"
                rules={{ required: "El cliente es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Empresa ABC S.A.C." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="ubicacion"
                rules={{ required: "La ubicación es requerida" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Lima, Perú" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={projectForm.control}
                  name="fecha_inicio"
                  rules={{ required: "La fecha de inicio es requerida" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="fecha_fin"
                  rules={{ required: "La fecha de fin es requerida" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={projectForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del proyecto..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeModal("newProject")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Crear Proyecto
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Proyecto */}
      <Dialog
        open={modals.editProject}
        onOpenChange={() => closeModal("editProject")}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
          </DialogHeader>
          <Form {...projectForm}>
            <form
              onSubmit={projectForm.handleSubmit(onSubmitProject)}
              className="space-y-4"
            >
              <FormField
                control={projectForm.control}
                name="nombre"
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proyecto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: PROYECTO 4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="cliente"
                rules={{ required: "El cliente es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Empresa ABC S.A.C." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="ubicacion"
                rules={{ required: "La ubicación es requerida" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Lima, Perú" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={projectForm.control}
                  name="fecha_inicio"
                  rules={{ required: "La fecha de inicio es requerida" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="fecha_fin"
                  rules={{ required: "La fecha de fin es requerida" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={projectForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del proyecto..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeModal("editProject")}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Etapa */}
      <Dialog
        open={modals.createEtapa}
        onOpenChange={() => closeModal("createEtapa")}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Etapa</DialogTitle>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                Para: {selectedProject.name}
              </p>
            )}
          </DialogHeader>
          <Form {...etapaForm}>
            <form
              onSubmit={etapaForm.handleSubmit(onSubmitEtapa)}
              className="space-y-4"
            >
              <FormField
                control={etapaForm.control}
                name="nombre"
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Etapa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Cimentación, Estructura, Acabados"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={etapaForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción de la etapa..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeModal("createEtapa")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Crear Etapa
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Sector */}
      <Dialog
        open={modals.createSector}
        onOpenChange={() => closeModal("createSector")}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Sector</DialogTitle>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                Para: {selectedProject.name}
              </p>
            )}
          </DialogHeader>
          <Form {...sectorForm}>
            <form
              onSubmit={sectorForm.handleSubmit(onSubmitSector)}
              className="space-y-4"
            >
              <FormField
                control={sectorForm.control}
                name="id_etapa"
                rules={{ required: "Debe seleccionar una etapa" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedEtapaForSector(e.target.value);
                        }}
                      >
                        <option value="">Seleccionar etapa...</option>
                        {selectedProject &&
                          getEtapasForProject(selectedProject.id).map(
                            (etapa) => (
                              <option key={etapa.id} value={etapa.id}>
                                {etapa.name}
                              </option>
                            )
                          )}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sectorForm.control}
                name="nombre"
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Sector</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Sector A - Zapatas, Sector 1 - Columnas"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sectorForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del sector..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sectorForm.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Bloque A, Zona Norte..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeModal("createSector")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Crear Sector
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Frente */}
      <Dialog
        open={modals.createFrente}
        onOpenChange={() => closeModal("createFrente")}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Frente</DialogTitle>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                Para: {selectedProject.name}
              </p>
            )}
          </DialogHeader>
          <Form {...frenteForm}>
            <form
              onSubmit={frenteForm.handleSubmit(onSubmitFrente)}
              className="space-y-4"
            >
              <FormField
                control={frenteForm.control}
                name="id_etapa"
                rules={{ required: "Debe seleccionar una etapa" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedEtapaForFrente(e.target.value);
                          setSelectedSectorForFrente("");
                          frenteForm.setValue("id_sector", "");
                        }}
                      >
                        <option value="">Seleccionar etapa...</option>
                        {selectedProject &&
                          getEtapasForProject(selectedProject.id).map(
                            (etapa) => (
                              <option key={etapa.id} value={etapa.id}>
                                {etapa.name}
                              </option>
                            )
                          )}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={frenteForm.control}
                name="id_sector"
                rules={{ required: "Debe seleccionar un sector" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        disabled={!selectedEtapaForFrente}
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedSectorForFrente(e.target.value);
                        }}
                      >
                        <option value="">Seleccionar sector...</option>
                        {selectedProject &&
                          selectedEtapaForFrente &&
                          getSectoresForEtapa(
                            selectedProject.id,
                            selectedEtapaForFrente
                          ).map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={frenteForm.control}
                name="nombre"
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Frente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Frente Norte, Frente Principal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={frenteForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del frente..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={frenteForm.control}
                name="responsable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre del responsable del frente"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeModal("createFrente")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Crear Frente
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Partida */}
      <Dialog
        open={modals.createPartida}
        onOpenChange={() => closeModal("createPartida")}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Partida</DialogTitle>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                Para: {selectedProject.name}
              </p>
            )}
          </DialogHeader>
          <Form {...partidaForm}>
            <form
              onSubmit={partidaForm.handleSubmit(onSubmitPartida)}
              className="space-y-4"
            >
              <FormField
                control={partidaForm.control}
                name="id_etapa"
                rules={{ required: "Debe seleccionar una etapa" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedEtapaForPartida(e.target.value);
                          setSelectedSectorForPartida("");
                          setSelectedFrenteForPartida("");
                          partidaForm.setValue("id_sector", "");
                          partidaForm.setValue("id_frente", "");
                        }}
                      >
                        <option value="">Seleccionar etapa...</option>
                        {selectedProject &&
                          getEtapasForProject(selectedProject.id).map(
                            (etapa) => (
                              <option key={etapa.id} value={etapa.id}>
                                {etapa.name}
                              </option>
                            )
                          )}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partidaForm.control}
                name="id_sector"
                rules={{ required: "Debe seleccionar un sector" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        disabled={!selectedEtapaForPartida}
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedSectorForPartida(e.target.value);
                          setSelectedFrenteForPartida("");
                          partidaForm.setValue("id_frente", "");
                        }}
                      >
                        <option value="">Seleccionar sector...</option>
                        {selectedProject &&
                          selectedEtapaForPartida &&
                          getSectoresForEtapa(
                            selectedProject.id,
                            selectedEtapaForPartida
                          ).map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partidaForm.control}
                name="id_frente"
                rules={{ required: "Debe seleccionar un frente" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frente</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        disabled={!selectedSectorForPartida}
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedFrenteForPartida(e.target.value);
                        }}
                      >
                        <option value="">Seleccionar frente...</option>
                        {selectedProject &&
                          selectedEtapaForPartida &&
                          selectedSectorForPartida &&
                          getFrentesForSector(
                            selectedProject.id,
                            selectedEtapaForPartida,
                            selectedSectorForPartida
                          ).map((frente) => (
                            <option key={frente.id} value={frente.id}>
                              {frente.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partidaForm.control}
                name="codigo"
                rules={{ required: "El código es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de la Partida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: EXC-001, ARM-002" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partidaForm.control}
                name="descripcion"
                rules={{ required: "La descripción es requerida" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Excavación masiva, Armado de acero..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={partidaForm.control}
                  name="unidad_medida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad de Medida</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: m3, kg, m2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partidaForm.control}
                  name="cantidad"
                  rules={{ required: "La cantidad es requerida" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={partidaForm.control}
                name="precio_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeModal("createPartida")}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Crear Partida
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
