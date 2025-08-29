"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente al dashboard
    router.push("/dashboard")
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="flex aspect-square size-16 items-center justify-center rounded-lg bg-blue-600 text-white mx-auto mb-4">
          <span className="text-lg font-bold">MA</span>
        </div>
        <h1 className="text-xl font-bold text-blue-700 mb-2">Maquinarias Ayala</h1>
        <p className="text-slate-600">Cargando...</p>
      </div>
    </div>
  )
}