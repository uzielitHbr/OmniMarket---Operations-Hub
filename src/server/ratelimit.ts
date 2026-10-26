import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./cache";

// Ratelimiter de Upstash si Redis está configurado
const upstashRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: false,
      prefix: "ratelimit:audit",
    })
  : null;

// Fallback en memoria si Upstash no está configurado (ej. desarrollo local o pruebas)
const localWindow = new Map<string, { count: number; expiresAt: number }>();

export async function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowSeconds = 60
): Promise<{ success: boolean; limit: number; remaining: number }> {
  if (upstashRatelimit) {
    try {
      const res = await upstashRatelimit.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
      };
    } catch (err) {
      console.warn("[ratelimit] Error consultando Upstash, permitiendo request:", err);
      return { success: true, limit: maxRequests, remaining: maxRequests - 1 };
    }
  }

  // Fallback local
  const now = Date.now();
  const record = localWindow.get(identifier);

  if (!record || now > record.expiresAt) {
    localWindow.set(identifier, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return { success: true, limit: maxRequests, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { success: false, limit: maxRequests, remaining: 0 };
  }

  record.count += 1;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
  };
}
