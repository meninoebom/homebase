// Slot registry — the one authoritative list of sections on the hub page.
// Adding a slot: create a component + meta.ts, import it here, add to
// `slots` and `slotOrder`.

import type { ComponentType } from "react";

import { meta as creativeMeta } from "./creative/meta";
import { meta as dreamsMeta } from "./dreams/meta";
import { meta as innerWeatherMeta } from "./inner-weather/meta";
import { meta as morningPracticesMeta } from "./morning-practices/meta";
import { meta as orientMeta } from "./orient/meta";
import { meta as pianoMeta } from "./piano/meta";

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
  goalState: string;
  component: ComponentType<SlotProps>;
}

export const slots: Record<SlotId, SlotModule> = {
  dreams: dreamsMeta,
  "inner-weather": innerWeatherMeta,
  "morning-practices": morningPracticesMeta,
  piano: pianoMeta,
  creative: creativeMeta,
  orient: orientMeta,
};

/**
 * The order sections appear on the hub page. Top-to-bottom.
 * Dreams is first (unlabeled prompt at the top of the page).
 */
export const slotOrder: SlotId[] = [
  "dreams",
  "inner-weather",
  "morning-practices",
  "piano",
  "creative",
  "orient",
];

export function getSlot(id: SlotId): SlotModule | null {
  return slots[id] ?? null;
}
