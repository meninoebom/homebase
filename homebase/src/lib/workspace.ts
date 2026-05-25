// The single Homebase workspace root.
//
// The user picks ONE folder (recommended ~/Homebase). Everything Homebase
// writes lives inside it, in two subfolders the app creates automatically:
//
//   <root>/strategy/   — life values, goals, year/month/week plans
//   <root>/log/        — daily morning-ritual logs + slot state
//
// Both fs.ts (log) and strategy-fs.ts (strategy) derive their working
// directory from this root via getSubdir(), so there is exactly one folder
// to pick, one permission to grant, and one folder to back up. The two
// subfolders stay distinct so the strategy folder can go under version
// control without dragging the day log in (the original two-folder rationale
// from active-plan.md §4.5 survives as two subdirs of one root).
//
// Why a single root instead of two independently-picked folders: it matches
// the user's mental model ("everything is in ~/Homebase"), halves first-run
// friction (one pick, not two), and makes backup a single instruction.
// Switched 2026-05-25, when the on-disk data was still empty so there was
// nothing to migrate.
//
// The browser persists a FileSystemDirectoryHandle (an opaque capability,
// NOT a path string — the FS Access API never exposes the absolute path) in
// IndexedDB so the folder is picked once and survives reloads. On later
// loads we just re-confirm permission, which Chromium usually grants
// silently.

import { idbGet, idbSet } from "./idb";

const HANDLE_KEY = "rootDir";

/** Subfolder names created inside the workspace root. */
export const STRATEGY_SUBDIR = "strategy";
export const LOG_SUBDIR = "log";

let cachedRoot: FileSystemDirectoryHandle | null = null;

/**
 * True if the browser supports the File System Access API. Used by gates and
 * the settings panel to show a clear "wrong browser" message instead of a
 * cryptic undefined-reference error.
 */
export function fsaSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker ===
      "function"
  );
}

/**
 * Return the saved root handle if permission is still granted, else null.
 * Never prompts — that's pickRoot's job. Caches on success so getSubdir can
 * resolve without a second IndexedDB round-trip.
 */
export async function getSavedRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (cachedRoot) {
    return (await verifyPermission(cachedRoot)) ? cachedRoot : null;
  }
  const saved = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY);
  if (!saved) return null;
  if (!(await verifyPermission(saved))) return null;
  cachedRoot = saved;
  return saved;
}

/** True if a handle is stored, regardless of whether permission is current. */
export async function hasSavedRoot(): Promise<boolean> {
  if (cachedRoot) return true;
  return (await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY)) !== undefined;
}

/** The cached root's display name (leaf folder name), or null. */
export function rootName(): string | null {
  return cachedRoot?.name ?? null;
}

/** Prompt the user to pick the workspace root. Must be from a user gesture. */
export async function pickRoot(): Promise<FileSystemDirectoryHandle> {
  // `id` makes Chromium remember where the picker last opened, so a re-pick
  // from settings starts in the same place as the original choice.
  const handle = await window.showDirectoryPicker({ mode: "readwrite", id: "homebase" });
  await idbSet(HANDLE_KEY, handle);
  cachedRoot = handle;
  return handle;
}

/**
 * Re-request permission on the stored root handle. Chromium may grant
 * silently if previously granted; otherwise it shows a prompt. Must be from
 * a user gesture. Returns null if no handle is saved or permission denied.
 */
export async function requestRootPermission(): Promise<FileSystemDirectoryHandle | null> {
  const saved = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY);
  if (!saved) return null;
  if ((await saved.requestPermission({ mode: "readwrite" })) !== "granted") return null;
  cachedRoot = saved;
  return saved;
}

/**
 * Return (creating if needed) a named subdirectory of the workspace root.
 * Throws if the root isn't resolved yet — the setup gate should have blocked
 * app render before any caller reaches here.
 */
export async function getSubdir(name: string): Promise<FileSystemDirectoryHandle> {
  const root = cachedRoot ?? (await getSavedRoot());
  if (!root) {
    throw new Error(
      "workspace root not initialized — the setup gate should have blocked app render",
    );
  }
  return root.getDirectoryHandle(name, { create: true });
}

async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  return (await handle.queryPermission({ mode: "readwrite" })) === "granted";
}
