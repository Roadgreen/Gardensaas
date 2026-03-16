import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // The authorized callback in auth.config.ts handles public/private route logic.
  // If we reach here, the user is authorized. Sync locale cookie if logged in.
  const response = undefined; // let NextAuth handle the response

  // We can only set cookies via NextResponse when we intercept,
  // but locale sync is better handled in the session callback.
  // The authorized callback already handles redirects for unauthenticated users.
  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
