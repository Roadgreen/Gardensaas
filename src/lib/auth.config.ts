import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

/**
 * Edge-safe auth configuration (no Prisma / Node.js dependencies).
 * Used by middleware and re-exported by auth.ts which adds the full adapter.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize is handled in auth.ts — this stub satisfies the type
      authorize: () => null,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public paths
      const publicPaths = ['/', '/pricing', '/auth/login', '/auth/register'];
      const publicPrefixes = ['/plants'];

      if (pathname.startsWith('/api')) return true;
      if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) return true;
      if (publicPaths.includes(pathname)) return true;
      if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;

      if (!isLoggedIn) return false; // redirect to signIn page

      return true;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'gardensaas-secret-change-in-production',
};
