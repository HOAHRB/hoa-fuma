import { getDocsPathEntries, type DocsPathEntry } from '@/lib/docs-paths';

export type StaticDocsRoute = {
  year: string;
  slug?: string[];
};

export type LegacyRedirectCandidate = {
  year: string;
  major: string;
  pathname: string;
};

export type StaticDocsRouteCatalog = {
  params: StaticDocsRoute[];
  aliases: Map<string, LegacyRedirectCandidate[]>;
};

function routeKey(route: StaticDocsRoute): string {
  return [route.year, ...(route.slug ?? [])].join('/');
}

function addRoute(
  routes: Map<string, StaticDocsRoute>,
  route: StaticDocsRoute
) {
  routes.set(routeKey(route), route);
}

function addAlias(
  aliases: Map<string, LegacyRedirectCandidate[]>,
  key: string,
  candidate: LegacyRedirectCandidate
) {
  const candidates = aliases.get(key) ?? [];
  if (!candidates.some((item) => item.pathname === candidate.pathname)) {
    candidates.push(candidate);
    aliases.set(key, candidates);
  }
}

export function buildStaticDocsRoutes(
  entries: DocsPathEntry[]
): StaticDocsRouteCatalog {
  const routes = new Map<string, StaticDocsRoute>();
  const aliases = new Map<string, LegacyRedirectCandidate[]>();

  for (const entry of entries) {
    const [year, ...slug] = entry.slugs;
    if (!year) continue;

    addRoute(routes, {
      year,
      slug: slug.length > 0 ? slug : undefined,
    });

    const major = slug[0];
    const semester = slug[1];
    const course = slug[2];
    if (!major || !semester || !course) continue;

    const candidate: LegacyRedirectCandidate = {
      year,
      major,
      pathname: `/docs/${entry.slugs.join('/')}`,
    };

    const normalizedCourse = course.toUpperCase();
    addAlias(aliases, normalizedCourse, candidate);
    addAlias(aliases, `${semester}/${normalizedCourse}`, candidate);

    addRoute(routes, { year: normalizedCourse });
    addRoute(routes, { year: semester, slug: [normalizedCourse] });
  }

  return {
    params: [...routes.values()],
    aliases,
  };
}

let cachedCatalog: StaticDocsRouteCatalog | undefined;

function getCatalog(): StaticDocsRouteCatalog {
  cachedCatalog ??= buildStaticDocsRoutes(getDocsPathEntries());
  return cachedCatalog;
}

export function getStaticDocsRoutes(): StaticDocsRoute[] {
  return getCatalog().params;
}

export function getLegacyRedirectCandidates(
  segments: string[]
): LegacyRedirectCandidate[] {
  if (segments.length === 0 || segments.length > 2) return [];

  const key =
    segments.length === 1
      ? segments[0].toUpperCase()
      : `${segments[0]}/${segments[1].toUpperCase()}`;

  return getCatalog().aliases.get(key) ?? [];
}
