import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const maxCacheBytes = 16 * 1024 * 1024;
const maxCacheEntries = 64;
const cache = new Map<string, { data: unknown; bytes: number }>();
let cacheBytes = 0;

// Build artifacts are immutable for the lifetime of a production process.
// Development keeps using live content so editing MDX needs no regeneration.
export function readDocsIndex<T>(key: string): T | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached.data as T;
  }
  const file = join(process.cwd(), 'lib/data/docs-index', `${key}.json`);
  const source = readFileSync(file, 'utf8');
  const artifact = JSON.parse(source) as {
    version: number;
    data: T;
  };
  if (artifact.version !== 1 || artifact.data === undefined)
    throw new Error(`Unsupported docs index: ${file}`);
  // Bound retained shards by entry count and serialized bytes. Parsed JS
  // objects can occupy more heap; this is not a process memory limit.
  const bytes = Buffer.byteLength(source);
  if (bytes <= maxCacheBytes) {
    while (
      cache.size &&
      (cache.size >= maxCacheEntries || cacheBytes + bytes > maxCacheBytes)
    ) {
      const oldest = cache.keys().next().value!;
      cacheBytes -= cache.get(oldest)!.bytes;
      cache.delete(oldest);
    }
    cache.set(key, { data: artifact.data, bytes });
    cacheBytes += bytes;
  }
  return artifact.data;
}
