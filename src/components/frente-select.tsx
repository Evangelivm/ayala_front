"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FrenteData {
  id: number;
  nombre: string;
  descripcion?: string;
  responsable?: string;
}

interface FrenteSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onFrenteChange?: (frente: FrenteData | null) => void;
  frentes: FrenteData[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FrenteSelect({
  value,
  onValueChange,
  onFrenteChange,
  frentes,
  placeholder = "Seleccionar frente...",
  className,
  disabled = false,
}: FrenteSelectProps) {
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);

    // Si hay callback para el objeto completo, encontrar y enviar el frente
    if (onFrenteChange) {
      if (newValue === "default" || !newValue) {
        onFrenteChange(null);
      } else {
        const selectedFrente = frentes.find((f) => f.nombre === newValue);
        onFrenteChange(selectedFrente || null);
      }
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem key="default" value="default">
          -- Seleccionar --
        </SelectItem>
        {frentes?.map((frente, index) => (
          <SelectItem
            key={frente.id ? `frente-${frente.id}` : `frente-index-${index}`}
            value={frente.nombre || `Frente ${index + 1}`}
            title={
              frente.responsable
                ? `Responsable: ${frente.responsable}`
                : undefined
            }
          >
            {frente.nombre || `Frente ${index + 1}`}
            {frente.responsable && (
              <span className="text-xs text-gray-500 ml-2">
                ({frente.responsable})
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
