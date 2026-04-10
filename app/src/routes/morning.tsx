// The morning sequence runner. This is the one file that knows the full
// shape of a morning: start → render current slot → Cmd-Enter → commit →
// advance → next slot or end-of-morning. Everything slot-specific lives in
// the slot component; everything session-wide lives in the Zustand store;
// this file is the glue.
//
// Cmd-Enter is handled at the window level via a keydown listener so every
// slot (current and future) inherits the covenant without re-implementing it.
// Plan §11 + interaction agent: the one keyboard gesture the whole app has.

import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { EndOfMorning } from "../components/EndOfMorning";
import { Greeting } from "../components/Greeting";
import { SlotShell } from "../components/SlotShell";
import { grepLogs, recentDates } from "../lib/log";
import type { LogHit } from "../lib/log";
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
  const currentSlotId = useRitualStore(selectCurrentSlotId);
  const draftForCurrent = useRitualStore((s) =>
    currentSlotId ? (s.drafts[currentSlotId] ?? "") : "",
  );
  const total = useRitualStore((s) => s.slotOrder.length);
  const currentIndex = useRitualStore((s) => s.currentIndex);
  const isDone = useRitualStore(selectIsDone);
  const elapsedMs = useRitualStore(selectElapsedMs);

  const [transitioning, setTransitioning] = useState(false);
  const [greetingWhisper, setGreetingWhisper] = useState<LogHit | null>(null);
  const [onFirstSlot, setOnFirstSlot] = useState(false);

  // Start the sequence on mount. startMorning is idempotent: if the store
  // already has a morning in progress, this is a no-op.
  useEffect(() => {
    startMorning(slotOrder);
  }, [startMorning]);

  // Yesterday whisper: grep the last 14 days for a telling pattern. For now
  // we just look for "avoiding" under any heading. This lights up on ~day 7
  // when there's real history; before that it returns nothing and the
  // greeting stays clean.
  useEffect(() => {
    const yesterday = recentDates(14).slice(1); // skip today
    grepLogs("avoiding", yesterday)
      .then((hits) => {
        if (hits.length > 0) setGreetingWhisper(hits[0]);
      })
      .catch((err) => {
        // Whisper is a nice-to-have, not load-bearing; a failed grep
        // should never block the morning.
        console.warn("whisper grep failed:", err);
      });
  }, []);

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

    // Hold the faded-out state briefly so the transition is visible, then
    // reset so the next slot mounts with the entrance animation.
    window.setTimeout(() => {
      setTransitioning(false);
    }, TRANSITION_MS);
  }, [completeSlot, currentSlotId, draftForCurrent, transitioning]);

  // Track whether we're on the first slot — used to suppress the entrance
  // transition on initial mount (there's nothing to transition away from).
  useEffect(() => {
    setOnFirstSlot(currentIndex === 0 && !isDone);
  }, [currentIndex, isDone]);

  // The one keyboard covenant — Cmd-Enter (or Ctrl-Enter on non-mac)
  // commits the current slot and advances. Listens at the window level so
  // every slot inherits the gesture; prevents default so textareas don't
  // also insert a newline.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleCommit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCommit]);

  if (isDone) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <EndOfMorning elapsedMs={elapsedMs} slotCount={total} />
      </main>
    );
  }

  if (!currentSlotId) {
    // Zero active slots — greet the day and exit cleanly. Matches the
    // bash spike's "zero-slot clean exit" behavior.
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div className="mx-auto w-full max-w-[62ch] px-8 text-center">
          <Greeting date={new Date()} />
          <p className="mt-10 font-sans text-xs uppercase tracking-[0.04em] text-ink-faint">
            no slots today
          </p>
        </div>
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
    <main className="flex min-h-screen flex-col bg-paper">
      {/* Greeting above the active slot, shown only on the first slot of
          the morning (not repeated once the sequence is in motion). The
          outer flex+justify-center keeps the 62ch column horizontally
          centered without fighting the parent's items-stretch. */}
      {onFirstSlot ? (
        <div className="flex w-full justify-center px-8 pt-20">
          <div className="w-full max-w-[62ch]">
            <Greeting date={new Date()} whisper={greetingWhisper?.line ?? undefined} />
          </div>
        </div>
      ) : null}

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
