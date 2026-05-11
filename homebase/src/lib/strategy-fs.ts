// File System Access API wrapper for strategy files.
//
// Strategy files live in the same single folder the user picked at first
// run (see ./fs). Pre-rewrite this had its own picker and its own folder;
// that turned the first-run flow into two near-identical "Choose folder"
// screens in a row, which read as a bug. Now: one folder, one pick.
//
// Strategy filenames are all prefixed (`values.md`, `life-goals.md`,
// `year-…`, `month-…`, `week-…`, `day-…`) so they don't collide with the
// date-named log files (`YYYY-MM-DD.md`).
//
// This module exports two implementations of the same shape:
//
//   - StrategyFs           — production singleton, reads from the shared
//                            homebase root via ./fs
//   - createFakeStrategyFs — in-memory factory, used by this module's tests
//                            and by downstream tests (CarryOverResolver,
//                            StrategyStore) that need a writable fake fs

import { getCachedHomebaseRoot, getSavedHomebaseFolder } from "./fs";

export interface StrategyFsApi {
  /**
   * Bootstrap the singleton with the saved directory handle, if permission
   * is still granted. Returns silently if so. Throws if no handle is saved
   * or permission was revoked — callers (the permission gate) should handle
   * by re-prompting via pickHomebaseFolder().
   */
  init(): Promise<void>;
  /** Read a single file. Returns null when missing; throws on real errors. */
  read(filename: string): Promise<string | null>;
  /** Write a file (creates if missing). */
  write(filename: string, content: string): Promise<void>;
  /**
   * List filenames in the directory whose name starts with `prefix`.
   * Sorted **lexicographically descending** (most recent first by ISO key —
   * `month-2026-04.md` before `month-2026-03.md`).
   */
  list(prefix: string): Promise<string[]>;
  exists(filename: string): Promise<boolean>;
}

// -- Directory handle resolution ----------------------------------------
//
// No local cache: we delegate to ./fs, which owns the single root handle.
// init() ensures the shared cache is populated; dirOrThrow() reads it.

function dirOrThrow(): FileSystemDirectoryHandle {
  const root = getCachedHomebaseRoot();
  if (!root) {
    throw new Error(
      "homebase folder handle not initialized — the setup gate should have blocked app render",
    );
  }
  return root;
}

// -- File operations on a handle (shared by production + tests via fake) -

async function readFromDir(dir: FileSystemDirectoryHandle, name: string): Promise<string | null> {
  try {
    const file = await dir.getFileHandle(name);
    const blob = await file.getFile();
    return blob.text();
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

async function writeToDir(
  dir: FileSystemDirectoryHandle,
  name: string,
  content: string,
): Promise<void> {
  const file = await dir.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  await writable.write(content);
  await writable.close();
}

async function listInDir(dir: FileSystemDirectoryHandle, prefix: string): Promise<string[]> {
  const names: string[] = [];
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== "file") continue;
    if (!name.startsWith(prefix)) continue;
    names.push(name);
  }
  // Lexicographic descending — most recent ISO key first.
  return names.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

async function existsInDir(dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch (err) {
    if (isNotFound(err)) return false;
    throw err;
  }
}

function isNotFound(err: unknown): boolean {
  return err instanceof DOMException && err.name === "NotFoundError";
}

// -- Production singleton -----------------------------------------------

export const StrategyFs: StrategyFsApi = {
  async init() {
    if (getCachedHomebaseRoot()) return;
    const saved = await getSavedHomebaseFolder();
    if (!saved) {
      throw new Error("homebase folder handle missing or permission revoked");
    }
  },
  async read(filename) {
    return readFromDir(dirOrThrow(), filename);
  },
  async write(filename, content) {
    return writeToDir(dirOrThrow(), filename, content);
  },
  async list(prefix) {
    return listInDir(dirOrThrow(), prefix);
  },
  async exists(filename) {
    return existsInDir(dirOrThrow(), filename);
  },
};

// -- Fake (in-memory) for tests -----------------------------------------

/**
 * Build an in-memory `StrategyFsApi` for tests. Pass an optional initial
 * map of filename → content to seed the fake.
 *
 * The fake matches production semantics exactly:
 *   - read() returns null for missing files
 *   - write() creates or overwrites
 *   - list(prefix) returns names sorted descending
 *   - exists() reflects current state
 */
export function createFakeStrategyFs(initial: Record<string, string> = {}): StrategyFsApi {
  const files = new Map<string, string>(Object.entries(initial));
  return {
    async init() {
      // No-op for the fake; nothing to bootstrap.
    },
    async read(filename) {
      return files.has(filename) ? (files.get(filename) ?? null) : null;
    },
    async write(filename, content) {
      files.set(filename, content);
    },
    async list(prefix) {
      const matches: string[] = [];
      for (const name of files.keys()) {
        if (name.startsWith(prefix)) matches.push(name);
      }
      return matches.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    },
    async exists(filename) {
      return files.has(filename);
    },
  };
}
