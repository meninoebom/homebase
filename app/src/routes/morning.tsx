// The morning sequence runner. This file knows the full shape of a morning:
// start → render current slot → Cmd-Enter → commit → advance → next slot
// or end-of-morning. Everything slot-specific lives in the slot component;
// everything session-wide lives in the Zustand store; this file is the glue.
//
// Cmd-Enter is handled at the window level via a keydown listener so every
// slot (current and future) inherits the covenant without re-implementing
// it. Cmd+Shift+R resets the current session — useful during development
// and testing to clear persisted drafts without opening devtools.

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { EndOfMorning } from "../components/EndOfMorning";
import { SlotShell } from "../components/SlotShell";
import { getSlot, slotOrder } from "../slots/registry";
import {
  selectCurrentSlotId,
  selectElapsedMs,
  selectIsDone,
  useRitualStore,
} from "../store/ritual";

const TRANSITION_MS = 320;

export const Route = createFileRoute("/morning")({
  component: MorningRunner,
});

function MorningRunner() {
  const startMorning = useRitualStore((s) => s.startMorning);
  const completeSlot = useRitualStore((s) => s.completeSlot);
  const setDraft = useRitualStore((s) => s.setDraft);
  const reset = useRitualStore((s) => s.reset);
  const currentSlotId = useRitualStore(selectCurrentSlotId);
  const draftForCurrent = useRitualStore((s) =>
    currentSlotId ? (s.drafts[currentSlotId] ?? "") : "",
  );
  const total = useRitualStore((s) => s.slotOrder.length);
  const currentIndex = useRitualStore((s) => s.currentIndex);
  const isDone = useRitualStore(selectIsDone);
  const elapsedMs = useRitualStore(selectElapsedMs);

  const [transitioning, setTransitioning] = useState(false);

  // Start the sequence on mount. startMorning handles all four cases
  // (fresh, in-progress today, completed today, stale from a previous day).
  useEffect(() => {
    startMorning(slotOrder);
  }, [startMorning]);

  const handleCommit = useCallback(async () => {
    if (!currentSlotId || transitioning) return;
    const body = draftForCurrent;

    setTransitioning(true);
    try {
      await completeSlot(currentSlotId, body);
    } catch (err) {
      console.error("completeSlot failed:", err);
      setTransitioning(false);
      return;
    }

    // Hold the faded-out state briefly so the transition is visible,
    // then reset so the next slot mounts with the entrance animation.
    window.setTimeout(() => {
      setTransitioning(false);
    }, TRANSITION_MS);
  }, [completeSlot, currentSlotId, draftForCurrent, transitioning]);

  // Keyboard covenants:
  //   Cmd-Enter  — commit current slot and advance (the one ritual gesture)
  //   Cmd-Shift-R — reset the entire session (development / testing escape hatch)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleCommit();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        reset();
        // Re-start the sequence after the reset so the user lands on a
        // fresh first slot instead of an empty store.
        startMorning(slotOrder);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCommit, reset, startMorning]);

  if (isDone) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <EndOfMorning elapsedMs={elapsedMs} slotCount={total} />
      </main>
    );
  }

  if (!currentSlotId) {
    // Zero active slots — quiet exit, matching the bash spike's behavior
    // when slots.md was empty.
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
          no slots today
        </p>
      </main>
    );
  }

  const slot = getSlot(currentSlotId);
  if (!slot) {
    // Programmer error: slotOrder references a slot that isn't in the registry.
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-serif text-ink">
          unknown slot: <code className="font-mono">{currentSlotId}</code>
        </p>
      </main>
    );
  }

  const SlotComponent = slot.component;

  return (
    <main className="min-h-screen bg-paper">
      <SlotShell
        slotName={slot.id}
        currentIndex={currentIndex}
        total={total}
        transitioning={transitioning}
      >
        <SlotComponent
          key={currentSlotId}
          mode="morning"
          initialDraft={draftForCurrent}
          onDraft={(body) => setDraft(currentSlotId, body)}
        />
      </SlotShell>
    </main>
  );
}
