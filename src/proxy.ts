import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Osobna, lekka instancja (bez Credentials/Prisma) - proxy działa w
// Edge runtime, gdzie połączenie z Postgresem przez `pg` nie zadziała.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
