const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000/';

export function withBasePath(path: string) {
  return `${basePath}${path}`;
}

// Source URLs start with /; resolve them inside the deployment subpath.
export function siteHref(path: string) {
  return new URL(path.replace(/^\/+/, ''), siteUrl.replace(/\/?$/, '/')).href;
}
