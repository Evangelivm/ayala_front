"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { proyectosApi, type ProyectoData } from "@/lib/connections"

interface ProyectoSelectProps {
  value?: number
  onChange: (id: number | undefined) => void
  onProyectoChange?: (proyecto: ProyectoData | null) => void
  onNameChange?: (name: string) => void
  placeholder?: string
  className?: string
}

export function ProyectoSelect({
  value,
  onChange,
  onProyectoChange,
  onNameChange,
  placeholder = "Seleccionar proyecto...",
  className,
}: ProyectoSelectProps) {
  const [proyectos, setProyectos] = useState<ProyectoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        setLoading(true)
        const data = await proyectosApi.getAll()
        setProyectos(data)
      } catch (error) {
        console.error('Error fetching proyectos:', error)
        setProyectos([])
      } finally {
        setLoading(false)
      }
    }

    fetchProyectos()
  }, [])

  useEffect(() => {
    if (value && proyectos.length > 0) {
      const proyecto = proyectos.find(p => p.id === value) || null
      if (onProyectoChange) {
        onProyectoChange(proyecto)
      }
      if (onNameChange && proyecto) {
        onNameChange(proyecto.nombre)
      }
    } else if (!value && onNameChange) {
      onNameChange("")
    }
  }, [value, proyectos, onNameChange, onProyectoChange])

  const handleValueChange = (val: string) => {
    onChange(parseInt(val))
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Cargando..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={value ? value.toString() : undefined} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {proyectos.map((proyecto) => (
          <SelectItem key={proyecto.id} value={proyecto.id.toString()}>
            {proyecto.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
