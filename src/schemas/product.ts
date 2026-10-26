import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  sku: z
    .string()
    .min(3, "El SKU debe tener al menos 3 caracteres")
    .max(50, "El SKU no puede exceder 50 caracteres")
    .regex(/^[A-Za-z0-9-_]+$/, "El SKU solo puede contener letras, números, guiones y guiones bajos")
    .trim(),
  priceCents: z.coerce
    .number()
    .int("El precio debe ser un número entero en centavos")
    .min(0, "El precio no puede ser negativo"),
  costCents: z.coerce
    .number()
    .int("El costo debe ser un número entero en centavos")
    .min(0, "El costo no puede ser negativo"),
  stock: z.coerce
    .number()
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo")
    .default(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
