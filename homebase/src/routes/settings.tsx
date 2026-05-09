// /settings — customize your homebase.
//
// First user-facing payoff of the configurability epic (#45). The user
// reorders slots, adds new ones, and removes slots they don't use,
// without touching code or JSON. Per-slot editing (title/prompt/hints)
// lands in #50; this issue ships only the list view.
//
// Stable IDs are sacred: the user can rename a slot's title in #50 but
// id is permanent (it's written into day-file ## headers). For new
// slots, we generate ids of the form `prompt-N` / `workspace-N` using
// the smallest unused number.

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRitualStore } from "../store/ritual";
import type {
  HomebaseConfig,
  PromptSlotConfig,
  SlotConfig,
  WorkspaceSlotConfig,
} from "../lib/config";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const config = useRitualStore((s) => s.config);
  const loaded = useRitualStore((s) => s.loaded);
  const loadToday = useRitualStore((s) => s.loadToday);
  const updateConfig = useRitualStore((s) => s.updateConfig);

  // Settings reuses the morning store; if it hasn't been loaded yet
  // (e.g. user came straight to /settings), kick the load.
  useEffect(() => {
    if (!loaded) void loadToday();
  }, [loaded, loadToday]);

  if (!loaded || !config) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[640px] px-8 pb-12 pt-12">
          <p className="font-serif text-[14px] italic text-[#9CA3AF]">Loading…</p>
        </div>
      </main>
    );
  }

  const reorderTo = async (newOrder: string[]) => {
    await updateConfig((c) => {
      const byId = new Map(c.slots.map((s) => [s.id, s]));
      const next = newOrder.map((id) => byId.get(id)).filter((s): s is SlotConfig => Boolean(s));
      return { ...c, slots: next };
    });
  };

  const addSlot = async (kind: "prompt" | "workspace") => {
    await updateConfig((c) => ({
      ...c,
      slots: [...c.slots, makeNewSlot(kind, c)],
    }));
  };

  const removeSlot = async (id: string) => {
    await updateConfig((c) => ({
      ...c,
      slots: c.slots.filter((s) => s.id !== id),
    }));
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[640px] px-8 pb-24 pt-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-10 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 py-1.5 font-sans text-[11px] font-medium uppercase text-[#6B7280] hover:text-[#111]"
          style={{ letterSpacing: "0.24em" }}
        >
          <span aria-hidden="true">←</span>
          Done
        </button>

        <h1 className="mb-2 font-serif text-[28px] italic text-[#111]">Customize your homebase</h1>
        <p className="mb-8 font-serif text-[14px] leading-relaxed text-[#6B7280]">
          Reorder, add, or remove slots. Changes save automatically next to your day files.
        </p>

        <h2 className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#9CA3AF]">
          Your morning page
        </h2>

        <SlotList slots={config.slots} onReorder={reorderTo} onRemove={removeSlot} />

        <div className="mt-6 flex flex-col gap-2">
          <AddButton label="Add a writing prompt" onClick={() => void addSlot("prompt")} />
          <AddButton label="Add a workspace" onClick={() => void addSlot("workspace")} />
        </div>
      </div>
    </main>
  );
}

function SlotList({
  slots,
  onReorder,
  onRemove,
}: {
  slots: SlotConfig[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slots.findIndex((s) => s.id === active.id);
    const newIndex = slots.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(slots, oldIndex, newIndex).map((s) => s.id);
    onReorder(newOrder);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={slots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-1 rounded border border-[#EBEBEB] bg-[#FAFAFA] p-2">
          {slots.map((slot) => (
            <SlotRow key={slot.id} slot={slot} onRemove={() => onRemove(slot.id)} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SlotRow({ slot, onRemove }: { slot: SlotConfig; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
  });
  const [confirming, setConfirming] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const displayTitle = slot.title ?? slot.id;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded bg-white px-3 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab touch-none border-0 bg-transparent p-1 text-[#9CA3AF] hover:text-[#374151]"
      >
        <span aria-hidden="true" className="font-mono text-[14px]">
          ⠿
        </span>
      </button>
      <span className="flex-1 font-serif text-[15px] text-[#111]">{displayTitle}</span>
      <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF]">
        {slot.kind}
      </span>
      {confirming ? (
        <div className="flex items-center gap-2 font-sans text-[12px]">
          <span className="text-[#6B7280]">Remove?</span>
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer rounded bg-[#B91C1C] px-2 py-1 text-white hover:bg-[#991B1B]"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="cursor-pointer rounded border border-[#E5E7EB] px-2 py-1 text-[#374151] hover:bg-[#F3F4F6]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Remove ${displayTitle}`}
          onClick={() => setConfirming(true)}
          className="cursor-pointer border-0 bg-transparent p-1 text-[#9CA3AF] hover:text-[#B91C1C]"
        >
          <span aria-hidden="true" className="text-[16px]">
            ×
          </span>
        </button>
      )}
    </li>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded border border-dashed border-[#D1D5DB] bg-transparent px-3 py-2 text-left font-sans text-[13px] text-[#6B7280] hover:border-[#9CA3AF] hover:text-[#111]"
    >
      + {label}
    </button>
  );
}

/** Generate a unique id for a new slot of the given kind. */
export function makeNewSlot(kind: "prompt" | "workspace", current: HomebaseConfig): SlotConfig {
  const prefix = kind;
  const taken = new Set(current.slots.map((s) => s.id));
  let n = 1;
  while (taken.has(`${prefix}-${n}`)) n++;
  const id = `${prefix}-${n}`;

  if (kind === "prompt") {
    const slot: PromptSlotConfig = {
      id,
      kind: "prompt",
      title: "New prompt",
      prompt: "What's on your mind?",
    };
    return slot;
  }
  const slot: WorkspaceSlotConfig = {
    id,
    kind: "workspace",
    title: "New workspace",
  };
  return slot;
}
