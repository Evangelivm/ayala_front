import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full`}>
        <main className="min-h-screen h-full flex flex-col">{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
