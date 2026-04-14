// Shared CodeMirror 6 editor for all prompt slots. Replaces TipTap.
//
// The switch from TipTap to CM6 was made on 2026-04-13 after research
// showed that CM6 is the standard for prose-quality writing surfaces in
// Tauri apps (Astro Editor, Obsidian Live Preview, Heynote). TipTap's
// ProseMirror model fights you on typewriter scrolling, empty-paragraph
// collapse, and markdown-as-you-type — all things CM6 gives for free
// or as idiomatic extensions.
//
// Design: the editor is mounted once on initial render and manages its
// own state (CM6 is not a React controlled component). On every doc
// change, we call onChange(doc.toString()). The caller (slot component)
// passes onChange as a stable callback via useCallback/ref.

import { useEffect, useRef } from "react";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { tags } from "@lezer/highlight";

interface RitualEditorProps {
  /** Document content on first mount. Not reactive after mount. */
  initialContent: string;
  /** Called on every doc change with the full document string. */
  onChange: (content: string) => void;
  /** Shown in ink-faint italic when the editor is empty. */
  placeholderText?: string;
  /** Auto-focus the editor on mount. Default true. */
  autoFocus?: boolean;
}

export function RitualEditor({
  initialContent,
  onChange,
  placeholderText,
  autoFocus = true,
}: RitualEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Use a ref for onChange so the updateListener closure doesn't go stale
  // if the parent re-renders with a new callback identity.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const extensions = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
      syntaxHighlighting(ritualHighlighting),
      updateListener,
      EditorView.lineWrapping,
      ritualTheme,
      typewriterScrolling,
    ];

    if (placeholderText) {
      extensions.push(placeholderExt(placeholderText));
    }

    const state = EditorState.create({
      doc: initialContent,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    if (autoFocus) {
      requestAnimationFrame(() => view.focus());
    }

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount only. Content flows through onChange; re-mounting would lose cursor.

  return <div ref={containerRef} className="ritual-editor" />;
}

// -- Theme ----------------------------------------------------------------

// CM6 theme: structural styles for the writing surface. Colors reference
// CSS custom properties from src/index.css so we don't hardcode hex values.
const ritualTheme = EditorView.theme({
  "&": {
    fontSize: "20px",
    backgroundColor: "transparent",
  },
  ".cm-content": {
    fontFamily: "var(--font-serif)",
    fontSize: "20px",
    lineHeight: "1.72",
    color: "var(--color-ink)",
    padding: "0",
    caretColor: "var(--color-ink)",
    minHeight: "20rem",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "visible",
    fontFamily: "var(--font-serif)",
  },
  ".cm-line": {
    padding: "0.1em 0",
  },
  ".cm-placeholder": {
    color: "var(--color-ink-faint)",
    fontStyle: "italic",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--color-ink)",
    borderLeftWidth: "1.5px",
  },
  // Don't highlight the active line — we want the text to dominate.
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  // Selection colors.
  ".cm-selectionBackground": {
    backgroundColor: "rgba(0, 0, 0, 0.08) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(0, 0, 0, 0.15) !important",
  },
  // Gutters off (no line numbers in a writing app).
  ".cm-gutters": {
    display: "none",
  },
});

// -- Syntax highlighting -------------------------------------------------

// Markdown heading styles. The `###` prefix is dimmed; the heading text
// after the space is italic and muted. No font-size changes for headings
// — the inner weather template's ### sections should feel like prompts,
// not a heading hierarchy.
const ritualHighlighting = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "var(--color-ink)",
  },
  {
    tag: tags.heading2,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "var(--color-ink-muted)",
  },
  {
    tag: tags.heading3,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "var(--color-ink-muted)",
  },
  // The ### prefix itself — dim so the heading text is what the eye reads.
  {
    tag: tags.processingInstruction,
    color: "var(--color-ink-faint)",
  },
  // Emphasis and strong in markdown
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
]);

// -- Typewriter scrolling ------------------------------------------------

// Pins the cursor line to the vertical center of the viewport on every
// selection change. Uses a transactionExtender (not an updateListener)
// so the scrollIntoView effect piggybacks on the selection-changing
// transaction — one transaction, no follow-up dispatch, no infinite loop.
//
// Pattern from CM6 forum (https://discuss.codemirror.net/t/cm6-scroll-to-middle/2924)
// and the Astro Editor Tauri app (dannysmith/astro-editor).
const typewriterScrolling = EditorState.transactionExtender.of((tr) => {
  if (!tr.selection) return null;
  return {
    effects: EditorView.scrollIntoView(tr.selection.main.head, {
      y: "center",
    }),
  };
});
