// Wraps a single slot's rendered component with the surrounding chrome —
// the small slot counter in the corner and the transition animation when
// the slot advances. Everything about "which slot am I" is the shell's
// job, not the slot component's.
//
// Cmd-Enter handling lives in routes/morning.tsx, NOT here, because the
// covenant is app-wide and should be defined in one place.

import type { ReactNode } from "react";

interface SlotShellProps {
  slotName: string;
  currentIndex: number;
  total: number;
  /** Set while the outgoing slot is fading out. Used to drive the transition. */
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
    <section
      className={[
        "flex min-h-screen flex-col justify-center",
        // 320ms single easing curve for every transition (plan §11).
        "transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        transitioning ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100",
      ].join(" ")}
    >
      <div className="relative flex-1 flex flex-col justify-center">{children}</div>
      <footer className="fixed bottom-6 right-8 font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
        {slotName} · {currentIndex + 1} of {total}
      </footer>
    </section>
  );
}
