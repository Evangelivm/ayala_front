"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subEtapasApi, type SubEtapaData } from "@/lib/connections";

interface SubEtapaSelectProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  idSubproyecto?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SubEtapaSelect({
  value,
  onChange,
  onNameChange,
  idSubproyecto,
  placeholder = "Seleccionar sub-etapa...",
  className,
  disabled = false,
}: SubEtapaSelectProps) {
  const [subEtapas, setSubEtapas] = useState<SubEtapaData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idSubproyecto) {
      setSubEtapas([]);
      if (onNameChange) onNameChange("");
      return;
    }

    const fetchSubEtapas = async () => {
      try {
        setLoading(true);
        const data = await subEtapasApi.getBySubproyecto(idSubproyecto);
        setSubEtapas(data);
      } catch (error) {
        console.error("Error fetching sub-etapas:", error);
        setSubEtapas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubEtapas();
  }, [idSubproyecto]);

  useEffect(() => {
    if (value && subEtapas.length > 0 && onNameChange) {
      const subEtapa = subEtapas.find((e) => e.id_sub_etapa === value);
      onNameChange(subEtapa?.nombre || "");
    } else if (!value && onNameChange) {
      onNameChange("");
    }
  }, [value, subEtapas]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idSubproyecto) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero un subproyecto" />
        </SelectTrigger>
      </Select>
    );
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Cargando..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={value ? value.toString() : undefined}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {subEtapas
          .filter((e) => e.id_sub_etapa)
          .map((subEtapa) => (
            <SelectItem
              key={subEtapa.id_sub_etapa}
              value={subEtapa.id_sub_etapa!.toString()}
            >
              {subEtapa.nombre}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
