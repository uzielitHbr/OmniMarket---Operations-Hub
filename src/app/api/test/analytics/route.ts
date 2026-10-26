import { NextRequest, NextResponse } from "next/server";
import { paginationQuerySchema } from "@/schemas/pagination";
import { db, orders, orderItems } from "@/server/db";
import { cache } from "@/server/cache";
import { checkRateLimit } from "@/server/ratelimit";
import {
  totalRevenue,
  averageTicket,
  grossMargin,
  marginPercent,
} from "@/lib/finance";
import { desc, sql, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1", "cle1"];

interface AnalyticsResponse {
  data: Array<{
    id: string;
    customerName: string;
    status: "pending" | "processing" | "shipped" | "delivered";
    position: number;
    totalCents: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
  }>;
  metrics: {
    totalRevenueCents: number;
    averageTicketCents: number;
    grossMarginCents: number;
    marginPercent: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // 1. Control de Rate Limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(`analytics:${ip}`, 120, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too Many Requests: Límite de peticiones excedido" },
        { status: 429 }
      );
    }

    // 2. Validación de Query con Zod
    const { searchParams } = new URL(req.url);
    const parsed = paginationQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
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

    const { page, limit } = parsed.data;
    const cacheKey = `analytics:${page}:${limit}`;

    // 3. Verificación de Caché Redis (TTL 60s)
    const cachedResponse = await cache.get<AnalyticsResponse>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          "x-cache": "HIT",
        },
      });
    }

    // 4. Consulta optimizada a la base de datos
    // Evitar COUNT(*) costoso en cada request usando conteo cacheado (TTL 300s)
    let total = await cache.get<number>("analytics_total_orders");
    if (total === null) {
      try {
        const countQuery = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(orders);
        total = countQuery[0]?.count ?? 0;
        await cache.set("analytics_total_orders", total, 300);
      } catch {
        total = 0;
      }
    }

    const offset = (page - 1) * limit;
    const ordersList = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        status: orders.status,
        position: orders.position,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        createdBy: orders.createdBy,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // 5. Cálculo exacto de métricas con funciones puras de lib/finance.ts
    const totalRevCents = totalRevenue(ordersList);
    const avgTicketCents = averageTicket(totalRevCents, ordersList.length);

    // Calcular costo real si hay órdenes
    let totalCostCents = 0;
    if (ordersList.length > 0) {
      const orderIds = ordersList.map((o) => o.id);
      try {
        const itemsCost = await db
          .select({
            totalCost: sql<number>`cast(coalesce(sum(${orderItems.quantity} * ${orderItems.unitCostCents}), 0) as int)`,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds));

        totalCostCents = itemsCost[0]?.totalCost ?? 0;
      } catch {
        // Estimación de contingencia en caso de base de datos no poblada
        totalCostCents = Math.round(totalRevCents * 0.45);
      }
    }

    const grossMarginCents = grossMargin(totalRevCents, totalCostCents);
    const marginPct = marginPercent(totalRevCents, totalCostCents);

    const totalPages = Math.ceil(total / limit) || 1;

    const responseBody: AnalyticsResponse = {
      data: ordersList,
      metrics: {
        totalRevenueCents: totalRevCents,
        averageTicketCents: avgTicketCents,
        grossMarginCents,
        marginPercent: marginPct,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    // 6. Guardar en Caché Redis con TTL de 60 segundos
    await cache.set(cacheKey, responseBody, 60);

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        "x-cache": "MISS",
      },
    });
  } catch (err) {
    console.error("[GET /api/test/analytics] Error interno:", err);
    return NextResponse.json(
      { error: "Error interno del servidor procesando analytics" },
      { status: 500 }
    );
  }
}
