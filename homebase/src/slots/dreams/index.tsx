// Dreams — no section header, just a placeholder prompt.
// The simplest entry point: "What did you dream?"

import { RitualEditor } from "../../components/RitualEditor";
import type { SlotProps } from "../registry";

export function DreamsSlot({ initialDraft, onDraft }: SlotProps) {
  return (
    <RitualEditor
      initialContent={initialDraft}
      onChange={onDraft}
      placeholderText="What did you dream?"
    />
  );
}
