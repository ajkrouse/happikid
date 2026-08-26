/**
 * Bounded alpha load simulation for provider discovery and inbox reads.
 *
 * This intentionally has conservative defaults and requires no credentials for
 * public search. Set LOAD_TEST_COOKIE, or the dedicated
 * RELEASE_SMOKE_PARENT_COOKIE secret, to exercise authenticated inbox routes.
 *
 * Examples:
 *   npm run alpha:load
 *   LOAD_TEST_BASE_URL=https://staging.example.test LOAD_TEST_COOKIE='...' npm run alpha:load
 *   LOAD_TEST_AI_PROBE=true npm run alpha:load
 */

type RequestResult = {
  endpoint: string;
  status: number | null;
  durationMs: number;
  error?: string;
};

type RequestTask = {
  endpoint: string;
  headers?: Record<string, string>;
};

const baseUrl = (
  process.env.LOAD_TEST_BASE_URL ||
  (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://127.0.0.1:5000")
).replace(/\/+$/, "");
const iterations = readPositiveInt("LOAD_TEST_ITERATIONS", 10);
const concurrency = readPositiveInt("LOAD_TEST_CONCURRENCY", 24);
const inboxConcurrency = readPositiveInt("LOAD_TEST_INBOX_CONCURRENCY", 8);
const timeoutMs = readPositiveInt("LOAD_TEST_TIMEOUT_MS", 5000);
const p95BudgetMs = readPositiveInt("LOAD_TEST_P95_MS", 1500);
export function readAuthenticatedInboxCookie(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return env.LOAD_TEST_COOKIE || env.RELEASE_SMOKE_PARENT_COOKIE;
}

const cookie = readAuthenticatedInboxCookie();
const runAiProbe = process.env.LOAD_TEST_AI_PROBE === "true";

const searchQueries = [
  "/api/providers?city=Brooklyn&ageRange=toddlers&sortBy=best-match&limit=20",
  "/api/providers?borough=Queens&priceMin=1000&priceMax=2200&sortBy=lowest-price&limit=20",
  "/api/providers?search=music%20and%20art&city=Brooklyn&sortBy=best-match&limit=20",
  "/api/providers?enrollmentStatus=accepting&verifiedPricing=true&sortBy=newest&limit=20",
  "/api/providers?type=camp&ageRange=school-age&sortBy=nearest&lat=40.7128&lng=-74.0060&radius=10&limit=20",
];

function readPositiveInt(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

async function requestEndpoint(task: RequestTask): Promise<RequestResult> {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${task.endpoint}`, {
      headers: task.headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    // Drain the response so keep-alive connections can be reused by fetch.
    await response.arrayBuffer();
    return {
      endpoint: task.endpoint,
      status: response.status,
      durationMs: performance.now() - startedAt,
    };
  } catch (error) {
    return {
      endpoint: task.endpoint,
      status: null,
      durationMs: performance.now() - startedAt,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function runConcurrent(tasks: RequestTask[], workerCount: number): Promise<RequestResult[]> {
  const results: RequestResult[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const task = tasks[cursor];
      cursor += 1;
      if (!task) return;
      results.push(await requestEndpoint(task));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(workerCount, tasks.length) }, () => worker()),
  );
  return results;
}

function percentile(values: number[], percentileRank: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileRank / 100) * sorted.length) - 1);
  return sorted[index];
}

function printSummary(label: string, results: RequestResult[]): void {
  const durations = results.map((result) => result.durationMs);
  const counts = results.reduce<Record<string, number>>((summary, result) => {
    const key = result.status === null ? "network-error" : String(result.status);
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);
  console.log(
    `${label}: ${results.length} requests | statuses=${JSON.stringify(counts)} | ` +
      `p50=${p50.toFixed(0)}ms p95=${p95.toFixed(0)}ms max=${Math.max(...durations).toFixed(0)}ms`,
  );
  const errors = results.filter((result) => result.error);
  if (errors.length > 0) {
    console.log(`${label}: ${errors.length} network/timeout errors`);
  }
}

function assertHealthy(label: string, results: RequestResult[], acceptedStatuses: number[]): void {
  const unexpected = results.filter(
    (result) => result.status === null || !acceptedStatuses.includes(result.status),
  );
  const p95 = percentile(results.map((result) => result.durationMs), 95);
  if (unexpected.length > 0) {
    throw new Error(
      `${label} had ${unexpected.length} unexpected responses; ` +
        `expected statuses ${acceptedStatuses.join(", ")}`,
    );
  }
  if (p95 > p95BudgetMs) {
    throw new Error(`${label} p95 ${p95.toFixed(0)}ms exceeded ${p95BudgetMs}ms budget`);
  }
}

async function main(): Promise<void> {
  console.log(
    `Running bounded alpha load against ${baseUrl} ` +
      `(iterations=${iterations}, concurrency=${concurrency}, timeout=${timeoutMs}ms)`,
  );

  const searchTasks = Array.from({ length: iterations }, (_, iteration) =>
    searchQueries.map((endpoint) => ({
      endpoint: `${endpoint}&offset=${iteration}`,
    })),
  ).flat();
  const searchResults = await runConcurrent(searchTasks, concurrency);
  printSummary("provider search", searchResults);
  assertHealthy("provider search", searchResults, [200]);

  if (cookie) {
    const inboxTasks = Array.from({ length: iterations }, (_, iteration) => [
      { endpoint: "/api/threads", headers: { Cookie: cookie } },
      { endpoint: "/api/threads/provider/list", headers: { Cookie: cookie } },
    ]).flat();
    const inboxResults = await runConcurrent(inboxTasks, inboxConcurrency);
    printSummary("authenticated inbox", inboxResults);
    assertHealthy("authenticated inbox", inboxResults, [200]);
  } else {
    console.log(
      "authenticated inbox: skipped " +
        "(set LOAD_TEST_COOKIE or RELEASE_SMOKE_PARENT_COOKIE in the secret manager to run it)",
    );
  }

  if (runAiProbe) {
    const aiTasks = Array.from({ length: 22 }, (_, index) => ({
      endpoint: `/api/providers?search=daycare&aiSummary=true&offset=${index}`,
    }));
    const aiResults = await runConcurrent(aiTasks, concurrency);
    printSummary("AI-summary limiter probe", aiResults);
    if (!aiResults.some((result) => result.status === 429)) {
      throw new Error("AI-summary limiter probe did not observe a 429 response");
    }
    console.log("AI-summary limiter: protected the endpoint with at least one 429 response");
  }

  console.log("Alpha load simulation completed within configured budgets.");
}

main().catch((error) => {
  console.error(`Alpha load simulation failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});