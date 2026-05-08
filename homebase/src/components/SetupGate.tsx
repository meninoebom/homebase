// First-run gate. If the user has not yet picked the log directory (or
// re-opened the app and the permission hasn't been re-confirmed), we block
// the whole app and show a single button that triggers showDirectoryPicker.
// Must be a user click — File System Access API refuses to prompt otherwise.

import { useEffect, useState } from "react";
import { fsaSupported, getSavedLogDir, pickLogDir, requestLogDirPermission } from "../lib/fs";

type GateState =
  | { kind: "checking" }
  | { kind: "unsupported" }
  | { kind: "needs-pick"; hasSaved: boolean }
  | { kind: "ready" }
  | { kind: "error"; message: string };

// Routes that should render before the gate prompts. /about is a colophon
// that explains what Homebase is; a first-time visitor should be able to
// read it before deciding whether to grant filesystem access.
//
// SetupGate is mounted outside RouterProvider, so this check only runs on
// the initial render; client-side nav within a session won't re-evaluate
// it. That's acceptable — the protected routes (/horizon/$id, /, /morning)
// have their own per-feature gates or runtime fail-closed checks.
function isPublicRoute(pathname: string): boolean {
  return /\/about\/?$/.test(pathname);
}

export function SetupGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: "checking" });

  useEffect(() => {
    if (!fsaSupported()) {
      setState({ kind: "unsupported" });
      return;
    }
    getSavedLogDir().then((saved) => {
      if (saved) {
        setState({ kind: "ready" });
      } else {
        setState({ kind: "needs-pick", hasSaved: false });
      }
    });
  }, []);

  if (typeof window !== "undefined" && isPublicRoute(window.location.pathname)) {
    return <>{children}</>;
  }
  if (state.kind === "ready") return <>{children}</>;
  if (state.kind === "checking") return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      {state.kind === "unsupported" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Homebase needs a Chromium browser.</h1>
          <p className="font-serif text-[15px] italic text-[#6B7280]">
            The File System Access API is how Homebase reads and writes your morning log as real
            markdown files. Open this page in Chrome, Edge, Arc, or Brave.
          </p>
        </>
      )}

      {state.kind === "needs-pick" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Homebase</h1>
          <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
            Pick the folder where your morning log lives. Typically{" "}
            <code className="font-mono text-[13px]">~/Documents/homebase-log</code>. Your choice is
            remembered for next time.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await pickLogDir();
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
                const handle = await requestLogDirPermission();
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
            onClick={() => setState({ kind: "needs-pick", hasSaved: false })}
            className="rounded bg-[#374151] px-4 py-2 font-sans text-[13px] text-white hover:bg-[#1F2937]"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
