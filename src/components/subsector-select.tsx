"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subsectoresApi, type SubsectorData } from "@/lib/connections";

interface SubsectorSelectProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  idSubEtapa?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SubsectorSelect({
  value,
  onChange,
  onNameChange,
  idSubEtapa,
  placeholder = "Seleccionar subsector...",
  className,
  disabled = false,
}: SubsectorSelectProps) {
  const [subsectores, setSubsectores] = useState<SubsectorData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idSubEtapa) {
      setSubsectores([]);
      if (onNameChange) onNameChange("");
      return;
    }

    const fetchSubsectores = async () => {
      try {
        setLoading(true);
        const data = await subsectoresApi.getBySubEtapa(idSubEtapa);
        setSubsectores(data);
      } catch (error) {
        console.error("Error fetching subsectores:", error);
        setSubsectores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubsectores();
  }, [idSubEtapa]);

  useEffect(() => {
    if (value && subsectores.length > 0 && onNameChange) {
      const subsector = subsectores.find((s) => s.id_subsector === value);
      onNameChange(subsector?.nombre || "");
    } else if (!value && onNameChange) {
      onNameChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, subsectores]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idSubEtapa) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero una sub-etapa" />
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
        {subsectores
          .filter((s) => s.id_subsector)
          .map((subsector) => (
            <SelectItem
              key={subsector.id_subsector}
              value={subsector.id_subsector!.toString()}
            >
              {subsector.nombre}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
