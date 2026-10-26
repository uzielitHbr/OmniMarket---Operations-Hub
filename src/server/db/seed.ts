import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, products, orders, orderItems, users } from "./index";
import { sql } from "drizzle-orm";

// ==========================================
// DETERMINISTIC PRNG (Mulberry32)
// ==========================================
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_VALUE = 20261026;
const rand = createPRNG(SEED_VALUE);

function randomInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randomChoice<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

const CATEGORIES = [
  "Electrónica",
  "Hogar",
  "Ropa",
  "Deportes",
  "Oficina",
  "Calzado",
  "Accesorios",
  "Libros",
  "Salud",
  "Tecnología",
];

const ADJECTIVES = [
  "Pro",
  "Ultra",
  "Smart",
  "Premium",
  "Eco",
  "Classic",
  "Max",
  "Slim",
  "Elite",
  "Plus",
];

const NOUNS = [
  "Auriculares",
  "Monitor",
  "Teclado",
  "Lámpara",
  "Mochila",
  "Reloj",
  "Cargador",
  "Silla",
  "Botella",
  "Cafetera",
];

const FIRST_NAMES = [
  "Carlos",
  "Ana",
  "Luis",
  "María",
  "Jorge",
  "Sofía",
  "Mateo",
  "Valentina",
  "Alejandro",
  "Camila",
  "Diego",
  "Lucía",
  "Gabriel",
  "Elena",
  "Fernando",
];

const LAST_NAMES = [
  "García",
  "Rodríguez",
  "Martínez",
  "Hernández",
  "López",
  "González",
  "Pérez",
  "Sánchez",
  "Ramírez",
  "Torres",
  "Flores",
  "Vargas",
];

type OrderStatus = "pending" | "processing" | "shipped" | "delivered";
const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

export async function runSeed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("mock_user")) {
    console.log(
      "[seed] DATABASE_URL no configurada o simulada. Seed no ejecutado en base de datos real."
    );
    return;
  }

  console.log("[seed] Iniciando seed determinista e idempotente...");

  // 1. Limpieza idempotente previa para garantizar estado idéntico
  console.log("[seed] Limpiando tablas de demostración...");
  await db.execute(sql`TRUNCATE TABLE order_items CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE orders CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE products CASCADE;`);

  // 2. Crear usuario administrador de prueba determinista
  const adminUser = {
    id: "usr_admin_demo_001",
    name: "Administrador OmniMarket",
    email: "admin@omnimarket.local",
    emailVerified: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  await db
    .insert(users)
    .values(adminUser)
    .onConflictDoUpdate({
      target: users.id,
      set: { name: adminUser.name, email: adminUser.email },
    });

  // 3. Generar ~100 Productos
  console.log("[seed] Creando 100 productos...");
  const TOTAL_PRODUCTS = 100;
  type ProductRecord = typeof products.$inferInsert & { id: string };
  const productData: ProductRecord[] = [];

  for (let i = 1; i <= TOTAL_PRODUCTS; i++) {
    const sku = `SKU-${String(i).padStart(4, "0")}`;
    const category = randomChoice(CATEGORIES);
    const adj = randomChoice(ADJECTIVES);
    const noun = randomChoice(NOUNS);
    const name = `${noun} ${adj} (${category})`;

    // Precios y costos en centavos enteros
    const priceCents = randomInt(1500, 150000); // $15.00 a $1,500.00 MXN
    const marginRatio = 0.4 + rand() * 0.4; // margen bruto entre 40% y 80%
    const costCents = Math.floor(priceCents * (1 - marginRatio));
    const stock = randomInt(10, 500);

    productData.push({
      id: `prod_${String(i).padStart(4, "0")}`,
      name,
      sku,
      priceCents,
      costCents,
      stock,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  }

  await db.insert(products).values(productData);

  // 4. Generar 6.000 Pedidos e Ítems con posiciones ordenadas para Kanban
  console.log("[seed] Creando 6.000 pedidos con sus respectivos ítems...");
  const TOTAL_ORDERS = 6000;
  const BATCH_SIZE = 500;

  const statusPositions: Record<OrderStatus, number> = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  };

  // Base de tiempo: últimos 90 días (en ms)
  const baseTimeMs = new Date("2026-10-25T00:00:00.000Z").getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (let batchStart = 0; batchStart < TOTAL_ORDERS; batchStart += BATCH_SIZE) {
    const ordersBatch: Array<typeof orders.$inferInsert> = [];
    const itemsBatch: Array<typeof orderItems.$inferInsert> = [];

    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_ORDERS);

    for (let i = batchStart + 1; i <= batchEnd; i++) {
      const orderId = `ord_${String(i).padStart(6, "0")}`;
      const customerName = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
      const status = randomChoice(ORDER_STATUSES);
      const position = statusPositions[status]++;

      // Fecha determinista en los últimos 90 días
      const orderTimeMs = baseTimeMs - Math.floor(rand() * ninetyDaysMs);
      const createdAt = new Date(orderTimeMs);
      const updatedAt = new Date(orderTimeMs + randomInt(60000, 3600000));

      // Seleccionar entre 1 y 3 ítems del catálogo existente
      const numItems = randomInt(1, 3);
      let totalOrderCents = 0;

      for (let j = 1; j <= numItems; j++) {
        const prod = randomChoice(productData);
        const quantity = randomInt(1, 4);
        const unitPriceCents = prod.priceCents;
        const unitCostCents = prod.costCents;

        totalOrderCents += quantity * unitPriceCents;

        itemsBatch.push({
          id: `item_${orderId}_${j}`,
          orderId,
          productId: prod.id,
          quantity,
          unitPriceCents,
          unitCostCents,
        });
      }

      ordersBatch.push({
        id: orderId,
        customerName,
        status,
        position,
        totalCents: totalOrderCents,
        createdAt,
        updatedAt,
        createdBy: adminUser.id,
      });
    }

    await db.insert(orders).values(ordersBatch);
    await db.insert(orderItems).values(itemsBatch);

    console.log(
      `[seed] Progreso: ${batchEnd} / ${TOTAL_ORDERS} pedidos insertados.`
    );
  }

  console.log(
    `[seed] ✅ Seed completado con éxito: 100 productos y 6.000 pedidos.`
  );
}

// Ejecución directa si se invoca con `pnpm db:seed`
if (require.main === module || process.argv[1]?.includes("seed.ts")) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] Error durante la ejecución del seed:", err);
      process.exit(1);
    });
}
