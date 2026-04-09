# morning-ritual

A personal morning ritual built as a thin shell around a set of composable slots. The first slot is the algorithmic gym. Future slots include a daily check-in (brain dump, inner weather, today's compass), piano practice log, reading reflections, Tend todo triage, and crumb.blog draft capture.

This is both a working tool and a research substrate for writing about the minimum viable substrate for personalized software.

## Structure

- `docs/` — idea briefs and plans for the ritual and each slot
- `docs/templates/` — templates used by slots (e.g. the inner weather check-in)
- `NOTES.md` — research field notes on the ritual itself
- `gym/` — the algorithmic gym (first active slot, created when Cut 1 ships)
- `log/` — daily dated markdown logs, shared across slots (created when the shell ships)
- `slots.md` — ordered list of active slots (created when the shell ships)

## Active work streams

Two things are being built in parallel:

1. **Ralf hardening via the Signal Gym track.** Python reps that fix real Ralf bugs, hand-ported back to the Ralf TypeScript runtime. See `docs/plan-algorithmic-gym.md`.
2. **Control center agents.** Small specific agents wired into the ritual, designed around state handoff via MCP and durable event logs. See `docs/plan-algorithmic-gym.md` Track 2b.

See also `docs/plan-morning-ritual.md` for the shell and slot protocol.

## The broader bet

This is not a "control center" or a "productivity hub." It is a personal logbook plus a manifest of slots that read and write it. The substrate is plaintext on the filesystem. The log file IS the memory. See `docs/plan-morning-ritual.md` section 1 for the framing.
