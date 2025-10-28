"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { proyectosApi, subproyectosApi, type ProyectoData, type SubproyectoData } from "@/lib/connections"

interface ProyectoSelectProps {
  value?: number | string
  onChange: (id: number | undefined, type: "proyecto" | "subproyecto") => void
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
  placeholder = "Seleccionar proyecto o subproyecto...",
  className,
}: ProyectoSelectProps) {
  const [proyectos, setProyectos] = useState<ProyectoData[]>([])
  const [subproyectosByProyecto, setSubproyectosByProyecto] = useState<Record<number, SubproyectoData[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const proyectosData = await proyectosApi.getAll()
        setProyectos(proyectosData)

        // Cargar subproyectos para cada proyecto
        const subproyectosMap: Record<number, SubproyectoData[]> = {}
        for (const proyecto of proyectosData) {
          if (proyecto.id) {
            const subproyectos = await subproyectosApi.getByProyecto(proyecto.id)
            subproyectosMap[proyecto.id] = subproyectos
          }
        }
        setSubproyectosByProyecto(subproyectosMap)
      } catch (error) {
        console.error('Error fetching proyectos:', error)
        setProyectos([])
        setSubproyectosByProyecto({})
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (value && proyectos.length > 0) {
      const valueStr = value.toString()

      // Verificar si es proyecto (formato: "p-{id}")
      if (valueStr.startsWith("p-")) {
        const proyectoId = parseInt(valueStr.replace("p-", ""))
        const proyecto = proyectos.find(p => p.id === proyectoId) || null
        if (onProyectoChange) {
          onProyectoChange(proyecto)
        }
        if (onNameChange && proyecto) {
          onNameChange(proyecto.nombre)
        }
      }
      // Verificar si es subproyecto (formato: "s-{id}")
      else if (valueStr.startsWith("s-")) {
        const subproyectoId = parseInt(valueStr.replace("s-", ""))
        let subproyectoNombre = ""

        // Buscar el nombre del subproyecto en el mapa
        for (const subproyectos of Object.values(subproyectosByProyecto)) {
          const subproyecto = subproyectos.find(s => s.id_subproyecto === subproyectoId)
          if (subproyecto) {
            subproyectoNombre = subproyecto.nombre
            break
          }
        }

        if (onProyectoChange) {
          onProyectoChange(null)
        }
        if (onNameChange) {
          onNameChange(subproyectoNombre)
        }
      }
    } else if (!value && onNameChange) {
      onNameChange("")
    }
  }, [value, proyectos, subproyectosByProyecto])

  const handleValueChange = (val: string) => {
    if (val.startsWith("p-")) {
      const id = parseInt(val.replace("p-", ""))
      onChange(id, "proyecto")
    } else if (val.startsWith("s-")) {
      const id = parseInt(val.replace("s-", ""))
      onChange(id, "subproyecto")
    }
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
      <SelectContent className="max-h-[300px]">
        {proyectos.map((proyecto) => (
          <SelectGroup key={proyecto.id}>
            {/* Proyecto padre */}
            <SelectItem value={`p-${proyecto.id}`}>
              <span className="font-semibold">📁 {proyecto.nombre}</span>
            </SelectItem>

            {/* Subproyectos si existen */}
            {subproyectosByProyecto[proyecto.id!] && subproyectosByProyecto[proyecto.id!].length > 0 && (
              <>
                {subproyectosByProyecto[proyecto.id!].map((subproyecto) => (
                  <SelectItem
                    key={`s-${subproyecto.id_subproyecto}`}
                    value={`s-${subproyecto.id_subproyecto}`}
                    className="pl-8"
                  >
                    <span className="text-sm">└─ {subproyecto.nombre}</span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
