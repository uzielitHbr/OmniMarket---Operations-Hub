import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProductsPage() {
  return (
    <div className="space-y-6" data-testid="products-page">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Catálogo de Productos</h2>
        <p className="text-sm text-muted-foreground">
          Control de inventario, SKUs, precios y costos unitarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardDescription>Gestión integral de productos disponibles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Módulo preparado para integración de catálogo en Fase 2 y Fase 4.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
