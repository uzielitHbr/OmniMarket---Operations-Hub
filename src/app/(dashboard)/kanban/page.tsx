import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function KanbanPage() {
  return (
    <div className="space-y-6" data-testid="kanban-page">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tablero Kanban</h2>
        <p className="text-sm text-muted-foreground">
          Flujo de pedidos drag & drop con persistencia optimista.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {["Pendientes", "En Proceso", "Enviados", "Entregados"].map((col) => (
          <Card key={col} className="bg-muted/30">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold">{col}</CardTitle>
              <CardDescription>0 pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                Columna lista para @dnd-kit en Fase 4
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
