// File operations for the morning-ritual log directory.
//
// The log directory is the `log/` subfolder of the single Homebase workspace
// root (see workspace.ts). This module no longer owns a folder handle of its
// own — it caches the resolved `<root>/log/` handle and reads/writes inside
// it. initLogDir() (called by the setup gate, and again by the settings panel
// after a folder change) resolves that subdir from the current root.
//
// Layout inside the log directory is unchanged from the Tauri version:
//   <log-dir>/YYYY-MM-DD.md      — day logs
//   <log-dir>/<slot>/state.md    — workspace slot state
// Preserving §15 rule 4 (grep is the memory layer): real plaintext on disk,
// greppable from Terminal, survives the app.

import { getSubdir, LOG_SUBDIR } from "./workspace";

let cachedDir: FileSystemDirectoryHandle | null = null;

/**
 * Resolve (and cache) the `<root>/log/` directory from the current workspace
 * root, creating it if needed. Always re-resolves so a folder change made in
 * settings repoints subsequent reads/writes. Cheap enough off the hot path;
 * read/write use the cached handle.
 */
export async function initLogDir(): Promise<void> {
  cachedDir = await getSubdir(LOG_SUBDIR);
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
