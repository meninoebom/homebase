# Bash shell spike (April 9, 2026)

This directory holds the bash shell prototype of the morning ritual runner. It was the Day 1 implementation before the April 10 pivot to Tauri v2 + React. It is **not** working code any longer — it is research material, preserved so the repo history documents what was tried, what worked, and what was learned.

## What was here

- `morning` — a ~75-line bash shell that read `slots.md`, iterated the active slots, invoked each slot's `run.sh` with `RITUAL_DATE` and `RITUAL_LOG` env vars, greeted the day, quoted yesterday's log if present, and printed elapsed time on exit.
- `slots.md` — an intentionally-empty-on-Day-1 manifest of active slots. Numbered markdown list with a `## Parked` section below, an awk-parser in the shell, and the commitment-device rule from plan §15 written as a block comment at the top.

## Why it moved here

The bash substrate was architecturally right in every way that survives the Tauri rebuild — plaintext markdown logs in `~/Documents/morning-ritual-log/`, the `log/` symlink pattern, the day-file-per-date convention, the "slot is a directory with its own runner" contract. But a terminal is not a rich enough writing surface for Brandon to actually want to open every morning, and that user-experience truth overrode the elegance-of-substrate argument. See the April 10 NOTES.md entry at `~/Documents/morning-ritual-log/NOTES.md` for the full research note — six concrete lessons plus the meta-lesson ("I am a terminal user for my code, not for my writing").

## What survived

Every architectural decision validated by the spike carried forward unchanged:

- **Logs live in `~/Documents/morning-ritual-log/`, not in the repo.** The `log/` symlink at the repo root is kept and will be used by the Tauri Rust backend exactly as it was used by the bash shell.
- **NOTES.md is the research log**, lives next to the daily logs, is the canary for whether the ritual is studied or just performed.
- **A slot is a small, self-contained unit** that appends to the day's markdown file under a `## <slot-name>` header. In the Tauri version the slot is a React component instead of a bash script, but the log-append contract is identical.
- **The shell layer is smaller than any single slot.** The bash shell was ~60 lines of code; the Tauri app's shell layer (`src-tauri/src/commands/log.rs` + `src/store/ritual.ts` + `src/routes/morning.tsx`) should stay in the same ballpark. If it grows past ~300 lines before any slot ships, something is wrong with the contract.

## What did NOT survive

- The bash substrate itself (replaced by Tauri's Rust + React runtime)
- The `run.sh` per-slot contract (replaced by the TypeScript slot component contract)
- The `RITUAL_MODE` environment variable (replaced by the Zustand `sequence.mode` runtime state)
- The awk-based `slots.md` parser (replaced by an explicit TypeScript slot registry)
- The terminal UX itself (replaced by a full-bleed Lapham-palette window with Charter serif typography)

## Pointer

- **The detailed research note** (what the spike taught, with the meta-lesson): `~/Documents/morning-ritual-log/NOTES.md` → `### 2026-04-10 — The Tauri pivot, and what the bash spike taught`
- **The current design plan** (what the Tauri rebuild looks like): `../../docs/plan-morning-ritual.md`
- **The current active work plan**: `../../.llm/active-plan.md` (gitignored, ephemeral)

Don't run the bash shell from here. Its `log/` symlink path resolution assumed it was at the repo root, which it no longer is. If you actually want to resurrect it for reference, `git show feature/day-1-shell` or `git log --all --source -- morning` will surface the original history.
