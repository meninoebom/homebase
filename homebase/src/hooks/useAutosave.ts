// useAutosave — debounce-and-flush hook for one accordion row.
//
// Subscribes to the strategy store's content + dirty flag for `horizon`.
// When dirty content changes, schedules a flush() after `debounceMs`. On
// successful save, the store transitions saveStatus → "saved"; this hook
// then schedules a settle to reset → "idle" after `settleMs` so the
// indicator dot fades.
//
// Returns a `flushNow()` callback that forces an immediate save — meant
// to be called from the editor's onBlur so unsaved drafts are persisted
// when the user navigates away from the row.

import { useEffect } from "react";
import type { Horizon } from "../lib/period-key";
import { useStrategyStore } from "../store/strategy";

interface AutosaveResult {
  flushNow: () => Promise<void>;
}

export function useAutosave(horizon: Horizon, debounceMs = 500, settleMs = 2000): AutosaveResult {
  const content = useStrategyStore((s) => s.rows[horizon].content);
  const dirty = useStrategyStore((s) => s.rows[horizon].dirty);
  const saveStatus = useStrategyStore((s) => s.rows[horizon].saveStatus);
  const flush = useStrategyStore((s) => s.flush);
  const resetSaveStatus = useStrategyStore((s) => s.resetSaveStatus);

  // Debounced save: schedule a flush whenever dirty content changes.
  // The hook deliberately ignores rejections — the store sets
  // saveStatus="error" on failure, which is the user-visible signal.
  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(() => {
      flush(horizon).catch(() => {
        // Error already reflected in saveStatus; nothing more to do here.
      });
    }, debounceMs);
    return () => clearTimeout(id);
  }, [content, dirty, horizon, flush, debounceMs]);

  // Settle: after a successful save, fade the indicator back to idle.
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const id = setTimeout(() => resetSaveStatus(horizon), settleMs);
    return () => clearTimeout(id);
  }, [saveStatus, horizon, resetSaveStatus, settleMs]);

  return {
    flushNow: () => flush(horizon),
  };
}
