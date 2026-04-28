"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "@/lib/connections";

interface LoginConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  descripcion?: string;
  onSuccess: (usuario: { id: number; nombre: string; rol: string }) => void;
}

export function LoginConfirmDialog({
  open,
  onOpenChange,
  titulo = "Confirmar identidad",
  descripcion = "Ingrese sus credenciales para guardar la orden.",
  onSuccess,
}: LoginConfirmDialogProps) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setUsuario("");
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError("Ingrese usuario y contraseña");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const auth = await authApi.login({ usuario: usuario.trim(), password });
      setUsuario("");
      setPassword("");
      onSuccess(auth);
    } catch {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>{titulo}</DialogTitle>
              <DialogDescription className="text-sm">
                {descripcion}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="login-usuario">Usuario</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-usuario"
                type="text"
                placeholder="Nombre de usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="pl-9"
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Confirmar y guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
