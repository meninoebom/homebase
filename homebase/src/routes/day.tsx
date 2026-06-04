// /day — today's writing surface. The Day-row portal on / lands here.
//
// Renamed from /morning on 2026-05-15 because the page isn't necessarily
// a "morning ritual" — it's the day's working page. Same component, new
// name. The /morning path is retired (no redirect — the only caller was
// the Day-row portal on /, which now points here).
//
// Typography modernized in the same pass: Inter Tight throughout, no
// italics, larger sizes. The page is still on a white surface — that's
// deliberate; writing surfaces stay white while the strategic accordion
// keeps its warm bone register. See the .strategy-scope note in
// index.css for the broader two-rooms rationale.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { DayLoadError } from "../components/DayLoadError";
import { FolderAccessError } from "../components/FolderAccessError";
import { PromptSlot } from "../components/PromptSlot";
import { WorkspaceSlot } from "../components/WorkspaceSlot";
import { useRitualStore } from "../store/ritual";
import type { HomebaseConfig, SlotConfig } from "../lib/config";

// Inter Tight chain — kept inline rather than in @theme so the existing
// --font-sans / --font-serif tokens remain untouched for code that
// still relies on them (CodeMirror reads them too).
const DAY_SANS =
  "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif";

export const Route = createFileRoute("/day")({
  component: DayPage,
});

/**
 * Footer status text. A failed autosave must not keep showing the stale
 * "saved …" label — surface the failure instead. Pure + exported for testing.
 */
export function saveFooterText(saving: boolean, saveError: boolean, savedLabel: string): string {
  if (saving) return "saving…";
  if (saveError) return "couldn’t save — check your folder";
  return savedLabel;
}

function DayPage() {
  const navigate = useNavigate();
  const loadToday = useRitualStore((s) => s.loadToday);
  const setDraft = useRitualStore((s) => s.setDraft);
  const saveNow = useRitualStore((s) => s.saveNow);
  const resetToDefaults = useRitualStore((s) => s.resetToDefaults);
  const saving = useRitualStore((s) => s.saving);
  const saveError = useRitualStore((s) => s.saveError);
  const lastSavedAt = useRitualStore((s) => s.lastSavedAt);
  const drafts = useRitualStore((s) => s.drafts);
  const loaded = useRitualStore((s) => s.loaded);
  const config = useRitualStore((s) => s.config);
  const configError = useRitualStore((s) => s.configError);
  const draftsError = useRitualStore((s) => s.draftsError);
  const accessError = useRitualStore((s) => s.accessError);

  useEffect(() => {
    // loadToday surfaces every read/write failure internally — config content
    // (configError), day-file read (draftsError), and folder access
    // (accessError) — and never rejects, so `void` is safe here.
    void loadToday();
  }, [loadToday]);

  // Auto-save 800ms after any draft change. Gated on `loaded` so we don't
  // race-write an empty file before the disk read settles, and on
  // `!draftsError` / `!accessError` so we never write over a day file that
  // failed to load or into a folder we can't reach.
  useEffect(() => {
    if (!loaded || !config || draftsError || accessError) return;
    const timer = setTimeout(() => {
      void saveNow();
    }, 800);
    return () => clearTimeout(timer);
  }, [drafts, saveNow, loaded, config, draftsError, accessError]);

  // Folder unreachable is the most fundamental failure (config + drafts both
  // depend on it), so check it before the content-level recovery screens.
  if (accessError) {
    return <FolderAccessError onRetry={() => void loadToday()} />;
  }

  if (configError) {
    return <ConfigRecoveryScreen error={configError} onReset={() => void resetToDefaults()} />;
  }

  if (draftsError) {
    return <DayLoadError onRetry={() => void loadToday()} />;
  }

  const today = new Date();
  const dateline = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const savedLabel = lastSavedAt
    ? `saved ${new Date(lastSavedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase()}`
    : "";

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: DAY_SANS }}>
      <div className="mx-auto max-w-[780px] px-8 pt-8 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="cursor-pointer border-0 bg-transparent p-0 transition-colors hover:text-[#111]"
            style={{
              fontFamily: DAY_SANS,
              fontSize: "14px",
              fontWeight: 600,
              color: "#6B7280",
            }}
          >
            ← Homebase
          </button>
          <p
            style={{
              fontFamily: DAY_SANS,
              fontSize: "14px",
              fontWeight: 600,
              color: "#374151",
              margin: 0,
            }}
          >
            {dateline}
          </p>
        </div>

        {loaded && config && <BriefingPanel config={config} />}

        {loaded && config && config.slots.length === 0 && (
          <EmptyState onCustomize={() => navigate({ to: "/settings" })} />
        )}

        {loaded &&
          config?.slots.map((slot, i) => (
            <section key={slot.id} className={i > 0 ? "mt-6 border-t border-[#EBEBEB] pt-5" : ""}>
              {slot.kind !== "prompt" || slot.title ? (
                <h2
                  className="mb-2"
                  style={{
                    fontFamily: DAY_SANS,
                    fontSize: "24px",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    color: "#111",
                  }}
                >
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

      <footer
        className="sticky bottom-0 flex items-center justify-between border-t border-[#EBEBEB] bg-white px-6 py-2"
        style={{ fontFamily: DAY_SANS }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/settings" })}
          className="cursor-pointer border-0 bg-transparent p-0 transition-colors hover:text-[#111]"
          style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280" }}
        >
          Customize
        </button>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: !saving && saveError ? "#B91C1C" : "#9CA3AF",
          }}
        >
          {saveFooterText(saving, saveError, savedLabel)}
        </span>
      </footer>
    </main>
  );
}

export function EmptyState({ onCustomize }: { onCustomize: () => void }) {
  return (
    <div
      className="mt-12 flex flex-col items-center gap-4 rounded border border-dashed border-[#E5E7EB] px-6 py-12 text-center"
      style={{ fontFamily: DAY_SANS }}
    >
      <p style={{ fontSize: "18px", fontWeight: 500, color: "#6B7280" }}>
        Your homebase has no slots yet.
      </p>
      <p
        data-testid="slot-gloss"
        style={{ fontSize: "14px", color: "#9CA3AF", maxWidth: "38ch", lineHeight: 1.5 }}
      >
        A slot is a named section of your day — a prompt, a running workspace, or anything you want
        to keep in view.
      </p>
      <button
        type="button"
        onClick={onCustomize}
        className="cursor-pointer rounded bg-[#111] px-5 py-2.5 text-white hover:bg-[#374151]"
        style={{ fontFamily: DAY_SANS, fontSize: "15px", fontWeight: 600 }}
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
    <div className="mb-6 rounded bg-[#F8F8F8] px-4 py-3" style={{ fontFamily: DAY_SANS }}>
      <div className="flex items-baseline justify-between">
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#6B7280", margin: 0 }}>Briefing</h2>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#D1D5DB",
          }}
        >
          generated
        </span>
      </div>
      <p
        className="mt-2"
        style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.5, color: "#4B5563", margin: 0 }}
      >
        “{quote}”
      </p>
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
    <main className="min-h-screen bg-white" style={{ fontFamily: DAY_SANS }}>
      <div className="mx-auto max-w-[640px] px-8 pt-12 pb-12">
        <h1
          className="mb-4"
          style={{
            fontFamily: DAY_SANS,
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#111",
          }}
        >
          Your homebase config has a problem
        </h1>
        <p style={{ fontSize: "17px", lineHeight: 1.55, color: "#374151", margin: "0 0 16px" }}>
          The file <code className="font-mono text-[14px]">homebase.config.json</code> in your log
          directory couldn't be loaded. Until it's fixed or reset, your daily page can't render.
        </p>

        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#9CA3AF",
            margin: "0 0 12px",
          }}
        >
          {error.kind === "parse-error" ? "Parse error" : "Schema error"} ·{" "}
          <span style={{ textTransform: "lowercase", letterSpacing: "normal", color: "#6B7280" }}>
            you can also fix this by editing the file directly in any text editor
          </span>
        </p>

        {error.kind === "parse-error" ? (
          <pre className="mb-6 rounded bg-[#FEF2F2] p-3 font-mono text-[13px] whitespace-pre-wrap text-[#991B1B]">
            {error.message}
          </pre>
        ) : (
          <ul className="mb-6 list-disc rounded bg-[#FEF2F2] p-3 pl-7 font-mono text-[13px] text-[#991B1B]">
            {error.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer rounded bg-[#111] px-5 py-2.5 text-white hover:bg-[#374151]"
          style={{ fontFamily: DAY_SANS, fontSize: "15px", fontWeight: 600 }}
        >
          Reset to defaults
        </button>
        <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "12px 0 0" }}>
          Resetting overwrites homebase.config.json with the standard slot set. Your day-file
          content is untouched.
        </p>
      </div>
    </main>
  );
}
