import { test, expect } from "@playwright/test";
import path from "path";

const STORAGE_STATE = path.join(process.cwd(), "e2e/.auth/user.json");
const AUDIT_TOKEN = process.env.AUDIT_TOKEN || "audit_test_token_2026";

test.describe("Flujo de Creación (CRUD)", () => {
  test.beforeEach(async ({ request }) => {
    // Invocación previa al endpoint de reset
    await request.post("/api/test/reset-data", {
      headers: { "x-audit-token": AUDIT_TOKEN },
    }).catch(() => null);
  });

  test("Crear un nuevo producto y verificar reflejo en la tabla", async ({ browser }) => {
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/products");
    await expect(page.locator('[data-testid="products-table-container"]')).toBeVisible();

    // Abrir modal de creación
    await page.locator('[data-testid="create-product-button"]').click();
    await expect(page.locator('[data-testid="product-name-input"]')).toBeVisible();

    // Rellenar formulario
    const uniqueSku = `SKU-E2E-${Date.now().toString().slice(-4)}`;
    await page.locator('[data-testid="product-name-input"]').fill("Producto Test E2E");
    await page.locator('[data-testid="product-sku-input"]').fill(uniqueSku);
    await page.locator('[data-testid="product-price-input"]').fill("8900");
    await page.locator('[data-testid="product-cost-input"]').fill("4500");
    await page.locator('[data-testid="product-stock-input"]').fill("30");

    // Guardar
    await page.locator('[data-testid="product-submit-button"]').click();

    // Verificar que aparece en la tabla
    await expect(page.getByText(uniqueSku)).toBeVisible({ timeout: 10000 });

    expect(consoleErrors).toHaveLength(0);
    await context.close();
  });
});
