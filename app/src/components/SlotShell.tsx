// Wraps the current slot with the 320ms fade/rise transition animation and
// the small slot counter in the bottom-right corner. The counter lives in a
// fixed-position footer outside the animated region so it doesn't fade
// during slot transitions.
//
// The shell itself uses `flex-1` (not `min-h-screen`) so it fills whatever
// space is available inside its parent — typically a `<main>` container
// that owns the overall viewport height. Stacking two `min-h-screen`
// containers would force a scroll; `flex-1` lets the parent decide.

import type { ReactNode } from "react";

interface SlotShellProps {
  slotName: string;
  currentIndex: number;
  total: number;
  /** True while the outgoing slot is fading out. Drives the transition. */
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
          "flex flex-1 flex-col items-center justify-center px-8",
          "transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          transitioning ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100",
        ].join(" ")}
      >
        <div className="w-full max-w-[62ch]">{children}</div>
      </section>
      <footer className="fixed right-8 bottom-6 font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
        {slotName} · {currentIndex + 1} of {total}
      </footer>
    </>
  );
}
