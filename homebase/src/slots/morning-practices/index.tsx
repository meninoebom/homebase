// Morning practices — single optional reflective field.
// Research confirmed: "Checkbox trackers solve a problem he doesn't have."

import { RitualEditor } from "../../components/RitualEditor";
import type { SlotProps } from "../registry";

export function MorningPracticesSlot({ initialDraft, onDraft }: SlotProps) {
  return (
    <div>
      <p className="mb-2 font-serif text-[13px] italic text-[#9CA3AF]">
        movement · meditation · water · piano
      </p>
      <RitualEditor
        initialContent={initialDraft}
        onChange={onDraft}
        placeholderText="Anything about your practices today?"
      />
    </div>
  );
}
