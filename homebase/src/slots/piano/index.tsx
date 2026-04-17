// Piano practice section — workspace state + daily writing.
// The "Working on" list is persistent state (changes after lessons, not daily).
// The writing field is for today's practice notes.

import { RitualEditor } from "../../components/RitualEditor";
import type { SlotProps } from "../registry";

// Persistent practice items — eventually loaded from a state file.
// For now hardcoded; the state.md pattern will replace this when
// the workspace-slot infrastructure ships.
const PRACTICE_ITEMS = [
  "Chopin Nocturne Op. 9 No. 1 — LH voicing, bars 12–16",
  "C minor harmonic scale, contrary motion",
  "Chord inversions: dominant 7ths through all keys",
  "Sight-reading: Bartók Mikrokosmos Vol. 3",
];

const LAST_LESSON =
  "Legato in the ornamental turns. Slow the gruppetti way down before speeding up. New assignment: contrary motion scales.";

export function PianoSlot({ initialDraft, onDraft }: SlotProps) {
  return (
    <div>
      <div className="mb-3 rounded bg-[#F8F8F8] px-3 py-2">
        <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
          Working on
        </p>
        <ul className="font-sans text-[13px] leading-relaxed text-[#6B7280]">
          {PRACTICE_ITEMS.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-[#D1D5DB]">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-[#EBEBEB] pt-2 font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
          Last lesson
        </p>
        <p className="font-serif text-[13px] italic text-[#6B7280]">{LAST_LESSON}</p>
      </div>
      <RitualEditor
        initialContent={initialDraft}
        onChange={onDraft}
        placeholderText="What did you practice? What clicked, what needs work?"
      />
    </div>
  );
}
