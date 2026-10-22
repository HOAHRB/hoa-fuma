import { registerHooks } from 'node:module';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
// Use the live-content implementations, never an index from an earlier build.
process.env.NODE_ENV = 'development';

// Node 24 strips TS types; resolve the same local aliases as tsconfig.json.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith('@/')
      ? join(root, specifier.slice(2))
      : specifier.startsWith('.') && context.parentURL?.endsWith('.ts')
        ? fileURLToPath(new URL(specifier, context.parentURL))
        : undefined;
    if (local && existsSync(`${local}.ts`)) {
      return nextResolve(pathToFileURL(`${local}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { getDocsPathEntries } = await import('../lib/docs-paths.ts');
const { getDocsSeoPath } = await import('../lib/docs-seo.ts');
const {
  getAvailableYears,
  getDocsPageTree,
  getYearPageTree,
  getMajorPageTree,
} = await import('../lib/docs-tree.ts');
const { getMajorCourses } = await import('../lib/major-courses-data.ts');

const output = join(root, 'lib/data/docs-index');
const staging = `${output}.tmp`;
rmSync(staging, { recursive: true, force: true });
function write(key, data) {
  const file = join(staging, `${key}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ version: 1, data }));
}

const start = performance.now();
const entries = getDocsPathEntries();
write(
  'paths',
  entries.map(({ slugs, file }) => ({
    slugs,
    file: relative(join(root, 'content/docs'), file).split(sep).join('/'),
  }))
);
const seo = Object.create(null);
for (const { slugs } of entries) {
  const result = getDocsSeoPath(slugs);
  if (result.indexable) seo[`/docs/${slugs.join('/')}`] = result.canonical;
}
write('seo', seo);
const tree = getDocsPageTree();
write('tree', tree);
const majors = Object.create(null);
for (const year of getAvailableYears()) {
  write(`year/${year}`, getYearPageTree(year));
  for (const major of readdirSync(join(root, 'content/docs', year), {
    withFileTypes: true,
  })) {
    if (!major.isDirectory()) continue;
    majors[`${year}/${major.name}`] = true;
    const key = `${year}/${major.name}`;
    const yearFolder = tree.children.find((node) => node.$id === year);
    const folder =
      yearFolder?.type === 'folder'
        ? yearFolder.children.find(
            (node) => node.type === 'folder' && node.$id === key
          )
        : undefined;
    write(
      `major/${key}`,
      folder
        ? { type: 'root', name: year, children: [folder], $id: key }
        : getMajorPageTree(year, major.name)
    );
    write(`courses/${year}/${major.name}`, getMajorCourses([year, major.name]));
  }
}
write('majors', majors);
// Publish only after every source file has been read successfully.
rmSync(output, { recursive: true, force: true });
renameSync(staging, output);
console.log(
  `Generated docs index for ${entries.length} pages in ${((performance.now() - start) / 1000).toFixed(2)}s`
);
