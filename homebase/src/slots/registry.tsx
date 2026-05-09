// Slot registry — bridges the new config-driven slot model to the
// existing MorningHub render path.
//
// Pre-#47, slots were registered as TypeScript modules (one folder per
// slot). After #47 the bespoke slots are gone and the registry is a
// thin compatibility layer that builds SlotModules from
// legacyDefaultConfig(): each PromptSlotConfig binds to PromptSlot,
// each WorkspaceSlotConfig binds to WorkspaceSlot.
//
// #48 will make MorningHub read config directly and delete this file
// entirely. Keeping it for one PR keeps the diff bounded.

import type { ComponentType } from "react";

import { PromptSlot } from "../components/PromptSlot";
import { WorkspaceSlot } from "../components/WorkspaceSlot";
import { legacyDefaultConfig, type SlotConfig } from "../lib/config";

export type SlotId = string;
export type SlotKind = "prompt" | "workspace";

export interface SlotProps {
  mode: "morning" | "adhoc";
  initialDraft: string;
  onDraft: (body: string) => void;
}

export interface SlotModule {
  id: SlotId;
  kind: SlotKind;
  component: ComponentType<SlotProps>;
}

function buildComponent(config: SlotConfig): ComponentType<SlotProps> {
  if (config.kind === "prompt") {
    return function BoundPromptSlot(props: SlotProps) {
      return (
        <PromptSlot config={config} initialDraft={props.initialDraft} onDraft={props.onDraft} />
      );
    };
  }
  return function BoundWorkspaceSlot(props: SlotProps) {
    return (
      <WorkspaceSlot config={config} initialDraft={props.initialDraft} onDraft={props.onDraft} />
    );
  };
}

const _config = legacyDefaultConfig();

export const slots: Record<SlotId, SlotModule> = Object.fromEntries(
  _config.slots.map((slotConfig) => [
    slotConfig.id,
    {
      id: slotConfig.id,
      kind: slotConfig.kind,
      component: buildComponent(slotConfig),
    },
  ]),
);

export const slotOrder: SlotId[] = _config.slots.map((s) => s.id);

export function getSlot(id: SlotId): SlotModule | null {
  return slots[id] ?? null;
}
