/**
 * Safe preflight for the role-based release smoke check.
 *
 * Role sessions are supplied through Replit Secrets (or another secret
 * manager), never through source files or command-line arguments. This script
 * only reports whether a session is present and which role the application
 * returned; it never prints cookies or response bodies.
 */

export const RELEASE_SMOKE_ROLES = [
  { name: "parent", envKey: "RELEASE_SMOKE_PARENT_COOKIE" },
  { name: "provider", envKey: "RELEASE_SMOKE_PROVIDER_COOKIE" },
  { name: "admin", envKey: "RELEASE_SMOKE_ADMIN_COOKIE" },
] as const;

type SmokeRole = (typeof RELEASE_SMOKE_ROLES)[number]["name"];

export interface ReleaseSmokeFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type ReleaseSmokeFetch = (
  input: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<ReleaseSmokeFetchResponse>;

export interface ReleaseSmokePreflightResult {
  baseUrl: string;
  testInboxConfigured: boolean;
  roles: Record<SmokeRole, string>;
}

function readRequired(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value || undefined;
}

function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateCookieHeader(value: string, envKey: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(`${envKey} must not contain line breaks`);
  }
  if (/^cookie\s*:/i.test(value)) {
    throw new Error(`${envKey} must omit the Cookie: header name`);
  }
  const pairs = value.split(";").map((pair) => pair.trim()).filter(Boolean);
  if (
    pairs.length === 0 ||
    pairs.some((pair) => {
      const separator = pair.indexOf("=");
      return separator < 1 || separator === pair.length - 1;
    })
  ) {
    throw new Error(
      `${envKey} must contain a complete cookie pair such as connect.sid=<redacted>`,
    );
  }
}

function getTargetUrl(env: NodeJS.ProcessEnv): URL {
  const raw = readRequired(env, "RELEASE_SMOKE_BASE_URL");
  if (!raw) {
    throw new Error("RELEASE_SMOKE_BASE_URL is required");
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    throw new Error("RELEASE_SMOKE_BASE_URL must be a valid URL");
  }

  if (target.protocol !== "https:") {
    throw new Error("RELEASE_SMOKE_BASE_URL must use HTTPS");
  }

  const productionHosts = (env.RELEASE_SMOKE_PRODUCTION_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (productionHosts.length === 0) {
    throw new Error("RELEASE_SMOKE_PRODUCTION_HOSTS is required as a production safety guard");
  }
  if (productionHosts.includes(target.hostname.toLowerCase())) {
    throw new Error("RELEASE_SMOKE_BASE_URL must not target a production hostname");
  }

  return target;
}

function validateConfiguration(env: NodeJS.ProcessEnv): {
  target: URL;
  inbox: string;
  cookies: Record<SmokeRole, string>;
} {
  if (readRequired(env, "RELEASE_SMOKE_ENV") !== "staging") {
    throw new Error('RELEASE_SMOKE_ENV must be exactly "staging"');
  }

  const target = getTargetUrl(env);
  const inbox = readRequired(env, "RELEASE_SMOKE_TEST_INBOX");
  if (!inbox || !isEmailAddress(inbox)) {
    throw new Error("RELEASE_SMOKE_TEST_INBOX must be a designated test email address");
  }

  const cookies = Object.fromEntries(
    RELEASE_SMOKE_ROLES.map(({ name, envKey }) => {
      const cookie = readRequired(env, envKey);
      if (!cookie) {
        throw new Error(`${envKey} is required and must be stored as a secret`);
      }
      validateCookieHeader(cookie, envKey);
      return [name, cookie];
    }),
  ) as Record<SmokeRole, string>;

  if (new Set(Object.values(cookies)).size !== RELEASE_SMOKE_ROLES.length) {
    throw new Error("Each smoke-test role must use a different staging session");
  }

  return { target, inbox, cookies };
}

function returnedRole(user: unknown): string | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) return undefined;
  const role = (user as { role?: unknown }).role;
  return typeof role === "string" ? role : undefined;
}

/**
 * Validate the staging-only secret contract and confirm each session belongs
 * to the expected role. No secret value is returned from this function.
 */
export async function runReleaseSmokePreflight(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: ReleaseSmokeFetch = fetch as ReleaseSmokeFetch,
): Promise<ReleaseSmokePreflightResult> {
  const { target, inbox, cookies } = validateConfiguration(env);
  const roles = {} as Record<SmokeRole, string>;
  const failures: string[] = [];

  for (const { name } of RELEASE_SMOKE_ROLES) {
    try {
      const response = await fetchImpl(`${target.origin}/api/auth/user`, {
        headers: { Cookie: cookies[name] },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        failures.push(`${name} staging session was rejected (HTTP ${response.status})`);
        continue;
      }

      let user: unknown;
      try {
        user = await response.json();
      } catch {
        failures.push(`${name} staging session returned an invalid user response`);
        continue;
      }

      const actualRole = returnedRole(user);
      if (actualRole !== name) {
        failures.push(
          `${name} staging session returned role ${actualRole ?? "unknown"}`,
        );
        continue;
      }
      roles[name] = actualRole;
    } catch {
      failures.push(`${name} staging session could not reach the target`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`role checks failed: ${failures.join("; ")}`);
  }

  return {
    baseUrl: target.origin,
    testInboxConfigured: Boolean(inbox),
    roles,
  };
}

async function main(): Promise<void> {
  const result = await runReleaseSmokePreflight();
  console.log(
    `Release smoke preflight passed for ${result.baseUrl}: ` +
      `parent, provider, and admin sessions are distinct and role-verified; ` +
      "designated test inbox is configured.",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      `Release smoke preflight failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    process.exitCode = 1;
  });
}