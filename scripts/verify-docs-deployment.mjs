import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

// Run inside the deployed container: probe the origin without proxy caching.
const { config } = JSON.parse(
  readFileSync('.next/required-server-files.json', 'utf8')
);
const base = `http://127.0.0.1:3000${config.basePath || ''}`;
const majors = Object.keys(
  JSON.parse(readFileSync('lib/data/docs-index/majors.json', 'utf8')).data
);
const years = [...new Set(majors.map((key) => key.split('/')[0]))];
if (!years.length) throw new Error('No indexed documentation years');
let failures = 0;
async function probe(path, phase, expected = 200) {
  const start = performance.now();
  try {
    const response = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(29000),
    });
    const ttfb = performance.now() - start;
    const body = await response.arrayBuffer();
    const total = performance.now() - start;
    console.log(
      JSON.stringify({
        phase,
        path,
        status: response.status,
        cache: response.headers.get('x-nextjs-cache'),
        ttfbMs: Math.round(ttfb),
        totalMs: Math.round(total),
        bytes: body.byteLength,
      })
    );
    if (response.status !== expected || total >= 29000) failures++;
    if (ttfb >= 20000) console.warn(`Low timeout headroom: ${path}`);
  } catch (error) {
    failures++;
    console.error(JSON.stringify({ phase, path, error: error.message }));
  }
}

// Verify this temporary removal against the deployed origin and rebuilt index.
for (const major of ['2024/09333', '2023/35163', '2024/35163', '2025/35163']) {
  if (majors.includes(major))
    throw new Error(`Removed major remains indexed: ${major}`);
  await probe(`/docs/${major}`, 'removed-international', 404);
}

// First docs requests enter together, before these URLs have been warmed.
await Promise.all(
  years.map((year) => probe(`/docs/${year}`, 'cold-concurrent'))
);
for (const year of years) {
  const major = majors.find((key) => key.startsWith(`${year}/`));
  const courses = JSON.parse(
    readFileSync(`lib/data/docs-index/courses/${major}.json`, 'utf8')
  ).data;
  const course = courses[0];
  const paths = [`/docs/${year}`, `/docs/${major}`];
  if (course) paths.push(`/docs/${major}/${course.term}`, course.href);
  for (const path of paths) await probe(path, 'first-or-warm');
  for (const path of paths) await probe(path, 'repeat');
}
await probe(`/docs/${years[0]}/__missing_docs_probe__`, 'missing', 404);
if (failures) throw new Error(`${failures} deployment probes failed`);
