import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/server/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth?.user;

  // Rutas públicas que no requieren sesión de usuario
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/test"); // Endpoints de auditoría tienen validación por x-audit-token

  if (isPublicRoute) {
    // Si ya está autenticado y visita /login, redirigir al panel principal
    if (isAuth && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Si no está autenticado y la ruta es privada:
  if (!isAuth) {
    // Para endpoints de API privadas, responder HTTP 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized: Sesión requerida" },
        { status: 401 }
      );
    }

    // Para páginas de dashboard y vistas privadas, redirigir a /login
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto archivos estáticos, de optimización de imagen o favicon
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
