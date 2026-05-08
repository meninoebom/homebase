# homebase

A strategic life guide. Open Homebase to ground yourself in what you've decided matters — life values, life goals, and yearly / monthly / weekly strategic plans — before you open your calendar. The morning writing ritual lives one click away as the **Day** row.

Everything is plain markdown on your disk. **Your files; your machine; your edits.** There is no backend, no database, no account.

## Try it

**Live app:** [https://meninoebom.github.io/homebase/](https://meninoebom.github.io/homebase/)

Open it in a Chromium browser (Chrome, Edge, Arc, Brave, Opera). The app needs the browser's File System Access API to read and write your markdown files. Safari and Firefox don't support that API yet.

## Install as a desktop app

Once you're on the live URL in Chromium, click the **install** button in the URL bar (or the 3-dot menu → "Install Homebase"). A standalone window appears, with a desktop icon you can pin to your dock. From then on you launch Homebase like any other app — no browser tab, no dev server.

Updates roll out automatically the next time you open the app after a new version deploys. Your files are unaffected because they live on your disk, not on a server.

## Your data stays on your disk

On first launch, Homebase asks you to pick a folder. The recommended location is `~/Documents/homebase-strategy/` (you can choose anywhere). Your strategic plans live as plain markdown files in that folder, on your machine. Nothing is sent to a server. Nothing is stored in a database.

If you ever want a real backup, the simplest move is `git init` inside your strategy folder and push it to a private repo. Strategic plans are exactly the kind of thing whose history is interesting — diffs over months show how your thinking evolved.

The morning writing ritual writes to a separate folder (`~/Documents/homebase-log/`) for the same reason: durable plain text, your disk, no service to depend on. **The log file IS the memory; grep is the memory layer.**

## What's in the app

Six rows in a vertical accordion, top to bottom:

```
i.    Life values    PERSISTENT
ii.   Life goals     PERSISTENT
iii.  Year           2026
iv.   Month          MAY 2026
v.    Week           WEEK 18, 2026
vi.   Day            OPEN MORNING RITUAL  →
```

Click any of i–v to expand a preview (lead paragraph + numbered items + Open/Edit actions). Click Open to drop into a full-page editor for that horizon. Click Day to launch the morning writing ritual unchanged.

Time-bound rows (year/month/week) carry over from the prior period when you enter a new one — a banner shows "Carried from April 2026 — review and edit, or clear" so the prior thinking is the editable starting point, not a blank page.

## The design

Editorial system inspired by The New Criterion. Cream paper, dusty-red signature accent, italic Newsreader display + Inter Tight chrome. The strategic accordion's source-of-truth design canvas is at `Homebase Redesign/`.

This is a *writing practice that happens to be structured.* Not a life tracker. No streaks, no completion percentages, no scores.

## Local development

Repo layout:

```
homebase/                      # the app — Vite+ + React + TanStack Router
  src/                         # routes, components, store
  public/                      # icons, manifest source
  vite.config.ts               # Vite + PWA + Tailwind config
docs/                          # durable design notes (plan, rationale, etc.)
research/                      # archived prototypes (bash shell spike, etc.)
Homebase Redesign/             # current design canvas (HTML + CSS + JSX prototype)
.github/workflows/             # CI + Pages deploy
.llm/                          # AI workflow scratch (gitignored)
```

Daily commands (run from the repo root — these forward to `homebase/`):

```bash
pnpm dev          # Vite dev server at http://localhost:47823
pnpm build        # production build to homebase/dist/
pnpm check        # format + lint
pnpm check:fix    # auto-fix
pnpm test         # vitest run once
pnpm test:watch   # vitest watch mode
pnpm typecheck    # tsc --noEmit
```

The dev server is pinned to **port 47823** (not the Vite default 5173) to dodge collisions with other Vite projects on the same machine; `strictPort: true` makes a collision fail loudly instead of silently picking the next port. Configured in `homebase/vite.config.ts` under `server.port`.

Under the hood the toolchain is Vite+ (`vp`), wrapping Vite + Vitest + Oxlint + Oxfmt. See `homebase/AGENTS.md` for the full `vp` reference, and `CLAUDE.md` (root) for project-specific gotchas.

## CI / deploy

Two workflows:

- `.github/workflows/ci.yml` — runs on every PR and push to main. Format + lint + typecheck + tests. Required check; gates auto-merge.
- `.github/workflows/deploy.yml` — runs on push to main. Builds with `BASE_PATH=/homebase/` and publishes to GitHub Pages. The live URL above is the output.

Branch protection on `main` requires the CI check to pass before merge.

## Pointers

- **Active plan:** `.llm/active-plan.md` (gitignored — current in-flight work)
- **Design canvas:** `Homebase Redesign/Homebase.html` (open in a browser; runs the prototype offline)
- **Morning ritual plan (historical):** `docs/plan-morning-ritual.md`
- **Five rules:** `docs/plan-morning-ritual.md` §15
- **Strategic-layer rationale:** `.llm/design-strategic-layer/rationale.md`
- **Engineering gym** (separate repo): `meninoebom/engineering-gym`
