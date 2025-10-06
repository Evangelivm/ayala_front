"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sectoresApi, type SectorData } from "@/lib/connections";

interface SectorSelectProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  idEtapa?: number;
  placeholder?: string;
  className?: string;
}

export function SectorSelect({
  value,
  onChange,
  onNameChange,
  idEtapa,
  placeholder = "Seleccionar sector...",
  className,
}: SectorSelectProps) {
  const [sectores, setSectores] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idEtapa) {
      setSectores([]);
      if (onNameChange) onNameChange("");
      return;
    }

    const fetchSectores = async () => {
      try {
        setLoading(true);
        const data = await sectoresApi.getByEtapa(idEtapa);
        setSectores(data);
      } catch (error) {
        console.error("Error fetching sectores:", error);
        setSectores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSectores();
  }, [idEtapa]);

  useEffect(() => {
    if (value && sectores.length > 0 && onNameChange) {
      const sector = sectores.find(s => s.id_sector === value);
      onNameChange(sector?.nombre || "");
    } else if (!value && onNameChange) {
      onNameChange("");
    }
  }, [value, sectores, onNameChange]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idEtapa) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero una etapa" />
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
        {sectores.filter(s => s.id_sector).map((sector) => (
          <SelectItem key={sector.id_sector} value={sector.id_sector!.toString()}>
            {sector.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
