import { NextRequest, NextResponse } from "next/server";
import { runSeed } from "@/server/db/seed";
import { cache } from "@/server/cache";
import { checkRateLimit } from "@/server/ratelimit";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1", "cle1"];

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Control de Rate Limiting en endpoint de administración
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = await checkRateLimit(`reset-data:${ip}`, 10, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too Many Requests: Límite de reset de datos excedido" },
        { status: 429 }
      );
    }

    // 2. Validación de x-audit-token en tiempo constante
    const providedToken = req.headers.get("x-audit-token");
    const configuredToken = process.env.AUDIT_TOKEN;

    if (
      !providedToken ||
      !configuredToken ||
      !timingSafeCompare(providedToken, configuredToken)
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Token de auditoría inválido o ausente" },
        { status: 401 }
      );
    }

    // 3. Restaurar dataset determinista de demostración
    await runSeed();

    // 4. Invalidar toda la caché relacionada
    await cache.invalidateAnalytics();

    return NextResponse.json(
      {
        message: "Dataset de demostración restaurado e invalidación de caché exitosa",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/test/reset-data] Error durante reset:", err);
    return NextResponse.json(
      { error: "Error interno al restaurar dataset de demostración" },
      { status: 500 }
    );
  }
}
