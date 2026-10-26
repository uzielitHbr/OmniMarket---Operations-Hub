import { NextRequest, NextResponse } from "next/server";
import { kanbanStatusQuerySchema } from "@/schemas/order";
import { db, orders } from "@/server/db";
import { checkRateLimit } from "@/server/ratelimit";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1", "cle1"];

export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(`kanban-status:${ip}`, 120, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too Many Requests: Límite de peticiones excedido" },
        { status: 429 }
      );
    }

    // 2. Validación Zod de orderId en searchParams
    const { searchParams } = new URL(req.url);
    const parsed = kanbanStatusQuerySchema.safeParse({
      orderId: searchParams.get("orderId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Parámetros de consulta inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { orderId } = parsed.data;

    // 3. Consulta en base de datos
    const foundOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        position: orders.position,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = foundOrders[0];

    // 4. Si no existe, responder 404 Not Found
    if (!order) {
      return NextResponse.json(
        { error: `Pedido con id '${orderId}' no encontrado` },
        { status: 404 }
      );
    }

    // 5. Contrato de respuesta exacto: { orderId, status, position, updatedAt }
    return NextResponse.json(
      {
        orderId: order.id,
        status: order.status,
        position: order.position,
        updatedAt: order.updatedAt,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/test/kanban-status] Error interno:", err);
    return NextResponse.json(
      { error: "Error interno del servidor procesando estado de kanban" },
      { status: 500 }
    );
  }
}
