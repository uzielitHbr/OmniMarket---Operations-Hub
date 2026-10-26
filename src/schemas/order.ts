import { z } from "zod";

export const kanbanStatusQuerySchema = z.object({
  orderId: z
    .string()
    .min(1, "El orderId es obligatorio")
    .trim(),
});

export type KanbanStatusQuery = z.infer<typeof kanbanStatusQuerySchema>;
