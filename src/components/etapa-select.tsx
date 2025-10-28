"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { etapasApi, type EtapaData } from "@/lib/connections";

interface EtapaSelectProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  idProyecto?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EtapaSelect({
  value,
  onChange,
  onNameChange,
  idProyecto,
  placeholder = "Seleccionar etapa...",
  className,
  disabled = false,
}: EtapaSelectProps) {
  const [etapas, setEtapas] = useState<EtapaData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idProyecto) {
      setEtapas([]);
      if (onNameChange) onNameChange("");
      return;
    }

    const fetchEtapas = async () => {
      try {
        setLoading(true);
        const data = await etapasApi.getByProyecto(idProyecto);
        setEtapas(data);
      } catch (error) {
        console.error("Error fetching etapas:", error);
        setEtapas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEtapas();
  }, [idProyecto]);

  useEffect(() => {
    if (value && etapas.length > 0 && onNameChange) {
      const etapa = etapas.find(e => e.id_etapa === value);
      onNameChange(etapa?.nombre || "");
    } else if (!value && onNameChange) {
      onNameChange("");
    }
  }, [value, etapas]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idProyecto) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero un proyecto" />
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
    <Select value={value ? value.toString() : undefined} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {etapas.filter(e => e.id_etapa).map((etapa) => (
          <SelectItem key={etapa.id_etapa} value={etapa.id_etapa!.toString()}>
            {etapa.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
