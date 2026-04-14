// Shared CodeMirror 6 editor for all prompt slots.
//
// Replaces TipTap (2026-04-13). The swap was driven by research showing
// CM6 is the standard for prose-quality writing surfaces in Tauri apps
// (Astro Editor, Obsidian Live Preview). CM6 gives us typewriter scrolling,
// markdown-as-you-type, and simpler code in exchange for a larger per-chunk
// bundle (acceptable for a local-first desktop app).
//
// Typewriter mode implementation adapted from Danny Smith's Astro Editor
// (https://github.com/dannysmith/astro-editor) — Apache/MIT licensed.
// Key patterns: transaction extender for keyboard centering, ViewPlugin
// for deferred pointer centering, and 50vh padding on .cm-content so
// the first/last lines of the document CAN reach viewport center.

import { useEffect, useRef } from "react";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  ViewPlugin,
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
  autoFocus = true,
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
      ritualTheme,
      // Typewriter mode: always on, not togglable. Three pieces work together:
      // 1. transactionExtender centers on keyboard selection changes
      // 2. ViewPlugin centers on mouse clicks (deferred to after mouseup)
      // 3. 50vh padding on .cm-content (in the theme) creates scroll space
      typewriterKeyboardExtender,
      typewriterMousePlugin,
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
      requestAnimationFrame(() => {
        view.focus();
        // After focusing, center the cursor position
        view.dispatch({
          effects: EditorView.scrollIntoView(view.state.selection.main.head, {
            y: "center",
          }),
        });
      });
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

// -- Theme ----------------------------------------------------------------

const ritualTheme = EditorView.theme({
  "&": {
    fontSize: "20px",
    backgroundColor: "transparent",
    height: "100%",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "var(--font-serif)",
  },
  ".cm-content": {
    fontFamily: "var(--font-serif)",
    fontSize: "20px",
    lineHeight: "1.72",
    color: "var(--color-ink)",
    caretColor: "var(--color-ink)",
    // 50vh padding above and below the content so the first and last
    // lines can scroll to viewport center. Without this, typewriter
    // mode can't center content near the edges of the document.
    // Pattern from Astro Editor (dannysmith/astro-editor).
    paddingTop: "50vh",
    paddingBottom: "50vh",
    minHeight: "0",
  },
  "&.cm-focused": {
    outline: "none",
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
  {
    tag: tags.processingInstruction,
    color: "var(--color-ink-faint)",
  },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
]);

// -- Typewriter scrolling ------------------------------------------------
//
// Adapted from Astro Editor by Danny Smith (Apache/MIT).
// https://github.com/dannysmith/astro-editor
//
// Two pieces:
// 1. A transactionExtender that adds scrollIntoView(head, { y: 'center' })
//    to every non-pointer transaction that changes the selection or document.
//    Pointer events are EXCLUDED because scrolling between mousedown and
//    mouseup causes CM6 to interpret the click as a drag selection.
// 2. A ViewPlugin that handles pointer centering AFTER mouseup completes,
//    using requestAnimationFrame to ensure CM6 has finished processing the
//    click before we scroll.

const typewriterKeyboardExtender = EditorState.transactionExtender.of((tr) => {
  if (!tr.selection && !tr.docChanged) return null;
  // Skip pointer selections — handled by the ViewPlugin after mouseup
  if (tr.isUserEvent("select.pointer")) return null;
  return {
    effects: EditorView.scrollIntoView(tr.state.selection.main.head, {
      y: "center",
    }),
  };
});

const typewriterMousePlugin = ViewPlugin.fromClass(
  class {
    private _destroyed = false;
    private pendingCleanup: (() => void) | null = null;

    constructor(private view: EditorView) {}

    update(update: ViewUpdate) {
      if (update.transactions.some((tr) => tr.isUserEvent("select.pointer"))) {
        this.cancelPending();
        const handler = () => {
          this.pendingCleanup = null;
          requestAnimationFrame(() => {
            if (this._destroyed) return;
            this.view.dispatch({
              effects: EditorView.scrollIntoView(this.view.state.selection.main.head, {
                y: "center",
              }),
            });
          });
        };
        this.pendingCleanup = () => document.removeEventListener("mouseup", handler);
        document.addEventListener("mouseup", handler, { once: true });
      }
    }

    private cancelPending() {
      if (this.pendingCleanup) {
        this.pendingCleanup();
        this.pendingCleanup = null;
      }
    }

    destroy() {
      this._destroyed = true;
      this.cancelPending();
    }
  },
);
