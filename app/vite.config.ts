import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://viteplus.dev/config
//
// Config is a plain object (not a function wrapper) so Vite+ can statically
// introspect the `fmt` field. Environment-dependent bits (TAURI_DEV_HOST) are
// read at module load, which happens once per invocation — same effect as
// using `defineConfig(async () => ({...}))` but keeps the tooling happy.
export default defineConfig({
  plugins: [
    // Order matters: TanStack Router plugin must run before the React plugin so
    // the generated routeTree.gen.ts exists before React compiles imports.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],

  // Oxfmt ignore patterns — oxfmt is the formatter bundled with Vite+ and
  // runs via `vp check`. The auto-generated route tree regenerates on every
  // build, so formatting it would just loop. Tauri's config lives outside
  // the frontend ecosystem and uses its own conventions.
  fmt: {
    ignorePatterns: ["**/*.gen.ts", "dist/**", "src-tauri/**", "pnpm-lock.yaml"],
  },

  // Vite options tailored for Tauri development, only applied in `vp dev`
  // or `vp build` (invoked through Tauri's beforeDevCommand / beforeBuildCommand).
  clearScreen: false,
  server: {
    // Tauri expects a fixed port.
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
