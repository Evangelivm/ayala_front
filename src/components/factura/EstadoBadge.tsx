import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileQuestion } from "lucide-react";

interface EstadoBadgeProps {
  estado: string | null;
  className?: string;
}

export function EstadoBadge({ estado, className = "" }: EstadoBadgeProps) {
  const getEstadoConfig = (estado: string | null) => {
    switch (estado) {
      case null:
      case "SIN PROCESAR":
        return {
          label: "SIN PROCESAR",
          color: "bg-gray-200 text-gray-700 hover:bg-gray-300",
          icon: FileQuestion,
        };
      case "PENDIENTE":
        return {
          label: "PENDIENTE",
          color: "bg-yellow-200 text-yellow-800 hover:bg-yellow-300",
          icon: Clock,
        };
      case "PROCESANDO":
        return {
          label: "PROCESANDO",
          color: "bg-blue-200 text-blue-800 hover:bg-blue-300 animate-pulse",
          icon: Clock,
        };
      case "COMPLETADO":
        return {
          label: "COMPLETADO",
          color: "bg-green-200 text-green-800 hover:bg-green-300",
          icon: CheckCircle2,
        };
      case "FALLADO":
        return {
          label: "FALLADO",
          color: "bg-red-200 text-red-800 hover:bg-red-300",
          icon: XCircle,
        };
      default:
        return {
          label: estado || "DESCONOCIDO",
          color: "bg-gray-200 text-gray-700 hover:bg-gray-300",
          icon: AlertCircle,
        };
    }
  };

  const config = getEstadoConfig(estado);
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
