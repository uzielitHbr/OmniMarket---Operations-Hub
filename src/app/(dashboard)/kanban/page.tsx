import { KanbanBoard } from "@/components/kanban/kanban-board";
import { OrderFormDialog } from "@/components/forms/order-form-dialog";

export default function KanbanPage() {
  return (
    <div className="space-y-6" data-testid="kanban-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tablero Kanban</h2>
          <p className="text-sm text-muted-foreground">
            Arrastra pedidos entre columnas con persistencia y sincronización optimista inmediata.
          </p>
        </div>
        <OrderFormDialog />
      </div>

      <KanbanBoard />
    </div>
  );
}
