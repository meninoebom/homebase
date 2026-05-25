// Settings panel for the Homebase workspace folder.
//
// This is the only place in the app to see which folder Homebase is using and
// to move it. Split into a presentational `FolderSettingsView` (props-driven,
// unit-tested) and a `FolderSettings` container that wires the workspace
// functions — mirroring the codebase pattern of testing the pure surface and
// smoke-testing the File System Access plumbing.
//
// A deliberate limitation made explicit in the copy: the browser never hands
// the app an absolute path (FS Access API security), so we can only show the
// folder's *name*, not where it lives. The panel tells the user how to find it
// from Finder if they need the full path.

import { useCallback, useEffect, useState } from "react";
import {
  fsaSupported,
  getSavedRoot,
  hasSavedRoot,
  LOG_SUBDIR,
  pickRoot,
  requestRootPermission,
  STRATEGY_SUBDIR,
} from "../lib/workspace";
import { ensureWorkspaceSubdirs } from "../lib/workspace-init";

export type ConnState =
  | { kind: "checking" }
  | { kind: "unsupported" }
  | { kind: "connected"; rootName: string }
  | { kind: "disconnected"; hasSaved: boolean };

interface FolderSettingsViewProps {
  state: ConnState;
  busy: boolean;
  /** Open the OS picker to choose (or change) the workspace folder. */
  onChoose: () => void;
  /** Re-grant permission on the previously-saved folder. */
  onReconnect: () => void;
}

const EYEBROW = "font-sans text-[10px] font-medium uppercase";
const eyebrowStyle = { color: "var(--ink-3)", letterSpacing: "0.24em" } as const;

export function FolderSettingsView({
  state,
  busy,
  onChoose,
  onReconnect,
}: FolderSettingsViewProps) {
  return (
    <section className="mx-auto max-w-[62ch]">
      <header className="mb-12 text-center">
        <div
          className={`mb-3 ${EYEBROW}`}
          style={{ color: "var(--accent-1)", letterSpacing: "0.24em" }}
        >
          Where your files live
        </div>
        <h1
          className="italic"
          style={{
            fontFamily: "var(--font-serif-display)",
            fontWeight: 400,
            fontSize: "calc(56px * var(--display-scale, 1))",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--ink-1)",
          }}
        >
          Folders
        </h1>
        <div
          aria-hidden="true"
          className="mx-auto mt-[22px] h-px w-12"
          style={{ background: "var(--ink-4)" }}
        />
      </header>

      {state.kind === "checking" && (
        <p className="text-center font-serif text-[15px] italic" style={{ color: "var(--ink-3)" }}>
          Checking…
        </p>
      )}

      {state.kind === "unsupported" && (
        <p className="font-serif text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Homebase needs the File System Access API to read and write your markdown files, and that
          only exists in Chromium browsers. Open this page in Chrome, Edge, Arc, or Brave to manage
          your folder.
        </p>
      )}

      {state.kind === "connected" && (
        <div className="flex flex-col gap-8">
          <div>
            <div className={EYEBROW} style={eyebrowStyle}>
              Homebase folder
            </div>
            <p
              className="mt-2 font-mono text-[17px]"
              style={{ color: "var(--ink-1)" }}
              data-testid="root-name"
            >
              {state.rootName}/
            </p>
            <ul
              className="mt-4 flex flex-col gap-1.5 font-mono text-[14px]"
              style={{ color: "var(--ink-2)" }}
            >
              <li>
                {state.rootName}/{STRATEGY_SUBDIR}/{" "}
                <span className="font-sans" style={{ color: "var(--ink-3)" }}>
                  — life values, goals, and your year / month / week plans
                </span>
              </li>
              <li>
                {state.rootName}/{LOG_SUBDIR}/{" "}
                <span className="font-sans" style={{ color: "var(--ink-3)" }}>
                  — your daily morning-ritual log
                </span>
              </li>
            </ul>
          </div>

          <p className="font-serif text-[14px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            The browser only tells Homebase the folder’s <em>name</em>, never its full path — that’s
            a privacy guarantee of the File System Access API. To find it on disk, search Finder (or
            Spotlight) for <span className="font-mono">{state.rootName}</span>. To back it up, copy
            that one folder somewhere safe, or run <span className="font-mono">git init</span>{" "}
            inside it — strategy diffs over months are worth keeping.
          </p>

          <div>
            <button
              type="button"
              onClick={onChoose}
              disabled={busy}
              className="rounded border px-4 py-2 font-sans text-[12px] font-medium uppercase transition-colors disabled:opacity-50"
              style={{
                borderColor: "var(--ink-4)",
                color: "var(--ink-2)",
                letterSpacing: "0.18em",
              }}
            >
              {busy ? "Opening…" : "Change folder…"}
            </button>
            <p className="mt-3 font-serif text-[14px] italic" style={{ color: "var(--ink-4)" }}>
              Changing the folder points Homebase at a new location. Existing files aren’t moved —
              copy them over first if you want to keep them.
            </p>
          </div>
        </div>
      )}

      {state.kind === "disconnected" && (
        <div className="flex flex-col gap-6">
          <p className="font-serif text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            No folder is connected. Pick where Homebase should keep your files — we recommend a{" "}
            <span className="font-mono">Homebase</span> folder in your home directory (
            <span className="font-mono">~/Homebase</span>). Homebase creates{" "}
            <span className="font-mono">{STRATEGY_SUBDIR}/</span> and{" "}
            <span className="font-mono">{LOG_SUBDIR}/</span> inside it.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onChoose}
              disabled={busy}
              className="rounded px-4 py-2 font-sans text-[12px] font-medium uppercase text-white transition-colors disabled:opacity-50"
              style={{ background: "var(--accent-1)", letterSpacing: "0.18em" }}
            >
              {busy ? "Opening…" : "Choose folder"}
            </button>
            {state.hasSaved && (
              <button
                type="button"
                onClick={onReconnect}
                disabled={busy}
                className="rounded border px-4 py-2 font-sans text-[12px] font-medium uppercase transition-colors disabled:opacity-50"
                style={{
                  borderColor: "var(--ink-4)",
                  color: "var(--ink-2)",
                  letterSpacing: "0.18em",
                }}
              >
                Re-use saved folder
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function FolderSettings() {
  const [state, setState] = useState<ConnState>({ kind: "checking" });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!fsaSupported()) {
      setState({ kind: "unsupported" });
      return;
    }
    const root = await getSavedRoot();
    if (root) {
      setState({ kind: "connected", rootName: root.name });
    } else {
      setState({ kind: "disconnected", hasSaved: await hasSavedRoot() });
    }
  }, []);

  useEffect(() => {
    refresh().catch((err) => {
      console.error(err);
      setState({ kind: "disconnected", hasSaved: false });
    });
  }, [refresh]);

  const onChoose = useCallback(async () => {
    setBusy(true);
    try {
      await pickRoot();
      await ensureWorkspaceSubdirs();
      // Full reload rather than setState. The strategy and ritual stores are
      // module-scoped Zustand singletons that cache row content with
      // loaded:true and never re-read on remount; pointing the fs layer at a
      // new folder would otherwise let an edit flush the OLD folder's cached
      // content into the NEW folder. Reload is the simplest correct reset for
      // an action this rare. (Alternative — per-store reset actions — is more
      // code for no user-visible gain here.)
      window.location.reload();
    } catch (err) {
      // User dismissing the OS picker throws AbortError — that's a no-op, not
      // a failure. Log and re-sync state for anything else.
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error(err);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const onReconnect = useCallback(async () => {
    setBusy(true);
    try {
      const root = await requestRootPermission();
      if (!root) {
        // Permission denied (or no saved handle) — re-sync so the panel
        // reflects reality instead of silently doing nothing.
        await refresh();
        return;
      }
      await ensureWorkspaceSubdirs();
      setState({ kind: "connected", rootName: root.name });
    } catch (err) {
      console.error(err);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return (
    <FolderSettingsView state={state} busy={busy} onChoose={onChoose} onReconnect={onReconnect} />
  );
}
