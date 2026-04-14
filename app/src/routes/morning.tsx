// The morning hub — all sections on one scrollable page.
// Compact layout: editors are content-height, not viewport-height.
// The page scrolls normally like a web form.

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

import { getSlot, slotOrder } from "../slots/registry";
import { useRitualStore } from "../store/ritual";

export const Route = createFileRoute("/morning")({
  component: MorningHub,
});

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
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[780px] px-8 pb-12 pt-6">
        {/* Dateline */}
        <p className="mb-4 font-sans text-[11px] tracking-[0.1em] text-[#9CA3AF]">{dateline}</p>

        {/* Sections */}
        {slotOrder.map((slotId, i) => {
          const slot = getSlot(slotId);
          if (!slot) return null;
          const SlotComponent = slot.component;
          const title = SECTION_TITLES[slotId];

          return (
            <section key={slotId} className={i > 0 ? "mt-4 border-t border-[#EBEBEB] pt-3" : ""}>
              {title && (
                <h2 className="mb-1 font-serif text-[17px] font-light italic text-[#111]">
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

        {/* Briefing placeholder */}
        <div className="mt-4 rounded bg-[#F8F8F8] px-3 py-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-[14px] italic text-[#6B7280]">Briefing</h2>
            <span className="font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
              generated
            </span>
          </div>
          <p className="mt-1 font-serif text-[13px] italic leading-snug text-[#9CA3AF]">
            "The only way to do great work is to love what you do."
          </p>
        </div>

        {/* Tend placeholder */}
        <div className="mt-2 rounded bg-[#F8F8F8] px-3 py-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-[14px] italic text-[#6B7280]">Today in Tend</h2>
            <a
              href="https://tendyourgarden.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[10px] text-[#D1D5DB] underline decoration-dotted"
            >
              open
            </a>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <footer className="sticky bottom-0 flex items-center justify-between border-t border-[#EBEBEB] bg-white px-6 py-1.5">
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
