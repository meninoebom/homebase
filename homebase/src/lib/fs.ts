// File System Access API wrapper for the one folder Homebase uses.
//
// Homebase's substrate is real plaintext markdown on disk. The user picks
// ONE folder via showDirectoryPicker(); both the morning-ritual log
// (dated `YYYY-MM-DD.md` files, plus per-slot subdirs) and the strategy
// files (`values.md`, `year-…`, `month-…`, etc.) live in that one folder.
// Filenames don't collide (strategy files are all prefixed; log files are
// date-named), so a single flat folder works.
//
// We store the chosen FileSystemDirectoryHandle in IndexedDB so it
// survives page reloads. On subsequent loads we just need to re-confirm
// permission (usually silent once granted).
//
// Browser support: Chromium-based only (Chrome, Edge, Arc, Brave, Opera).
// Firefox and Safari: absent. This is a deliberate trade — preserving §15
// rule 4 (grep is the memory layer) matters more than browser breadth for
// a personal app.

import { idbGet, idbSet } from "./idb";

const HANDLE_KEY = "homebaseRoot";
// One-time migration: pre-rewrite, the log used "logDir" and strategy
// used "strategyDir". If "homebaseRoot" is missing but "logDir" exists,
// the user's existing log folder is promoted to the unified root.
const LEGACY_LOG_KEY = "logDir";

// -- Directory handle resolution ----------------------------------------

let cachedDir: FileSystemDirectoryHandle | null = null;

/**
 * True if the browser supports the File System Access API. Used by the
 * setup gate to show a clear "wrong browser" message instead of a cryptic
 * undefined-reference error.
 */
export function fsaSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker ===
      "function"
  );
}

/**
 * Look up any persisted handle (new key first, then legacy log-dir key for
 * one-time migration). Returns the raw handle without permission checks.
 */
async function loadPersistedHandle(): Promise<FileSystemDirectoryHandle | null> {
  const saved = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY);
  if (saved) return saved;
  const legacy = await idbGet<FileSystemDirectoryHandle>(LEGACY_LOG_KEY);
  if (!legacy) return null;
  // Promote legacy log handle to the unified key so future loads skip the
  // migration check.
  await idbSet(HANDLE_KEY, legacy);
  return legacy;
}

/**
 * Return the saved homebase folder handle if permission is still granted,
 * else null. Never prompts the user — that's pickHomebaseFolder's job.
 * Used by the setup gate to decide whether to render the picker or the
 * app.
 */
export async function getSavedHomebaseFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (cachedDir) {
    const ok = await verifyPermission(cachedDir);
    return ok ? cachedDir : null;
  }
  const saved = await loadPersistedHandle();
  if (!saved) return null;
  const ok = await verifyPermission(saved);
  if (!ok) return null;
  cachedDir = saved;
  return saved;
}

/**
 * True if a folder handle is persisted (regardless of permission state).
 * The setup gate uses this to distinguish "first run" (no handle yet,
 * full-bleed welcome copy) from "re-confirm permission" (handle exists
 * but browser dropped the grant, friendlier "click to reconnect" copy).
 */
export async function hasSavedHomebaseFolder(): Promise<boolean> {
  if (cachedDir) return true;
  return (await loadPersistedHandle()) !== null;
}

/**
 * Prompt the user to pick a folder. Must be called from a user gesture
 * (click). Persists the chosen handle in IndexedDB.
 */
export async function pickHomebaseFolder(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  await idbSet(HANDLE_KEY, handle);
  cachedDir = handle;
  return handle;
}

/**
 * Re-request permission on the stored handle. Chromium may silently grant
 * if the user granted previously; otherwise shows a permission prompt.
 * Must be called from a user gesture.
 */
export async function requestHomebaseFolderPermission(): Promise<FileSystemDirectoryHandle | null> {
  const saved = await loadPersistedHandle();
  if (!saved) return null;
  const perm = await saved.requestPermission({ mode: "readwrite" });
  if (perm !== "granted") return null;
  cachedDir = saved;
  return saved;
}

async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const status = await handle.queryPermission({ mode: "readwrite" });
  return status === "granted";
}

function rootOrThrow(): FileSystemDirectoryHandle {
  if (!cachedDir) {
    throw new Error(
      "homebase folder handle not initialized — the setup gate should have blocked app render",
    );
  }
  return cachedDir;
}

/**
 * Internal: expose the cached root for strategy-fs.ts, which shares the
 * same folder. Returns null if not yet initialized; callers should ensure
 * the setup gate has run first.
 */
export function getCachedHomebaseRoot(): FileSystemDirectoryHandle | null {
  return cachedDir;
}

// -- File operations ----------------------------------------------------

/** Read a top-level file by name. Returns "" if it doesn't exist. */
export async function readFile(name: string): Promise<string> {
  return readAt(rootOrThrow(), [name]);
}

/** Read a nested file, e.g. readNested(["piano", "state.md"]). */
export async function readNested(segments: string[]): Promise<string> {
  return readAt(rootOrThrow(), segments);
}

/** Write a top-level file, creating it if needed. */
export async function writeFile(name: string, text: string): Promise<void> {
  return writeAt(rootOrThrow(), [name], text);
}

/** Write a nested file, creating intermediate directories as needed. */
export async function writeNested(segments: string[], text: string): Promise<void> {
  return writeAt(rootOrThrow(), segments, text);
}

/**
 * List top-level filenames in the log dir. Used to detect whether the
 * directory already contains user data (any `YYYY-MM-DD.md` day file)
 * — drives the choice between `legacyDefaultConfig()` (existing user
 * migrating from a pre-config build) and `defaultConfig()` (fresh user).
 */
export async function listTopLevelFiles(): Promise<string[]> {
  const dir = rootOrThrow();
  const names: string[] = [];
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "file") names.push(name);
  }
  return names;
}

async function readAt(root: FileSystemDirectoryHandle, segments: string[]): Promise<string> {
  try {
    let dir = root;
    for (let i = 0; i < segments.length - 1; i++) {
      dir = await dir.getDirectoryHandle(segments[i]);
    }
    const file = await dir.getFileHandle(segments[segments.length - 1]);
    const blob = await file.getFile();
    return blob.text();
  } catch (err) {
    if (isNotFound(err)) return "";
    throw err;
  }
}

async function writeAt(
  root: FileSystemDirectoryHandle,
  segments: string[],
  text: string,
): Promise<void> {
  let dir = root;
  for (let i = 0; i < segments.length - 1; i++) {
    dir = await dir.getDirectoryHandle(segments[i], { create: true });
  }
  const file = await dir.getFileHandle(segments[segments.length - 1], {
    create: true,
  });
  const writable = await file.createWritable();
  await writable.write(text);
  await writable.close();
}

function isNotFound(err: unknown): boolean {
  return err instanceof DOMException && err.name === "NotFoundError";
}
