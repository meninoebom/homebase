# Contributing to Homebase

Thanks for your interest in helping. Homebase is a small personal-tool project — the bar for "useful contribution" is low, and the bar for "fits the vibe" is mainly about taste, not credentials.

## Ways to help

- **Report bugs you hit.** Use the [bug template](https://github.com/meninoebom/homebase/issues/new?template=bug.md). What you expected, what happened, what browser, what folder you picked, what was in the config file if relevant.
- **Open feature requests.** Use the [feature template](https://github.com/meninoebom/homebase/issues/new?template=feature.md). Tell me what you want to do that you currently can't, before sketching how it should work.
- **Pick up a [`good first issue`](https://github.com/meninoebom/homebase/labels/good%20first%20issue).** These are scoped narrowly enough that someone unfamiliar with the codebase can land a PR.
- **Improve the docs.** README, the About panel on the home page, the [landing page](homebase/public/welcome/index.html), in-code comments — all fair game.
- **Translate the default prompts.** Right now defaults ship in English. Adding a non-English starter config is genuinely useful.

## Development setup

Requires Node 20+ and `pnpm` (Corepack works: `corepack enable`). Everything else, including the `vp` toolchain, installs as a project dependency — there is nothing to install globally.

```bash
git clone https://github.com/meninoebom/homebase.git
cd homebase
pnpm install:app  # NOT plain `pnpm install`
pnpm dev          # Vite dev server at http://localhost:47823
```

The app's dependencies live in `homebase/`, and the repo root is not a pnpm workspace, so a plain `pnpm install` at the root succeeds while installing nothing at all — the next command then fails with `ERR_MODULE_NOT_FOUND`. `pnpm install:app` is a passthrough for `pnpm -C homebase install`.

Open the dev URL in a Chromium browser (Homebase uses the File System Access API). Pick a scratch folder for your local data — don't point dev at your real homebase folder unless you mean to.

Daily commands (run from the repo root):

```bash
pnpm install:app  # install/refresh the app's dependencies
pnpm dev          # Vite dev server at http://localhost:47823
pnpm test         # vitest run once
pnpm test:watch   # vitest watch mode
pnpm typecheck    # tsc --noEmit
pnpm check        # format + lint
pnpm check:fix    # auto-fix
pnpm build        # production build to homebase/dist/
```

## Conventions

### Branches and PRs

- Branch off `main`. Feature branches are named like `feature/foo`, `fix/bar`, `chore/baz`, `docs/qux`.
- Open a PR with a clear title and a short description. Include a "Test plan" — what you did to convince yourself it works.
- CI must pass before merge: format, lint, typecheck, tests. Branch protection enforces it.
- Auto-merge is the default. Once your PR is green and approved, GitHub squash-merges and deletes the branch.

### Commits

- Conventional-commit style for the title (`feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`).
- Body explains the *why*, not the *what* — the diff is the what.

### Code style

- TypeScript everywhere. No `any` without a justification comment.
- React 19 with hooks. No class components.
- Tailwind for styling, with the editorial-cream tokens scoped to `.strategy-scope` and a separate white register for the daily page. See [`homebase/src/index.css`](homebase/src/index.css).
- Tests live next to the code (`Foo.tsx` + `Foo.test.tsx`) and use `vitest` + `@testing-library/react`.
- Run `pnpm check` before pushing. CI rejects unformatted code.

### Comments

- Default to *no* comments. Only add a comment when the *why* is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug.
- Don't explain *what* the code does (well-named identifiers do that). Don't reference the current task or PR ("for the X feature"); that belongs in the PR description.

### Adding a slot kind

The two slot kinds (`prompt`, `workspace`) cover almost everything a personal-writing app needs. Resist adding a third unless you've literally typed the same code twice and want to factor it out — every new kind is a new rendering path, a new config schema field, a new settings-form branch.

If you do add one:

1. Extend `SlotConfig` and `validateSlot` in [`homebase/src/lib/config.ts`](homebase/src/lib/config.ts).
2. Add a generic component in [`homebase/src/components/`](homebase/src/components/).
3. Wire it into the dispatch in [`homebase/src/routes/day.tsx`](homebase/src/routes/day.tsx) and the settings edit form in [`homebase/src/routes/settings.tsx`](homebase/src/routes/settings.tsx).
4. Document it in the About panel (`homebase/src/components/Masthead.tsx`).

## Architecture pointers

- **Routes** — [TanStack Router](https://tanstack.com/router) file-based routing in `homebase/src/routes/`.
- **State** — Zustand stores in `homebase/src/store/`. The ritual store (`store/ritual.ts`) owns daily drafts + the user's HomebaseConfig.
- **Filesystem** — `homebase/src/lib/fs.ts` is the File System Access API wrapper. The picked directory handle is persisted in IndexedDB across reloads.
- **Config** — `homebase/src/lib/config.ts` is the schema, validator, and disk I/O for `homebase.config.json`. Slot ids are stable; titles/prompts are mutable.
- **Strategy accordion** — `homebase/src/components/HorizonRow.tsx` and `homebase/src/store/strategy.ts`. Carry-over logic is in `homebase/src/lib/carry-over-resolver.ts`.
- **Landing page** — `homebase/public/welcome/index.html`, plain static HTML with no build step, served at `/welcome`. It is the only page a visitor can read before granting folder access, so the setup gate links to it. Adding another static page under `public/` means adding it to `navigateFallbackDenylist` in `homebase/vite.config.ts`, or the service worker will serve the app shell over it.

## Testing

- Run `pnpm test` before pushing.
- Add tests for non-trivial logic. Pure functions get unit tests; React components get rendering tests via `@testing-library/react`.
- The File System Access API and IndexedDB aren't mocked globally; tests that need them mock at the module boundary (see `homebase/src/components/WorkspaceSlot.test.tsx` for the pattern).

## Code of Conduct

Be kind. Don't be a jerk. The full text is in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions

Open a [Discussion](https://github.com/meninoebom/homebase/discussions) for "how does X work" or "would you accept a PR that does Y". Issues are for concrete bugs and features.
