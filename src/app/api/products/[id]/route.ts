import { NextRequest, NextResponse } from "next/server";
import { db, products } from "@/server/db";
import { updateProductSchema } from "@/schemas/product";
import { logAudit } from "@/server/services/audit";
import { auth } from "@/server/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;
    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await db
      .update(products)
      .set(parsed.data)
      .where(eq(products.id, id));

    await logAudit({
      userId: session?.user?.id ?? null,
      action: "UPDATE_PRODUCT",
      entity: "product",
      entityId: id,
    });

    return NextResponse.json({ message: "Producto actualizado" }, { status: 200 });
  } catch (err) {
    console.error("[PUT /api/products/:id] Error:", err);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

    await db.delete(products).where(eq(products.id, id));

    await logAudit({
      userId: session?.user?.id ?? null,
      action: "DELETE_PRODUCT",
      entity: "product",
      entityId: id,
    });

    return NextResponse.json({ message: "Producto eliminado" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/products/:id] Error:", err);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
