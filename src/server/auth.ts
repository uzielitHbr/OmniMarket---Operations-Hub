import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import { authConfig } from "./auth.config";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
});

/**
 * Helper para verificar autenticación en el servidor.
 * Lanza un error si no hay sesión activa.
 * Usado en Server Actions y Route Handlers.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}
