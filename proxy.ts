import { NextResponse, type NextRequest } from 'next/server';
import { HOA_LAST_PATH_COOKIE } from '@/lib/constants';
import { findRedirect } from '@/lib/redirect';
import { isYear } from '@/lib/utils';

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.slice('/docs/'.length).split('/');
  if (isYear(segments[0])) return NextResponse.next();

  const target = findRedirect(
    segments,
    request.cookies.get(HOA_LAST_PATH_COOKIE)?.value
  );
  if (!target) return NextResponse.next();

  // NextURL keeps the deployment basePath when serializing the redirect URL.
  const url = request.nextUrl.clone();
  url.pathname = target;
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/docs/:segment', '/docs/:semester/:course'],
};
