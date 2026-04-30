import type { SlotModule } from "../registry";
import { OrientSlot } from "./index";

export const meta: SlotModule = {
  id: "orient",
  kind: "workspace",
  // §15 rule 5: concrete state of mind, not a feeling. If this sentence
  // ever drifts toward "I feel organized," the slot has rotted — cut it.
  goalState: "I know this week's focus, today's one thing, and where my tools live.",
  component: OrientSlot,
};
