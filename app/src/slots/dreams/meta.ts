// Dreams slot metadata. Imported by slots/registry.ts, kept separate from
// the component so the registry file stays a thin lookup table and each
// slot owns its own metadata file. This pattern will matter more once
// workspace slots (piano, creative) land and each slot has its own
// state.md alongside — the directory becomes the slot's home.

import type { SlotModule } from "../registry";
import { DreamsSlot } from "./index";

export const meta: SlotModule = {
  id: "dreams",
  kind: "prompt",
  goalState: "I have named what I dreamed before it decayed.",
  component: DreamsSlot,
};
