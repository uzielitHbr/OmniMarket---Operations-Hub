"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/finance";
import { GripVertical, Clock, DollarSign } from "lucide-react";

export interface KanbanOrder {
  id: string;
  customerName: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  position: number;
  totalCents: number;
  createdAt: string;
}

interface KanbanCardProps {
  order: KanbanOrder;
}

export function KanbanCard({ order }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    data: { order },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`kanban-card-${order.id}`}
      className="touch-none select-none"
    >
      <Card className="hover:border-primary/50 transition-all shadow-sm cursor-grab active:cursor-grabbing bg-card">
        <CardContent className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {order.id}
            </span>
            <div
              {...attributes}
              {...listeners}
              className="text-muted-foreground hover:text-foreground cursor-grab"
              aria-label={`Mover pedido ${order.id}`}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </div>

          <div className="font-medium text-sm text-foreground line-clamp-1">
            {order.customerName}
          </div>

          <div className="flex items-center justify-between pt-1 border-t text-xs">
            <span className="font-mono font-semibold text-foreground flex items-center">
              {formatCurrency(order.totalCents)}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(order.createdAt).toLocaleDateString("es-MX", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
