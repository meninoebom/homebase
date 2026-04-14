import type { SlotModule } from "../registry";
import { CreativeSlot } from "./index";

export const meta: SlotModule = {
  id: "creative",
  kind: "prompt",
  goalState: "I have named what's surfacing and what's maturing in my creative work.",
  component: CreativeSlot,
};
