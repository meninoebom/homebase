// Inner weather slot — second MVP slot, the first one with a template.
//
// Brandon's inner-weather template has five `###` section headers (from
// §14.2 of the plan). The editor renders each header as a styled h3 with
// an empty paragraph underneath that Brandon fills in. The headers are
// fully editable — if Brandon ever wants to rework the questions, he
// just edits template.md (or edits inside the editor and the new headers
// persist via the draft).
//
// Save format: on commit, the whole editor body is serialized back to
// markdown (`### Header\n\ntext\n\n### Header\n\ntext`) and passed to
// append_section, which wraps it under `## inner-weather`. The final log
// file entry looks like:
//
//     ## inner-weather
//
//     ### What's weighing on you
//
//     The demo.
//
//     ### What are you avoiding
//
//     The email from legal.
//
// Round-trip: saved draft re-parses cleanly into the same editor state.
// Template file (`./template.md`) is the source of truth on first run;
// after that, the saved draft takes over.

import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { EditorContent, useEditor } from "@tiptap/react";

import type { SlotProps } from "../registry";
import templateRaw from "./template.md?raw";

export function InnerWeatherSlot({ initialDraft, onDraft }: SlotProps) {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, Heading.configure({ levels: [3] }), History, HardBreak],
    // First run: no saved draft, load the template. Subsequent runs:
    // rehydrate from the saved markdown draft so Brandon continues
    // where he left off.
    content: parseMarkdownToDoc(initialDraft || templateRaw),
    autofocus: "end",
    onUpdate: ({ editor }) => {
      onDraft(serializeDocToMarkdown(editor.state.doc));
    },
    editorProps: {
      attributes: {
        "aria-label": "Inner weather",
        "data-slot": "inner-weather",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="inner-weather-slot ritual-editor">
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Parse a simple markdown document into TipTap / ProseMirror doc JSON.
 *
 * Supports only the three primitives this slot needs:
 *   - `### Header` → heading node at level 3
 *   - non-empty line → paragraph node with a text child
 *   - blank line → a break between the previous node and the next
 *
 * After every heading we insert an empty paragraph so Brandon's cursor
 * has a place to land under each section without pressing Enter first.
 *
 * This is NOT a general-purpose markdown parser. It's the minimum that
 * round-trips what `serializeDocToMarkdown` emits below.
 */
function parseMarkdownToDoc(raw: string): { type: "doc"; content: unknown[] } {
  const lines = raw.trim().split("\n");
  const content: unknown[] = [];
  let lastWasHeading = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: trimmed.slice(4) }],
      });
      lastWasHeading = true;
      continue;
    }

    if (trimmed === "") {
      // Blank line: if the previous node was a heading, add an empty
      // paragraph so Brandon has somewhere to type under it. Otherwise
      // the blank line is just separation between already-emitted nodes.
      if (lastWasHeading) {
        content.push({ type: "paragraph" });
        lastWasHeading = false;
      }
      continue;
    }

    // Non-heading, non-blank line → paragraph with text.
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: trimmed }],
    });
    lastWasHeading = false;
  }

  // If the document ends with a heading that had no following blank
  // line in the source, still give Brandon a paragraph to type into.
  if (lastWasHeading) {
    content.push({ type: "paragraph" });
  }

  // Empty document edge case — TipTap requires at least one child.
  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}

/**
 * Serialize a ProseMirror doc back to simple markdown so it round-trips
 * through `parseMarkdownToDoc`. Empty paragraphs are dropped from the
 * output so the saved draft doesn't accumulate blank lines on every
 * re-serialization.
 *
 * Only handles headings (level 3) and paragraphs — the same nodes the
 * parser understands. If a future version of this slot adds lists or
 * blockquotes, both functions need to learn about them together.
 */
function serializeDocToMarkdown(doc: ProseMirrorNode): string {
  const parts: string[] = [];
  doc.forEach((node) => {
    if (node.type.name === "heading") {
      const level = (node.attrs.level as number) ?? 3;
      parts.push(`${"#".repeat(level)} ${node.textContent}`);
      return;
    }
    if (node.type.name === "paragraph") {
      const text = node.textContent;
      if (text) {
        parts.push(text);
      }
      return;
    }
  });
  return parts.join("\n\n").trim();
}
