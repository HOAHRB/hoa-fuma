// Temporary slow-request diagnostics; enabled explicitly through the deployment environment.
const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');
const http = require('node:http');
const { performance } = require('node:perf_hooks');

const key = Symbol.for('hoahrb.slow-request-trace');

function install(options = {}) {
  const now = options.now || Date.now;
  if (process.env.FUMA_SLOW_TRACE !== '1' || globalThis[key]) return () => {};
  const slowMs = options.slowMs ?? 3000;
  const pendingMs = options.pendingMs ?? 10000;
  const write =
    options.write || ((record) => console.log(JSON.stringify(record)));
  const storage = new AsyncLocalStorage();
  const originalEmit = http.Server.prototype.emit;
  let active = 0;
  let minute = Math.floor(now() / 60000);
  let written = 0;

  function log(record) {
    const current = Math.floor(now() / 60000);
    if (minute !== current) {
      minute = current;
      written = 0;
    }
    // Shared process budget; no queues and no per-path maps that can grow.
    if (written++ >= 20) return;
    write({
      tag: 'fuma-slow-request',
      time: new Date(now()).toISOString(),
      ...record,
    });
  }
  const api = {
    begin(name) {
      const trace = storage.getStore();
      if (!trace || trace.done || trace.steps.length >= 32) return () => {};
      const step = {
        name,
        startMs: Math.round(performance.now() - trace.start),
      };
      const start = performance.now();
      trace.steps.push(step);
      return () => {
        step.ms = Math.round(performance.now() - start);
      };
    },
  };
  globalThis[key] = api;
  log({ event: 'enabled', slowMs, pendingMs });

  function emit(event, ...args) {
    if (event !== 'request') return originalEmit.call(this, event, ...args);
    const [request, response] = args;
    // Exclude assets. Do not record query strings, headers, bodies or credentials.
    const path = (request.url || '/').split('?')[0].slice(0, 512);
    if (/\/_next\//.test(path) || active >= 128)
      return originalEmit.call(this, event, ...args);
    active++;
    const trace = {
      id: randomUUID(),
      path,
      method: request.method,
      start: performance.now(),
      steps: [],
      done: false,
      elu: performance.eventLoopUtilization(),
      cpu: process.cpuUsage(),
    };
    let pending = false;
    function snapshot(event) {
      const cpu = process.cpuUsage(trace.cpu);
      return {
        event,
        id: trace.id,
        path,
        method: trace.method,
        ms: Math.round(performance.now() - trace.start),
        status: response.statusCode,
        cache: response.getHeader('x-nextjs-cache'),
        rssMiB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        processCpuMs: Math.round((cpu.user + cpu.system) / 1000),
        processEventLoopUtilization: performance.eventLoopUtilization(trace.elu)
          .utilization,
        steps: trace.steps,
      };
    }
    const timer = setTimeout(() => {
      pending = true;
      log(snapshot('pending'));
    }, pendingMs);
    timer.unref();
    function finish(event) {
      if (trace.done) return;
      trace.done = true;
      active--;
      clearTimeout(timer);
      response.removeListener('finish', onFinish);
      response.removeListener('close', onClose);
      if (
        pending ||
        performance.now() - trace.start >= slowMs ||
        response.statusCode >= 500 ||
        event === 'aborted' ||
        event === 'error'
      )
        log(snapshot(event));
    }
    const onFinish = () => finish('finished');
    const onClose = () =>
      finish(response.writableFinished ? 'finished' : 'aborted');
    response.once('finish', onFinish);
    response.once('close', onClose);
    try {
      return storage.run(trace, () => originalEmit.call(this, event, ...args));
    } catch (error) {
      finish('error');
      throw error;
    }
  }
  http.Server.prototype.emit = emit;
  return () => {
    if (http.Server.prototype.emit === emit)
      http.Server.prototype.emit = originalEmit;
    if (globalThis[key] === api) delete globalThis[key];
  };
}

module.exports = { install };
if (require.main !== module) install();
