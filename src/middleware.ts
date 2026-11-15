import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intl = createIntlMiddleware(routing);

const PRIVADAS = ['/panel', '/login', '/registro', '/api', '/auth'];

function esPrivada(pathname: string) {
  return PRIVADAS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const base = esPrivada(request.nextUrl.pathname) ? undefined : intl(request);
  return updateSession(request, base);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
