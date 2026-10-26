"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Root application error:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground font-mono">
          {error.message || "Error inesperado en el sistema."}
        </p>
        <Button onClick={() => reset()} variant="default">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
