import { NextRequest, NextResponse } from "next/server";
import { db, orders, orderItems } from "@/server/db";
import { createOrderSchema } from "@/schemas/order";
import { logAudit } from "@/server/services/audit";
import { cache } from "@/server/cache";
import { auth } from "@/server/auth";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const ordersList = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    return NextResponse.json({ data: ordersList }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/orders] Error:", err);
    return NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de pedido inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerName, status, items } = parsed.data;

    // Calcular totalCents a partir de la suma exacta de los ítems
    const totalCents = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0
    );

    const orderId = `ord_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date();

    const newOrder = {
      id: orderId,
      customerName,
      status,
      position: 0,
      totalCents,
      createdAt: now,
      updatedAt: now,
      createdBy: session?.user?.id ?? null,
    };

    await db.insert(orders).values(newOrder);

    // Insertar ítems asociados
    const itemsToInsert = items.map((item, idx) => ({
      id: `item_${orderId}_${idx + 1}`,
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      unitCostCents: item.unitCostCents,
    }));

    if (itemsToInsert.length > 0) {
      await db.insert(orderItems).values(itemsToInsert);
    }

    // Registrar en audit_log
    await logAudit({
      userId: session?.user?.id ?? null,
      action: "CREATE_ORDER",
      entity: "order",
      entityId: orderId,
    });

    // Invalidar caché de métricas
    await cache.invalidateAnalytics();

    return NextResponse.json(
      { data: newOrder, message: "Pedido creado con éxito" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/orders] Error:", err);
    return NextResponse.json(
      { error: "Error al crear pedido" },
      { status: 500 }
    );
  }
}
