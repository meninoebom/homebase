# morning-ritual

A personal daily writing workspace, shaped like a bullet journal. Time-axis is a dated markdown file per day in `log/`; topic-axis is a set of slot subdirectories — each a small, focused surface for one domain of Brandon's mornings (dreams, inner weather, piano, the algorithmic gym, reflections, creative projects, a daily briefing). Both live as plaintext on the filesystem. **The log file IS the memory; grep is the memory layer.**

## Current phase: Tauri v2 rebuild (April 10, 2026)

This repo is mid-pivot from a bash shell prototype (now archived in `research/bash-shell-spike/`) to a Tauri v2 desktop app with a React + TanStack Router frontend and a Lapham's editorial aesthetic (warm cream, Charter serif, terracotta accent). The Tauri app lives at `app/` once scaffolded. See `docs/plan-morning-ritual.md` for the full plan and `.llm/active-plan.md` (gitignored) for the current working state.

The design rules that constrain every decision in this project are in `docs/plan-morning-ritual.md` §15 (the five rules) and §16 (the self-audit checklist). In one sentence: **this is a writing practice that happens to be structured. It is not a life tracker.**

## Directory layout

```
morning-ritual/
├── app/                       # Tauri v2 application (scaffolds in issue 002)
│   ├── src-tauri/             # Rust backend (log commands, filesystem, grep)
│   └── src/                   # React frontend (routes, slots, store)
├── docs/                      # Durable plans and design notes
│   ├── plan-morning-ritual.md # THE plan — always the source of truth
│   ├── plan-algorithmic-gym.md # Gym slot's own plan
│   ├── idea-morning-ritual.md # Original idea brief
│   ├── reading-list.md
│   └── templates/
│       └── inner-weather.md   # Editable prompt templates
├── research/
│   └── bash-shell-spike/      # Archived April 9 bash prototype (research only)
├── log/                       # → ~/Documents/morning-ritual-log/ (symlink)
│                              #   dated markdown files, NOTES.md
├── .llm/                      # AI workflow scratch (gitignored)
│   ├── active-plan.md         # current working plan state
│   └── issues/                # decomposed work items (001-housekeeping.md, etc.)
└── .gitignore
```

`log/` is a relative symlink to `~/Documents/morning-ritual-log/`. The repo is disposable; the logs are the data. Deleting this repo does not delete a single morning's writing.

## The slot contract (v2, for the Tauri app)

A slot is a directory under `app/src/slots/<slot-id>/` containing:

- **`index.tsx`** — React component exporting `default function Slot({ mode, onComplete, onDraft, initialDraft }: SlotProps)`
- **`meta.ts`** — `{ id, kind: 'prompt' | 'workspace' | 'reminder' | 'fetch' | 'gated', goalState: string, component }`
- **`template.md`** (for prompt slots) — markdown with editable `## headers`, substituted with `{{RITUAL_DATE}}` at render time
- **`state.md`** (for workspace slots like piano) — persistent state the user edits directly between sessions

A slot is expected to append writing to the day log under a `## <slot-name>` header. That's the entire contract. No manifest, no JSON schema, no config file.

Full slot taxonomy and workspace-state pattern: `docs/plan-morning-ritual.md` §10.

## Commands (once `app/` is scaffolded)

    pnpm --dir app install         # first time only
    pnpm --dir app tauri dev       # launches the desktop app in dev mode
    pnpm --dir app tauri build     # production bundle
    pnpm --dir app test            # Vitest
    cargo test --manifest-path app/src-tauri/Cargo.toml

Brandon's typical entry point is: double-click the dock icon in the morning, or `pnpm --dir app tauri dev` from a terminal during development.

## The research framing

This project is designed toward writing practice first, research material second, shippable product never. The bet under study is whether a dated plaintext log + a manifest of slots that read and write it is the minimum viable substrate for personalized software that survives a decade of model and vendor churn. The month-3 test for whether the framing earned itself: *"is there a written observation in NOTES.md you could not have made on day 1?"* (plan §12). The April 10 NOTES.md entry already satisfies this test once, six lessons deep.

## Pointers

- **The plan:** `docs/plan-morning-ritual.md`
- **The five rules:** `docs/plan-morning-ritual.md` §15
- **The self-audit checklist for new slots:** §16
- **The bash shell spike (archived research):** `research/bash-shell-spike/`
- **The research log:** `log/NOTES.md` → `~/Documents/morning-ritual-log/NOTES.md`
- **Current active plan (gitignored):** `.llm/active-plan.md`
- **Decomposed work items (gitignored):** `.llm/issues/`
