/**
 * Funciones puras de cálculo financiero para OmniMarket Operations Hub.
 * Todas las operaciones monetarias se realizan estrictamente en centavos enteros (integers).
 * Libre de dependencias externas, React o bases de datos.
 */

/**
 * Calcula el ingreso total acumulado en centavos enteros.
 * Admite un arreglo de objetos con `totalCents` o un arreglo directo de números en centavos.
 * Si el arreglo está vacío, devuelve 0 sin producir errores.
 */
export function totalRevenue(
  items: Array<{ totalCents: number } | number>
): number {
  if (!items || items.length === 0) return 0;
  return items.reduce<number>((acc, item) => {
    const val = typeof item === "number" ? item : item.totalCents;
    return acc + (Number.isFinite(val) ? Math.round(val) : 0);
  }, 0);
}

/**
 * Calcula el ticket promedio en centavos enteros redondeados.
 * Maneja divisiones por cero devolviendo 0 (sin producir NaN ni Infinity).
 */
export function averageTicket(
  totalRevenueCents: number,
  orderCount: number
): number;
export function averageTicket(
  orders: Array<{ totalCents: number } | number>
): number;
export function averageTicket(
  arg1: number | Array<{ totalCents: number } | number>,
  arg2?: number
): number {
  if (Array.isArray(arg1)) {
    if (arg1.length === 0) return 0;
    const total = totalRevenue(arg1);
    return Math.round(total / arg1.length);
  }

  const revenue = arg1;
  const count = arg2 ?? 0;
  if (!count || count <= 0) return 0;
  return Math.round(revenue / count);
}

/**
 * Calcula el margen bruto en centavos enteros (ingresos - costos).
 * Puede retornar valores negativos si los costos superan a los ingresos.
 */
export function grossMargin(revenueCents: number, costCents: number): number {
  const rev = Number.isFinite(revenueCents) ? Math.round(revenueCents) : 0;
  const cost = Number.isFinite(costCents) ? Math.round(costCents) : 0;
  return rev - cost;
}

/**
 * Calcula el porcentaje de margen bruto: (grossMargin / totalRevenue) * 100.
 * Si los ingresos totales son 0 o negativos, devuelve 0 para evitar divisiones por cero o NaN.
 * Retorna el resultado redondeado a dos cifras decimales.
 */
export function marginPercent(revenueCents: number, costCents: number): number {
  if (!revenueCents || revenueCents <= 0) return 0;
  const margin = grossMargin(revenueCents, costCents);
  const percent = (margin / revenueCents) * 100;
  return Math.round(percent * 100) / 100;
}

/**
 * Da formato estándar a montos en centavos como moneda localizada (por defecto MXN).
 * Maneja centavos enteros, negativos, cero y grandes magnitudes.
 */
export function formatCurrency(
  cents: number,
  locale = "es-MX",
  currency = "MXN"
): string {
  const amount = (Number.isFinite(cents) ? Math.round(cents) : 0) / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
