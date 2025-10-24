"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subfrentesApi, type SubfrenteData } from "@/lib/connections";

interface SubfrenteSelectProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  idSubsector?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SubfrenteSelect({
  value,
  onChange,
  onNameChange,
  idSubsector,
  placeholder = "Seleccionar subfrente...",
  className,
  disabled = false,
}: SubfrenteSelectProps) {
  const [subfrentes, setSubfrentes] = useState<SubfrenteData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idSubsector) {
      setSubfrentes([]);
      if (onNameChange) onNameChange("");
      return;
    }

    const fetchSubfrentes = async () => {
      try {
        setLoading(true);
        const data = await subfrentesApi.getBySubsector(idSubsector);
        setSubfrentes(data);
      } catch (error) {
        console.error("Error fetching subfrentes:", error);
        setSubfrentes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubfrentes();
  }, [idSubsector]);

  useEffect(() => {
    if (value && subfrentes.length > 0 && onNameChange) {
      const subfrente = subfrentes.find((f) => f.id_subfrente === value);
      onNameChange(subfrente?.nombre || "");
    } else if (!value && onNameChange) {
      onNameChange("");
    }
  }, [value, subfrentes, onNameChange]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idSubsector) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero un subsector" />
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
        {subfrentes
          .filter((f) => f.id_subfrente)
          .map((subfrente) => (
            <SelectItem
              key={subfrente.id_subfrente}
              value={subfrente.id_subfrente!.toString()}
            >
              {subfrente.nombre}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
