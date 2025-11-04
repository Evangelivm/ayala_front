import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Maquinarias Ayala - Sistema de Reportes",
  description: "Sistema de gestión de reportes diarios de trabajo",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <main>{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
