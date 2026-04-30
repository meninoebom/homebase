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

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HorizonRow } from "../components/HorizonRow";
import { StrategyPermissionGate } from "../components/StrategyPermissionGate";
import { PeriodKey } from "../lib/period-key";

export const Route = createFileRoute("/")({
  component: StrategyAccordion,
});

function StrategyAccordion() {
  const navigate = useNavigate();
  return (
    <StrategyPermissionGate>
      <div className="strategy-scope min-h-screen">
        <div className="mx-auto max-w-[720px] px-10 pb-16">
          <Masthead />
          <div className="stack mt-6 border-t" style={{ borderColor: "var(--hairline)" }}>
            <HorizonRow horizon="life-values" />
            <HorizonRow horizon="life-goals" />
            <HorizonRow horizon="year" />
            <HorizonRow horizon="month" />
            <HorizonRow horizon="week" />
            <HorizonRow horizon="day" onDayClick={() => navigate({ to: "/morning" })} />
          </div>
        </div>
      </div>
    </StrategyPermissionGate>
  );
}

function Masthead() {
  const today = new Date();
  const dateline = formatDateline(today);
  return (
    <header className="pt-9 text-center">
      <div
        className="mb-2 font-sans text-[10px] uppercase"
        style={{ color: "var(--ink-faint)", letterSpacing: "0.18em" }}
      >
        a strategic life guide
      </div>
      <h1
        className="font-serif text-[38px] font-light italic leading-[1.1] tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        Homebase
      </h1>
      <div
        className="mt-2 font-sans text-[11px] uppercase"
        style={{ color: "var(--ink-faint)", letterSpacing: "0.1em" }}
      >
        {dateline}
      </div>
      <div
        className="mx-auto mt-4 h-px w-9"
        style={{ background: "var(--terracotta)" }}
        aria-hidden="true"
      />
    </header>
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDateline(d: Date): string {
  const day = DAYS[d.getDay()];
  const month = MONTHS[d.getMonth()];
  const date = d.getDate();
  const year = d.getFullYear();
  const weekKey = PeriodKey.current("week", d);
  const week = weekKey ? weekKey.split("-W")[1].replace(/^0/, "") : "";
  return `${day} · ${month} ${date}, ${year} · Week ${week}`;
}
