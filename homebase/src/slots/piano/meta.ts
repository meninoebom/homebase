import type { SlotModule } from "../registry";
import { PianoSlot } from "./index";

export const meta: SlotModule = {
  id: "piano",
  kind: "workspace",
  goalState: "I know what I'm working on at the piano and what happened in today's practice.",
  component: PianoSlot,
};
