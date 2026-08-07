import type { LegacyRedirectCandidate } from '@/lib/docs-static-routes';

export function readCookieValue(
  cookieHeader: string,
  name: string
): string | undefined {
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;

    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function getPreferredLocation(lastPath: string | undefined) {
  if (!lastPath?.startsWith('/docs/')) return {};

  const segments = lastPath.split('/').filter(Boolean);
  return {
    year: segments[1],
    major: segments[2],
  };
}

export function chooseLegacyRedirect(
  candidates: LegacyRedirectCandidate[],
  lastPath: string | undefined
): string | null {
  if (candidates.length === 0) return null;

  const preferred = getPreferredLocation(lastPath);
  const exact = candidates.find(
    (candidate) =>
      candidate.year === preferred.year && candidate.major === preferred.major
  );
  if (exact) return exact.pathname;

  const yearMatch = candidates.find(
    (candidate) => candidate.year === preferred.year
  );
  if (yearMatch) return yearMatch.pathname;

  const majorMatch = candidates.find(
    (candidate) => candidate.major === preferred.major
  );
  if (majorMatch) return majorMatch.pathname;

  return [...candidates].sort((a, b) => {
    const yearOrder = b.year.localeCompare(a.year);
    return yearOrder || a.pathname.localeCompare(b.pathname);
  })[0].pathname;
}
