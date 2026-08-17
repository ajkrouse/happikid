import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { gzipSync } from "zlib";
import { readFileSync, readdirSync } from "fs";

/**
 * Vite plugin: enforce a gzipped-size budget on the Search page chunk.
 *
 * Vite's built-in `chunkSizeWarningLimit` only checks raw (uncompressed) size.
 * This plugin fires after every build, compresses the Search chunk with gzip,
 * and emits a build warning when the chunk grows beyond the budget so that
 * regressions are visible in the build log before they reach users.
 *
 * @param budgetKB  Maximum allowed gzipped size in kilobytes (default 200).
 */
function searchChunkSizeBudget(budgetKB = 200) {
  let outDir: string;

  return {
    name: "search-chunk-size-budget",
    // Capture the resolved output directory from Vite's config.
    configResolved(resolved: { build: { outDir: string } }) {
      outDir = resolved.build.outDir;
    },
    // closeBundle fires after all files have been written to disk.
    closeBundle() {
      if (!outDir) return;

      const assetsDir = path.join(outDir, "assets");
      let files: string[];
      try {
        files = readdirSync(assetsDir);
      } catch {
        // outDir may not exist in watch/dev modes — skip silently.
        return;
      }

      // Match the Search page chunk (e.g. "Search-AbCdEfGh.js").
      // The name comes from Vite's chunk naming convention for page modules.
      const searchChunks = files.filter(
        (f) => f.startsWith("Search-") && f.endsWith(".js"),
      );

      if (searchChunks.length === 0) {
        // No Search chunk found — nothing to check.
        return;
      }

      const budgetBytes = budgetKB * 1024;

      for (const fileName of searchChunks) {
        const filePath = path.join(assetsDir, fileName);
        const code = readFileSync(filePath);
        const gzipped = gzipSync(code);
        const gzippedKB = Math.round(gzipped.length / 1024);

        if (gzipped.length > budgetBytes) {
          // Use console.warn so the message appears in build output and CI logs.
          console.warn(
            `\n⚠️  [search-chunk-size-budget] "${fileName}" is ${gzippedKB} KB gzipped` +
              ` — exceeds the ${budgetKB} KB budget.\n` +
              `   Review recent imports added to client/src/pages/Search.tsx.\n`,
          );
        } else {
          console.log(
            `✓  [search-chunk-size-budget] "${fileName}": ${gzippedKB} KB gzipped` +
              ` (budget: ${budgetKB} KB)`,
          );
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // Enforce 200 KB gzipped budget on the Search page chunk.
    searchChunkSizeBudget(200),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Warn when any individual chunk exceeds 500 kB (uncompressed).
    // The searchChunkSizeBudget plugin above enforces a tighter 200 KB gzipped
    // limit specifically on the Search page chunk.
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — always needed
          "vendor-react": ["react", "react-dom"],
          // Routing & data fetching
          "vendor-query": ["@tanstack/react-query", "wouter"],
          // Map library (leaflet + react-leaflet are large)
          "vendor-map": ["leaflet", "react-leaflet"],
          // Radix UI / shadcn component primitives
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-label",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-progress",
            "@radix-ui/react-toast",
            "@radix-ui/react-accordion",
            "@radix-ui/react-slot",
          ],
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
