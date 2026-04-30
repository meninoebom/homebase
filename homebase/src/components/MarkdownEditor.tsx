// MarkdownEditor — CodeMirror 6 editor for the strategic layer.
//
// Differs from RitualEditor (morning ritual hub) in two ways:
//
//   1. Clickable GFM checkboxes — `- [ ]` / `- [x]` (one level of nesting)
//      render as toggleable checkbox widgets. Source markdown stays the
//      authoritative state; clicking just dispatches a one-character
//      transaction flipping ` ` ↔ `x`.
//
//   2. No magazine-hub styling — this editor is a transparent surface
//      that inherits Lapham CSS variables from its accordion-row container.
//
// The component itself is the same controlled-input contract as
// RitualEditor: pass `value`, get `onChange(newValue)`. Source-of-truth
// is the markdown text; we never round-trip through a doc tree.

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { type Extension, EditorState, type Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  placeholder as placeholderExt,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readonly?: boolean;
  autoFocus?: boolean;
  /**
   * Optional explicit-save callback bound to Cmd-Enter / Ctrl-Enter.
   * Autosave handles persistence within 500ms anyway; this is the keyboard
   * affordance for users who want immediate feedback (the SaveIndicator
   * pulses → settles).
   */
  onSave?: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  readonly = false,
  autoFocus = false,
  onSave,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // Mount + unmount the editor exactly once per component lifecycle.
  // External `value` updates after mount are accepted via the effect below.
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const saveBinding = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          onSaveRef.current?.();
          return true;
        },
      },
    ]);

    const extensions: Extension[] = [
      history(),
      saveBinding,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
      syntaxHighlighting(strategyHighlighting),
      checkboxPlugin,
      updateListener,
      EditorView.lineWrapping,
      strategyTheme,
    ];

    if (placeholder) extensions.push(placeholderExt(placeholder));
    if (readonly) extensions.push(EditorState.readOnly.of(true));

    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });

    if (autoFocus) requestAnimationFrame(() => view.focus());

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. clear-banner, programmatic load)
  // back into the editor without remounting it.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={containerRef} className="markdown-editor" />;
}

// -- Checkbox ViewPlugin -------------------------------------------------

/**
 * Match `- [ ]` and `- [x]` at the start of a line, allowing up to 4 spaces
 * of indentation (one level of nesting via 2-space indent has plenty of
 * headroom). Captures: leading whitespace (0-4 chars), then the inner
 * checkbox char ` ` or `x`. The space after `]` is required.
 */
const CHECKBOX_RE = /^( {0,4})- \[( |x)\] /gm;

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly bracketStart: number,
  ) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked && other.bracketStart === this.bracketStart;
  }

  toDOM(view: EditorView): HTMLElement {
    const el = document.createElement("span");
    el.className = this.checked ? "cm-checkbox cm-checkbox-checked" : "cm-checkbox";
    el.setAttribute("role", "checkbox");
    el.setAttribute("aria-checked", String(this.checked));
    el.setAttribute("contenteditable", "false");
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Toggle the single character inside the brackets.
      const innerCharPos = this.bracketStart + 1;
      view.dispatch({
        changes: {
          from: innerCharPos,
          to: innerCharPos + 1,
          insert: this.checked ? " " : "x",
        },
      });
    });
    return el;
  }

  /** Allow clicks (we handle them); ignore other DOM events. */
  ignoreEvent(event: Event) {
    return event.type !== "mousedown";
  }
}

function buildCheckboxDecorations(view: EditorView): DecorationSet {
  const widgets: Range<Decoration>[] = [];
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    // Reset regex state for each slice — RegExp with /g is stateful.
    CHECKBOX_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CHECKBOX_RE.exec(text)) !== null) {
      const bracketStart = from + m.index + m[1].length + 2; // skip leading ws + "- "
      const bracketEnd = bracketStart + 3; // "[?]"
      const checked = m[2] === "x";
      widgets.push(
        Decoration.replace({
          widget: new CheckboxWidget(checked, bracketStart),
          inclusive: false,
        }).range(bracketStart, bracketEnd),
      );
    }
  }
  return Decoration.set(widgets, true);
}

const checkboxPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildCheckboxDecorations(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) {
        this.decorations = buildCheckboxDecorations(u.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    eventHandlers: {
      // Prevent the editor from selecting text when the user clicks the
      // checkbox — handled by the widget's own mousedown listener.
      mousedown: (e, view) => {
        const target = e.target as HTMLElement;
        if (target.classList?.contains("cm-checkbox")) {
          // Don't prevent default here; the widget handler does it. We just
          // need to keep CodeMirror from also moving the cursor.
          view.focus();
        }
        return false;
      },
    },
  },
);

// -- Theme: transparent surface that inherits Lapham CSS variables ------

const strategyTheme = EditorView.theme({
  "&": {
    fontSize: "17px",
    backgroundColor: "transparent",
  },
  ".cm-scroller": {
    overflow: "visible",
    fontFamily: "var(--font-body, 'Newsreader', 'Charter', 'Georgia', serif)",
  },
  ".cm-content": {
    fontFamily: "var(--font-body, 'Newsreader', 'Charter', 'Georgia', serif)",
    fontSize: "17px",
    lineHeight: "1.55",
    color: "var(--ink, #1A1614)",
    caretColor: "var(--terracotta, #B8472D)",
    padding: "8px 0",
    minHeight: "2.5em",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-line": { padding: "1px 0" },
  ".cm-placeholder": {
    color: "var(--ink-ghost, #C9C0B0)",
    fontStyle: "italic",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--terracotta, #B8472D)",
    borderLeftWidth: "1.5px",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(184, 71, 45, 0.1) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(184, 71, 45, 0.2) !important",
  },
  ".cm-gutters": { display: "none" },

  // Checkbox widget styling (Lapham square with terracotta fill on check).
  ".cm-checkbox": {
    display: "inline-block",
    width: "12px",
    height: "12px",
    marginRight: "6px",
    border: "1.4px solid var(--ink-faint, #A39A8A)",
    borderRadius: "2px",
    background: "transparent",
    cursor: "pointer",
    verticalAlign: "-2px",
    position: "relative",
    transition: "border-color 0.15s, background 0.15s",
  },
  ".cm-checkbox:hover": {
    borderColor: "var(--terracotta, #B8472D)",
  },
  ".cm-checkbox-checked": {
    background: "var(--terracotta, #B8472D)",
    borderColor: "var(--terracotta, #B8472D)",
  },
  ".cm-checkbox-checked::after": {
    content: '""',
    position: "absolute",
    left: "2px",
    top: "0",
    width: "4px",
    height: "8px",
    border: "solid var(--page, #FAF7F0)",
    borderWidth: "0 1.4px 1.4px 0",
    transform: "rotate(45deg)",
  },
});

// -- Syntax highlighting (Lapham-leaning) -------------------------------

const strategyHighlighting = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "var(--ink, #1A1614)",
  },
  {
    tag: tags.heading2,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "var(--ink, #1A1614)",
  },
  {
    tag: tags.heading3,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "var(--ink-muted, #7A7268)",
  },
  { tag: tags.processingInstruction, color: "var(--ink-faint, #A39A8A)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold", color: "var(--ink, #1A1614)" },
]);
