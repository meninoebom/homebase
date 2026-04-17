// Orient — the map-of-content slot. Workspace kind, but unlike piano
// it does NOT write to the day log. Pure orientation: hand-edited
// state.md → static display.
//
// §15 rule 5 guardrail: every element here must be something Brandon
// would still want to look at during a bad month. No counts, no
// dynamic data, no progress indicators.

import { useEffect, useState } from "react";
import { readState } from "../../lib/log";
import type { SlotProps } from "../registry";
import { parseOrientState, type OrientState } from "./parse";

const EMPTY: OrientState = { focus: "", oneThing: "" };

export function OrientSlot(_props: SlotProps) {
  const [state, setState] = useState<OrientState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readState("orient").then((md) => {
      setState(parseOrientState(md));
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  if (!state.focus && !state.oneThing) {
    return (
      <p className="font-serif text-[15px] italic text-[#9CA3AF]">
        Edit <code className="font-mono text-[13px]">~/Documents/morning-ritual-log/orient/state.md</code> to set up this slot.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {state.focus && (
        <Block label="This week's focus">
          <p className="font-serif text-[17px] leading-relaxed text-[#4B5563]">
            {state.focus}
          </p>
        </Block>
      )}
      {state.oneThing && (
        <Block label="One thing today">
          <p className="font-serif text-[17px] italic leading-relaxed text-[#374151]">
            {state.oneThing}
          </p>
        </Block>
      )}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.06em] text-[#D1D5DB]">
        {label}
      </p>
      {children}
    </div>
  );
}
