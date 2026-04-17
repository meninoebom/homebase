// Creative projects — freeform writing field.

import { RitualEditor } from "../../components/RitualEditor";
import type { SlotProps } from "../registry";

export function CreativeSlot({ initialDraft, onDraft }: SlotProps) {
  return (
    <RitualEditor
      initialContent={initialDraft}
      onChange={onDraft}
      placeholderText="What's surfacing? What's maturing?"
    />
  );
}
