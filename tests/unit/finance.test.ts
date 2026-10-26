import { describe, it, expect } from "vitest";
import {
  averageTicket,
  grossMargin,
  marginPercent,
  totalRevenue,
  formatCurrency,
} from "@/lib/finance";

describe("lib/finance.ts — Pure financial functions", () => {
  describe("totalRevenue", () => {
    it("debe sumar correctamente los montos en centavos de una lista de órdenes", () => {
      const orders = [
        { totalCents: 1500 },
        { totalCents: 3500 },
        { totalCents: 5000 },
      ];
      expect(totalRevenue(orders)).toBe(10000);
    });

    it("debe retornar 0 si la lista de órdenes está vacía o es nula", () => {
      expect(totalRevenue([])).toBe(0);
      // @ts-expect-error test edge case
      expect(totalRevenue(null)).toBe(0);
    });

    it("debe sumar un arreglo de números directos en centavos", () => {
      expect(totalRevenue([1000, 2000, 3000])).toBe(6000);
    });
  });

  describe("averageTicket", () => {
    it("debe calcular el ticket promedio normal en centavos enteros", () => {
      // 10000 centavos entre 4 pedidos = 2500 centavos
      expect(averageTicket(10000, 4)).toBe(2500);
    });

    it("debe retornar 0 sin producir NaN ni Infinity cuando hay 0 pedidos", () => {
      expect(averageTicket(5000, 0)).toBe(0);
      expect(Number.isNaN(averageTicket(5000, 0))).toBe(false);
      expect(averageTicket([])).toBe(0);
    });

    it("debe redondear adecuadamente los centavos sin decimales flotantes", () => {
      // 1000 centavos entre 3 pedidos = 333.333 -> 333 centavos
      expect(averageTicket(1000, 3)).toBe(333);
      // 2000 centavos entre 3 pedidos = 666.666 -> 667 centavos
      expect(averageTicket(2000, 3)).toBe(667);
    });

    it("debe soportar llamada pasando arreglo de órdenes directamente", () => {
      const orders = [{ totalCents: 2000 }, { totalCents: 4000 }];
      expect(averageTicket(orders)).toBe(3000);
    });
  });

  describe("grossMargin & marginPercent", () => {
    it("debe calcular el margen bruto normal (ingresos - costos)", () => {
      // Ingresos: 10000 centavos ($100), Costos: 6000 centavos ($60) -> Margen: 4000 centavos ($40)
      expect(grossMargin(10000, 6000)).toBe(4000);
    });

    it("debe permitir margen negativo cuando el costo supera al precio de venta", () => {
      // Ingreso 5000 centavos, Costo 7000 centavos -> Margen: -2000 centavos
      expect(grossMargin(5000, 7000)).toBe(-2000);
    });

    it("debe calcular el porcentaje de margen con 2 decimales", () => {
      // Margen de 4000 sobre 10000 = 40%
      expect(marginPercent(10000, 6000)).toBe(40);
      // Margen de 3333 sobre 10000 = 33.33%
      expect(marginPercent(10000, 6667)).toBe(33.33);
    });

    it("debe retornar 0 en marginPercent si los ingresos son 0 para prevenir división por cero o NaN", () => {
      expect(marginPercent(0, 5000)).toBe(0);
      expect(Number.isNaN(marginPercent(0, 5000))).toBe(false);
      expect(marginPercent(-1000, 2000)).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("debe formatear centavos a formato de moneda MXN", () => {
      const formatted = formatCurrency(12550); // $125.50
      expect(formatted).toContain("125.50");
    });

    it("debe manejar cero centavos correctamente", () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain("0.00");
    });

    it("debe manejar montos negativos adecuadamente", () => {
      const formatted = formatCurrency(-5000);
      expect(formatted).toContain("50.00");
      expect(formatted).toContain("-");
    });

    it("debe manejar números grandes sin desbordamiento", () => {
      const formatted = formatCurrency(1000000000); // 10 millones de pesos
      expect(formatted).toContain("10,000,000.00");
    });
  });
});
