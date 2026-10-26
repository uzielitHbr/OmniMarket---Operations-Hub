import { encode } from "next-auth/jwt";
import fs from "fs";
import path from "path";

export default async function globalSetup() {
  const authSecret =
    process.env.AUTH_SECRET || "omnmarket_e2e_super_secret_key_32chars_min";

  const token = {
    name: "Administrador E2E",
    email: "admin@omnimarket.local",
    sub: "usr_admin_demo_001",
    id: "usr_admin_demo_001",
  };

  // Firmar y cifrar el token de sesión de Auth.js v5 con AUTH_SECRET
  const sessionToken = await encode({
    token,
    secret: authSecret,
    salt: "authjs.session-token",
  });

  const authDir = path.join(process.cwd(), "e2e/.auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const storageState = {
    cookies: [
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 días
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  };

  const storagePath = path.join(authDir, "user.json");
  fs.writeFileSync(storagePath, JSON.stringify(storageState, null, 2), "utf-8");
  console.log(`[global-setup] Cookie de sesión generada en: ${storagePath}`);
}
