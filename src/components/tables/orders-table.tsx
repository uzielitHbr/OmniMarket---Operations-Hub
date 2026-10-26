"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filterOrders } from "@/lib/filters";
import { formatCurrency } from "@/lib/finance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { OrderFormDialog } from "@/components/forms/order-form-dialog";
import { toast } from "sonner";
import { Search, Trash2, CheckSquare } from "lucide-react";

interface Order {
  id: string;
  customerName: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  position: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
}

const statusBadgeVariantMap: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  processing: "secondary",
  shipped: "default",
  delivered: "secondary",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  processing: "En Proceso",
  shipped: "Enviado",
  delivered: "Entregado",
};

const EMPTY_ORDERS_LIST: Order[] = [];

export function OrdersTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = React.useState<string>("processing");

  // 1. Fetching de órdenes
  const { data, isLoading, error } = useQuery<{ data: Order[] }>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=300");
      if (!res.ok) throw new Error("Error al consultar pedidos");
      return res.json();
    },
  });

  // 2. Mutación de Bulk Update
  const bulkMutation = useMutation({
    mutationFn: async ({
      orderIds,
      status,
    }: {
      orderIds: string[];
      status: string;
    }) => {
      const res = await fetch("/api/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds, status }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error en actualización masiva");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(
        data.message || `${selectedIds.length} pedidos actualizados correctamente`
      );
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al actualizar pedidos en lote");
    },
  });

  // 3. Mutación de eliminación
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar pedido");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Pedido eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo eliminar el pedido");
    },
  });

  const ordersList = data?.data ?? EMPTY_ORDERS_LIST;

  // 4. Filtrado con función pura de lib/filters.ts
  const filteredOrders = React.useMemo(() => {
    return filterOrders(ordersList, {
      search,
      status: statusFilter,
      startDate: startDate || null,
      endDate: endDate || null,
    });
  }, [ordersList, search, statusFilter, startDate, endDate]);

  // Selección en lote
  const allFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return <TableSkeleton rows={8} cols={7} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-sm text-destructive">
        Error al cargar pedidos del servidor.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="orders-table-container">
      {/* Barra de Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="order-search-input"
            />
          </div>

          <div className="w-40">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger data-testid="status-filter-select">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">En Proceso</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36 text-xs"
              data-testid="date-start-input"
              aria-label="Fecha inicio"
            />
            <span className="text-xs text-muted-foreground">a</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36 text-xs"
              data-testid="date-end-input"
              aria-label="Fecha fin"
            />
          </div>
        </div>

        <OrderFormDialog
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["orders"] })}
        />
      </div>

      {/* Barra de Acción Bulk Update (visible al seleccionar 1 o más pedidos) */}
      {selectedIds.length > 0 && (
        <div
          data-testid="bulk-action-bar"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in fade-in-50"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span>{selectedIds.length} pedidos seleccionados</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Cambiar a:</span>
            <div className="w-36">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger data-testid="bulk-status-select" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">En Proceso</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              disabled={bulkMutation.isPending}
              data-testid="bulk-apply-button"
              onClick={() =>
                bulkMutation.mutate({
                  orderIds: selectedIds,
                  status: bulkStatus,
                })
              }
            >
              {bulkMutation.isPending ? "Actualizando..." : "Aplicar cambio"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              disabled={bulkMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Tabla de Pedidos */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  data-testid="select-all-checkbox"
                  aria-label="Seleccionar todos los pedidos"
                />
              </TableHead>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No se encontraron pedidos coincidentes con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                const badgeVariant =
                  statusBadgeVariantMap[order.status] || "outline";
                const label = statusLabels[order.status] || order.status;

                return (
                  <TableRow
                    key={order.id}
                    data-testid={`order-row-${order.id}`}
                    data-state={isSelected ? "selected" : undefined}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                        data-testid={`order-checkbox-${order.id}`}
                        aria-label={`Seleccionar pedido ${order.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {order.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant} className="text-xs">
                        {label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(order.totalCents)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        data-testid={`order-delete-${order.id}`}
                        aria-label={`Eliminar pedido ${order.id}`}
                        onClick={() => {
                          if (
                            confirm(
                              `¿Estás seguro de eliminar el pedido ${order.id}?`
                            )
                          ) {
                            deleteMutation.mutate(order.id);
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

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {selectedIds.length > 0 && (
            <span>{selectedIds.length} seleccionados · </span>
          )}
          Mostrando {filteredOrders.length} de {ordersList.length} pedidos
        </div>
      </div>
    </div>
  );
}
