"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { partidasApi, type PartidaData } from "@/lib/connections";

interface PartidaSelectProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  onNameChange?: (name: string) => void;
  onPartidaDataChange?: (data: { codigo: string; descripcion: string } | null) => void;
  idFrente?: number;
  placeholder?: string;
  className?: string;
}

export function PartidaSelect({
  value,
  onChange,
  onNameChange,
  onPartidaDataChange,
  idFrente,
  placeholder = "Seleccionar partida...",
  className,
}: PartidaSelectProps) {
  const [partidas, setPartidas] = useState<PartidaData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idFrente) {
      setPartidas([]);
      if (onNameChange) onNameChange("");
      return;
    }

    const fetchPartidas = async () => {
      try {
        setLoading(true);
        const data = await partidasApi.getByFrente(idFrente);
        setPartidas(data);
      } catch (error) {
        console.error("Error fetching partidas:", error);
        setPartidas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartidas();
  }, [idFrente]);

  useEffect(() => {
    if (value && partidas.length > 0) {
      const partida = partidas.find(p => p.id_partida === value);
      if (partida) {
        if (onNameChange) {
          onNameChange(`${partida.codigo} - ${partida.descripcion}`);
        }
        if (onPartidaDataChange) {
          onPartidaDataChange({
            codigo: partida.codigo,
            descripcion: partida.descripcion,
          });
        }
      } else {
        if (onNameChange) onNameChange("");
        if (onPartidaDataChange) onPartidaDataChange(null);
      }
    } else if (!value) {
      if (onNameChange) onNameChange("");
      if (onPartidaDataChange) onPartidaDataChange(null);
    }
  }, [value, partidas]);

  const handleValueChange = (val: string) => {
    onChange(parseInt(val));
  };

  if (!idFrente) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Seleccione primero un frente" />
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
        {partidas.filter(p => p.id_partida).map((partida) => (
          <SelectItem key={partida.id_partida} value={partida.id_partida!.toString()}>
            {partida.codigo} - {partida.descripcion}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
