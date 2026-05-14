# Homebase

A personal writing tool. Plain markdown. Your folder. No server.

**[Try it →](https://homebase.you)**

Homebase has two surfaces:

- A **home page** for reflection at long horizons — your values, your goals, the year, the month, the week. Writing at one horizon carries forward to the next when a new period begins, so a fresh week starts with last week's draft instead of a blank page.
- A **daily page** for whatever you want to write today. Sections (called *slots*) are arranged to suit your practice — morning ritual, evening journal, midday check-in, all the same surface.

Everything you write is plain markdown saved to a folder you choose on your own computer. There is no server, no account, no sync. Open the same files in any text editor; back them up however you back up files.

## Try it

Open **[homebase.you](https://homebase.you)** in a Chromium browser (Chrome, Edge, Brave, Arc). Homebase uses the browser's File System Access API to read and write your markdown files; Firefox and Safari don't support that yet.

On first launch you pick a folder. `~/Documents/homebase` works well, but anywhere is fine. You only pick it once. Both your home-page horizons and your daily entries live in that one folder.

To install as a desktop app, click the install button in the address bar (or the 3-dot menu → "Install Homebase"). The app shell works offline after first load.

## Customize it

Most things you'd want to change are configurable from the **Customize** link on the home page or daily page footer:

- Reorder, rename, add, or remove slots on the daily page
- Edit the prompts and small hint chips
- Toggle the briefing panel; comes pre-seeded with a curated quote rotation drawn from non-dual, contemplative, and deeper Stoic traditions — replace or extend at will
- Reset to defaults if you want a clean slate

All edits save to a file called `homebase.config.json` in your homebase folder. You can hand-edit it in any text editor; if you break it, Homebase shows a recovery screen with a "Reset to defaults" button.

The two slot kinds:

- **Prompt slot** — single writing field, optional question above it. Each day starts blank. Examples: Dreams, Inner Weather, Gratitude, Today.
- **Workspace slot** — a small whiteboard above a writing field. The whiteboard persists across days; the writing field resets daily. Use a workspace when there's standing context you want to see *before* writing today's entry — goals for a project, the book you're reading, the instrument you're practicing.

## Your data stays on your disk

The app is a static site hosted on GitHub Pages. There is no backend, no database, no telemetry. Your writing never leaves your machine. The browser's File System Access API lets the app read and write the folder you pick; that access ends when you close the tab.

For a real backup: `git init` inside your homebase folder and push to a private repo. Diffs over months tell you something interesting about how your thinking shifted.

## Contribute

Homebase is small and personal, but it's open source ([MIT](LICENSE)) and contributions are welcome. Some ways in:

- **Try it and tell me what's broken.** [Open an issue](https://github.com/meninoebom/homebase/issues/new/choose).
- **Pick up a [`good first issue`](https://github.com/meninoebom/homebase/labels/good%20first%20issue).**
- **Translate the default prompts** into another language.
- **Build something niche** — a slot kind for habits with reps, a calendar overlay, a different briefing source. PRs welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and conventions.

## Local development

Repo layout:

```
homebase/                      # the app — Vite+ + React + TanStack Router
  src/                         # routes, components, store
  public/                      # icons, manifest
  vite.config.ts               # Vite + PWA + Tailwind config
docs/                          # durable design notes
.github/workflows/             # CI + Pages deploy
```

Daily commands (from the repo root):

```bash
pnpm install      # first time only
pnpm dev          # Vite dev server at http://localhost:47823
pnpm test         # vitest run once
pnpm typecheck    # tsc --noEmit
pnpm check        # format + lint
pnpm check:fix    # auto-fix
pnpm build        # production build to homebase/dist/
```

The dev server is pinned to port 47823 to dodge collisions with other Vite projects (`strictPort: true` fails loudly instead of picking the next port).

Under the hood the toolchain is Vite+ (`vp`), wrapping Vite + Vitest + Oxlint + Oxfmt. See [homebase/AGENTS.md](homebase/AGENTS.md) for the full `vp` reference and [CLAUDE.md](CLAUDE.md) for project-specific gotchas.

## CI / deploy

Two workflows:

- `.github/workflows/ci.yml` — runs on every PR and push to main. Format + lint + typecheck + tests. Required check; gates auto-merge.
- `.github/workflows/deploy.yml` — runs on push to main. Builds with `BASE_PATH=/` and publishes to GitHub Pages, served at the custom domain `homebase.you` (configured via `homebase/public/CNAME`).

Branch protection on `main` requires the CI check to pass before merge.

## License

[MIT](LICENSE) — do whatever you want with it; just keep the copyright notice.
