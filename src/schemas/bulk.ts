import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending",
  "processing",
  "shipped",
  "delivered",
]);

export const bulkUpdateOrdersSchema = z.object({
  orderIds: z
    .array(z.string().min(1, "El ID de orden no puede estar vacío"))
    .min(1, "Debe seleccionar al menos un pedido")
    .max(100, "No puede modificar más de 100 pedidos por petición"),
  status: orderStatusSchema,
});

export type BulkUpdateOrdersInput = z.infer<typeof bulkUpdateOrdersSchema>;
