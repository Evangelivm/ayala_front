"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { equiposApi, type EquipoData } from "@/lib/connections"

interface EquipoSelectProps {
  value: string
  onValueChange: (value: string) => void
  onEquipoSelected?: (equipo: EquipoData | null) => void // Callback para el objeto completo
  tipo_equipo?: string // Filtro por tipo de equipo (opcional)
  placeholder?: string
  className?: string
}

export function EquipoSelect({
  value,
  onValueChange,
  onEquipoSelected,
  tipo_equipo,
  placeholder = "Seleccionar equipo...",
  className,
}: EquipoSelectProps) {
  const [equipos, setEquipos] = useState<EquipoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        setLoading(true)
        // Obtener equipos filtrados por tipo o todos
        const data = tipo_equipo 
          ? await equiposApi.getByTipo(tipo_equipo)
          : await equiposApi.getAll()
        
        // Verificar que data sea un array válido
        if (Array.isArray(data)) {
          setEquipos(data)
        } else {
          console.warn('Equipos API returned non-array data:', data)
          setEquipos([])
        }
      } catch (error) {
        console.error('Error fetching equipos:', error)
        // Fallback a datos vacíos en caso de error
        setEquipos([])
      } finally {
        setLoading(false)
      }
    }

    fetchEquipos()
  }, [tipo_equipo])

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Cargando equipos..." />
        </SelectTrigger>
      </Select>
    )
  }

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue)
    
    // Si hay callback para el objeto completo, encontrar y enviar el equipo
    if (onEquipoSelected) {
      if (newValue === "default" || !newValue) {
        onEquipoSelected(null)
      } else {
        const selectedEquipo = equipos.find(e => `${e.marca} ${e.modelo}` === newValue)
        onEquipoSelected(selectedEquipo || null)
      }
    }
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value && value !== "default" ? value : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">-- Seleccionar --</SelectItem>
        {Array.isArray(equipos) && equipos.map((equipo) => (
          <SelectItem key={equipo.id_equipo} value={`${equipo.marca} ${equipo.modelo}`}>
            <div className="flex flex-col">
              <span className="font-medium">{equipo.marca} {equipo.modelo}</span>
              {equipo.descripcion && (
                <span className="text-xs text-gray-500">{equipo.descripcion}</span>
              )}
              <span className="text-xs text-blue-600">
                {equipo.unidad} - S/ {equipo.precio_referencial?.toFixed(2)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}