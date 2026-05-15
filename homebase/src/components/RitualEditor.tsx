// Shared CodeMirror 6 editor for the hub page.
//
// Hub mode: each section gets its own editor instance, stacked vertically
// on a scrollable page. Editors are COMPACT — they grow with content and
// have a small min-height, NOT 50vh of padding like the wizard had. The
// PAGE scrolls, not each individual editor.
//
// Typewriter scrolling is OFF in hub mode because there's no per-editor
// scroll container. If we ever add a focus mode (single-section-at-a-time),
// typewriter mode can be re-enabled for that context.

import { useEffect, useRef } from "react";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  type ViewUpdate,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";

interface RitualEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholderText?: string;
  autoFocus?: boolean;
}

export function RitualEditor({
  initialContent,
  onChange,
  placeholderText,
  autoFocus = false,
}: RitualEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
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
      hubTheme,
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
  }, []);

  return <div ref={containerRef} className="ritual-editor" />;
}

// -- Theme: compact hub editors ------------------------------------------
//
// Inter Tight at 18px — modernized 2026-05-15 alongside the /day rename.
// The prior Charter/serif italic register was too small-feeling for a
// daily writing surface; the new system matches the strategic accordion
// (Inter Tight, roman) while keeping the writing surface white.

const DAY_EDITOR_FONT =
  "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif";

const hubTheme = EditorView.theme({
  "&": {
    fontSize: "18px",
    backgroundColor: "transparent",
  },
  ".cm-scroller": {
    overflow: "visible",
    fontFamily: DAY_EDITOR_FONT,
  },
  ".cm-content": {
    fontFamily: DAY_EDITOR_FONT,
    fontSize: "18px",
    lineHeight: "1.55",
    color: "var(--color-ink)",
    caretColor: "var(--color-ink)",
    padding: "8px 0",
    minHeight: "2.5em",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-line": {
    padding: "1px 0",
  },
  ".cm-placeholder": {
    color: "var(--color-ink-faint)",
    fontStyle: "normal",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--color-ink)",
    borderLeftWidth: "1.5px",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(0, 0, 0, 0.08) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(0, 0, 0, 0.15) !important",
  },
  ".cm-gutters": {
    display: "none",
  },
});

// -- Syntax highlighting -------------------------------------------------
//
// Headings now use weight to differentiate, not italic. Emphasis (single
// asterisks) still renders italic because that's what the markdown
// semantics call for — the user explicitly typed it.

const ritualHighlighting = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontWeight: "700",
    color: "var(--color-ink)",
  },
  {
    tag: tags.heading2,
    fontWeight: "600",
    color: "var(--color-ink)",
  },
  {
    tag: tags.heading3,
    fontWeight: "600",
    color: "var(--color-ink-muted)",
  },
  {
    tag: tags.processingInstruction,
    color: "var(--color-ink-faint)",
  },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
]);
