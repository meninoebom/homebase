// markdown-preview — extract a "section preview" from raw markdown.
//
// The strategic accordion's expanded view is a *projection* of the file
// content (not the file itself): one italic lead paragraph + a numbered
// list of top-level bullet items. The user clicks Open to drill into
// the full editor, where the markdown is canonical.
//
// We deliberately keep this dumb — first paragraph, top-level bullets,
// nothing more. If the file is empty or has no extractable structure,
// the helpers return null/[] and the caller renders the empty-state
// invitation instead.

/**
 * Extract the first paragraph as the row's "lead" — the italic line
 * shown above the items list. Skips ATX headings (`#`, `##`, ...) so
 * an h1 at the top of the file doesn't become the lead. Returns null
 * if the file is empty or contains only headings/whitespace.
 */
export function extractLead(content: string): string | null {
  const lines = content.split("\n");
  let buffer: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      if (buffer.length > 0) return buffer.join(" ");
      continue;
    }
    if (line.startsWith("#")) {
      // Heading — flush any in-progress buffer and stop here, since the
      // first non-empty body has been a heading: don't pull text from
      // *after* a heading, that's body content for that heading.
      if (buffer.length > 0) return buffer.join(" ");
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\./.test(line)) {
      // Bullet — if we've already started a paragraph, end it; otherwise
      // there's no lead before the list (return null).
      if (buffer.length > 0) return buffer.join(" ");
      return null;
    }
    buffer.push(line);
  }
  return buffer.length > 0 ? buffer.join(" ") : null;
}

/**
 * Extract top-level bullet items as a flat list of plain strings. Strips
 * GFM checkboxes (`- [ ]` / `- [x]`) so the preview reads as content,
 * not as a checklist with state. Skips nested bullets (anything indented).
 *
 * @param max  Optional cap — the prototype's week list shows 7; default 10.
 */
export function extractItems(content: string, max = 10): string[] {
  const items: string[] = [];
  const lines = content.split("\n");
  for (const raw of lines) {
    if (items.length >= max) break;
    if (raw.startsWith(" ") || raw.startsWith("\t")) continue; // skip nested
    const m = /^(?:- |\* |\d+\.\s+)(.*)$/.exec(raw);
    if (!m) continue;
    let text = m[1].trim();
    // Strip GFM checkbox prefix.
    text = text.replace(/^\[[ xX]\]\s+/, "");
    if (text === "") continue;
    items.push(text);
  }
  return items;
}
