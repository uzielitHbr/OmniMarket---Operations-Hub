import { z } from "zod";
import { orderStatusSchema } from "./bulk";

export const kanbanStatusQuerySchema = z.object({
  orderId: z.string().min(1, "El orderId es obligatorio").trim(),
});

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, "El productId es obligatorio"),
  quantity: z.coerce.number().int().min(1, "La cantidad mínima es 1"),
  unitPriceCents: z.coerce.number().int().min(0, "El precio no puede ser negativo"),
  unitCostCents: z.coerce.number().int().min(0, "El costo no puede ser negativo"),
});

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .min(2, "El nombre del cliente debe tener al menos 2 caracteres")
    .max(100, "El nombre del cliente no puede exceder 100 caracteres")
    .trim(),
  status: orderStatusSchema.default("pending"),
  items: z
    .array(orderItemInputSchema)
    .min(1, "El pedido debe contener al menos un ítem"),
});

export const moveOrderSchema = z.object({
  status: orderStatusSchema,
  position: z.coerce.number().int().min(0, "La posición debe ser mayor o igual a 0"),
});

export const updateOrderSchema = z.object({
  customerName: z.string().min(2).max(100).trim().optional(),
  status: orderStatusSchema.optional(),
});

export type KanbanStatusQuery = z.infer<typeof kanbanStatusQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type MoveOrderInput = z.infer<typeof moveOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
