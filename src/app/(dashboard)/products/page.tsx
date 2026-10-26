import { ProductsTable } from "@/components/tables/products-table";

export default function ProductsPage() {
  return (
    <div className="space-y-6" data-testid="products-page">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Catálogo de Productos</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de inventario, márgenes financieros, creación y edición de SKUs.
        </p>
      </div>

      <ProductsTable />
    </div>
  );
}
