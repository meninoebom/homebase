/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vitest-only config. Kept separate from vite.config.ts so the TanStack Router
// plugin and Tailwind plugin don't run during unit tests — tests should be
// fast, isolated, and not depend on the generated route tree.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
