type TraceApi = { begin(name: string): () => void };

function begin(name: string) {
  const api = (
    globalThis as typeof globalThis & {
      [key: symbol]: TraceApi | undefined;
    }
  )[Symbol.for('hoahrb.slow-request-trace')];
  return api?.begin(name) ?? (() => {});
}

export function traceStep<T>(name: string, operation: () => T): T {
  const end = begin(name);
  try {
    return operation();
  } finally {
    end();
  }
}

export async function traceAsyncStep<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const end = begin(name);
  try {
    return await operation();
  } finally {
    end();
  }
}
