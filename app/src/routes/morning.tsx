// The morning hub — all sections on one scrollable page.
//
// Replaces the sequential wizard (2026-04-13) because Brandon's original
// vision was always "one-stop shop where I can see everything in one place."
// The Capacities template he used for months was a single long page, and
// that's what this is: a daily worksheet, not a wizard.
//
// Save model: Cmd-S writes all non-empty sections to the day log via the
// Rust `save_day` command. Drafts live in Zustand (persisted to localStorage)
// for crash recovery between saves.

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

import { getSlot, slotOrder } from "../slots/registry";
import { useRitualStore } from "../store/ritual";

export const Route = createFileRoute("/morning")({
  component: MorningHub,
});

// Section titles — dreams has none (it's just the prompt at the top).
const SECTION_TITLES: Record<string, string> = {
  "inner-weather": "Inner Weather",
  "morning-practices": "Morning Practices",
  piano: "Piano",
  creative: "Creative Projects",
};

function MorningHub() {
  const startMorning = useRitualStore((s) => s.startMorning);
  const setDraft = useRitualStore((s) => s.setDraft);
  const saveMorning = useRitualStore((s) => s.saveMorning);
  const saving = useRitualStore((s) => s.saving);
  const lastSavedAt = useRitualStore((s) => s.lastSavedAt);
  const reset = useRitualStore((s) => s.reset);
  const drafts = useRitualStore((s) => s.drafts);

  useEffect(() => {
    startMorning();
  }, [startMorning]);

  const handleSave = useCallback(async () => {
    try {
      await saveMorning();
    } catch (err) {
      console.error("save failed:", err);
    }
  }, [saveMorning]);

  // Keyboard shortcuts: Cmd-S saves, Cmd-Shift-R resets
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        reset();
        startMorning();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, reset, startMorning]);

  const today = new Date();
  const dateline = today
    .toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const savedLabel = lastSavedAt
    ? `saved ${new Date(lastSavedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase()}`
    : "";

  return (
    <main className="flex h-screen flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[640px] px-10 pb-16 pt-8">
          {/* Dateline */}
          <p className="font-sans text-[11px] tracking-[0.1em] text-[#9CA3AF]">{dateline}</p>

          {/* Sections */}
          {slotOrder.map((slotId, i) => {
            const slot = getSlot(slotId);
            if (!slot) return null;
            const SlotComponent = slot.component;
            const title = SECTION_TITLES[slotId];

            return (
              <section
                key={slotId}
                className={i > 0 ? "mt-2 border-t border-[#EBEBEB] pt-5" : "mt-4"}
              >
                {title && (
                  <h2 className="mb-3 font-serif text-[20px] font-light italic text-[#111111]">
                    {title}
                  </h2>
                )}
                <SlotComponent
                  mode="morning"
                  initialDraft={drafts[slotId] ?? ""}
                  onDraft={(body) => setDraft(slotId, body)}
                />
              </section>
            );
          })}

          {/* Briefing (placeholder — agent-generated content comes later) */}
          <div className="mt-4 rounded-md bg-[#F8F8F8] px-4 py-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-[16px] italic text-[#6B7280]">Briefing</h2>
              <span className="font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
                generated
              </span>
            </div>
            <p className="mt-2 font-serif text-[14px] italic leading-relaxed text-[#6B7280]">
              "The only way to do great work is to love what you do."
            </p>
            <p className="mt-2 font-sans text-[11px] text-[#D1D5DB]">
              Briefing integrations (calendar, elder care) come later.
            </p>
          </div>

          {/* Tend (placeholder — read-only to-do list comes later) */}
          <div className="mt-2 rounded-md bg-[#F8F8F8] px-4 py-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-[16px] italic text-[#6B7280]">Today in Tend</h2>
              <a
                href="https://tendyourgarden.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-[10px] text-[#D1D5DB] underline decoration-dotted"
              >
                open
              </a>
            </div>
            <p className="mt-2 font-sans text-[11px] text-[#D1D5DB]">
              Tend integration ships when the API is ready.
            </p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <footer className="flex items-center justify-between border-t border-[#EBEBEB] px-6 py-2">
        <span className="font-sans text-[11px] text-[#D1D5DB]">
          {saving ? "saving…" : savedLabel}
        </span>
        <span className="font-sans text-[11px] text-[#D1D5DB]">
          <kbd className="rounded border border-[#EBEBEB] px-1 py-0.5 font-sans text-[10px] text-[#9CA3AF]">
            ⌘S
          </kbd>{" "}
          save
        </span>
      </footer>
    </main>
  );
}
