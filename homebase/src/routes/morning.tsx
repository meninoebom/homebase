import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

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
  const loadToday = useRitualStore((s) => s.loadToday);
  const setDraft = useRitualStore((s) => s.setDraft);
  const saveNow = useRitualStore((s) => s.saveNow);
  const saving = useRitualStore((s) => s.saving);
  const lastSavedAt = useRitualStore((s) => s.lastSavedAt);
  const drafts = useRitualStore((s) => s.drafts);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  // Auto-save 800ms after any draft change
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveNow();
    }, 800);
    return () => clearTimeout(timer);
  }, [drafts, saveNow]);

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
        <p className="mb-4 font-sans text-[11px] tracking-[0.1em] text-[#9CA3AF]">{dateline}</p>

        <div className="mb-4 rounded bg-[#F8F8F8] px-3 py-2">
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
      </div>

      <footer className="sticky bottom-0 flex items-center justify-end border-t border-[#EBEBEB] bg-white px-6 py-1.5">
        <span className="font-sans text-[11px] text-[#D1D5DB]">
          {saving ? "saving…" : savedLabel}
        </span>
      </footer>
    </main>
  );
}
