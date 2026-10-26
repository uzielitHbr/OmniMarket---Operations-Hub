"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, type CreateProductInput } from "@/schemas/product";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface ProductFormDialogProps {
  onSuccess?: () => void;
  productToEdit?: {
    id: string;
    name: string;
    sku: string;
    priceCents: number;
    costCents: number;
    stock: number;
  };
  trigger?: React.ReactNode;
}

export function ProductFormDialog({
  onSuccess,
  productToEdit,
  trigger,
}: ProductFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditing = !!productToEdit;

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: productToEdit?.name ?? "",
      sku: productToEdit?.sku ?? "",
      priceCents: productToEdit?.priceCents ?? 0,
      costCents: productToEdit?.costCents ?? 0,
      stock: productToEdit?.stock ?? 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: productToEdit?.name ?? "",
        sku: productToEdit?.sku ?? "",
        priceCents: productToEdit?.priceCents ?? 0,
        costCents: productToEdit?.costCents ?? 0,
        stock: productToEdit?.stock ?? 0,
      });
    }
  }, [open, productToEdit, form]);

  async function onSubmit(values: CreateProductInput) {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/products/${productToEdit.id}`
        : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al procesar producto");
      }

      toast.success(
        isEditing
          ? "Producto actualizado exitosamente"
          : "Producto creado exitosamente"
      );
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al guardar";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="create-product-button">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Producto" : "Crear Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del producto en el catálogo."
              : "Ingresa la información requerida para dar de alta el producto."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Teclado Mecánico Pro"
                      data-testid="product-name-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. TEC-MEC-01"
                      disabled={isEditing}
                      data-testid="product-sku-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (Centavos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5990 = $59.90"
                        data-testid="product-price-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo (Centavos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2500 = $25.00"
                        data-testid="product-cost-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Inicial</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Cantidad disponible"
                      data-testid="product-stock-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="product-submit-button"
              >
                {isSubmitting
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar Cambios"
                    : "Crear Producto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
