// "Your folder" section of the /settings (Customize) page.
//
// Homebase picks the folder once at first run (SetupGate) and then never
// surfaces it again — so before this there was no way to see WHICH folder
// you're saving to, or to move to a different one. This section closes that
// gap: it shows the connected folder's name and offers a "Change folder…"
// button.
//
// A deliberate limitation made explicit in the copy: the File System Access
// API hands the app only the folder's *name*, never its absolute path, so we
// can't display where it lives — we tell the user to find it via Finder.
//
// Split into a presentational `FolderSectionView` (props-driven, unit-tested)
// and a `FolderSection` container that wires the fs layer. The FS Access
// plumbing itself is untested by repo convention (jsdom has no
// showDirectoryPicker); the testable surface is the view.

import { useState } from "react";
import { getCachedHomebaseRoot, pickHomebaseFolder } from "../lib/fs";

interface FolderSectionViewProps {
  /** The connected folder's leaf name, or null if somehow unresolved. */
  folderName: string | null;
  busy: boolean;
  onChange: () => void;
}

export function FolderSectionView({ folderName, busy, onChange }: FolderSectionViewProps) {
  const name = folderName ?? "your homebase folder";
  return (
    <section className="mt-12">
      <h2 className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#9CA3AF]">
        Your folder
      </h2>

      <p className="font-serif text-[14px] text-[#111]">
        Saving to <span className="font-mono text-[13px]">{name}/</span>
      </p>
      <p className="mt-2 font-serif text-[14px] leading-relaxed text-[#6B7280]">
        Your browser only tells Homebase the folder&rsquo;s name, never where it lives on disk. To
        find it, search Finder (or Spotlight) for{" "}
        <span className="font-mono text-[13px]">{name}</span>. To back it up, copy that folder
        somewhere safe, or run <span className="font-mono text-[13px]">git init</span> inside it.
      </p>

      <button
        type="button"
        onClick={onChange}
        disabled={busy}
        className="mt-4 cursor-pointer rounded border border-[#E5E7EB] bg-white px-3 py-1.5 font-sans text-[13px] text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-50"
      >
        {busy ? "Opening…" : "Change folder…"}
      </button>
      <p className="mt-2 font-serif text-[14px] italic leading-relaxed text-[#9CA3AF]">
        Changing the folder points Homebase at a new location and reloads. Existing files
        aren&rsquo;t moved &mdash; copy them over first if you want to keep them.
      </p>
    </section>
  );
}

export function FolderSection() {
  const [busy, setBusy] = useState(false);
  // getCachedHomebaseRoot is sync and non-null here: SetupGate resolves the
  // handle before rendering any non-public route, and /settings isn't public.
  const folderName = getCachedHomebaseRoot()?.name ?? null;

  const onChange = async () => {
    setBusy(true);
    try {
      await pickHomebaseFolder();
      // Full reload. The ritual and strategy stores are module-scoped Zustand
      // singletons that cache loaded content and never re-read on remount;
      // pointing the fs layer at a new folder without a reload would let a
      // later edit flush the OLD folder's cached content into the NEW folder.
      window.location.reload();
    } catch (err) {
      // Dismissing the OS picker throws AbortError — a no-op, not a failure.
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error(err);
      }
    } finally {
      setBusy(false);
    }
  };

  return <FolderSectionView folderName={folderName} busy={busy} onChange={() => void onChange()} />;
}
