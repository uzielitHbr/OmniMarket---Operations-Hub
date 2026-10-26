import { OrdersTable } from "@/components/tables/orders-table";

export default function OrdersPage() {
  return (
    <div className="space-y-6" data-testid="orders-page">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Pedidos</h2>
        <p className="text-sm text-muted-foreground">
          Control integral de órdenes, filtros avanzados y actualización por lotes (Bulk Update).
        </p>
      </div>

      <OrdersTable />
    </div>
  );
}
