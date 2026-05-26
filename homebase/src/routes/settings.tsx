// /settings — customize your homebase.
//
// Reorder, add, remove, and now (per #50) edit per-slot internals
// (title, prompt, hints, state label) inline. The slot's `id` stays
// read-only because it's tied to day-file `## headers`; renaming the
// id would orphan the user's history.
//
// Edits debounce-save: the local form state holds whatever the user is
// typing, and ~400ms after the last keystroke we flush to the config
// store (which writes to disk).

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
import { ConfigWriteErrorBanner } from "../components/ConfigWriteErrorBanner";
import { FolderSection } from "../components/FolderSection";
import { useRitualStore } from "../store/ritual";
import type {
  BriefingConfig,
  HomebaseConfig,
  PromptSlotConfig,
  SlotConfig,
  WorkspaceSlotConfig,
} from "../lib/config";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const SAVE_DEBOUNCE_MS = 400;

function SettingsPage() {
  const navigate = useNavigate();
  const config = useRitualStore((s) => s.config);
  const loaded = useRitualStore((s) => s.loaded);
  const loadToday = useRitualStore((s) => s.loadToday);
  const updateConfig = useRitualStore((s) => s.updateConfig);
  const resetToDefaults = useRitualStore((s) => s.resetToDefaults);
  const configWriteError = useRitualStore((s) => s.configWriteError);

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

  const replaceSlot = async (id: string, next: SlotConfig) => {
    await updateConfig((c) => ({
      ...c,
      slots: c.slots.map((s) => (s.id === id ? next : s)),
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
          Reorder, edit, or remove slots. Changes save automatically next to your day files.
        </p>

        {configWriteError && <ConfigWriteErrorBanner />}

        <h2 className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#9CA3AF]">
          Your daily page
        </h2>

        <SlotList
          slots={config.slots}
          onReorder={reorderTo}
          onRemove={removeSlot}
          onReplace={replaceSlot}
        />

        <div className="mt-6 flex flex-col gap-2">
          <AddButton label="Add a writing prompt" onClick={() => void addSlot("prompt")} />
          <AddButton label="Add a workspace" onClick={() => void addSlot("workspace")} />
        </div>

        <BriefingSection
          briefing={config.briefing}
          onChange={(next) => void updateConfig((c) => ({ ...c, briefing: next }))}
        />

        <FolderSection />

        <ResetSection onReset={() => void resetToDefaults()} />
      </div>
    </main>
  );
}

function ResetSection({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="mt-16 rounded border border-[#FECACA] bg-[#FEF2F2] p-4">
        <p className="mb-3 font-serif text-[14px] leading-relaxed text-[#991B1B]">
          Reset to defaults? This will replace your current slots and briefing with the standard
          starter set. Your day-file content will be left alone.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onReset();
            }}
            className="cursor-pointer rounded bg-[#B91C1C] px-3 py-1.5 font-sans text-[13px] text-white hover:bg-[#991B1B]"
          >
            Yes, reset
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="cursor-pointer rounded border border-[#E5E7EB] bg-white px-3 py-1.5 font-sans text-[13px] text-[#374151] hover:bg-[#F3F4F6]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 flex justify-center">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer border-0 bg-transparent p-1 font-sans text-[12px] text-[#9CA3AF] hover:text-[#B91C1C]"
      >
        Reset to defaults
      </button>
    </div>
  );
}

function BriefingSection({
  briefing,
  onChange,
}: {
  briefing: BriefingConfig;
  onChange: (next: BriefingConfig) => void;
}) {
  // Local mirror of the textarea so keystrokes feel responsive. Debounced
  // flush keeps disk writes off the keystroke path.
  const [quotesText, setQuotesText] = useState(briefing.quotes.join("\n"));

  useEffect(() => {
    setQuotesText(briefing.quotes.join("\n"));
  }, [briefing.quotes]);

  useEffect(() => {
    const parsed = quotesText
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);
    if (arraysEqual(parsed, briefing.quotes)) return;

    const t = setTimeout(() => {
      onChange({ ...briefing, quotes: parsed });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [quotesText, briefing, onChange]);

  return (
    <section className="mt-12">
      <h2 className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#9CA3AF]">
        Briefing
      </h2>

      <label className="flex cursor-pointer items-center gap-3 font-serif text-[14px] text-[#111]">
        <input
          type="checkbox"
          checked={briefing.enabled}
          onChange={(e) => onChange({ ...briefing, enabled: e.target.checked })}
          className="h-4 w-4"
        />
        Show a daily quote at the top of your daily page
      </label>

      <div className="mt-4">
        <span className="mb-1 block font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">
          Quotes (one per line)
        </span>
        <textarea
          value={quotesText}
          onChange={(e) => setQuotesText(e.target.value)}
          rows={6}
          placeholder={
            briefing.quotes.length === 0
              ? "Add quotes you want to see each day. One rotates in by date."
              : ""
          }
          className="w-full resize-y rounded border border-[#E5E7EB] bg-white px-2 py-1 font-serif text-[14px] leading-snug focus:border-[#9CA3AF] focus:outline-none"
        />
      </div>
    </section>
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function SlotList({
  slots,
  onReorder,
  onRemove,
  onReplace,
}: {
  slots: SlotConfig[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (id: string) => void;
  onReplace: (id: string, next: SlotConfig) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
            <SlotRow
              key={slot.id}
              slot={slot}
              expanded={expandedId === slot.id}
              onToggleExpand={() => setExpandedId(expandedId === slot.id ? null : slot.id)}
              onRemove={() => onRemove(slot.id)}
              onReplace={(next) => onReplace(slot.id, next)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SlotRow({
  slot,
  expanded,
  onToggleExpand,
  onRemove,
  onReplace,
}: {
  slot: SlotConfig;
  expanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onReplace: (next: SlotConfig) => void;
}) {
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
    <li ref={setNodeRef} style={style} className="rounded bg-white">
      <div className="flex items-center gap-3 px-3 py-2">
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
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="flex-1 cursor-pointer border-0 bg-transparent p-0 text-left font-serif text-[15px] text-[#111] hover:text-[#374151]"
        >
          {displayTitle}
        </button>
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
      </div>

      {expanded && (
        <div className="border-t border-[#F3F4F6] px-3 pb-4 pt-3">
          <SlotEditForm slot={slot} onChange={onReplace} />
        </div>
      )}
    </li>
  );
}

function SlotEditForm({
  slot,
  onChange,
}: {
  slot: SlotConfig;
  onChange: (next: SlotConfig) => void;
}) {
  // Local form state — what the user sees while typing. Debounced flush
  // to onChange below.
  const [draft, setDraft] = useState<SlotConfig>(slot);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Sync external changes (e.g. another tab writes a config update) into
  // the form. Compares serialized values to avoid a feedback loop where
  // every flush re-syncs.
  useEffect(() => {
    setDraft(slot);
  }, [slot]);

  // Debounced flush. Only persists when the title is non-empty (workspace
  // requires title; prompt's title is optional but if present must be
  // non-empty when set — empty string would render as no title, which is
  // fine, so we allow). For workspaces, an empty title is rejected.
  useEffect(() => {
    if (draft === slot) return;

    const isInvalid =
      draft.kind === "workspace" &&
      (typeof draft.title !== "string" || draft.title.trim().length === 0);

    if (isInvalid) {
      setTitleError("Title can't be empty");
      return;
    }
    setTitleError(null);

    const t = setTimeout(() => {
      onChange(draft);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft, slot, onChange]);

  return (
    <div className="grid gap-3">
      <Field label="Title">
        <input
          type="text"
          value={draft.title ?? ""}
          onChange={(e) => setDraft({ ...draft, title: e.target.value } as SlotConfig)}
          className="w-full rounded border border-[#E5E7EB] bg-white px-2 py-1 font-serif text-[14px] focus:border-[#9CA3AF] focus:outline-none"
        />
        {titleError && <p className="mt-1 font-sans text-[11px] text-[#B91C1C]">{titleError}</p>}
        <p className="mt-1 font-mono text-[10px] text-[#9CA3AF]">id: {draft.id}</p>
      </Field>

      {draft.kind === "prompt" ? (
        <PromptFields draft={draft} onChange={(d) => setDraft(d)} />
      ) : (
        <WorkspaceFields draft={draft} onChange={(d) => setDraft(d)} />
      )}
    </div>
  );
}

function PromptFields({
  draft,
  onChange,
}: {
  draft: PromptSlotConfig;
  onChange: (d: PromptSlotConfig) => void;
}) {
  return (
    <>
      <Field label="Prompt">
        <textarea
          value={draft.prompt}
          rows={2}
          onChange={(e) => onChange({ ...draft, prompt: e.target.value })}
          className="w-full resize-none rounded border border-[#E5E7EB] bg-white px-2 py-1 font-serif text-[14px] leading-snug focus:border-[#9CA3AF] focus:outline-none"
        />
      </Field>
      <HintsEditor
        hints={draft.hints ?? []}
        onChange={(hints) => onChange({ ...draft, hints: hints.length > 0 ? hints : undefined })}
      />
    </>
  );
}

function WorkspaceFields({
  draft,
  onChange,
}: {
  draft: WorkspaceSlotConfig;
  onChange: (d: WorkspaceSlotConfig) => void;
}) {
  return (
    <>
      <Field label="Header label">
        <input
          type="text"
          value={draft.stateLabel ?? ""}
          placeholder="e.g. Goals, Working on, Repertoire"
          onChange={(e) =>
            onChange({
              ...draft,
              stateLabel: e.target.value.length > 0 ? e.target.value : undefined,
            })
          }
          className="w-full rounded border border-[#E5E7EB] bg-white px-2 py-1 font-serif text-[14px] focus:border-[#9CA3AF] focus:outline-none"
        />
        <p className="mt-1 font-sans text-[11px] leading-snug text-[#6B7280]">
          Small caps text shown above the saved area — tells you what to think of it as. Defaults to
          "Editable and persistent" if left empty.
        </p>
      </Field>
      <Field label="Today prompt (optional)">
        <textarea
          value={draft.prompt ?? ""}
          rows={2}
          placeholder="Leave empty to skip the today writing field"
          onChange={(e) =>
            onChange({
              ...draft,
              prompt: e.target.value.length > 0 ? e.target.value : undefined,
            })
          }
          className="w-full resize-none rounded border border-[#E5E7EB] bg-white px-2 py-1 font-serif text-[14px] leading-snug focus:border-[#9CA3AF] focus:outline-none"
        />
      </Field>
    </>
  );
}

function HintsEditor({
  hints,
  onChange,
}: {
  hints: string[];
  onChange: (hints: string[]) => void;
}) {
  return (
    <Field label="Hints">
      <div className="flex flex-col gap-1">
        {hints.map((h, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={h}
              onChange={(e) => {
                const next = [...hints];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded border border-[#E5E7EB] bg-white px-2 py-1 font-serif text-[14px] focus:border-[#9CA3AF] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(hints.filter((_, j) => j !== i))}
              aria-label={`Remove hint ${h || `#${i + 1}`}`}
              className="cursor-pointer border-0 bg-transparent p-1 text-[#9CA3AF] hover:text-[#B91C1C]"
            >
              <span aria-hidden="true" className="text-[14px]">
                ×
              </span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...hints, ""])}
          className="self-start cursor-pointer border-0 bg-transparent p-1 font-sans text-[12px] text-[#6B7280] hover:text-[#111]"
        >
          + Add hint
        </button>
      </div>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">
        {label}
      </span>
      {children}
    </label>
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
