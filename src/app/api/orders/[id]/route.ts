import { NextRequest, NextResponse } from "next/server";
import { db, orders, orderItems } from "@/server/db";
import { logAudit } from "@/server/services/audit";
import { cache } from "@/server/cache";
import { auth } from "@/server/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const found = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

    if (!found[0]) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    return NextResponse.json({ data: { ...found[0], items } }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/orders/:id] Error:", err);
    return NextResponse.json(
      { error: "Error al consultar pedido" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

    await db.delete(orders).where(eq(orders.id, id));

    await logAudit({
      userId: session?.user?.id ?? null,
      action: "DELETE_ORDER",
      entity: "order",
      entityId: id,
    });

    await cache.invalidateAnalytics();

    return NextResponse.json({ message: "Pedido eliminado" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/orders/:id] Error:", err);
    return NextResponse.json(
      { error: "Error al eliminar pedido" },
      { status: 500 }
    );
  }
}
