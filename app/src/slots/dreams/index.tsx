// Dreams slot — CodeMirror 6 version. Drastically simpler than the TipTap
// version because CM6's document IS plain text — no JSON intermediate, no
// parseMarkdownToDoc/serializeDocToMarkdown round-trip. The editor content
// is the draft string, period.

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
