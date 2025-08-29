"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { personalNuevoApi, type PersonalNuevoData } from "@/lib/connections"

interface PersonalSelectProps {
  value: string
  onValueChange: (value: string) => void
  onPersonSelected?: (person: PersonalNuevoData | null) => void // Nuevo callback para el objeto completo
  placeholder?: string
  className?: string
}

export function PersonalSelect({
  value,
  onValueChange,
  onPersonSelected,
  placeholder = "Seleccionar persona...",
  className,
}: PersonalSelectProps) {
  const [personal, setPersonal] = useState<PersonalNuevoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        setLoading(true)
        // Ya no filtramos por cargo - todos pueden desempeñar cualquier rol
        const data = await personalNuevoApi.getAll()
        
        // Verificar que data sea un array válido
        if (Array.isArray(data)) {
          setPersonal(data)
        } else {
          console.warn('Personal API returned non-array data:', data)
          setPersonal([])
        }
      } catch (error) {
        console.error('Error fetching personal:', error)
        // Fallback a datos vacíos en caso de error
        setPersonal([])
      } finally {
        setLoading(false)
      }
    }

    fetchPersonal()
  }, [])

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Cargando..." />
        </SelectTrigger>
      </Select>
    )
  }

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue)
    
    // Si hay callback para el objeto completo, encontrar y enviar la persona
    if (onPersonSelected) {
      if (newValue === "default" || !newValue) {
        onPersonSelected(null)
      } else {
        const selectedPerson = personal.find(p => p.nombre_completo === newValue)
        onPersonSelected(selectedPerson || null)
      }
    }
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">-- Seleccionar --</SelectItem>
        {Array.isArray(personal) && personal.map((person) => (
          <SelectItem key={person.id_personal} value={person.nombre_completo || `${person.nombres} ${person.apellidos}`}>
            {person.nombre_completo || `${person.nombres} ${person.apellidos}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
