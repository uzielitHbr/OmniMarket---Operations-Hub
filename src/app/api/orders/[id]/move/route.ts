import { NextRequest, NextResponse } from "next/server";
import { db, orders } from "@/server/db";
import { moveOrderSchema } from "@/schemas/order";
import { logAudit } from "@/server/services/audit";
import { cache } from "@/server/cache";
import { auth } from "@/server/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;
    const body = await req.json();

    const parsed = moveOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de movimiento inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { status, position } = parsed.data;

    // Verificar existencia del pedido
    const existing = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const previousStatus = existing[0].status;
    const now = new Date();

    // Actualizar estado y posición en la base de datos
    await db
      .update(orders)
      .set({
        status,
        position,
        updatedAt: now,
      })
      .where(eq(orders.id, id));

    // Registrar en audit_log para trazabilidad estricta
    await logAudit({
      userId: session?.user?.id ?? null,
      action: `MOVE_ORDER_${previousStatus.toUpperCase()}_TO_${status.toUpperCase()}`,
      entity: "order",
      entityId: id,
    });

    // Invalidar caché analítica y de estados
    await cache.invalidateAnalytics();

    return NextResponse.json(
      {
        success: true,
        orderId: id,
        status,
        position,
        updatedAt: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PATCH /api/orders/:id/move] Error:", err);
    return NextResponse.json(
      { error: "Error al mover el pedido en el tablero Kanban" },
      { status: 500 }
    );
  }
}
