// "/" — the strategic accordion as front door of Homebase.
//
// Pre-2026-04-30 this route redirected to /morning (the morning ritual was
// the center of gravity). The strategic-layer plan (#13) flips that: "/"
// is the strategic accordion — life values, life goals, year, month, week
// — and the morning ritual is reachable via the Day-row portal. The
// existing /morning route is unchanged; only the front door moved.
//
// State preservation across the Day → /morning → back round-trip is
// inherited from Zustand: useStrategyStore is module-scoped, so unmounting
// and remounting the accordion (route nav out and back) leaves the row
// state intact. No persist-middleware required for the in-session round-
// trip; persistent reload state is out of scope for v1.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HorizonRow } from "../components/HorizonRow";
import { Masthead } from "../components/Masthead";

export const Route = createFileRoute("/")({
  component: StrategyAccordion,
});

function StrategyAccordion() {
  const navigate = useNavigate();
  return (
    <div className="strategy-scope min-h-screen">
      <div className="mx-auto max-w-[760px] px-8 pt-16 pb-24">
        <Masthead />
        <div className="toc flex flex-col">
          <HorizonRow horizon="life-values" />
          <HorizonRow horizon="life-goals" />
          <HorizonRow horizon="year" />
          <HorizonRow horizon="month" />
          <HorizonRow horizon="week" />
          <HorizonRow horizon="day" onDayClick={() => navigate({ to: "/morning" })} />
        </div>
        <footer className="mt-18 flex flex-col items-center gap-3">
          <div
            className="font-sans text-[10px] font-medium uppercase"
            style={{ color: "var(--ink-4)", letterSpacing: "0.28em" }}
          >
            VOL. I <span aria-hidden="true">·</span> HOMEBASE 2026
          </div>
          <Link
            to="/settings"
            className="font-sans text-[10px] font-medium uppercase transition-colors hover:text-[var(--ink-1)]"
            style={{ color: "var(--ink-4)", letterSpacing: "0.28em" }}
          >
            Folders
          </Link>
        </footer>
      </div>
    </div>
  );
}
