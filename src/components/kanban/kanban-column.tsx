"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard, type KanbanOrder } from "./kanban-card";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
  id: string;
  title: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  orders: KanbanOrder[];
}

export function KanbanColumn({ id, title, status, orders }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-column-${status}`}
      className={`flex flex-col rounded-xl border bg-muted/30 p-3 min-h-[500px] transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      {/* Header de Columna */}
      <div className="flex items-center justify-between pb-3 px-1 border-b">
        <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
        <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
          {orders.length}
        </Badge>
      </div>

      {/* Lista Ordenable */}
      <div className="flex-1 space-y-2.5 pt-3">
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
              Sin pedidos
            </div>
          ) : (
            orders.map((order) => <KanbanCard key={order.id} order={order} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}
