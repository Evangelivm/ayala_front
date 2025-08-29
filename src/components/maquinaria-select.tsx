"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { maquinariaApi, type MaquinariaData } from "@/lib/connections"

interface MaquinariaSelectProps {
  value: string
  onValueChange: (value: string) => void
  onMaquinariaSelected?: (maquinaria: MaquinariaData | null) => void
  placeholder?: string
  className?: string
}

export function MaquinariaSelect({
  value,
  onValueChange,
  onMaquinariaSelected,
  placeholder = "Seleccionar maquinaria...",
  className,
}: MaquinariaSelectProps) {
  const [maquinarias, setMaquinarias] = useState<MaquinariaData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMaquinarias = async () => {
      try {
        setLoading(true)
        const data = await maquinariaApi.getAll()
        setMaquinarias(data)
      } catch (error) {
        console.error('Error fetching maquinarias:', error)
        // Fallback a datos vacíos en caso de error
        setMaquinarias([])
      } finally {
        setLoading(false)
      }
    }

    fetchMaquinarias()
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
    
    // Si hay callback para el objeto completo, encontrar y enviar la maquinaria
    if (onMaquinariaSelected) {
      if (newValue === "default" || !newValue) {
        onMaquinariaSelected(null)
      } else {
        const selectedMaquinaria = maquinarias.find(m => m.nombre === newValue)
        onMaquinariaSelected(selectedMaquinaria || null)
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
        {maquinarias.map((maquinaria) => (
          <SelectItem key={maquinaria.id} value={maquinaria.nombre}>
            {maquinaria.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
