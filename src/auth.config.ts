import type { NextAuthConfig } from "next-auth";

// Konfiguracja bez providerów zależnych od Node.js (Prisma/pg), żeby dało
// się jej bezpiecznie użyć w middleware (Edge runtime). Pełna konfiguracja
// z Credentials providerem jest w src/auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized: ({ auth }) => Boolean(auth?.user),
  },
  providers: [],
} satisfies NextAuthConfig;
