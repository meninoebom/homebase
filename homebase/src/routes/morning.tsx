import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { PromptSlot } from "../components/PromptSlot";
import { WorkspaceSlot } from "../components/WorkspaceSlot";
import { useRitualStore } from "../store/ritual";
import type { HomebaseConfig, SlotConfig } from "../lib/config";

export const Route = createFileRoute("/morning")({
  component: MorningHub,
});

function MorningHub() {
  const navigate = useNavigate();
  const loadToday = useRitualStore((s) => s.loadToday);
  const setDraft = useRitualStore((s) => s.setDraft);
  const saveNow = useRitualStore((s) => s.saveNow);
  const resetToDefaults = useRitualStore((s) => s.resetToDefaults);
  const saving = useRitualStore((s) => s.saving);
  const lastSavedAt = useRitualStore((s) => s.lastSavedAt);
  const drafts = useRitualStore((s) => s.drafts);
  const loaded = useRitualStore((s) => s.loaded);
  const config = useRitualStore((s) => s.config);
  const configError = useRitualStore((s) => s.configError);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  // Auto-save 800ms after any draft change. Gated on `loaded` so we
  // don't race-write an empty file before the disk read settles.
  useEffect(() => {
    if (!loaded || !config) return;
    const timer = setTimeout(() => {
      void saveNow();
    }, 800);
    return () => clearTimeout(timer);
  }, [drafts, saveNow, loaded, config]);

  if (configError) {
    return <ConfigRecoveryScreen error={configError} onReset={() => void resetToDefaults()} />;
  }

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

        {loaded && config && <BriefingPanel config={config} />}

        {loaded && config && config.slots.length === 0 && (
          <EmptyState onCustomize={() => navigate({ to: "/settings" })} />
        )}

        {loaded &&
          config?.slots.map((slot, i) => (
            <section key={slot.id} className={i > 0 ? "mt-4 border-t border-[#EBEBEB] pt-3" : ""}>
              {slot.kind !== "prompt" || slot.title ? (
                <h2 className="mb-1 font-serif text-[17px] font-light italic text-[#111]">
                  {slot.title}
                </h2>
              ) : null}
              <SlotRenderer
                slot={slot}
                initialDraft={drafts[slot.id] ?? ""}
                onDraft={(body) => setDraft(slot.id, body)}
              />
            </section>
          ))}
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-[#EBEBEB] bg-white px-6 py-1.5">
        <button
          type="button"
          onClick={() => navigate({ to: "/settings" })}
          className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[11px] uppercase tracking-[0.18em] text-[#9CA3AF] hover:text-[#111]"
        >
          Customize
        </button>
        <span className="font-sans text-[11px] text-[#D1D5DB]">
          {saving ? "saving…" : savedLabel}
        </span>
      </footer>
    </main>
  );
}

function EmptyState({ onCustomize }: { onCustomize: () => void }) {
  return (
    <div className="mt-12 flex flex-col items-center gap-4 rounded border border-dashed border-[#E5E7EB] px-6 py-12 text-center">
      <p className="font-serif text-[16px] italic text-[#6B7280]">
        Your homebase has no slots yet.
      </p>
      <button
        type="button"
        onClick={onCustomize}
        className="cursor-pointer rounded bg-[#111] px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-[#374151]"
      >
        Customize your homebase →
      </button>
    </div>
  );
}

function SlotRenderer({
  slot,
  initialDraft,
  onDraft,
}: {
  slot: SlotConfig;
  initialDraft: string;
  onDraft: (body: string) => void;
}) {
  if (slot.kind === "prompt") {
    return <PromptSlot config={slot} initialDraft={initialDraft} onDraft={onDraft} />;
  }
  return <WorkspaceSlot config={slot} initialDraft={initialDraft} onDraft={onDraft} />;
}

function BriefingPanel({ config }: { config: HomebaseConfig }) {
  if (!config.briefing.enabled || config.briefing.quotes.length === 0) return null;
  // Stable hash on today's date — same quote all day, rotates daily.
  const today = todayKey();
  const idx = stableHash(today) % config.briefing.quotes.length;
  const quote = config.briefing.quotes[idx];

  return (
    <div className="mb-4 rounded bg-[#F8F8F8] px-3 py-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[14px] italic text-[#6B7280]">Briefing</h2>
        <span className="font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
          generated
        </span>
      </div>
      <p className="mt-1 font-serif text-[13px] italic leading-snug text-[#9CA3AF]">"{quote}"</p>
    </div>
  );
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function ConfigRecoveryScreen({
  error,
  onReset,
}: {
  error: { kind: "parse-error"; message: string } | { kind: "schema-error"; issues: string[] };
  onReset: () => void;
}) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[640px] px-8 pb-12 pt-12">
        <h1 className="mb-4 font-serif text-[22px] italic text-[#111]">
          Your homebase config has a problem
        </h1>
        <p className="mb-3 font-serif text-[15px] leading-relaxed text-[#374151]">
          The file <code className="font-mono text-[13px]">homebase.config.json</code> in your log
          directory couldn't be loaded. Until it's fixed or reset, the morning page can't render.
        </p>

        <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">
          {error.kind === "parse-error" ? "Parse error" : "Schema error"} ·{" "}
          <span className="lowercase tracking-normal text-[#6B7280]">
            you can also fix this by editing the file directly in any text editor
          </span>
        </p>

        {error.kind === "parse-error" ? (
          <pre className="mb-6 whitespace-pre-wrap rounded bg-[#FEF2F2] p-3 font-mono text-[12px] text-[#991B1B]">
            {error.message}
          </pre>
        ) : (
          <ul className="mb-6 list-disc rounded bg-[#FEF2F2] p-3 pl-7 font-mono text-[12px] text-[#991B1B]">
            {error.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer rounded bg-[#111] px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-[#374151]"
        >
          Reset to defaults
        </button>
        <p className="mt-3 font-sans text-[11px] text-[#9CA3AF]">
          Resetting overwrites homebase.config.json with the standard slot set. Your day-file
          content is untouched.
        </p>
      </div>
    </main>
  );
}
