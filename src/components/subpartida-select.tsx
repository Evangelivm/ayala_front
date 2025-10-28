"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subpartidasApi, type SubpartidaData } from "@/lib/connections";

interface SubpartidaSelectProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  onSubpartidaDataChange?: (data: { codigo: string; descripcion: string } | null) => void;
  idSubfrente?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SubpartidaSelect({
  value,
  onChange,
  onNameChange,
  onSubpartidaDataChange,
  idSubfrente,
  placeholder = "Seleccionar subpartida...",
  className,
  disabled = false,
}: SubpartidaSelectProps) {
  const [subpartidas, setSubpartidas] = useState<SubpartidaData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idSubfrente) {
      setSubpartidas([]);
      if (onNameChange) onNameChange("");
      if (onSubpartidaDataChange) onSubpartidaDataChange(null);
      return;
    }

    const fetchSubpartidas = async () => {
      try {
        setLoading(true);
        const data = await subpartidasApi.getBySubfrente(idSubfrente);
        setSubpartidas(data);
      } catch (error) {
        console.error("Error fetching subpartidas:", error);
        setSubpartidas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubpartidas();
  }, [idSubfrente]);

  useEffect(() => {
    if (value && subpartidas.length > 0) {
      const subpartida = subpartidas.find((p) => p.id_subpartida === value);
      if (onNameChange) {
        onNameChange(subpartida?.descripcion || "");
      }
      if (onSubpartidaDataChange && subpartida) {
        onSubpartidaDataChange({
          codigo: subpartida.codigo,
          descripcion: subpartida.descripcion,
        });
      }
    } else if (!value) {
      if (onNameChange) onNameChange("");
      if (onSubpartidaDataChange) onSubpartidaDataChange(null);
    }
  }, [value, subpartidas]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idSubfrente) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero un subfrente" />
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
        {subpartidas
          .filter((p) => p.id_subpartida)
          .map((subpartida) => (
            <SelectItem
              key={subpartida.id_subpartida}
              value={subpartida.id_subpartida!.toString()}
            >
              {subpartida.codigo} - {subpartida.descripcion}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
