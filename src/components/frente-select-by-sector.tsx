"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { frentesApi, type FrenteData } from "@/lib/connections";

interface FrenteSelectBySectorProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  idSector?: number;
  placeholder?: string;
  className?: string;
}

export function FrenteSelectBySector({
  value,
  onChange,
  onNameChange,
  idSector,
  placeholder = "Seleccionar frente...",
  className,
}: FrenteSelectBySectorProps) {
  const [frentes, setFrente] = useState<FrenteData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idSector) {
      setFrente([]);
      if (onNameChange) onNameChange("");
      return;
    }

    const fetchFrente = async () => {
      try {
        setLoading(true);
        const data = await frentesApi.getBySector(idSector);
        setFrente(data);
      } catch (error) {
        console.error("Error fetching frentes:", error);
        setFrente([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFrente();
  }, [idSector]);

  useEffect(() => {
    if (value && frentes.length > 0 && onNameChange) {
      const frente = frentes.find(f => f.id_frente === value);
      onNameChange(frente?.nombre || "");
    } else if (!value && onNameChange) {
      onNameChange("");
    }
  }, [value, frentes, onNameChange]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idSector) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero un sector" />
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
    <Select value={value ? value.toString() : undefined} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {frentes.filter(f => f.id_frente).map((frente) => (
          <SelectItem key={frente.id_frente} value={frente.id_frente!.toString()}>
            {frente.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
