// Explicit slot registry. This file is the one authoritative list of slots
// known to the app — no filesystem magic, no auto-discovery. Adding a slot
// means editing this file and `slotOrder` below.
//
// Each slot's metadata lives with its own code in `<slot>/meta.ts`, which
// the registry imports. That keeps the registry a thin lookup table while
// slot properties (goalState, kind) live next to the component they
// describe.
//
// The slot component contract is deliberately minimal: a React function
// component that receives `SlotProps` and renders whatever it wants. The
// morning route calls `onDraft(body)` as the user types and reads the
// draft from the store when Cmd-Enter fires; slots don't handle keyboard
// events themselves. This keeps the Cmd-Enter covenant in one place
// (morning.tsx) instead of scattered across every slot.

import type { ComponentType } from "react";
import { meta as dreamsMeta } from "./dreams/meta";

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
  dreams: dreamsMeta,
};

/**
 * The order slots run in during the morning sequence. Dreams is first
 * because dream memory is perishable (plan §5). When inner weather ships
 * in issue 005, this becomes `["dreams", "inner-weather"]` — one slot at
 * a time, previous slot must survive a week of real mornings before the
 * next is added.
 */
export const slotOrder: SlotId[] = ["dreams"];

export function getSlot(id: SlotId): SlotModule | null {
  return slots[id] ?? null;
}
