import { NextRequest, NextResponse } from "next/server";
import { db, products } from "@/server/db";
import { createProductSchema } from "@/schemas/product";
import { logAudit } from "@/server/services/audit";
import { auth } from "@/server/auth";
import { desc, ilike } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const query = db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(200);

    const items = search
      ? await query.where(ilike(products.name, `%${search}%`))
      : await query;

    return NextResponse.json({ data: items }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/products] Error:", err);
    return NextResponse.json(
      { error: "Error al listar productos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de producto inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const newProduct = {
      id: `prod_${crypto.randomUUID().slice(0, 8)}`,
      ...parsed.data,
      createdAt: new Date(),
    };

    await db.insert(products).values(newProduct);

    await logAudit({
      userId: session?.user?.id ?? null,
      action: "CREATE_PRODUCT",
      entity: "product",
      entityId: newProduct.id,
    });

    return NextResponse.json({ data: newProduct }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/products] Error:", err);
    return NextResponse.json(
      { error: "Error al crear producto o SKU duplicado" },
      { status: 500 }
    );
  }
}
