import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = join(projectRoot, 'out');

function fail(message) {
  console.error(`static export verification failed: ${message}`);
  process.exitCode = 1;
}

function requirePath(relativePath, description) {
  const absolutePath = join(outputRoot, relativePath);
  if (!statSync(absolutePath, { throwIfNoEntry: false })) {
    fail(`${description} is missing (${relativePath})`);
  } else {
    console.log(`verified: ${description}`);
  }
  return absolutePath;
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

if (!statSync(outputRoot, { throwIfNoEntry: false })) {
  fail('out/ does not exist');
  process.exit(1);
}

requirePath('index.html', 'home page');
requirePath('404.html', 'static 404 page');
const staticAssets = requirePath('_next/static', 'Next static assets');
requirePath('api/search.json', 'static search index');
requirePath('blog/rss.xml', 'blog RSS feed');
requirePath('news/rss.xml', 'news RSS feed');

if (
  statSync(staticAssets).isDirectory() &&
  readdirSync(staticAssets).length === 0
) {
  fail('Next static asset directory is empty');
}

const searchIndex = join(outputRoot, 'api/search.json');
if (statSync(searchIndex, { throwIfNoEntry: false })) {
  try {
    JSON.parse(readFileSync(searchIndex, 'utf8'));
    console.log('verified: search index is valid JSON');
  } catch (error) {
    fail(`search index is not valid JSON: ${error.message}`);
  }
}

const files = walk(outputRoot);
const htmlFiles = files.filter((path) => extname(path) === '.html');
if (!htmlFiles.some((path) => path.includes(`${join('out', 'docs')}`))) {
  fail('docs contains no generated HTML page');
} else {
  console.log('verified: docs contains generated HTML');
}

if (files.some((path) => path.endsWith('server.js'))) {
  fail('server.js was emitted into the static artifact');
} else {
  console.log('verified: no standalone server.js');
}

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  if (html.includes('/_next/image')) {
    fail(`HTML references the server-only image optimizer (${htmlFile})`);
    break;
  }
}
if (
  !htmlFiles.some((path) => readFileSync(path, 'utf8').includes('/_next/image'))
) {
  console.log('verified: no HTML references /_next/image');
}

if (process.exitCode) process.exit(1);
console.log('static export verified: out/');
