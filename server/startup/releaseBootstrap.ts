import { runMigrations } from "../db/migrate";

export interface ReleaseBootstrapDependencies {
  migrate?: () => Promise<void>;
  startServer?: () => Promise<unknown>;
}

/**
 * A release must finish migrations before importing the HTTP server. Keeping
 * the import behind this gate means a migration error cannot leave a listener
 * serving an incompatible schema.
 */
export async function startAfterMigrations(
  dependencies: ReleaseBootstrapDependencies = {},
): Promise<void> {
  const migrate = dependencies.migrate ?? runMigrations;
  const startServer = dependencies.startServer ?? (async () => {
    await import("../index");
  });

  await migrate();
  await startServer();
}