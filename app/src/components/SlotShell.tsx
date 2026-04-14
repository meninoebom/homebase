// Wraps the current slot with the 320ms fade/rise transition animation and
// the small slot counter in the bottom-right corner.
//
// The layout fills the remaining viewport height (flex-1) so the editor
// inside it can be a fixed-height viewport with its own scrolling —
// which is what typewriter mode needs (50vh padding on .cm-content only
// works when the editor's scroll container has a bounded height).

import type { ReactNode } from "react";

interface SlotShellProps {
  slotName: string;
  currentIndex: number;
  total: number;
  transitioning: boolean;
  children: ReactNode;
}

export function SlotShell({
  slotName,
  currentIndex,
  total,
  transitioning,
  children,
}: SlotShellProps) {
  return (
    <>
      <section
        className={[
          "flex flex-1 flex-col items-center overflow-hidden px-8",
          "transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          transitioning ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100",
        ].join(" ")}
      >
        <div className="w-full max-w-[72ch] flex-1 overflow-hidden">{children}</div>
      </section>
      <footer className="fixed right-8 bottom-6 font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
        {slotName} · {currentIndex + 1} of {total}
      </footer>
    </>
  );
}
