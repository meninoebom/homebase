// Inner weather slot — CodeMirror 6 version. Massively simpler than TipTap
// because the document IS the markdown text. No parseMarkdownToDoc, no
// serializeDocToMarkdown, no Heading extension. The template.md content
// is loaded via Vite's ?raw import and used directly as the initial doc
// string. Brandon types below each ### header. On save, doc.toString()
// gives the exact markdown that goes into the day log.
//
// The ### headers render in italic ink-muted via CM6's syntax highlighting
// (configured in RitualEditor's ritualHighlighting). The "### " prefix
// is dimmed further. No separate CSS needed per slot.

import { RitualEditor } from "../../components/RitualEditor";
import type { SlotProps } from "../registry";
import templateRaw from "./template.md?raw";

export function InnerWeatherSlot({ initialDraft, onDraft }: SlotProps) {
  // First launch (no saved draft): load the template so Brandon sees the
  // five section headers. Subsequent launches: rehydrate from the saved
  // draft in Zustand, which is already the plain markdown text.
  const content = initialDraft || templateRaw.trim();

  return <RitualEditor initialContent={content} onChange={onDraft} />;
}
