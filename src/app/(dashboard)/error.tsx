"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Registro de error para monitoreo (sin tokens ni datos personales)
    console.error("Dashboard error caught by boundary:", error.message);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] items-center justify-center p-4"
      data-testid="dashboard-error"
    >
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Error en el Dashboard</CardTitle>
          </div>
          <CardDescription>
            Ocurrió un problema inesperado al cargar la información.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground font-mono break-words">
            {error.message || "Error desconocido en la aplicación."}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="default"
            onClick={() => reset()}
            data-testid="retry-button"
          >
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
