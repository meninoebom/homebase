// Repoint both subdirectory caches at the current workspace root.
//
// Lives apart from workspace.ts to keep the module graph acyclic: workspace.ts
// owns the root and knows nothing about its consumers; fs.ts and strategy-fs.ts
// each depend on workspace.ts; this module is the one place allowed to import
// all three. Call it after the root is first resolved (the setup gate) and
// again after a folder change (the settings panel) so subsequent reads/writes
// hit the new <root>/log and <root>/strategy.

import { initLogDir } from "./fs";
import { StrategyFs } from "./strategy-fs";

export async function ensureWorkspaceSubdirs(): Promise<void> {
  await initLogDir();
  await StrategyFs.init();
}
