import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

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
    // PWA: Workbox-backed service worker + Web App Manifest. Lets the app
    // install as a standalone desktop window in Chromium browsers, and
    // caches the app shell so a cold reload (or offline open) is instant.
    VitePWA({
      registerType: "autoUpdate",
      // The icon set is generated at build time by vite-plugin-pwa from the
      // single source SVG at public/icon.svg. PNG variants land in dist/.
      includeAssets: ["icon.svg", "favicon.ico"],
      manifest: {
        name: "Homebase",
        short_name: "Homebase",
        description: "A strategic life guide.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FAF5EB",
        theme_color: "#7A2618",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Don't precache the SPA-fallback 404.html — it's a client-side
        // redirect shim (see #30), not a real page. The service worker
        // would otherwise intercept it on offline navigations.
        globIgnores: ["**/404.html"],
      },
    }),
  ],

  // oxfmt (bundled with Vite+) skips the generated route tree since it
  // regenerates every build — formatting it would loop.
  fmt: {
    ignorePatterns: ["**/*.gen.ts", "dist/**", "pnpm-lock.yaml"],
  },
});
