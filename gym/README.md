# gym

The algorithmic gym. Daily deliberate practice in Python, driven by the `/gym` Claude Code slash command.

## What this is

A terminal-first daily rep against one of a small set of tracks:
- `signal-gym/` — Ralf hardening (DTW, Kalman, Pearson, jerkiness, one-euro, hysteresis)
- `agent-internals/` — frontier literacy (constrained decoding, MCP, durable execution)
- `control-center/` — shippable portfolio agents with state handoff
- `interview-patch/` — on-demand 10-problem geometry sprint (reactivates only for scheduled interviews)

Each rep follows the 7-phase protocol in `protocol.md`. Phase 3 (cost prediction) is gated by `rep.py` and cannot be skipped. Phase 4 (code alone) is no-AI, no-peeking.

## Canonical log

Every phase appends a section to `~/Documents/homebase-log/YYYY-MM-DD.md` under a `## gym: <track> / <rep>` header. The log file lives outside this repo, in `~/Documents/`, so it survives repo nuking and iCloud syncs it. This is the same file the Tauri homebase slots append to, per `docs/save-architecture.md` and plan-morning-ritual.md §15 rule 2.

## How to run a rep

Open Claude Code in this directory (or anywhere) and type `/gym`. Claude walks through the 7 phases, calling `rep.py` at each transition. That is the whole interface.

Direct invocations (for debugging or forcing state):

```
python3 rep.py start                    show today's state
python3 rep.py open <track> <rep>       create rep dir, stub solve.py
python3 rep.py log <phase> <body>       record a phase transition
python3 rep.py close                    finalize, bump streak
python3 rep.py status                   streak + current rep
```

## Relation to homebase

This is a Python CLI practice, not a Tauri slot. When (if) the gym eventually becomes a React slot inside homebase (see `docs/save-architecture.md:147`), it reads and writes the same day log. Nothing built here is throwaway.

## Note on language

Python, stdlib plus numpy when a rep genuinely needs it. The Ralf TypeScript runtime is a separate world; the "hand-port from Python to TypeScript" step happens in your editor, not here (see plan-algorithmic-gym.md rules).
