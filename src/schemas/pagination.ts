import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("La página debe ser un número entero")
    .min(1, "La página debe ser mayor o igual a 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("El límite debe ser un número entero")
    .min(1, "El límite mínimo es 1")
    .max(100, "El límite máximo es 100")
    .default(50),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
