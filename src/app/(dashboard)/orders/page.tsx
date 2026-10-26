import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OrdersPage() {
  return (
    <div className="space-y-6" data-testid="orders-page">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Pedidos</h2>
        <p className="text-sm text-muted-foreground">
          Listado, filtros y operaciones por lote sobre pedidos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pedidos</CardTitle>
          <CardDescription>Visualización y estado del ciclo de vida de compras.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Módulo preparado para integración de datos en Fase 2 y Fase 4.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
