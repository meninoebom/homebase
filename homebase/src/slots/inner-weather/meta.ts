import type { SlotModule } from "../registry";
import { InnerWeatherSlot } from "./index";

export const meta: SlotModule = {
  id: "inner-weather",
  kind: "prompt",
  goalState: "I have named what I'm carrying this morning.",
  component: InnerWeatherSlot,
};
