import { test, expect } from "@playwright/test";
import path from "path";

const STORAGE_STATE = path.join(process.cwd(), "e2e/.auth/user.json");
const AUDIT_TOKEN = process.env.AUDIT_TOKEN || "audit_test_token_2026";

test.describe("Tablero Kanban Drag & Drop y Persistencia", () => {
  test.beforeEach(async ({ request }) => {
    // Invocación previa al endpoint de reset
    await request
      .post("/api/test/reset-data", {
        headers: { "x-audit-token": AUDIT_TOKEN },
      })
      .catch(() => null);
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

    // Columna origen (Pendientes) y columna destino (En Proceso)
    const sourceColumn = page.locator('[data-testid="kanban-column-pending"]');
    await expect(sourceColumn).toBeVisible();

    const targetColumn = page.locator('[data-testid="kanban-column-processing"]');
    await expect(targetColumn).toBeVisible();

    // Obtener la primera tarjeta disponible en la columna de pendientes
    const firstCard = sourceColumn.locator('[data-testid^="kanban-card-"]').first();
    await expect(firstCard).toBeVisible();

    const cardTestId = await firstCard.getAttribute("data-testid");
    const orderId = cardTestId?.replace("kanban-card-", "") || "";
    expect(orderId).toBeTruthy();

    // Localizar el elemento que contiene los listeners de DnD (el grip handle o la tarjeta completa)
    const dragHandle = firstCard.locator('[aria-label^="Mover pedido"]');
    const dragSource = (await dragHandle.count()) > 0 ? dragHandle : firstCard;
    await dragSource.scrollIntoViewIfNeeded();

    const sourceBox = await dragSource.boundingBox();
    expect(sourceBox).not.toBeNull();
    const targetBox = await targetColumn.boundingBox();
    expect(targetBox).not.toBeNull();

    if (!sourceBox || !targetBox) {
      throw new Error("No se pudieron obtener las coordenadas de origen o destino.");
    }

    const startX = sourceBox.x + sourceBox.width / 2;
    const startY = sourceBox.y + sourceBox.height / 2;

    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + Math.min(targetBox.height / 3, 150);

    // 1. Mover al origen y presionar el botón del mouse (dispara pointerdown para @dnd-kit)
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(100);
    await page.mouse.down();
    await page.waitForTimeout(100);

    // 2. Mover ligeramente para superar el activationConstraint (distance: 5)
    await page.mouse.move(startX + 10, startY + 5, { steps: 5 });
    await page.waitForTimeout(50);

    // 3. Preparar escucha de la mutación PATCH /api/orders/:id/move
    const moveResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/orders/") &&
        res.url().includes("/move") &&
        res.request().method() === "PATCH",
      { timeout: 15000 }
    ).catch(() => null);

    // 4. Mover hacia la columna destino con pasos intermedios para registrar dragover
    await page.mouse.move(targetX, targetY, { steps: 15 });
    await page.waitForTimeout(200);

    // 5. Soltar el mouse para disparar dragend
    await page.mouse.up();

    // 6. Esperar la respuesta de la mutación de red o actualización en el DOM
    await Promise.race([
      moveResponsePromise,
      page.waitForTimeout(3000),
    ]);

    // 7. Verificar en la UI que la tarjeta ahora está en la columna En Proceso
    const targetCard = targetColumn.locator(`[data-testid="kanban-card-${orderId}"]`);
    await expect(targetCard).toBeVisible({
      timeout: 10000,
    });

    // 8. Verificación de contrato contra el endpoint de auditoría /api/test/kanban-status
    const statusRes = await request.get(`/api/test/kanban-status?orderId=${orderId}`, {
      headers: { "x-audit-token": AUDIT_TOKEN },
    });

    expect(statusRes.status()).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.orderId).toBe(orderId);
    expect(statusData.status).toBe("processing");

    // Verificar cero errores en consola
    expect(consoleErrors).toHaveLength(0);
    await context.close();
  });
});
