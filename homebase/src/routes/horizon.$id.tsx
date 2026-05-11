// /horizon/:id — full-page editor for one strategic horizon.
//
// Reached from the SectionPreview's "Open" action on the
// accordion at /. Re-uses the same StrategyStore, MarkdownEditor,
// CarryOverBanner, HorizonInvitation, SaveIndicator, and useAutosave
// hook — the only thing this route adds is the page chrome (back link,
// title, large-scale layout) and the horizon-id parameter parsing.
//
// State preservation across the / → /horizon/:id round-trip is free
// because useStrategyStore is module-scoped (Zustand). A row that's
// expanded on / stays expanded on return; content edited here shows
// up immediately in the row's preview.

import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { CarryOverBanner } from "../components/CarryOverBanner";
import { HorizonInvitation } from "../components/HorizonInvitation";
import { MarkdownEditor } from "../components/MarkdownEditor";
import { SaveIndicator } from "../components/SaveIndicator";
import { useAutosave } from "../hooks/useAutosave";
import { PeriodKey, type Horizon } from "../lib/period-key";
import { useStrategyStore } from "../store/strategy";

export const Route = createFileRoute("/horizon/$id")({
  component: HorizonEditorPage,
});

const VALID_HORIZONS: ReadonlySet<string> = new Set([
  "life-values",
  "life-goals",
  "year",
  "month",
  "week",
]);

const TITLE: Record<Horizon, string> = {
  "life-values": "Life values",
  "life-goals": "Life goals",
  year: "Year",
  month: "Month",
  week: "Week",
};

function HorizonEditorPage() {
  const { id } = useParams({ from: "/horizon/$id" });
  const navigate = useNavigate();

  // Validate the route param before treating it as a Horizon. Bad ids
  // bounce back to /.
  useEffect(() => {
    if (!VALID_HORIZONS.has(id)) {
      navigate({ to: "/" });
    }
  }, [id, navigate]);

  if (!VALID_HORIZONS.has(id)) return null;
  const horizon = id as Horizon;

  return (
    <div className="strategy-scope min-h-screen">
      <div className="mx-auto max-w-[760px] px-8 pt-10 pb-24">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-14 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 py-1.5 font-sans text-[11px] font-medium uppercase transition-colors hover:text-[var(--ink-1)]"
          style={{ color: "var(--ink-3)", letterSpacing: "0.24em" }}
        >
          <span
            aria-hidden="true"
            className="italic"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "16px",
              transform: "translateY(-1px)",
            }}
          >
            ←
          </span>
          Homebase
        </button>
        <EditorBody horizon={horizon} />
      </div>
    </div>
  );
}

function EditorBody({ horizon }: { horizon: Horizon }) {
  const row = useStrategyStore((s) => s.rows[horizon]);
  const expandRow = useStrategyStore((s) => s.expandRow);
  const setContent = useStrategyStore((s) => s.setContent);
  const clearCarryOver = useStrategyStore((s) => s.clearCarryOver);

  const { flushNow } = useAutosave(horizon);

  // First mount: trigger expandRow so the store loads content + carry-over.
  // The accordion may have done this already; expandRow is idempotent
  // when loaded.
  useEffect(() => {
    if (!row.loaded) {
      expandRow(horizon).catch(() => {});
    }
  }, [horizon, row.loaded, expandRow]);

  // Flush in-flight buffer on unmount.
  useEffect(() => {
    return () => {
      if (row.dirty) flushNow().catch(() => {});
    };
    // Subscribed-once cleanup; the latest dirty/flushNow read at unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showInvitation = !row.carryOver && row.loaded && row.content === "";

  return (
    <div>
      <header className="mb-12 text-center">
        <div
          className="mb-3 font-sans text-[11px] font-medium uppercase"
          style={{ color: "var(--accent-1)", letterSpacing: "0.24em" }}
        >
          {metaFor(horizon)}
        </div>
        <h1
          className="italic"
          style={{
            fontFamily: "var(--font-serif-display)",
            fontWeight: 400,
            fontSize: "calc(72px * var(--display-scale, 1))",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--ink-1)",
          }}
        >
          {TITLE[horizon]}
        </h1>
        <div
          aria-hidden="true"
          className="mx-auto mt-[22px] h-px w-12"
          style={{ background: "var(--ink-4)" }}
        />
      </header>

      {row.carryOver ? (
        <CarryOverBanner
          horizon={horizon}
          sourcePeriod={row.carryOver.sourcePeriod}
          onClear={() => clearCarryOver(horizon)}
        />
      ) : (
        showInvitation && <HorizonInvitation horizon={horizon} />
      )}

      {/* No editor placeholder: HorizonInvitation owns the empty state above
          the editor, and CarryOverBanner provides context post-load. The
          previous attempt to suppress the placeholder via a `showInvitation`
          ternary failed because MarkdownEditor's CodeMirror state captures
          the placeholder on first mount (useEffect with empty deps) — by
          the time `row.loaded` flipped to true, the placeholder was already
          baked in and could not be retracted. Dropping it entirely is the
          cleanest fix. */}
      <div className="relative max-w-[62ch]">
        <MarkdownEditor
          value={row.content}
          onChange={(v) => setContent(horizon, v)}
          onSave={flushNow}
          autoFocus
        />
        <span className="absolute -right-2 bottom-0">
          <SaveIndicator status={row.saveStatus} />
        </span>
      </div>
    </div>
  );
}

function metaFor(horizon: Horizon): string {
  if (horizon === "life-values" || horizon === "life-goals") return "Persistent";
  const key = PeriodKey.current(horizon);
  if (!key) return "";
  return PeriodKey.format(horizon, key);
}
