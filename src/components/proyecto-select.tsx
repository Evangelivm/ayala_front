"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { proyectosApi, type ProyectoData } from "@/lib/connections"

interface ProyectoSelectProps {
  value: string
  onValueChange: (value: string) => void
  onProyectoChange?: (proyecto: ProyectoData | null) => void
  placeholder?: string
  className?: string
}

export function ProyectoSelect({
  value,
  onValueChange,
  onProyectoChange,
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
        // Fallback a datos vacíos en caso de error
        setProyectos([])
      } finally {
        setLoading(false)
      }
    }

    fetchProyectos()
  }, [])

  useEffect(() => {
    if (value && onProyectoChange && proyectos.length > 0) {
      const proyecto = proyectos.find(p => p.nombre === value) || null
      onProyectoChange(proyecto)
    }
  }, [value, onProyectoChange, proyectos])

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
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">-- Seleccionar --</SelectItem>
        {proyectos.map((proyecto) => (
          <SelectItem key={proyecto.id} value={proyecto.nombre}>
            {proyecto.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
