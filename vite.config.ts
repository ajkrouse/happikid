import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
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
    // Warn when any individual chunk exceeds 500 kB (gzipped target: ~150 kB).
    // This acts as a CI-visible signal before bundle bloat ships to users.
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
