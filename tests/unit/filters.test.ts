import { describe, it, expect } from "vitest";
import { filterOrders, filterProducts } from "@/lib/filters";

describe("lib/filters.ts — Pure filtering functions", () => {
  const sampleOrders = [
    {
      id: "ord_001",
      customerName: "Carlos Gómez",
      status: "pending",
      totalCents: 5000,
      createdAt: new Date("2026-10-01T10:00:00Z"),
    },
    {
      id: "ord_002",
      customerName: "Ana Martínez",
      status: "processing",
      totalCents: 12000,
      createdAt: new Date("2026-10-15T12:00:00Z"),
    },
    {
      id: "ord_003",
      customerName: "Luis Hernández",
      status: "shipped",
      totalCents: 8500,
      createdAt: new Date("2026-10-20T14:00:00Z"),
    },
    {
      id: "ord_004",
      customerName: "María López",
      status: "delivered",
      totalCents: 22000,
      createdAt: new Date("2026-10-25T16:00:00Z"),
    },
  ];

  describe("filterOrders", () => {
    it("debe retornar todas las órdenes si no se proporcionan filtros o status='all'", () => {
      expect(filterOrders(sampleOrders, {})).toHaveLength(4);
      expect(filterOrders(sampleOrders, { status: "all" })).toHaveLength(4);
    });

    it("debe filtrar órdenes por estado específico", () => {
      const pending = filterOrders(sampleOrders, { status: "pending" });
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe("ord_001");

      const shipped = filterOrders(sampleOrders, { status: "shipped" });
      expect(shipped).toHaveLength(1);
      expect(shipped[0].id).toBe("ord_003");
    });

    it("debe filtrar por búsqueda de nombre de cliente o ID", () => {
      const byCustomer = filterOrders(sampleOrders, { search: "Ana" });
      expect(byCustomer).toHaveLength(1);
      expect(byCustomer[0].customerName).toBe("Ana Martínez");

      const byId = filterOrders(sampleOrders, { search: "ord_004" });
      expect(byId).toHaveLength(1);
      expect(byId[0].customerName).toBe("María López");
    });

    it("debe filtrar por rango de fechas (startDate y endDate)", () => {
      const inRange = filterOrders(sampleOrders, {
        startDate: "2026-10-10",
        endDate: "2026-10-22",
      });
      // ord_002 (Oct 15) y ord_003 (Oct 20)
      expect(inRange).toHaveLength(2);
      expect(inRange.map((o) => o.id)).toEqual(["ord_002", "ord_003"]);
    });

    it("debe combinar filtros de estado, búsqueda y fecha adecuadamente", () => {
      const combined = filterOrders(sampleOrders, {
        status: "processing",
        search: "Martínez",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });
      expect(combined).toHaveLength(1);
      expect(combined[0].id).toBe("ord_002");
    });

    it("debe retornar arreglo vacío cuando ningún pedido coincide con el filtro", () => {
      const noMatch = filterOrders(sampleOrders, { search: "Inexistente" });
      expect(noMatch).toEqual([]);
    });

    it("debe manejar arreglo de entrada vacío sin arrojar error", () => {
      expect(filterOrders([], { status: "pending" })).toEqual([]);
    });
  });

  describe("filterProducts", () => {
    const sampleProducts = [
      {
        id: "p1",
        name: "Teclado Mecánico Pro",
        sku: "TEC-MEC-01",
        priceCents: 15000,
        costCents: 8000,
        stock: 25,
      },
      {
        id: "p2",
        name: "Mouse Ergonómico",
        sku: "MOU-ERG-02",
        priceCents: 8500,
        costCents: 4000,
        stock: 0,
      },
      {
        id: "p3",
        name: "Monitor Gamer 27",
        sku: "MON-GAM-03",
        priceCents: 45000,
        costCents: 28000,
        stock: 5,
      },
    ];

    it("debe filtrar productos por nombre o SKU", () => {
      const byName = filterProducts(sampleProducts, { search: "Teclado" });
      expect(byName).toHaveLength(1);
      expect(byName[0].sku).toBe("TEC-MEC-01");

      const bySku = filterProducts(sampleProducts, { search: "MOU" });
      expect(bySku).toHaveLength(1);
      expect(bySku[0].name).toBe("Mouse Ergonómico");
    });

    it("debe filtrar exclusivamente productos con stock disponible cuando inStockOnly=true", () => {
      const inStock = filterProducts(sampleProducts, { inStockOnly: true });
      expect(inStock).toHaveLength(2);
      expect(inStock.some((p) => p.stock === 0)).toBe(false);
    });

    it("debe retornar vacío si la búsqueda no encuentra coincidencias", () => {
      const empty = filterProducts(sampleProducts, { search: "Impresora" });
      expect(empty).toEqual([]);
    });
  });
});
