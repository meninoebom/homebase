// File System Access API wrapper for the morning-ritual log directory,
// with IndexedDB handle persistence (via ./idb).
//
// Homebase's substrate is real plaintext markdown on disk — same folder the
// Tauri version used (~/Documents/homebase-log/). The user picks the
// folder once via showDirectoryPicker(). We store the resulting
// FileSystemDirectoryHandle in IndexedDB so it survives page reloads; on
// subsequent loads we just need to re-confirm permission (usually silent
// once granted).
//
// Browser support: Chromium-based only (Chrome, Edge, Arc, Brave, Opera).
// Firefox and Safari: absent. This is a deliberate trade — preserving §15
// rule 4 (grep is the memory layer) matters more than browser breadth for
// a personal app.

import { idbGet, idbSet } from "./idb";

const HANDLE_KEY = "logDir";

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
 * Return the saved directory handle if permission is still granted, else
 * null. Never prompts the user — that's pickLogDir's job. Used by the
 * setup gate to decide whether to render the picker or the app.
 */
export async function getSavedLogDir(): Promise<FileSystemDirectoryHandle | null> {
  if (cachedDir) {
    const ok = await verifyPermission(cachedDir);
    return ok ? cachedDir : null;
  }
  const saved = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY);
  if (!saved) return null;
  const ok = await verifyPermission(saved);
  if (!ok) return null;
  cachedDir = saved;
  return saved;
}

/**
 * Prompt the user to pick a directory. Must be called from a user gesture
 * (click). Persists the chosen handle in IndexedDB.
 */
export async function pickLogDir(): Promise<FileSystemDirectoryHandle> {
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
export async function requestLogDirPermission(): Promise<FileSystemDirectoryHandle | null> {
  const saved = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY);
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

function logDirOrThrow(): FileSystemDirectoryHandle {
  if (!cachedDir) {
    throw new Error(
      "log directory handle not initialized — the setup gate should have blocked app render",
    );
  }
  return cachedDir;
}

// -- File operations ----------------------------------------------------

/** Read a top-level file by name. Returns "" if it doesn't exist. */
export async function readFile(name: string): Promise<string> {
  return readAt(logDirOrThrow(), [name]);
}

/** Read a nested file, e.g. readNested(["piano", "state.md"]). */
export async function readNested(segments: string[]): Promise<string> {
  return readAt(logDirOrThrow(), segments);
}

/** Write a top-level file, creating it if needed. */
export async function writeFile(name: string, text: string): Promise<void> {
  return writeAt(logDirOrThrow(), [name], text);
}

/** Write a nested file, creating intermediate directories as needed. */
export async function writeNested(segments: string[], text: string): Promise<void> {
  return writeAt(logDirOrThrow(), segments, text);
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
