"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard, type KanbanOrder } from "./kanban-card";
import { KanbanSkeleton } from "@/components/skeletons/kanban-skeleton";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

const COLUMNS: Array<{
  id: string;
  title: string;
  status: OrderStatus;
}> = [
  { id: "col-pending", title: "Pendientes", status: "pending" },
  { id: "col-processing", title: "En Proceso", status: "processing" },
  { id: "col-shipped", title: "Enviados", status: "shipped" },
  { id: "col-delivered", title: "Entregados", status: "delivered" },
];

const EMPTY_ORDERS: KanbanOrder[] = [];

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const [activeOrder, setActiveOrder] = React.useState<KanbanOrder | null>(null);

  // 1. Sensores accesibles (puntero + teclado para accesibilidad)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 2. Carga de órdenes con TanStack Query
  const { data, isLoading, error } = useQuery<{ data: KanbanOrder[] }>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=300");
      if (!res.ok) throw new Error("Error al consultar pedidos");
      return res.json();
    },
  });

  const orders = data?.data ?? EMPTY_ORDERS;

  // 3. Mutación optimista con rollback automático
  const moveMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      position,
    }: {
      id: string;
      status: OrderStatus;
      position: number;
    }) => {
      const res = await fetch(`/api/orders/${id}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, position }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al actualizar estado");
      }

      return res.json();
    },
    // Snapshot del estado previo y actualización optimista inmediata en la UI
    onMutate: async ({ id, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      const previousOrders = queryClient.getQueryData<{ data: KanbanOrder[] }>([
        "orders",
      ]);

      if (previousOrders?.data) {
        const updated = previousOrders.data.map((item) =>
          item.id === id ? { ...item, status, position } : item
        );
        queryClient.setQueryData(["orders"], { data: updated });
      }

      return { previousOrders };
    },
    // Rollback automático en caso de fallo + Toast de error Sonner
    onError: (err: Error, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
      toast.error(`Error al mover pedido: ${err.message || "Fallo en el servidor"}`);
    },
    // Toast de éxito Sonner
    onSuccess: () => {
      toast.success("Pedido actualizado correctamente en el tablero");
    },
    // Sincronización final con el backend
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-status"] });
    },
  });

  // Mapear órdenes ordenadas por posición en cada columna
  const columnsData = React.useMemo(() => {
    const map: Record<OrderStatus, KanbanOrder[]> = {
      pending: [],
      processing: [],
      shipped: [],
      delivered: [],
    };

    orders.forEach((order) => {
      if (map[order.status]) {
        map[order.status].push(order);
      }
    });

    Object.keys(map).forEach((key) => {
      map[key as OrderStatus].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });

    return map;
  }, [orders]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const found = orders.find((o) => o.id === active.id);
    if (found) {
      setActiveOrder(found);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedOrder = orders.find((o) => o.id === activeId);
    if (!draggedOrder) return;

    // Detectar si se soltó sobre una columna directa o sobre otra tarjeta
    let targetStatus: OrderStatus | null = null;
    let targetPosition = 0;

    const columnMatch = COLUMNS.find((c) => c.id === overId);
    if (columnMatch) {
      targetStatus = columnMatch.status;
      targetPosition = columnsData[targetStatus].length;
    } else {
      const overOrder = orders.find((o) => o.id === overId);
      if (overOrder) {
        targetStatus = overOrder.status;
        targetPosition = overOrder.position ?? 0;
      }
    }

    if (
      targetStatus &&
      (draggedOrder.status !== targetStatus ||
        draggedOrder.position !== targetPosition)
    ) {
      moveMutation.mutate({
        id: activeId,
        status: targetStatus,
        position: targetPosition,
      });
    }
  }

  if (isLoading) {
    return <KanbanSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-sm text-destructive">
        Error al cargar los pedidos del tablero Kanban.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="kanban-board"
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            status={col.status}
            orders={columnsData[col.status] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOrder ? <KanbanCard order={activeOrder} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
