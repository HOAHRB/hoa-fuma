import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';

const YEAR_PATTERN = /^\d{4}$/;

function pathToName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function sortedEntries(dir) {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function readMeta(dir) {
  const file = join(dir, 'meta.json');
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8'));
}

function getPageFile(dir, name) {
  const mdx = join(dir, `${name}.mdx`);
  if (existsSync(mdx)) return mdx;

  const md = join(dir, `${name}.md`);
  if (existsSync(md)) return md;
}

function getIndexFile(dir) {
  return getPageFile(dir, 'index');
}

function readIndexInfo(dir) {
  const file = getIndexFile(dir);
  if (!file) return { cardTitles: new Map() };

  const content = readFileSync(file, 'utf8');
  const cardTitles = new Map();
  const cardRe = /<Card\b([^>]*)>/g;
  const attrRe = /\b(title|href)="([^"]*)"/g;

  for (const match of content.matchAll(cardRe)) {
    let title;
    let href;

    for (const attr of match[1].matchAll(attrRe)) {
      if (attr[1] === 'title') title = attr[2];
      if (attr[1] === 'href') href = attr[2];
    }

    if (title && href) cardTitles.set(href, title);
  }

  return {
    title: frontmatter(content).data.title,
    cardTitles,
  };
}

function createPage(slugs, name) {
  return {
    type: 'page',
    name,
    url: `/docs/${slugs.join('/')}`,
    $id: slugs.join('/'),
    $ref: slugs.join('/'),
  };
}

function sortEntries(entries) {
  return entries.sort((a, b) => {
    if (a === 'index') return -1;
    if (b === 'index') return 1;
    return a.localeCompare(b);
  });
}

function buildPageFromFile(file, slugs, titleHint) {
  return createPage(
    slugs,
    titleHint ?? pathToName(basename(file, extname(file)))
  );
}

function listChildNames(dir) {
  const names = new Set();

  for (const entry of sortedEntries(dir)) {
    if (entry.name === 'meta.json') continue;

    if (entry.isDirectory()) {
      names.add(entry.name);
    } else if (/\.mdx?$/.test(entry.name)) {
      names.add(basename(entry.name, extname(entry.name)));
    }
  }

  return sortEntries(Array.from(names));
}

function getSemesterOrder(page) {
  const parts = page.split('-');
  if (parts.length !== 2) return undefined;

  const [year, semester] = parts;
  const yearIndex = ['fresh', 'sophomore', 'junior', 'senior', 'fifth'].indexOf(
    year
  );
  const semesterIndex = ['autumn', 'summer', 'spring'].indexOf(semester);

  if (yearIndex === -1 || semesterIndex === -1) return undefined;
  return yearIndex * 3 + semesterIndex;
}

function orderSemesterPages(pages) {
  const semesters = pages
    .filter((page) => getSemesterOrder(page) !== undefined)
    .toSorted((a, b) => getSemesterOrder(a) - getSemesterOrder(b));
  let index = 0;

  return pages.map((page) =>
    getSemesterOrder(page) === undefined ? page : semesters[index++]
  );
}

function buildChild(dir, slugs, name, cardTitles, indexTitle) {
  const childDir = join(dir, name);
  if (existsSync(childDir)) return buildFolder(childDir, [...slugs, name]);

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

function buildChildren(dir, slugs, meta, cardTitles, indexTitle, excludeIndex) {
  const children = [];
  const added = new Set();

  function addChild(name) {
    if ((excludeIndex && name === 'index') || added.has(name)) return;

    const child = buildChild(dir, slugs, name, cardTitles, indexTitle);
    if (!child) return;

    added.add(name);
    children.push(child);
  }

  function addRest() {
    for (const name of listChildNames(dir)) addChild(name);
  }

  if (!excludeIndex) addChild('index');

  if (meta.pages) {
    let hasRest = false;
    let hasRestReversed = false;

    for (const item of orderSemesterPages(meta.pages)) {
      if (item === '...') {
        hasRest = true;
      } else if (item === 'z...a') {
        hasRestReversed = true;
      } else if (!item.startsWith('!')) {
        addChild(item);
      }
    }

    if (hasRestReversed) {
      for (const name of listChildNames(dir).reverse()) addChild(name);
    }
    if (hasRest) addRest();
  } else {
    addRest();
  }

  return children;
}

function buildFolder(dir, slugs) {
  const meta = readMeta(dir);
  const indexFile = getIndexFile(dir);
  const indexInfo = readIndexInfo(dir);
  const index =
    !meta.root && indexFile
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
      Boolean(index)
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

function getMarkdownFiles(dir) {
  const files = [];

  for (const entry of sortedEntries(dir)) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function fileToSlugs(docsRoot, year, file) {
  const withoutExt = relative(join(docsRoot, year), file).replace(
    /\.mdx?$/,
    ''
  );
  const slugs = [year, ...withoutExt.split(sep)];
  if (slugs.at(-1) === 'index') slugs.pop();
  return slugs;
}

export function buildDocsManifest(docsRoot) {
  const yearEntries = sortedEntries(docsRoot).filter(
    (entry) => entry.isDirectory() && YEAR_PATTERN.test(entry.name)
  );
  const folders = yearEntries.map((entry) =>
    buildFolder(join(docsRoot, entry.name), [entry.name])
  );
  /** @type {Record<string, object>} */
  const yearPageTrees = {};
  /** @type {Record<string, string[]>} */
  const majorIdsByYear = {};
  const paths = [];

  for (const [index, entry] of yearEntries.entries()) {
    const folder = folders[index];
    const yearDir = join(docsRoot, entry.name);
    yearPageTrees[entry.name] = {
      type: 'root',
      name: folder.name,
      description: folder.description,
      children: folder.children,
      $id: entry.name,
      $ref: folder.$ref,
    };
    majorIdsByYear[entry.name] = sortedEntries(yearDir)
      .filter((child) => child.isDirectory())
      .map((child) => child.name);

    for (const file of getMarkdownFiles(yearDir)) {
      paths.push(fileToSlugs(docsRoot, entry.name, file));
    }
  }

  return {
    pageTree: {
      type: 'root',
      name: 'Docs',
      children: folders,
      $id: 'root',
    },
    yearPageTrees,
    years: yearEntries
      .map((entry) => entry.name)
      .toSorted()
      .reverse(),
    paths,
    majorIdsByYear,
  };
}

export function writeDocsManifest({ docsRoot, outputFile }) {
  const manifest = buildDocsManifest(docsRoot);
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, `${JSON.stringify(manifest)}\n`);
  return manifest;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  writeDocsManifest({
    docsRoot: resolve('content/docs'),
    outputFile: resolve('.source/docs-manifest.json'),
  });
}
