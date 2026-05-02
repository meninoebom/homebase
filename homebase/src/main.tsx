import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { SetupGate } from "./components/SetupGate";
import "./index.css";

// basepath comes from Vite's base config (/ in dev, /homebase/ in prod
// build per vite.config.ts). Trailing slash trimmed because TanStack
// Router expects the basepath without one.
const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, "") || undefined,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <SetupGate>
      <RouterProvider router={router} />
    </SetupGate>
  </React.StrictMode>,
);
