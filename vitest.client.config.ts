import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest config for browser-side (React component) tests.
 * Uses happy-dom so React and the DOM APIs are available.
 *
 * Run with:  npx vitest run --config vitest.client.config.ts
 *
 * Note: We intentionally skip @vitejs/plugin-react here.
 * Vite 6 / Vitest 4 now uses oxc as its default transformer and the
 * Babel-based react plugin conflicts with it (oxc wins but then drops
 * esbuild JSX transforms, leaving JSX unprocessed). Instead we configure
 * oxc directly via the top-level `oxc` option, telling it to use React's
 * automatic JSX runtime — which overrides the `jsx: preserve` in tsconfig.
 */
export default defineConfig({
  // oxc is vite 6's default transformer; configure it to handle React JSX.
  // OxcOptions.jsx accepts the same shape as oxc-transform's JsxOptions.
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react",
    } as Record<string, unknown>,
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./client/src/__tests__/setup.ts"],
    include: ["client/src/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
});
