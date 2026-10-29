import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { fetchGearStatus } from './lib/api';

const intl = createMiddleware(routing);

// Public gear detail URLs: /fi/varuste/<id>[-slug] and /en/gear/<id>[-slug] (not /edit).
const GEAR_URL = /^\/(fi|en)\/(?:varuste|gear)\/([0-9a-f]{24})(?:-[^/]*)?\/?$/i;

export default async function proxy(request: NextRequest) {
  // A page cannot set status 410, so removed listings are answered here with the "gone" page.
  const match = GEAR_URL.exec(request.nextUrl.pathname);
  if (match) {
    const status = await fetchGearStatus(match[2] as string, request.headers.get('cookie'));
    if (status === 410) {
      return NextResponse.rewrite(new URL(`/${match[1]}/gone`, request.url), { status: 410 });
    }
  }
  return intl(request);
}

export const config = { matcher: ['/((?!api|og|_next|.*\\..*).*)'] };
