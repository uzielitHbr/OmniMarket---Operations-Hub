import { test, expect } from "@playwright/test";
import path from "path";

const STORAGE_STATE = path.join(process.cwd(), "e2e/.auth/user.json");
const AUDIT_TOKEN = process.env.AUDIT_TOKEN || "audit_test_token_2026";

test.describe("Autenticación y Redirección de Rutas", () => {
  test.beforeEach(async ({ request }) => {
    // Invocación obligatoria de reset-data antes de cada spec
    await request.post("/api/test/reset-data", {
      headers: { "x-audit-token": AUDIT_TOKEN },
    }).catch(() => null);
  });

  test("Ruta privada sin sesión debe redirigir a /login", async ({ browser }) => {
    // Contexto anónimo sin cookies de sesión
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
    await context.close();
  });

  test("Ruta privada con sesión firmada debe acceder al dashboard", async ({ browser }) => {
    // Contexto autenticado con la cookie generada en global-setup
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator('[data-testid="metrics-page"]')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
    await context.close();
  });
});
