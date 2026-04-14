import type { SlotModule } from "../registry";
import { MorningPracticesSlot } from "./index";

export const meta: SlotModule = {
  id: "morning-practices",
  kind: "prompt",
  goalState: "I have acknowledged how my practices felt this morning.",
  component: MorningPracticesSlot,
};
