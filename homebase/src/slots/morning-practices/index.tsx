// Morning practices — single optional reflective field.
// Research confirmed: "Checkbox trackers solve a problem he doesn't have."

import { useEffect, useState } from "react";
import { RitualEditor } from "../../components/RitualEditor";
import type { SlotProps } from "../registry";

const PRACTICES_KEY = "homebase-practices-label";
const DEFAULT_PRACTICES = "movement · meditation · water · piano";

export function MorningPracticesSlot({ initialDraft, onDraft }: SlotProps) {
  const [practices, setPractices] = useState(
    () => localStorage.getItem(PRACTICES_KEY) ?? DEFAULT_PRACTICES,
  );

  useEffect(() => {
    localStorage.setItem(PRACTICES_KEY, practices);
  }, [practices]);

  return (
    <div>
      <input
        type="text"
        value={practices}
        onChange={(e) => setPractices(e.target.value)}
        className="mb-2 w-full border-none bg-transparent font-serif text-[13px] italic text-[#9CA3AF] outline-none focus:text-[#6B7280]"
      />
      <RitualEditor
        initialContent={initialDraft}
        onChange={onDraft}
        placeholderText="Anything about your practices today?"
      />
    </div>
  );
}
