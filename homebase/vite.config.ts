import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://viteplus.dev/config
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

  // oxfmt (bundled with Vite+) skips the generated route tree since it
  // regenerates every build — formatting it would loop.
  fmt: {
    ignorePatterns: ["**/*.gen.ts", "dist/**", "pnpm-lock.yaml"],
  },
});
