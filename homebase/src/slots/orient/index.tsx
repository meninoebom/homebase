import { useEffect, useRef, useState } from "react";
import { RitualEditor } from "../../components/RitualEditor";
import { readState, writeState } from "../../lib/log";
import type { SlotProps } from "../registry";

const QUESTION =
  "According to my deepest understanding, how can I live that understanding more deeply?";

function mondayLabel(): string {
  const now = new Date();
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function OrientSlot({ initialDraft, onDraft }: SlotProps) {
  const [goals, setGoals] = useState("");
  const [goalsDirty, setGoalsDirty] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const lastSavedRef = useRef("");

  useEffect(() => {
    readState("orient").then((md) => {
      setGoals(md);
      lastSavedRef.current = md;
      setLoaded(true);
    });
  }, []);

  async function handleGoalsBlur() {
    if (!goalsDirty || goals === lastSavedRef.current) {
      setGoalsDirty(false);
      return;
    }
    await writeState("orient", goals);
    lastSavedRef.current = goals;
    setGoalsDirty(false);
  }

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
          Goals for this week <span className="normal-case">· {mondayLabel()}</span>
        </p>
        <textarea
          className="w-full resize-none bg-transparent font-serif text-[17px] leading-relaxed text-[#4B5563] placeholder:text-[#D1D5DB] focus:outline-none"
          placeholder="What do you want to move toward this week?"
          value={goals}
          rows={3}
          onChange={(e) => {
            setGoals(e.target.value);
            setGoalsDirty(true);
          }}
          onBlur={handleGoalsBlur}
        />
      </div>

      <div>
        <p className="mb-2 font-serif text-[15px] italic leading-relaxed text-[#9CA3AF]">
          {QUESTION}
        </p>
        <RitualEditor
          initialContent={initialDraft}
          onChange={onDraft}
          placeholderText="Write here…"
        />
      </div>
    </div>
  );
}
