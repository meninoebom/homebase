// Dreams slot — the first real MVP slot. Single header, full-bleed textarea,
// auto-grow height, cursor pre-focused. The simplest possible prompt slot
// and deliberately so: dreams are perishable, so the slot is first in the
// morning sequence and the fewest possible clicks between "I woke up" and
// "the dream is in the log."
//
// Goal state (plan §16): "I have named what I dreamed before it decayed."
//
// No template.md for now — a single header is cheaper as a hardcoded
// string than as a file to parse. Inner weather (issue 005) is where the
// template.md pattern earns its place, since that's 5 editable headers.

import { useEffect, useRef, useState } from "react";
import type { SlotProps } from "../registry";

export function DreamsSlot({ initialDraft, onDraft }: SlotProps) {
  const [text, setText] = useState(initialDraft);
  const [hasFocus, setHasFocus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea to match its content so a two-paragraph dream
  // doesn't need an inner scrollbar. The container clips at viewport height
  // if the writing ever gets longer than the window, which is fine — that
  // much writing already tripped its own alarm.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  // Cursor pre-focused on mount. The first thing Brandon should see is a
  // place to write, not a button to press.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Header recedes (opacity 1.0 → 0.55) once Brandon starts typing. Plan
  // §11: "once Brandon starts typing, his prose is what the eye lands on."
  const headerFaded = hasFocus && text.length > 0;

  return (
    <div className="flex flex-col gap-12">
      <h2
        className={[
          "font-serif text-[28px] italic leading-[1.28] text-ink-muted",
          "transition-opacity duration-[320ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          headerFaded ? "opacity-55" : "opacity-100",
        ].join(" ")}
      >
        Dreams
      </h2>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onDraft(e.target.value);
        }}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        rows={5}
        aria-label="Dreams"
        className={[
          "w-full resize-none overflow-hidden bg-page",
          "font-serif text-[19px] leading-[1.58] text-ink",
          "rounded-none border-none p-6 outline-none",
          "focus:outline-none focus:ring-0",
        ].join(" ")}
      />
    </div>
  );
}
