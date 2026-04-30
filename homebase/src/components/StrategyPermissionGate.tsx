// First-run gate for the strategy directory. Mirrors SetupGate (the log
// directory gate) but for ~/Documents/homebase-strategy/. Strategy is a
// separate directory so it can go under version control without dragging
// the day log in (active-plan.md §4.5).
//
// This gate wraps only the strategy-layer route. The morning ritual
// (/morning) does not need it — that route uses the log gate.

import { useEffect, useState } from "react";
import {
  fsaSupported,
  getSavedStrategyDir,
  pickStrategyDir,
  requestStrategyDirPermission,
} from "../lib/strategy-fs";

type GateState =
  | { kind: "checking" }
  | { kind: "unsupported" }
  | { kind: "needs-pick" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export function StrategyPermissionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: "checking" });

  useEffect(() => {
    if (!fsaSupported()) {
      setState({ kind: "unsupported" });
      return;
    }
    // getSavedStrategyDir returns a handle only after verifying permission;
    // its side effect is caching that handle so StrategyFs.read/write/list
    // can be called by children immediately.
    getSavedStrategyDir().then((saved) => {
      setState(saved ? { kind: "ready" } : { kind: "needs-pick" });
    });
  }, []);

  if (state.kind === "ready") return <>{children}</>;
  if (state.kind === "checking") return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      {state.kind === "unsupported" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Homebase needs a Chromium browser.</h1>
          <p className="font-serif text-[15px] italic text-[#6B7280]">
            The File System Access API is how Homebase reads and writes your strategic plans as real
            markdown files. Open this page in Chrome, Edge, Arc, or Brave.
          </p>
        </>
      )}

      {state.kind === "needs-pick" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Strategic plans folder</h1>
          <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
            Pick a folder for your life values, life goals, and yearly / monthly / weekly strategic
            plans. We recommend{" "}
            <code className="font-mono text-[13px]">~/Documents/homebase-strategy</code>. This is
            separate from your daily log so you can put strategy under version control later without
            dragging the day log in.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await pickStrategyDir();
                  setState({ kind: "ready" });
                } catch (err) {
                  if (err instanceof Error && err.name === "AbortError") return;
                  setState({ kind: "error", message: String(err) });
                }
              }}
              className="rounded bg-[#374151] px-4 py-2 font-sans text-[13px] text-white hover:bg-[#1F2937]"
            >
              Choose folder
            </button>
            <button
              type="button"
              onClick={async () => {
                const handle = await requestStrategyDirPermission();
                if (handle) setState({ kind: "ready" });
              }}
              className="rounded border border-[#E5E7EB] px-4 py-2 font-sans text-[13px] text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              Re-use saved folder
            </button>
          </div>
        </>
      )}

      {state.kind === "error" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Something went wrong.</h1>
          <p className="font-mono text-[13px] text-[#6B7280]">{state.message}</p>
          <button
            type="button"
            onClick={() => setState({ kind: "needs-pick" })}
            className="rounded bg-[#374151] px-4 py-2 font-sans text-[13px] text-white hover:bg-[#1F2937]"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
