// First-run gate for the whole app. Blocks render until the single Homebase
// workspace root is connected (picked once, permission granted), then ensures
// the strategy/ and log/ subfolders exist so every route can read/write
// immediately. Wraps the entire router (see main.tsx), so it replaces the old
// pair of per-folder gates — there is now one folder to connect, not two.
//
// The folder pick must happen on a user click: the File System Access API
// refuses to prompt otherwise.

import { useEffect, useState } from "react";
import { fsaSupported, getSavedRoot, pickRoot, requestRootPermission } from "../lib/workspace";
import { ensureWorkspaceSubdirs } from "../lib/workspace-init";

type GateState =
  | { kind: "checking" }
  | { kind: "unsupported" }
  | { kind: "needs-pick" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export function SetupGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: "checking" });

  useEffect(() => {
    if (!fsaSupported()) {
      setState({ kind: "unsupported" });
      return;
    }
    getSavedRoot()
      .then(async (saved) => {
        if (!saved) {
          setState({ kind: "needs-pick" });
          return;
        }
        await ensureWorkspaceSubdirs();
        setState({ kind: "ready" });
      })
      .catch((err) => setState({ kind: "error", message: String(err) }));
  }, []);

  if (state.kind === "ready") return <>{children}</>;
  if (state.kind === "checking") return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      {state.kind === "unsupported" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Homebase needs a Chromium browser.</h1>
          <p className="font-serif text-[15px] italic text-[#6B7280]">
            The File System Access API is how Homebase reads and writes your plans and your morning
            log as real markdown files. Open this page in Chrome, Edge, Arc, or Brave.
          </p>
        </>
      )}

      {state.kind === "needs-pick" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Homebase</h1>
          <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
            Pick the folder where Homebase keeps your files. We recommend making a{" "}
            <code className="font-mono text-[13px]">Homebase</code> folder in your home directory
            (e.g. <code className="font-mono text-[13px]">~/Homebase</code>). Homebase creates{" "}
            <code className="font-mono text-[13px]">strategy/</code> and{" "}
            <code className="font-mono text-[13px]">log/</code> inside it. Your choice is remembered
            for next time.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await pickRoot();
                  await ensureWorkspaceSubdirs();
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
                try {
                  const handle = await requestRootPermission();
                  // Denial leaves the user on this screen — both buttons and
                  // the explanation are still here, so it's not a dead end.
                  if (!handle) return;
                  await ensureWorkspaceSubdirs();
                  setState({ kind: "ready" });
                } catch (err) {
                  setState({ kind: "error", message: String(err) });
                }
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
