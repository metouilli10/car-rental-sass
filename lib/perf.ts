type PerfMeta = Record<string, unknown>;

const PERF_ENABLED = process.env.ENABLE_PERF_LOGS === "true";

function stringifyDuration(startedAt: number) {
  return `${Date.now() - startedAt}ms`;
}

export function createPerfLogger(scope: string, meta: PerfMeta = {}) {
  const startedAt = Date.now();

  function log(event: string, extra: PerfMeta = {}) {
    if (!PERF_ENABLED) return;

    console.info(`[perf] ${scope}`, {
      event,
      duration: stringifyDuration(startedAt),
      ...meta,
      ...extra,
    });
  }

  return {
    step(event: string, extra: PerfMeta = {}) {
      log(event, extra);
    },
    end(extra: PerfMeta = {}) {
      log("complete", extra);
    },
  };
}
