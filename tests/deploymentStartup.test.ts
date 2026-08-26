import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

describe("production deployment commands", () => {
  it("builds and starts the HTTP server entrypoint", () => {
    expect(packageJson.scripts.build).toContain("server/index.ts");
    expect(packageJson.scripts.build).toContain("--outfile=dist/index.js");
    expect(packageJson.scripts.start).toContain("node dist/index.js");
  });

  it("does not mutate the database during build or startup", () => {
    const deploymentCommands = [
      packageJson.scripts.build,
      packageJson.scripts.start,
    ].join(" ");

    expect(deploymentCommands).not.toMatch(
      /db:(?:push|migrate)|drizzle-kit|migrate-cli|releaseBootstrap|server\/start\.ts/,
    );
  });
});