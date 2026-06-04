// Generic workspace slot — persistent body + optional today field.
//
// Replaces the bespoke Piano slot. The persistent body is a textarea
// stored at <id>/state.md, save-on-blur. The optional today field is
// a RitualEditor wired into today's day-file via the parent's draft
// store, identical to PromptSlot's draft round-trip.
//
// Yesterday-section narrative behavior from the bespoke PianoSlot is
// deliberately not preserved — it's a Brandon-specific journaling
// pattern that doesn't generalize, and the strategy accordion's Week
// row already covers "what carried over from yesterday" framing.

import { useEffect, useRef, useState } from "react";
import { RitualEditor } from "./RitualEditor";
import { readState, writeState } from "../lib/log";
import type { WorkspaceSlotConfig } from "../lib/config";

interface WorkspaceSlotProps {
  config: WorkspaceSlotConfig;
  initialDraft: string;
  onDraft: (body: string) => void;
}

export function WorkspaceSlot({ config, initialDraft, onDraft }: WorkspaceSlotProps) {
  const [persistent, setPersistent] = useState<string>("");
  const [persistentDirty, setPersistentDirty] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    readState(config.id)
      .then((md) => {
        setPersistent(md);
        lastSavedRef.current = md;
        setLoaded(true);
      })
      .catch((err: unknown) => {
        console.error("workspace slot: failed to load state", err);
        setLoadError(err instanceof Error ? err.message : String(err));
        setLoaded(true);
      });
  }, [config.id]);

  async function handlePersistentBlur() {
    if (!persistentDirty || persistent === lastSavedRef.current) {
      setPersistentDirty(false);
      return;
    }
    try {
      await writeState(config.id, persistent);
      lastSavedRef.current = persistent;
      setPersistentDirty(false);
      setSaveError(null);
    } catch (err) {
      console.error("workspace slot: failed to save state", err);
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  if (!loaded) return null;

  if (loadError) {
    return (
      <p className="font-mono text-[13px] text-[#B91C1C]">
        {config.id}: couldn't load state — {loadError}
      </p>
    );
  }

  const stateLabel = config.stateLabel ?? "Editable and persistent";

  return (
    <div className="space-y-5">
      <p
        data-testid="workspace-gloss"
        className="font-sans text-[12px] text-[#9CA3AF]"
        style={{ lineHeight: 1.5 }}
      >
        A workspace is a persistent notes area that stays with you day to day — use it for running
        context, goals, or anything you want to keep in view.
      </p>
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <p className="font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
            {stateLabel}
          </p>
          {persistentDirty && (
            <span className="font-sans text-[10px] italic text-[#9CA3AF]">
              unsaved — will save on blur
            </span>
          )}
          {saveError && (
            <span className="font-mono text-[10px] text-[#B91C1C]">save failed: {saveError}</span>
          )}
        </div>
        <textarea
          value={persistent}
          onChange={(e) => {
            setPersistent(e.target.value);
            setPersistentDirty(true);
          }}
          onBlur={handlePersistentBlur}
          rows={Math.max(4, persistent.split("\n").length + 1)}
          placeholder="Goals, what you're working on, anything that should stay here until you change it."
          className="w-full resize-none rounded bg-[#F8F8F8] px-3 py-2 font-serif text-[14px] leading-relaxed text-[#374151] placeholder:text-[#C7CBD1] focus:bg-[#F3F4F6] focus:outline-none"
        />
      </div>

      {config.prompt !== undefined && (
        <div>
          <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
            Today
          </p>
          <RitualEditor
            initialContent={initialDraft}
            onChange={onDraft}
            placeholderText={config.prompt}
          />
        </div>
      )}
    </div>
  );
}
