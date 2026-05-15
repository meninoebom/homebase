// First-run gate. Blocks the whole app until the user has picked the
// folder Homebase keeps its files in. Once picked, the choice is
// remembered (IndexedDB) — the user shouldn't see this screen again
// unless the browser drops the permission (e.g. site data cleared).
//
// The File System Access API requires a user gesture to prompt, so the
// gate renders an explicit "Choose folder" button rather than auto-firing
// the picker.

import { useEffect, useState } from "react";
import {
  fsaSupported,
  getSavedHomebaseFolder,
  hasSavedHomebaseFolder,
  pickHomebaseFolder,
  requestHomebaseFolderPermission,
} from "../lib/fs";

type GateState =
  | { kind: "checking" }
  | { kind: "unsupported" }
  // first-time setup: no handle saved yet
  | { kind: "first-run" }
  // handle saved but browser dropped the grant; one click silently
  // reconnects in the common case
  | { kind: "reconnect" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

// Routes that should render before the gate prompts. /about is a colophon
// that explains what Homebase is; a first-time visitor should be able to
// read it before deciding whether to grant filesystem access.
//
// SetupGate is mounted outside RouterProvider, so this check only runs on
// the initial render; client-side nav within a session won't re-evaluate
// it. That's acceptable — the protected routes (/horizon/$id, /, /day)
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
    (async () => {
      const saved = await getSavedHomebaseFolder();
      if (saved) {
        setState({ kind: "ready" });
        return;
      }
      const hasSaved = await hasSavedHomebaseFolder();
      setState({ kind: hasSaved ? "reconnect" : "first-run" });
    })();
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
            Homebase saves your notes as real markdown files on your computer, which needs an API
            that Chrome, Edge, Arc, Brave, and Opera support. Firefox and Safari don&rsquo;t yet.
          </p>
        </>
      )}

      {state.kind === "first-run" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Welcome to Homebase.</h1>
          <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
            Homebase stores everything you write as plain text files in a folder on your computer.
            You pick the folder; Homebase never moves it, and you can back it up like any other
            folder.
          </p>
          <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
            Choose any folder you like &mdash;{" "}
            <code className="font-mono text-[13px]">Documents/homebase</code> works well. You only
            need to do this once.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await pickHomebaseFolder();
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
        </>
      )}

      {state.kind === "reconnect" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Welcome back.</h1>
          <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
            Your browser needs you to re-confirm access to your Homebase folder. Click below to
            reconnect &mdash; you shouldn&rsquo;t need to pick the folder again.
          </p>
          <button
            type="button"
            onClick={async () => {
              const handle = await requestHomebaseFolderPermission();
              if (handle) {
                setState({ kind: "ready" });
                return;
              }
              // Permission still denied. Fall back to picking again (rare:
              // e.g. user revoked or deleted the folder).
              setState({ kind: "first-run" });
            }}
            className="rounded bg-[#374151] px-4 py-2 font-sans text-[13px] text-white hover:bg-[#1F2937]"
          >
            Reconnect
          </button>
        </>
      )}

      {state.kind === "error" && (
        <>
          <h1 className="font-serif text-2xl text-[#374151]">Something went wrong.</h1>
          <p className="font-mono text-[13px] text-[#6B7280]">{state.message}</p>
          <button
            type="button"
            onClick={() => setState({ kind: "first-run" })}
            className="rounded bg-[#374151] px-4 py-2 font-sans text-[13px] text-white hover:bg-[#1F2937]"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
