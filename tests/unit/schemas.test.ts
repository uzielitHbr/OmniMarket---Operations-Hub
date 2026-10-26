import { describe, it, expect } from "vitest";
import { paginationQuerySchema } from "@/schemas/pagination";
import { createOrderSchema, moveOrderSchema } from "@/schemas/order";
import { bulkUpdateOrdersSchema } from "@/schemas/bulk";
import { createProductSchema } from "@/schemas/product";

describe("schemas — Zod Validation Schemas", () => {
  describe("paginationQuerySchema", () => {
    it("debe validar y usar valores por defecto para paginación vacía", () => {
      const parsed = paginationQuerySchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.limit).toBe(50);
      }
    });

    it("debe aceptar parámetros válidos y coercionarlos a números enteros", () => {
      const parsed = paginationQuerySchema.safeParse({ page: "3", limit: "25" });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(3);
        expect(parsed.data.limit).toBe(25);
      }
    });

    it("debe fallar si page es menor a 1 (ej. page=0)", () => {
      const parsed = paginationQuerySchema.safeParse({ page: 0 });
      expect(parsed.success).toBe(false);
    });

    it("debe fallar si limit supera 100 (ej. limit=101) o es menor a 1", () => {
      const overLimit = paginationQuerySchema.safeParse({ limit: 101 });
      expect(overLimit.success).toBe(false);

      const underLimit = paginationQuerySchema.safeParse({ limit: 0 });
      expect(underLimit.success).toBe(false);
    });

    it("debe fallar ante tipos no numéricos", () => {
      const invalid = paginationQuerySchema.safeParse({ page: "abc" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("createOrderSchema", () => {
    it("debe validar un pedido correctamente formado con sus ítems", () => {
      const valid = createOrderSchema.safeParse({
        customerName: "Juan Pérez",
        status: "pending",
        items: [
          {
            productId: "prod_001",
            quantity: 2,
            unitPriceCents: 1500,
            unitCostCents: 800,
          },
        ],
      });
      expect(valid.success).toBe(true);
    });

    it("debe rechazar pedidos sin cliente o con nombre demasiado corto", () => {
      const invalid = createOrderSchema.safeParse({
        customerName: "",
        items: [{ productId: "p1", quantity: 1, unitPriceCents: 100, unitCostCents: 50 }],
      });
      expect(invalid.success).toBe(false);
    });

    it("debe rechazar pedidos sin ningún ítem en el arreglo", () => {
      const emptyItems = createOrderSchema.safeParse({
        customerName: "Pedro Pascal",
        status: "pending",
        items: [],
      });
      expect(emptyItems.success).toBe(false);
    });
  });

  describe("moveOrderSchema", () => {
    it("debe validar un movimiento de Kanban con status válido y posición >= 0", () => {
      const valid = moveOrderSchema.safeParse({
        status: "processing",
        position: 0,
      });
      expect(valid.success).toBe(true);
    });

    it("debe rechazar posiciones negativas o status no definidos en el enum", () => {
      const invalidPos = moveOrderSchema.safeParse({
        status: "shipped",
        position: -1,
      });
      expect(invalidPos.success).toBe(false);

      const invalidStatus = moveOrderSchema.safeParse({
        status: "cancelled", // status no soportado en Kanban
        position: 0,
      });
      expect(invalidStatus.success).toBe(false);
    });
  });

  describe("bulkUpdateOrdersSchema", () => {
    it("debe validar un lote de actualización con IDs y estado permitido", () => {
      const valid = bulkUpdateOrdersSchema.safeParse({
        orderIds: ["ord_1", "ord_2", "ord_3"],
        status: "delivered",
      });
      expect(valid.success).toBe(true);
    });

    it("debe rechazar si orderIds está vacío", () => {
      const empty = bulkUpdateOrdersSchema.safeParse({
        orderIds: [],
        status: "delivered",
      });
      expect(empty.success).toBe(false);
    });

    it("debe rechazar si orderIds excede el límite máximo de 100 pedidos por petición", () => {
      const excess = bulkUpdateOrdersSchema.safeParse({
        orderIds: Array.from({ length: 101 }, (_, i) => `ord_${i}`),
        status: "shipped",
      });
      expect(excess.success).toBe(false);
    });
  });

  describe("createProductSchema", () => {
    it("debe validar un producto correcto con montos enteros en centavos", () => {
      const valid = createProductSchema.safeParse({
        name: "Auriculares Bluetooth",
        sku: "AUR-BT-001",
        priceCents: 8990,
        costCents: 4500,
        stock: 50,
      });
      expect(valid.success).toBe(true);
    });

    it("debe rechazar precios o costos negativos", () => {
      const negativePrice = createProductSchema.safeParse({
        name: "Producto Test",
        sku: "TEST-01",
        priceCents: -500,
        costCents: 100,
        stock: 10,
      });
      expect(negativePrice.success).toBe(false);
    });

    it("debe rechazar SKUs con caracteres no permitidos", () => {
      const invalidSku = createProductSchema.safeParse({
        name: "Producto Test",
        sku: "SKU CON ESPACIOS!",
        priceCents: 1000,
        costCents: 500,
        stock: 5,
      });
      expect(invalidSku.success).toBe(false);
    });
  });
});
