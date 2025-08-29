"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EtapaData {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface EtapaSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onEtapaChange?: (etapa: EtapaData | null) => void;
  etapas: EtapaData[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EtapaSelect({
  value,
  onValueChange,
  onEtapaChange,
  etapas,
  placeholder = "Seleccionar etapa...",
  className,
  disabled = false,
}: EtapaSelectProps) {
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);

    // Si hay callback para el objeto completo, encontrar y enviar la etapa
    if (onEtapaChange) {
      if (newValue === "default" || !newValue) {
        onEtapaChange(null);
      } else {
        const selectedEtapa = etapas.find((e) => e.nombre === newValue);
        onEtapaChange(selectedEtapa || null);
      }
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem key="etapa-default" value="default">
          -- Seleccionar --
        </SelectItem>
        {etapas?.map((etapa, index) => (
          <SelectItem key={`etapa-${etapa.id || index}`} value={etapa.nombre}>
            {etapa.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
