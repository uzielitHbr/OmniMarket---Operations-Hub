/**
 * Funciones puras de filtrado para OmniMarket Operations Hub.
 * Sin dependencias de React ni de base de datos.
 */

export interface FilterOrdersOptions {
  status?: string;
  search?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

export interface OrderLike {
  id: string;
  customerName: string;
  status: string;
  totalCents: number;
  createdAt: Date | string;
  position?: number;
}

/**
 * Filtra pedidos según estado, término de búsqueda (nombre de cliente o ID)
 * y rango de fechas (startDate y endDate).
 */
export function filterOrders<T extends OrderLike>(
  orders: T[],
  filters: FilterOrdersOptions = {}
): T[] {
  if (!orders || !Array.isArray(orders)) return [];

  const { status, search, startDate, endDate } = filters;

  const normalizedStatus = status && status !== "all" ? status.toLowerCase() : null;
  const normalizedSearch = search ? search.trim().toLowerCase() : null;

  const startTimestamp = startDate
    ? new Date(startDate).setHours(0, 0, 0, 0)
    : null;
  const endTimestamp = endDate
    ? new Date(endDate).setHours(23, 59, 59, 999)
    : null;

  return orders.filter((order) => {
    // 1. Filtro por estado
    if (normalizedStatus && order.status.toLowerCase() !== normalizedStatus) {
      return false;
    }

    // 2. Filtro por búsqueda (id o customerName)
    if (normalizedSearch) {
      const matchId = order.id.toLowerCase().includes(normalizedSearch);
      const matchCustomer = order.customerName
        .toLowerCase()
        .includes(normalizedSearch);
      if (!matchId && !matchCustomer) {
        return false;
      }
    }

    // 3. Filtro por fecha
    if (startTimestamp !== null || endTimestamp !== null) {
      const orderDate = new Date(order.createdAt).getTime();
      if (startTimestamp !== null && orderDate < startTimestamp) {
        return false;
      }
      if (endTimestamp !== null && orderDate > endTimestamp) {
        return false;
      }
    }

    return true;
  });
}

export interface FilterProductsOptions {
  search?: string;
  inStockOnly?: boolean;
}

export interface ProductLike {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  costCents: number;
  stock: number;
}

/**
 * Filtra productos por término de búsqueda (nombre o SKU) y stock disponible.
 */
export function filterProducts<T extends ProductLike>(
  products: T[],
  filters: FilterProductsOptions = {}
): T[] {
  if (!products || !Array.isArray(products)) return [];

  const { search, inStockOnly } = filters;
  const normalizedSearch = search ? search.trim().toLowerCase() : null;

  return products.filter((product) => {
    // 1. Filtro por búsqueda (nombre o sku)
    if (normalizedSearch) {
      const matchName = product.name.toLowerCase().includes(normalizedSearch);
      const matchSku = product.sku.toLowerCase().includes(normalizedSearch);
      if (!matchName && !matchSku) {
        return false;
      }
    }

    // 2. Filtro por stock
    if (inStockOnly && product.stock <= 0) {
      return false;
    }

    return true;
  });
}
