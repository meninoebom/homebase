// Dreams slot — the first real MVP slot. A TipTap (ProseMirror) editor with
// the minimum set of extensions: paragraphs, text, history, hard breaks,
// and a placeholder that shows "What did you dream?" when the editor is empty.
//
// No slot header — the placeholder IS the prompt. When Brandon starts
// typing, the placeholder fades and his prose becomes the whole slot. The
// slot name "dreams" lives only in the bottom-right counter. This matches
// the design voice agent's spec for prompt slots (plan §11): one clean
// writing surface, no redundant labels, the question is the invitation.
//
// Editor choice: TipTap minimal primitives rather than StarterKit. The
// StarterKit bundles marks (bold/italic/strike) and block types (lists,
// blockquotes, headings) that don't belong in a dreams slot. When inner
// weather (issue 005) or a slot that wants rich formatting ships, each
// slot configures its own extension list.
//
// Save flow unchanged from Phase C/D: onUpdate gives us the plain-text
// form via editor.getText(), which we hand to onDraft. Zustand persists.
// On Cmd-Enter, the morning runner reads the draft and calls completeSlot,
// which goes through the Rust append_section command into the day log.

import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";
import Paragraph from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";

import type { SlotProps } from "../registry";

export function DreamsSlot({ initialDraft, onDraft }: SlotProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      History,
      HardBreak,
      Placeholder.configure({
        placeholder: "What did you dream?",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    // TipTap accepts plain text for `content`; on first mount we pass the
    // current draft from Zustand (which may be empty on a fresh morning).
    content: initialDraftToContent(initialDraft),
    autofocus: "end",
    onUpdate: ({ editor }) => {
      onDraft(editor.getText());
    },
    editorProps: {
      attributes: {
        "aria-label": "Dreams",
        "data-slot": "dreams",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="dreams-slot">
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Convert a plain-text draft (with `\n\n` paragraph breaks) into TipTap's
 * document JSON shape. TipTap can parse HTML too, but building the JSON
 * directly avoids any XSS concerns with pasted content.
 */
function initialDraftToContent(draft: string) {
  if (!draft) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  const paragraphs = draft.split(/\n\n+/).map((text) => ({
    type: "paragraph",
    content: text ? [{ type: "text", text }] : [],
  }));
  return { type: "doc", content: paragraphs };
}
