import { createRootRoute, Outlet } from "@tanstack/react-router";

/*
 * Root layout. Intentionally minimal — no nav bar, no header, no sidebar. The
 * morning ritual opens full-bleed into whatever the active route renders, and
 * chrome is explicitly rejected (plan §15 rule 1: the morning is the center of
 * gravity, not a dashboard).
 */
export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-paper text-ink font-serif">
      <Outlet />
    </div>
  );
}
