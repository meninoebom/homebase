// Piano — workspace slot with three parts:
//   1. Editable & persistent — free-form goals/working-on. Saves to
//      piano/state.md on blur. Stays until Brandon edits it.
//   2. Yesterday — read-only, pulled from yesterday's ## piano section.
//   3. Today — editable, saved into today's log as ## piano (via the
//      hub's save_day mechanism). What you type here is tomorrow's
//      "Yesterday."

import { useEffect, useRef, useState } from "react";
import { RitualEditor } from "../../components/RitualEditor";
import { localDateISO, readDay, readState, writeState } from "../../lib/log";
import type { SlotProps } from "../registry";
import { extractSection } from "./parse";

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateISO(d);
}

export function PianoSlot({ initialDraft, onDraft }: SlotProps) {
  const [persistent, setPersistent] = useState<string>("");
  const [persistentDirty, setPersistentDirty] = useState(false);
  const [yesterday, setYesterday] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    Promise.all([readState("piano"), readDay(yesterdayISO())])
      .then(([stateMd, dayMd]) => {
        setPersistent(stateMd);
        lastSavedRef.current = stateMd;
        setYesterday(extractSection(dayMd, "piano"));
        setLoaded(true);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : String(err));
        setLoaded(true);
      });
  }, []);

  async function handlePersistentBlur() {
    if (!persistentDirty) return;
    if (persistent === lastSavedRef.current) {
      setPersistentDirty(false);
      return;
    }
    try {
      await writeState("piano", persistent);
      lastSavedRef.current = persistent;
      setPersistentDirty(false);
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  if (!loaded) return null;

  if (loadError) {
    return (
      <p className="font-mono text-[13px] text-[#B91C1C]">
        piano: couldn't load state — {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <p className="font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
            Editable and persistent
          </p>
          {persistentDirty && (
            <span className="font-sans text-[10px] italic text-[#9CA3AF]">
              unsaved — will save on blur
            </span>
          )}
          {saveError && (
            <span className="font-mono text-[10px] text-[#B91C1C]">
              save failed: {saveError}
            </span>
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

      {yesterday && (
        <div>
          <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
            Yesterday
          </p>
          <p className="whitespace-pre-wrap font-serif text-[15px] italic leading-relaxed text-[#9CA3AF]">
            {yesterday}
          </p>
        </div>
      )}

      <div>
        <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
          Today
        </p>
        <RitualEditor
          initialContent={initialDraft}
          onChange={onDraft}
          placeholderText="What did you practice? What clicked, what needs work?"
        />
      </div>
    </div>
  );
}
