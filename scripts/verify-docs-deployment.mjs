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

// Probe each related resource through a real curriculum page. These requests
// must contain the panels in HTML before the browser runs any JavaScript.
const relationKeys = JSON.parse(
  readFileSync('lib/data/docs-index/relations/keys.json', 'utf8')
).data;
const relationPages = new Map();
for (const major of majors) {
  if (relationPages.size === relationKeys.length) break;
  const offerings = JSON.parse(
    readFileSync(`lib/data/docs-index/relations/plan/${major}.json`, 'utf8')
  ).data;
  for (const repo of relationKeys) {
    if (!relationPages.has(repo) && offerings[repo]?.length)
      relationPages.set(repo, offerings[repo][0]);
  }
}
const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    }[character];
  });
for (const repo of relationKeys) {
  const offering = relationPages.get(repo);
  if (!offering) {
    failures++;
    console.error(`No curriculum page found for related resource: ${repo}`);
    continue;
  }
  const slice = JSON.parse(
    readFileSync(
      `lib/data/docs-index/relations/repository/${Buffer.from(repo).toString('hex')}.json`,
      'utf8'
    )
  ).data;
  const start = performance.now();
  try {
    const response = await fetch(`${base}${offering.href}`, {
      signal: AbortSignal.timeout(29000),
    });
    const ttfb = performance.now() - start;
    const html = await response.text();
    const missing = [];
    for (const kind of ['groups', 'series']) {
      const label = kind === 'groups' ? '课程群' : '课程系列';
      for (const relation of slice[kind]) {
        if (
          !html.includes(`aria-label="${label}：${escapeHtml(relation.name)}"`)
        )
          missing.push(relation.name);
      }
    }
    if (!html.includes('aria-label="当前页面课程"'))
      missing.push('当前页面课程');
    if (response.status !== 200 || missing.length) failures++;
    console.log(
      JSON.stringify({
        phase: 'course-relations-ssr',
        repo,
        path: offering.href,
        status: response.status,
        ttfbMs: Math.round(ttfb),
        totalMs: Math.round(performance.now() - start),
        bytes: Buffer.byteLength(html),
        groups: slice.groups.length,
        series: slice.series.length,
        missing,
      })
    );
  } catch (error) {
    failures++;
    console.error(JSON.stringify({ repo, error: error.message }));
  }
}
console.log(JSON.stringify({ relationResourcesProbed: relationPages.size }));
if (failures) throw new Error(`${failures} deployment probes failed`);
