"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filterProducts } from "@/lib/filters";
import { formatCurrency, grossMargin, marginPercent } from "@/lib/finance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { ProductFormDialog } from "@/components/forms/product-form-dialog";
import { toast } from "sonner";
import { Search, Trash2, Edit2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  costCents: number;
  stock: number;
  createdAt: string;
}

const EMPTY_PRODUCTS_LIST: Product[] = [];

export function ProductsTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [inStockOnly, setInStockOnly] = React.useState(false);

  // 1. TanStack Query para fetching de productos
  const { data, isLoading, error } = useQuery<{ data: Product[] }>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Error al cargar productos");
      return res.json();
    },
  });

  // 2. Mutación de eliminación
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar producto");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Producto eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo eliminar el producto");
    },
  });

  const productsList = data?.data ?? EMPTY_PRODUCTS_LIST;

  // 3. Filtrado con función pura de lib/filters.ts
  const filteredProducts = React.useMemo(() => {
    return filterProducts(productsList, {
      search,
      inStockOnly,
    });
  }, [productsList, search, inStockOnly]);

  if (isLoading) {
    return <TableSkeleton rows={8} cols={6} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-sm text-destructive">
        Error al cargar el catálogo de productos.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="products-table-container">
      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="product-search-input"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={inStockOnly}
              onCheckedChange={(checked) => setInStockOnly(!!checked)}
              data-testid="instock-checkbox"
            />
            <label
              htmlFor="inStock"
              className="text-xs font-medium cursor-pointer text-muted-foreground"
            >
              Solo en existencia
            </label>
          </div>
        </div>

        <ProductFormDialog
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["products"] })
          }
        />
      </div>

      {/* Tabla de Productos */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Margen %</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No se encontraron productos coincidentes.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => {
                const marginPct = marginPercent(p.priceCents, p.costCents);
                return (
                  <TableRow
                    key={p.id}
                    data-testid={`product-row-${p.id}`}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold">
                      {p.sku}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(p.priceCents)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(p.costCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={marginPct >= 30 ? "secondary" : "outline"}
                        className="font-mono text-xs"
                      >
                        {marginPct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={p.stock > 0 ? "secondary" : "destructive"}
                      >
                        {p.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <ProductFormDialog
                        productToEdit={p}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`product-edit-${p.id}`}
                            aria-label={`Editar ${p.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        }
                        onSuccess={() =>
                          queryClient.invalidateQueries({
                            queryKey: ["products"],
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        data-testid={`product-delete-${p.id}`}
                        aria-label={`Eliminar ${p.name}`}
                        onClick={() => {
                          if (
                            confirm(
                              `¿Estás seguro de eliminar el producto ${p.name}?`
                            )
                          ) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground text-right">
        Mostrando {filteredProducts.length} de {productsList.length} productos
      </div>
    </div>
  );
}
