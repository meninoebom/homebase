// The last screen of the morning sequence. Single italic line, filename below,
// four-second hold, then the window closes itself. Must NOT be a dashboard
// (plan §17's first deliberate exclusion) or a recap screen.
//
// The window auto-close on macOS uses Tauri v2's webviewWindow API. On the
// first build, if the close call fails for any reason (permissions, race),
// we log the error to the devtools console and leave the window open — the
// morning is over either way.

import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { todayISO } from "../lib/log";

interface EndOfMorningProps {
  elapsedMs: number;
  slotCount: number;
}

const AUTO_CLOSE_MS = 4000;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function EndOfMorning({ elapsedMs, slotCount }: EndOfMorningProps) {
  const date = new Date();
  const loggedAt = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const dayFull = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      getCurrentWindow()
        .close()
        .catch((err) => {
          // Tauri rejects window.close() in some test harnesses; leaving the
          // window open is a recoverable state, not a crash.
          console.warn("could not auto-close window:", err);
        });
    }, AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[62ch] flex-col items-center gap-8 px-8 text-center">
      <p className="font-serif text-[28px] italic leading-[1.28] text-ink-muted">
        {dayFull}. Logged at {loggedAt}.
      </p>
      <p className="font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
        {formatElapsed(elapsedMs)} · {slotCount} {slotCount === 1 ? "slot" : "slots"} · log/
        {todayISO()}.md
      </p>
    </div>
  );
}
