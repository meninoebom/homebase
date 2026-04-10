// Placeholder slot for Phase C. Deleted when Dreams ships in issue 004.
//
// Its whole job is to prove that the Tauri shell can:
//   1. Render a slot with typography from the Lapham palette
//   2. Accept text input
//   3. Update the Zustand draft state on change
//   4. Let the morning route read that draft and commit it via Cmd-Enter
//   5. Transition to the end-of-morning screen after completion
//
// Deliberately minimal. Dreams will have real styling, template loading,
// and the writing-column clamp. Placeholder has plain text and a textarea.

import { useState } from "react";
import type { SlotProps } from "../registry";

export function PlaceholderSlot({ initialDraft, onDraft }: SlotProps) {
  const [text, setText] = useState(initialDraft);

  return (
    <div className="mx-auto flex w-full max-w-[62ch] flex-col gap-10 px-8">
      <header>
        <p className="font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
          placeholder · phase C verification
        </p>
        <h2 className="mt-2 font-serif text-[28px] italic leading-[1.28] text-ink-muted">
          Type anything, then press ⌘↵
        </h2>
      </header>

      <textarea
        autoFocus
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onDraft(e.target.value);
        }}
        placeholder="This slot is scaffolding for the morning runner. Dreams ships next."
        className={[
          "min-h-[12em] w-full resize-none bg-page",
          "font-serif text-[19px] leading-[1.58] text-ink",
          "border-none outline-none placeholder:text-ink-faint",
          "p-6 focus:outline-none",
        ].join(" ")}
      />

      <p className="font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
        ⌘↵ to commit and advance
      </p>
    </div>
  );
}
