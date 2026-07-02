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
  configFromPreset,
  DEFAULT_PRESET_ID,
  layoutPresets,
  readConfig,
  writeConfig,
  type LayoutPreset,
} from "../lib/config";
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
  // folder picked on a fresh install (no existing config): let the user
  // pick a starter practice before they land in the app
  | { kind: "choose-practice" }
  // handle saved but browser dropped the grant; one click silently
  // reconnects in the common case
  | { kind: "reconnect" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

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

  if (state.kind === "ready") return <>{children}</>;
  if (state.kind === "checking") return null;

  if (state.kind === "choose-practice") {
    return (
      <StarterPracticeChooser
        presets={layoutPresets()}
        defaultPresetId={DEFAULT_PRESET_ID}
        onChoose={async (preset) => {
          try {
            await writeConfig(configFromPreset(preset));
            setState({ kind: "ready" });
          } catch (err) {
            setState({ kind: "error", message: String(err) });
          }
        }}
      />
    );
  }

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
            Choose any folder you like &mdash; a{" "}
            <code className="font-mono text-[13px]">Homebase</code> folder in your home directory (
            <code className="font-mono text-[13px]">~/Homebase</code>) works well. Keeping it out of{" "}
            <code className="font-mono text-[13px]">Documents</code> and{" "}
            <code className="font-mono text-[13px]">Desktop</code> avoids iCloud making
            sync-conflict copies of files you edit often. You only need to do this once.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await pickHomebaseFolder();
                // A folder that already has a homebase.config.json belongs to
                // a returning user (or a shared/migrated folder): don't offer
                // the first-run practice chooser or we'd overwrite their setup.
                // Only brand-new folders get the starter-practice step.
                const existing = await readConfig();
                setState({ kind: existing.kind === "ok" ? "ready" : "choose-practice" });
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

/**
 * First-run starter-practice picker. Presentational and exported so it can
 * be tested without the File System Access plumbing that wraps SetupGate.
 * A practice is just a named section layout; the highlighted default is
 * "Morning ritual", so a user who clicks Start without touching anything
 * gets today's behavior.
 */
export function StarterPracticeChooser({
  presets,
  defaultPresetId,
  onChoose,
}: {
  presets: LayoutPreset[];
  defaultPresetId: string;
  onChoose: (preset: LayoutPreset) => void;
}) {
  const [selectedId, setSelectedId] = useState(defaultPresetId);
  const [busy, setBusy] = useState(false);
  const selected = presets.find((p) => p.id === selectedId) ?? presets[0];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="font-serif text-2xl text-[#374151]">Pick a starter practice.</h1>
        <p className="mt-3 font-serif text-[15px] leading-relaxed text-[#6B7280]">
          This sets up the sections on your daily page. It&rsquo;s just a starting point: you can
          rename, reorder, add, or remove sections any time from Customize.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Starter practice</legend>
        {presets.map((preset) => {
          const active = preset.id === selected.id;
          return (
            <label
              key={preset.id}
              className={`flex cursor-pointer flex-col gap-1 rounded border px-4 py-3 text-left ${
                active
                  ? "border-[#374151] bg-[#F9FAFB]"
                  : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF]"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="starter-practice"
                  value={preset.id}
                  checked={active}
                  onChange={() => setSelectedId(preset.id)}
                  className="h-4 w-4"
                />
                <span className="font-serif text-[16px] text-[#111]">{preset.title}</span>
              </span>
              <span className="pl-7 font-serif text-[14px] leading-relaxed text-[#6B7280]">
                {preset.description}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex justify-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            onChoose(selected);
          }}
          className="rounded bg-[#374151] px-5 py-2 font-sans text-[13px] text-white hover:bg-[#1F2937] disabled:opacity-60"
        >
          {busy ? "Setting up…" : `Start with ${selected.title}`}
        </button>
      </div>
    </div>
  );
}
