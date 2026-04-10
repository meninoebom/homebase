// Explicit slot registry. This file is the one authoritative list of slots
// known to the app — no filesystem magic, no auto-discovery. Adding a slot
// means editing this file and `slotOrder` below.
//
// The slot component contract is deliberately minimal: a React function
// component that receives `SlotProps` and renders whatever it wants. The
// morning route calls `onComplete(body)` when Cmd-Enter fires; slots don't
// handle keyboard events themselves. This keeps the Cmd-Enter covenant in
// one place (morning.tsx) instead of scattered across every slot.

import type { ComponentType } from "react";
import { PlaceholderSlot } from "./placeholder";

export type SlotId = string;

export type SlotKind = "prompt" | "workspace" | "reminder" | "fetch" | "gated";

export interface SlotProps {
  mode: "morning" | "adhoc";
  initialDraft: string;
  onDraft: (body: string) => void;
}

export interface SlotModule {
  id: SlotId;
  kind: SlotKind;
  /**
   * One-sentence description of the state of mind the slot leaves Brandon
   * in when finished. Self-audit question from plan §16: if this sentence
   * is "I feel productive," the slot is decoration — cut it.
   */
  goalState: string;
  component: ComponentType<SlotProps>;
}

export const slots: Record<SlotId, SlotModule> = {
  placeholder: {
    id: "placeholder",
    kind: "prompt",
    goalState:
      "I have verified that the Tauri shell can run a slot end to end — " +
      "this slot is scaffolding and is deleted when Dreams ships in issue 004.",
    component: PlaceholderSlot,
  },
};

/**
 * The order slots run in during the morning sequence. When Dreams ships in
 * issue 004, this becomes `["dreams"]` and placeholder is removed. When
 * inner-weather ships in 005, this becomes `["dreams", "inner-weather"]`.
 * The rule from plan §5: one slot a week, previous slot must survive a
 * week of real mornings before the next is added.
 */
export const slotOrder: SlotId[] = ["placeholder"];

export function getSlot(id: SlotId): SlotModule | null {
  return slots[id] ?? null;
}
