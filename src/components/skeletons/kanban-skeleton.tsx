import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="kanban-skeleton">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, card) => (
              <div key={card} className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
