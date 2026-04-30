// /strategy — the strategic accordion, the new front door for Homebase
// (per the active-plan's "Solution" framing). For this issue (#9) it lives
// at /strategy alongside /morning. #13 swaps it to "/" and the morning
// route stays accessible via the Day-row portal.
//
// Three things compose here: the Lapham CSS token scope, the masthead
// (deck + title + dateline + terracotta rule), and the six HorizonRows
// in fixed order. Day's onDayClick is wired in #11.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HorizonRow } from "../components/HorizonRow";
import { StrategyPermissionGate } from "../components/StrategyPermissionGate";
import { PeriodKey } from "../lib/period-key";

export const Route = createFileRoute("/strategy")({
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
  // Extract just the "Wnn" portion from "YYYY-Wnn".
  const week = weekKey ? weekKey.split("-W")[1].replace(/^0/, "") : "";
  return `${day} · ${month} ${date}, ${year} · Week ${week}`;
}
