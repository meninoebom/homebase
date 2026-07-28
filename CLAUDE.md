# Homebase — project notes for Claude

This file collects project-specific instructions and hard-won gotchas. The user's global preferences live in `~/.claude/CLAUDE.md`; this file overlays homebase-specific concerns.

For the durable user-facing description and stack, see `README.md` (root). For the Vite+ CLI reference, see `homebase/AGENTS.md`.

## Development Workflow

Use judgment to plan appropriately for the task:
- Simple changes (copy tweak, single-file fix, port config): just implement directly.
- Larger changes: think through the approach before coding. A brief plan in the PR body or a scratch file is enough.
- Always create a feature branch off `origin/main`, commit with descriptive messages, and ship via PR. CI is required to pass before merge.

The branch protection on `main` requires the CI check to pass. Auto-merge is fine once CI is green; the deploy workflow rolls the change out to `homebase.you` automatically. (The old `meninoebom.github.io/homebase/` URL now 301s to the custom domain — with one nasty consequence for anyone who loaded it before the move; see `docs/solutions/stale-app-after-moving-to-a-custom-domain.md`.)

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

### About is a header disclosure, not a route (the `/about` page is gone)

The standalone `/about` route was removed in the sotol-fishhook cover redesign (2026-06). "About" is now an expand/collapse panel inside the `Masthead` rust band on `/`: a slim functional bar by default that opens to reveal the concentric `HorizonEmblem` plus a succinct "what Homebase is" + how-to-start. First load auto-opens it once via a localStorage flag (`homebase.seenIntro` in `Masthead.tsx`); the user reopens it any time with the About toggle.

Because About is no longer a public, pre-gate route, `SetupGate.isPublicRoute()` was deleted with it — *every React route* now sits behind the folder picker.

### Public pages live in `public/`, not in the router

The pre-gate surface is now `homebase/public/welcome/index.html`: plain static HTML, no build step, no React, served at `/welcome`. `SetupGate` links to it from both the first-run screen and the unsupported-browser screen, so a stranger can read what Homebase is without granting filesystem access.

This is the pattern to copy for any future public page (privacy, FAQ). Doing it as a static file rather than a router route sidesteps the bug the old `isPublicRoute()` had: that check read `window.location.pathname` once, outside `RouterProvider`, so client-side nav never re-evaluated it and an in-app link could walk you past the gate. A file in `public/` cannot have that problem — it isn't part of the SPA at all.

**Two things will bite you when adding one:**

1. **Add it to `navigateFallbackDenylist`** in `homebase/vite.config.ts`. The service worker registers a navigation fallback bound to the app shell, so without the denylist entry your new static page gets shadowed by the gated SPA for anyone with the worker installed — and only for them, which makes it look intermittent.
2. **Meta tags don't inherit.** `homebase/index.html` and the welcome page each carry their own `og:`/`twitter:` block; `og:image` must be an absolute URL, since unfurlers don't resolve relative paths. The card itself is `homebase/public/og.png`, excluded from the precache in `vite.config.ts` because only crawlers ever fetch it.

### A rotated `+` reads as `×`, not "collapse"

PR #77 fixed a TOC toggle that used `transform: rotate(45deg)` on a `+` glyph to indicate "expanded." The character is technically still a plus, but visual cognition reads *shape* — a 45°-rotated plus is identical to an X, and X triggers "delete / close / destroy" priors regardless of intent. Brandon flagged it as "I'm afraid to click it because I don't want to lose the things that I've saved."

The fix is dumb and right: swap glyphs (`+` ↔ `−`), don't rotate. If you find yourself reaching for a rotation to communicate state change on an interactive control, ask whether the rotated form will be mistaken for a different glyph entirely. Especially watch for: `+` → `×`, `−` → `|`, arrows that flip into different arrow directions.

Code pointer: `homebase/src/components/HorizonRow.tsx`, the `toc-row__icon` span.

### Auto-merge eats subsequent pushes to the same branch

The auto-merge workflow (`gh pr merge --auto --squash`) is great for CI-gated merges, but it has one teeth-grinding interaction: once the merge fires, the source branch is deleted from origin. A subsequent `git push` from your local copy of the same branch name will succeed as `* [new branch]`, but it pushes an *orphaned* branch — the PR is closed, so nothing references the new commits. Your "small follow-up tweak" silently goes nowhere.

The fix when you catch it: branch off the latest `origin/main`, cherry-pick the orphaned commit, open a fresh PR. PR #77 followed this pattern. The lesson: after running `gh pr merge --auto`, treat that branch as frozen — if you have a follow-up, branch off main fresh rather than pushing more commits to the same name.

### Two rooms, two registers — and now both speak Inter Tight

The strategic cover at `/` and the day page at `/day` (renamed from `/morning` on 2026-05-15) deliberately have different backgrounds — warm bone for the cover, white for the writing surface. Both share Inter Tight as the type system but apply it at different scales. If you're adding a new screen, ask which "room" it belongs to:

- **Strategic / cover surface** (`/`, `/horizon/$id`): warm bone (`--paper-1: #ECE6DA`), marigold accent (`--accent-2: #C18A2A`), Inter Tight at confident scales. Since the sotol-fishhook redesign (2026-06) the `/` cover *leads* with a full-bleed **rust** (`--accent-1: #7a2618`) hero band (`Masthead`) above the bone accordion — see the cream-on-rust gotcha below.
- **Writing surface** (`/day`, anywhere with a CodeMirror editor): white, Inter Tight at 18px body, no italics in the chrome. Italic is reserved for markdown semantics that the user typed.

Don't try to unify them — they're intentionally different rooms in the same magazine.

### Cream-on-rust hero + the perspective-taper accordion

The `/` cover redesign (sotol-fishhook, 2026-06, after Everlaw's landing page) layers two ideas on top of the bone accordion:

- **Cream-on-rust hero band** (`Masthead.tsx`, `HorizonEmblem.tsx`). The `strategy-scope` tokens are tuned for *dark ink on bone*; inside the saturated rust band you must flip to bone text on rust. Those inversions are hardcoded as `HERO_*` constants at the top of `Masthead.tsx` (e.g. `HERO_TEXT = var(--paper-1)`) rather than tokens — don't reach for `--ink-*` inside the band, it'll vanish.
- **Perspective taper** (`HorizonRow.tsx`, the `DEPTH` map). The six rows are *horizons*: the far ones (Life values) render small and pale at the top, growing and darkening down to **Today** — largest, rust-solid, the base. Row title size + color come from `DEPTH[horizon]`, not a single shared size. The old `01–06` numerals and the right-hand "Open today's page" label were dropped; labels are deictic ("This year / This month / This week / Today"), and the meta column (2026, June 2026, …) is marigold. If you add a horizon, add a `DEPTH` entry or it won't size.

### One folder, one gate

Homebase used to keep two separate directory handles — log (`logDir`) and strategy (`strategyDir`) — gated by two near-identical permission screens (`SetupGate` and the now-deleted `StrategyPermissionGate`). First-time users perceived this as the picker asking twice for the same thing. PR #68 collapsed both into a single root handle (`homebaseRoot`) under one gate. Strategy and log files coexist in the same folder; filenames don't collide (strategy is horizon-prefixed, log is date-named).

There is a one-time IDB migration: `loadPersistedHandle()` in `lib/fs.ts` falls back to the legacy `logDir` key and promotes it to `homebaseRoot` on first read. Don't remove that fallback until enough time has passed that no installed PWA still has only the old key.

If you ever need a *second* directory for genuinely-separate data (e.g. exports), give it its own picker reachable from settings — don't reintroduce a second first-run gate.

### Parallel agents in separate worktrees still collide on a shared file

When fanning out multiple build agents in parallel (each in its own git worktree), worktree isolation protects you from *most* conflicts — but NOT when two agents edit the **same file**. PRs #102 (jargon gloss) and #104 (feedback modal) were built concurrently and both touched `homebase/src/routes/day.tsx`; the gloss branch's commit swept in the feedback branch's footer edit, leaving an `import { FeedbackLink, FeedbackModal } from "../components/FeedbackModal"` against a component that didn't exist on that branch. Local `pnpm test` had already run before the contamination landed, so only CI typecheck caught the dangling import. The repair was to strip the foreign edit from `day.tsx` and re-push.

The lesson for the next parallel run: **partition the fan-out by file ownership, not just by issue.** Before launching, list the files each issue will touch; if two issues touch the same file, build them sequentially (or have the second rebase on the first) rather than concurrently. Trust CI, not the local test run, as the contamination backstop — and after any parallel build, diff each PR for changes outside its declared scope before merging.

## After Completing Work

Before wrapping up a non-trivial PR, self-assess:
- What was the hardest decision or trickiest problem?
- Did anything surprise you or require a workaround?
- Would a future session benefit from knowing this?

If the answer is yes, add to this file's **Gotchas** section. The bar is "would a future engineer (or future you) lose time without this." Keep entries focused — one paragraph plus a code pointer.

### `pnpm install` at the repo root installs nothing

The app's `package.json` lives in `homebase/`, and the repo root is *not* a pnpm workspace (the `pnpm-workspace.yaml` is inside `homebase/`, holding the Vite+ catalog). So a plain `pnpm install` at the root exits 0 after doing no work, and the next command dies with `ERR_MODULE_NOT_FOUND` plus a quiet "Local package.json exists, but node_modules missing" warning below the stack trace.

Use `pnpm install:app` (a passthrough for `pnpm -C homebase install`). Every other root script already delegates with `-C homebase`, which is why they work once the app's deps exist.

Nothing needs to be installed globally, `vp` included: `vite-plus` is a devDependency and provides `node_modules/.bin/vp`, which is how the scripts resolve it.
