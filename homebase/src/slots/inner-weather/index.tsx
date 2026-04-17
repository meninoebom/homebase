// Inner weather — single writing field with hint suggestions.
// Consolidated from 5 separate prompts per Brandon's feedback:
// "I think it can just be a single prompt with different suggestions."

import { RitualEditor } from "../../components/RitualEditor";
import type { SlotProps } from "../registry";

export function InnerWeatherSlot({ initialDraft, onDraft }: SlotProps) {
  return (
    <div>
      <p className="mb-2 font-serif text-[13px] italic text-[#9CA3AF]">
        weighing on you · avoiding · needs to be said · giving you life · gratitude
      </p>
      <RitualEditor
        initialContent={initialDraft}
        onChange={onDraft}
        placeholderText="What's alive in you this morning?"
      />
    </div>
  );
}
