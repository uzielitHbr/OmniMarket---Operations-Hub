import { test, expect } from "@playwright/test";
import path from "path";

const STORAGE_STATE = path.join(process.cwd(), "e2e/.auth/user.json");
const AUDIT_TOKEN = process.env.AUDIT_TOKEN || "audit_test_token_2026";

test.describe("Tablero Kanban Drag & Drop y Persistencia", () => {
  test.beforeEach(async ({ request }) => {
    // Invocación previa al endpoint de reset
    await request.post("/api/test/reset-data", {
      headers: { "x-audit-token": AUDIT_TOKEN },
    }).catch(() => null);
  });

  test("Arrastrar tarjeta a otra columna y verificar contra /api/test/kanban-status", async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/kanban");
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();

    // Obtener la primera tarjeta disponible
    const firstCard = page.locator('[data-testid^="kanban-card-"]').first();
    await expect(firstCard).toBeVisible();

    const cardTestId = await firstCard.getAttribute("data-testid");
    const orderId = cardTestId?.replace("kanban-card-", "") || "";
    expect(orderId).toBeTruthy();

    // Columna de destino: En Proceso
    const targetColumn = page.locator('[data-testid="kanban-column-processing"]');
    await expect(targetColumn).toBeVisible();

    // Arrastrar tarjeta hacia la columna de destino
    await firstCard.dragTo(targetColumn);

    // Verificar en la UI que la tarjeta ahora está en la columna En Proceso
    await expect(targetColumn.locator(`[data-testid="kanban-card-${orderId}"]`)).toBeVisible({
      timeout: 10000,
    });

    // Verificación de contrato contra el endpoint de auditoría /api/test/kanban-status
    const statusRes = await request.get(`/api/test/kanban-status?orderId=${orderId}`, {
      headers: { "x-audit-token": AUDIT_TOKEN },
    });

    expect(statusRes.status()).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.orderId).toBe(orderId);
    expect(statusData.status).toBe("processing");

    expect(consoleErrors).toHaveLength(0);
    await context.close();
  });
});
