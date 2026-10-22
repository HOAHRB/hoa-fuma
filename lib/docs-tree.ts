import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import type { Folder, Item, Node, Root } from 'fumadocs-core/page-tree';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { docsDirs, isSafePathSegment, type DocsYear } from '@/lib/docs-content';
import { readDocsIndex } from '@/lib/docs-index';

type Meta = {
  title?: string;
  description?: string;
  pages?: string[];
  root?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
};

let docsPageTree: Root | undefined;
const yearPageTrees = new Map<string, Root>();
const majorPageTrees = new Map<string, Root>();

export function getMajorPageTree(
  year: string,
  major: string
): Root | undefined {
  const dir = docsDirs[year];
  if (!dir || !isSafePathSegment(major) || /[\\/]/.test(major))
    return undefined;
  const key = `${year}/${major}`;
  const cached = majorPageTrees.get(key);
  if (cached) return cached;
  const majors = readDocsIndex<Record<string, boolean>>('majors');
  if (majors) {
    if (!majors[key]) return undefined;
    const tree = readDocsIndex<Root>(`major/${key}`)!;
    return tree;
  }
  if (
    !readdirSync(dir, { withFileTypes: true }).some(
      (entry) => entry.isDirectory() && entry.name === major
    )
  )
    return undefined;
  const folder = buildFolder(join(dir, major), [year, major]);
  const tree: Root = { type: 'root', name: year, children: [folder], $id: key };
  majorPageTrees.set(key, tree);
  return tree;
}

function pathToName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readMeta(dir: string): Meta {
  const file = join(dir, 'meta.json');
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as Meta;
}

function getPageFile(dir: string, name: string): string | undefined {
  const mdx = join(dir, `${name}.mdx`);
  if (existsSync(mdx)) return mdx;

  const md = join(dir, `${name}.md`);
  if (existsSync(md)) return md;
}

function getIndexFile(dir: string): string | undefined {
  return getPageFile(dir, 'index');
}

function readIndexInfo(dir: string): {
  title?: string;
  cardTitles: Map<string, string>;
} {
  const file = getIndexFile(dir);
  if (!file) return { cardTitles: new Map() };

  const content = readFileSync(file, 'utf8');
  const cardTitles = new Map<string, string>();
  const cardRe = /<Card\b([^>]*)>/g;
  const attrRe = /\b(title|href)="([^"]*)"/g;

  for (const match of content.matchAll(cardRe)) {
    let title: string | undefined;
    let href: string | undefined;

    for (const attr of match[1].matchAll(attrRe)) {
      if (attr[1] === 'title') title = attr[2];
      if (attr[1] === 'href') href = attr[2];
    }

    if (title && href) {
      cardTitles.set(href, title);
    }
  }

  return {
    title: (frontmatter(content).data as { title?: string }).title,
    cardTitles,
  };
}

function createPage(slugs: string[], name: string): Item {
  const url = `/docs/${slugs.join('/')}`;
  return {
    type: 'page',
    name,
    url,
    $id: slugs.join('/'),
    $ref: slugs.join('/'),
  };
}

function sortEntries(entries: string[]): string[] {
  return entries.sort((a, b) => {
    if (a === 'index') return -1;
    if (b === 'index') return 1;
    return a.localeCompare(b);
  });
}

function buildPageFromFile(
  file: string,
  slugs: string[],
  titleHint?: string
): Item {
  // Index cards already supply the display title for most course links.
  if (typeof titleHint === 'string' && titleHint.trim().length > 0)
    return createPage(slugs, titleHint);
  const pageTitle = (
    frontmatter(readFileSync(file, 'utf8')).data as {
      title?: unknown;
    }
  ).title;
  const name =
    typeof pageTitle === 'string' && pageTitle.trim().length > 0
      ? pageTitle
      : pathToName(basename(file, extname(file)));
  return createPage(slugs, name);
}

function listChildNames(dir: string): string[] {
  const names = new Set<string>();

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'meta.json') continue;

    if (entry.isDirectory()) {
      names.add(entry.name);
      continue;
    }

    if (/\.mdx?$/.test(entry.name)) {
      names.add(basename(entry.name, extname(entry.name)));
    }
  }

  return sortEntries(Array.from(names));
}

function getSemesterOrder(page: string): number | undefined {
  const parts = page.split('-');
  if (parts.length !== 2) return undefined;

  const [year, semester] = parts;
  const yearIndex = ['fresh', 'sophomore', 'junior', 'senior', 'fifth'].indexOf(
    year
  );
  const semesterIndex = ['autumn', 'spring', 'summer'].indexOf(semester);

  if (yearIndex === -1 || semesterIndex === -1) return undefined;
  return yearIndex * 3 + semesterIndex;
}

function orderSemesterPages(pages: string[]): string[] {
  const semesters = pages
    .filter((page) => getSemesterOrder(page) !== undefined)
    .toSorted((a, b) => getSemesterOrder(a)! - getSemesterOrder(b)!);
  let index = 0;

  return pages.map((page) =>
    getSemesterOrder(page) === undefined ? page : semesters[index++]
  );
}

function buildChild(
  dir: string,
  slugs: string[],
  name: string,
  cardTitles: Map<string, string>,
  indexTitle?: string,
  depth = Infinity
): Node | undefined {
  const childDir = join(dir, name);
  if (existsSync(childDir)) {
    if (depth === 0) return undefined;
    return buildFolder(childDir, [...slugs, name], depth - 1);
  }

  const file = getPageFile(dir, name);
  if (!file) return undefined;

  const pageSlugs = name === 'index' ? slugs : [...slugs, name];
  return buildPageFromFile(
    file,
    pageSlugs,
    name === 'index'
      ? indexTitle
      : cardTitles.get(`/docs/${pageSlugs.join('/')}`)
  );
}

function buildChildren(
  dir: string,
  slugs: string[],
  meta: Meta,
  cardTitles: Map<string, string>,
  indexTitle: string | undefined,
  excludeIndex: boolean,
  depth: number
): Node[] {
  const children: Node[] = [];
  const added = new Set<string>();

  function addChild(name: string) {
    if (excludeIndex && name === 'index') return;
    if (added.has(name)) return;

    const child = buildChild(dir, slugs, name, cardTitles, indexTitle, depth);
    if (!child) return;

    added.add(name);
    children.push(child);
  }

  function addRest() {
    for (const name of listChildNames(dir)) {
      addChild(name);
    }
  }

  if (!excludeIndex) {
    addChild('index');
  }

  if (meta.pages) {
    let hasRest = false;
    let hasRestReversed = false;

    for (const item of orderSemesterPages(meta.pages)) {
      if (item === '...') {
        hasRest = true;
        continue;
      }

      if (item === 'z...a') {
        hasRestReversed = true;
        continue;
      }

      if (!item.startsWith('!')) {
        addChild(item);
      }
    }

    if (hasRestReversed) {
      for (const name of listChildNames(dir).reverse()) {
        addChild(name);
      }
    }

    if (hasRest) {
      addRest();
    }
  } else {
    addRest();
  }

  return children;
}

function buildFolder(dir: string, slugs: string[], depth = Infinity): Folder {
  const meta = readMeta(dir);
  const indexFile = getIndexFile(dir);
  const indexInfo = readIndexInfo(dir);
  const isRoot = Boolean(meta.root);
  const index =
    !isRoot && indexFile
      ? buildPageFromFile(indexFile, slugs, indexInfo.title)
      : undefined;

  return {
    type: 'folder',
    name: meta.title ?? indexInfo.title ?? pathToName(basename(dir)),
    description: meta.description,
    root: meta.root,
    defaultOpen: meta.defaultOpen,
    collapsible: meta.collapsible,
    index,
    children: buildChildren(
      dir,
      slugs,
      meta,
      indexInfo.cardTitles,
      indexInfo.title,
      Boolean(index),
      depth
    ),
    $id: slugs.join('/'),
    $ref: {
      folder: slugs.join('/'),
      meta: existsSync(join(dir, 'meta.json'))
        ? `${slugs.join('/')}/meta.json`
        : undefined,
    },
  };
}

export function getDocsPageTree(): Root {
  if (docsPageTree) return docsPageTree;
  const indexed = readDocsIndex<Root>('tree');
  if (indexed) return indexed;

  docsPageTree = {
    type: 'root',
    name: 'Docs',
    children: Object.entries(docsDirs).map(([year, dir]) =>
      buildFolder(dir, [year])
    ),
    $id: 'root',
  };

  return docsPageTree;
}

export function getAvailableYears(): string[] {
  return Object.keys(docsDirs).sort((a, b) => b.localeCompare(a));
}

export function getYearPageTree(year: string): Root | undefined {
  if (!(year in docsDirs)) return undefined;

  const cached = yearPageTrees.get(year);
  if (cached) return cached;
  const indexed = readDocsIndex<Root>(`year/${year}`);
  if (indexed) return indexed;

  // The year overview needs major entry points. Semester and course trees
  // belong to the selected major's layout, not every major in the year.
  const folder = buildFolder(docsDirs[year as DocsYear], [year], 1);
  const tree: Root = {
    type: 'root',
    name: folder.name,
    description: folder.description,
    children: folder.children,
    $id: year,
    $ref: folder.$ref,
  };

  yearPageTrees.set(year, tree);
  return tree;
}
