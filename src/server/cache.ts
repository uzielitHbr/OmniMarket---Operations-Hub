import { Redis } from "@upstash/redis";

// In-memory fallback para desarrollo local o entornos sin Upstash configurado
const inMemoryStore = new Map<string, { value: string; expiresAt: number }>();

const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes("example.upstash.io") &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redis) {
        const data = await redis.get<T>(key);
        return data ?? null;
      }

      // Fallback en memoria
      const cached = inMemoryStore.get(key);
      if (!cached) return null;
      if (Date.now() > cached.expiresAt) {
        inMemoryStore.delete(key);
        return null;
      }
      return JSON.parse(cached.value) as T;
    } catch (err) {
      console.warn(`[cache:get] Error recuperando clave ${key}:`, err);
      return null;
    }
  },

  async set(key: string, value: unknown, exSeconds = 60): Promise<void> {
    try {
      if (redis) {
        await redis.set(key, value, { ex: exSeconds });
        return;
      }

      // Fallback en memoria
      inMemoryStore.set(key, {
        value: JSON.stringify(value),
        expiresAt: Date.now() + exSeconds * 1000,
      });
    } catch (err) {
      console.warn(`[cache:set] Error guardando clave ${key}:`, err);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
        return;
      }
      inMemoryStore.delete(key);
    } catch (err) {
      console.warn(`[cache:del] Error eliminando clave ${key}:`, err);
    }
  },

  async invalidateAnalytics(): Promise<void> {
    try {
      if (redis) {
        // En Redis buscar claves que coincidan con analytics:*
        const keys = await redis.keys("analytics:*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        await redis.del("analytics_total_orders");
        return;
      }

      // En memoria
      for (const k of Array.from(inMemoryStore.keys())) {
        if (k.startsWith("analytics:") || k === "analytics_total_orders") {
          inMemoryStore.delete(k);
        }
      }
    } catch (err) {
      console.warn("[cache:invalidateAnalytics] Error invalidando analytics:", err);
    }
  },
};
