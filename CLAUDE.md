# Homebase — project notes for Claude

This file collects project-specific instructions and hard-won gotchas. The user's global preferences live in `~/.claude/CLAUDE.md`; this file overlays homebase-specific concerns.

For the durable user-facing description and stack, see `README.md` (root). For the Vite+ CLI reference, see `homebase/AGENTS.md`.

## Development Workflow

Use judgment to plan appropriately for the task:
- Simple changes (copy tweak, single-file fix, port config): just implement directly.
- Larger changes: think through the approach before coding. A brief plan in the PR body or a scratch file is enough.
- Always create a feature branch off `origin/main`, commit with descriptive messages, and ship via PR. CI is required to pass before merge.

The branch protection on `main` requires the CI check to pass. Auto-merge is fine once CI is green; the deploy workflow rolls the change to `meninoebom.github.io/homebase/` automatically.

## Auto-merge

PRs in this repo use auto-merge. After creating a PR, run `gh pr merge --auto --squash`. GitHub will hold the merge until the required `check` status reports green, then squash + delete the branch automatically. No babysitting required.

## Code Quality

- `vp check` (or `pnpm check`) before committing — format + lint + typecheck.
- `pnpm test` runs the 100+ vitest suite. New components should land with a corresponding `*.test.tsx`.
- Don't commit broken code. If CI fails on format, run `vp check --fix` and re-push.

## Gotchas (hard-won)

### Dev server is on port 47823, not 5173

Pinned in `homebase/vite.config.ts` via `server.port` with `strictPort: true`. Picked to dodge the Vite default 5173 (which collides with other JS projects on the same machine) while staying under the macOS ephemeral range (49152+). If you change it, remember:

- The deploy workflow doesn't read this — production has no Vite server, just static GitHub Pages output.
- A service worker registered at a previous origin (e.g. `localhost:5173`) will *not* be evicted automatically. If a previous Homebase instance has poisoned an old port, clear it via DevTools → Application → Service Workers → Unregister.

### CodeMirror's `placeholder` is captured at mount time

`MarkdownEditor` (`homebase/src/components/MarkdownEditor.tsx`) builds its `EditorView` inside `useEffect(() => {...}, [])`. The `placeholder` prop is read once and baked into CodeMirror's internal state — subsequent prop changes are ignored.

PR #38 fixed a bug where this caused "How do you want to live? Begin anywhere." to stack twice on `/horizon/life-values`: the parent route flipped a `showInvitation` boolean to `true` after `row.loaded`, but the editor had already captured the old placeholder. The fix was to drop the placeholder prop on the horizon page entirely and let `HorizonInvitation` own the empty state.

If you ever need a reactive placeholder, the CodeMirror-idiomatic fix is a `Compartment` and a second `useEffect([placeholder])` that calls `view.dispatch({ effects: compartment.reconfigure(...) })`. Or remount the editor via React `key`.

### `/about` is whitelisted past `SetupGate`

`SetupGate` (`homebase/src/components/SetupGate.tsx`) wraps the entire `RouterProvider` in `main.tsx`, which means *every* other route is gated behind the homebase-folder picker. `/about` opts out via a path check (`isPublicRoute()`) so a first-time visitor can read what Homebase is before granting filesystem access.

The check reads `window.location.pathname` once. SetupGate is rendered outside `RouterProvider`, so client-side nav does *not* re-evaluate it. User-visible bug surface: someone landing on `/about` and then navigating to `/morning` would bypass SetupGate; `/morning` would fail at runtime when it tries to read the folder. If you add another colophon-style public route (privacy, FAQ), extend `isPublicRoute()` — and ideally only allow it as the entry route, not as a navigation target from inside the gated app.

### One folder, one gate

Homebase used to keep two separate directory handles — log (`logDir`) and strategy (`strategyDir`) — gated by two near-identical permission screens (`SetupGate` and the now-deleted `StrategyPermissionGate`). First-time users perceived this as the picker asking twice for the same thing. PR #68 collapsed both into a single root handle (`homebaseRoot`) under one gate. Strategy and log files coexist in the same folder; filenames don't collide (strategy is horizon-prefixed, log is date-named).

There is a one-time IDB migration: `loadPersistedHandle()` in `lib/fs.ts` falls back to the legacy `logDir` key and promotes it to `homebaseRoot` on first read. Don't remove that fallback until enough time has passed that no installed PWA still has only the old key.

If you ever need a *second* directory for genuinely-separate data (e.g. exports), give it its own picker reachable from settings — don't reintroduce a second first-run gate.

## After Completing Work

Before wrapping up a non-trivial PR, self-assess:
- What was the hardest decision or trickiest problem?
- Did anything surprise you or require a workaround?
- Would a future session benefit from knowing this?

If the answer is yes, add to this file's **Gotchas** section. The bar is "would a future engineer (or future you) lose time without this." Keep entries focused — one paragraph plus a code pointer.
