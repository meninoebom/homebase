// Masthead — the top of the strategic accordion, as an expand/collapse header.
//
// Two states on a full-bleed rust band:
//
//   - Collapsed (the everyday view): a slim functional bar — wordmark + date
//     on the left, an "About" disclosure and "Open today's page" on the right.
//     Keeps the band out of the way so the accordion (the actual tool) sits
//     near the top.
//
//   - Expanded (the About panel): clicking "About" opens the band to reveal
//     the concentric horizons emblem and a succinct what-it-is + how-to-start.
//     This replaces the old standalone /about route — About is now a
//     disclosure, not a page.
//
// First load auto-opens the panel (a one-time localStorage flag), so a new
// visitor reads the intro without hunting for it; every visit after starts
// collapsed. The user can reopen it any time via the About toggle.

import { useEffect, useState } from "react";
import { HorizonEmblem } from "./HorizonEmblem";
import { PeriodKey } from "../lib/period-key";

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

// Cream-on-rust palette for the hero band. The strategy-scope tokens are
// tuned for dark-ink-on-bone; inside the saturated band we flip to bone
// text on rust, with marigold as the one warm highlight.
const HERO_BG = "var(--accent-1)"; // rust #7a2618 — Homebase's deepest accent
const HERO_TEXT = "var(--paper-1)"; // bone
const HERO_MUTED = "rgba(236, 230, 218, 0.72)"; // bone @ 72%
const HERO_GOLD = "var(--accent-2-soft)"; // marigold-soft
const HERO_HAIRLINE = "rgba(236, 230, 218, 0.16)";

const SEEN_INTRO_KEY = "homebase.seenIntro";

// Auto-open on a visitor's first load; collapsed thereafter.
function computeInitialOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !localStorage.getItem(SEEN_INTRO_KEY);
  } catch {
    return false;
  }
}

export function Masthead({ onDayClick }: { onDayClick?: () => void }) {
  const [open, setOpen] = useState(computeInitialOpen);

  // Mark the intro as seen so it only auto-opens once.
  useEffect(() => {
    try {
      localStorage.setItem(SEEN_INTRO_KEY, "1");
    } catch {
      // Private mode / storage disabled: the panel just auto-opens each
      // visit. Harmless.
    }
  }, []);

  const now = new Date();
  const weekday = DAYS[now.getDay()];
  const date = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const weekKey = PeriodKey.current("week", now);
  const weekNum = weekKey ? Number(weekKey.split("-W")[1]) : null;
  const subline = weekNum ? `Week ${weekNum}` : "";

  return (
    <header
      className="masthead relative w-full overflow-hidden"
      style={{ background: HERO_BG, color: HERO_TEXT }}
    >
      {/* Faint geometric line-art, parked on the right, behind everything. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
        style={{
          background:
            "repeating-linear-gradient(135deg, transparent 0 38px, rgba(236,230,218,0.06) 38px 39px)",
          maskImage: "linear-gradient(to left, black, transparent)",
          WebkitMaskImage: "linear-gradient(to left, black, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[1040px] px-10 md:px-20">
        {/* Slim bar — always visible. Single-line elements, vertically
            centered, so nothing floats off-axis. px-4 matches the accordion
            rows so the wordmark shares one left edge with the titles below. */}
        <div className="flex items-center justify-between gap-6 px-4 py-6">
          <h1
            style={{
              fontFamily: "var(--font-serif-display)",
              fontWeight: 600,
              fontSize: "30px",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: HERO_TEXT,
              margin: 0,
            }}
          >
            Homebase
          </h1>

          <div className="flex shrink-0 items-center gap-6">
            <div
              className="hidden md:block"
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: HERO_TEXT }}>
                {weekday}, {date}
              </span>
              {subline && <span style={{ color: HERO_MUTED }}> · {subline}</span>}
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 transition-opacity hover:opacity-80"
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: HERO_TEXT,
              }}
            >
              {open ? "Close" : "About"}
              <span aria-hidden="true" style={{ fontSize: "11px" }}>
                {open ? "▴" : "▾"}
              </span>
            </button>
          </div>
        </div>

        {/* Expanded About panel — emblem + succinct what-it-is + how-to-start. */}
        {open && (
          <div
            className="flex flex-col gap-12 px-4 pt-9 pb-12 md:flex-row-reverse md:items-start md:justify-between"
            style={{ borderTop: `1px solid ${HERO_HAIRLINE}` }}
          >
            <HorizonEmblem />
            {/* Reading text is left-aligned and shares the wordmark's left
                edge — one clean vertical line down the page. */}
            <div className="flex max-w-[46ch] flex-col items-start gap-5">
              <div
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: HERO_GOLD,
                }}
              >
                What Homebase is
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "20px",
                  fontWeight: 400,
                  lineHeight: 1.5,
                  letterSpacing: "-0.01em",
                  color: HERO_TEXT,
                }}
              >
                A writing tool for people who keep their thinking in plain text. Reflect at long
                horizons on the home page; write freely on the daily page. Every entry is a markdown
                file in a folder you point us at. No server, no account, no lock-in. Your journal is
                a folder you can grep, back up, and open in any editor.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: 1.55,
                  letterSpacing: "-0.01em",
                  color: HERO_MUTED,
                }}
              >
                And because the words are yours, it's built to talk back. Point an AI you trust at
                your folder and ask it about yourself: what you keep circling back to, what's
                shifted since spring. That part is still growing.
              </p>
              <div
                className="flex flex-col gap-1.5"
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: HERO_MUTED,
                }}
              >
                <span>1 · Open a horizon</span>
                <span>2 · Write in plain markdown</span>
                <span>3 · It saves as a file you own</span>
              </div>
              <button
                type="button"
                onClick={onDayClick}
                className="mt-1 cursor-pointer rounded-full px-7 py-3.5 transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  background: HERO_TEXT,
                  color: HERO_BG,
                  border: "none",
                }}
              >
                Start with today &rarr;
              </button>
              {/* The critical practical facts the old /about page carried,
                  compressed to one quiet line so the dropdown stands alone. */}
              <p
                className="mt-1"
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  color: "rgba(236, 230, 218, 0.5)",
                }}
              >
                Chromium browsers · autosaves as you write · works offline
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
