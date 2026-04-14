import type { SlotModule } from "../registry";
import { DreamsSlot } from "./index";

export const meta: SlotModule = {
  id: "dreams",
  kind: "prompt",
  goalState: "I have named what I dreamed before it decayed.",
  component: DreamsSlot,
};
