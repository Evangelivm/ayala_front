"use client"

import type * as React from "react"
import {
  FileText,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Truck,
  User,
  ChevronDown,
  LogOut,
  UserCircle,
  ClipboardList,
  Upload,
  ShoppingCart,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import Image from "next/image"

// Datos del menú principal
const menuItems = [
  {
    title: "Reportes",
    items: [
      {
        title: "Reporte Diario",
        url: "/",
        icon: FileText,
        isActive: false,
      },
      {
        title: "Reporte Operadores",
        url: "/reporte-operadores",
        icon: Users,
        isActive: false, // Set to false as we are adding a new active item
      },
      {
        title: "Reporte Plantilleros", // New menu item
        url: "/reporte-plantilleros",
        icon: ClipboardList,
        isActive: false,
      },
      {
        title: "Programación",
        url: "/programacion",
        icon: Upload,
        isActive: false,
      },
      {
        title: "Orden de Compra",
        url: "/orden-compra",
        icon: ShoppingCart,
        isActive: false,
      },
      {
        title: "Reportes Semanales",
        url: "/reportes/semanales",
        icon: Calendar,
      },
      {
        title: "Reportes Mensuales",
        url: "/reportes/mensuales",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        title: "Personal",
        url: "/personal",
        icon: Users,
      },
      {
        title: "Maquinaria",
        url: "/maquinaria",
        icon: Truck,
      },
      {
        title: "Proyectos",
        url: "/proyectos",
        icon: FileText,
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        title: "Configuración",
        url: "/configuracion",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <span className="text-sm font-bold">MA</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Maquinarias Ayala</span>
            <span className="truncate text-xs text-muted-foreground">Sistema de Reportes</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatars/user.png" alt="Usuario" />
                    <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                      <UserCircle className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Juan Pérez</span>
                    <span className="truncate text-xs text-muted-foreground">Supervisor</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
