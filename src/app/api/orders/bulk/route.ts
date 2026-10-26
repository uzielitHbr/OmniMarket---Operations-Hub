import { NextRequest, NextResponse } from "next/server";
import { db, orders } from "@/server/db";
import { bulkUpdateOrdersSchema } from "@/schemas/bulk";
import { logAudit } from "@/server/services/audit";
import { cache } from "@/server/cache";
import { auth } from "@/server/auth";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const parsed = bulkUpdateOrdersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de actualización masiva inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { orderIds, status } = parsed.data;
    const now = new Date();

    // Actualización masiva transaccional en PostgreSQL
    await db
      .update(orders)
      .set({
        status,
        updatedAt: now,
      })
      .where(inArray(orders.id, orderIds));

    // Registrar en audit_log para cada pedido modificado
    for (const orderId of orderIds) {
      await logAudit({
        userId: session?.user?.id ?? null,
        action: `BULK_UPDATE_STATUS_${status.toUpperCase()}`,
        entity: "order",
        entityId: orderId,
      });
    }

    // Invalidar caché analítica
    await cache.invalidateAnalytics();

    return NextResponse.json(
      {
        success: true,
        updatedCount: orderIds.length,
        status,
        message: `${orderIds.length} pedidos actualizados correctamente al estado '${status}'`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/orders/bulk] Error:", err);
    return NextResponse.json(
      { error: "Error interno al ejecutar la actualización por lotes" },
      { status: 500 }
    );
  }
}
