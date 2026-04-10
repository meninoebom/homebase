# morning-ritual

A personal daily workspace shaped like a bullet journal. The time-axis is a
dated markdown file per day, in `log/`. The topic-axis is a set of slot
subdirectories — each a small tool for one domain of Brandon's mornings
(the algorithmic gym, piano, inner weather, dreams, reading, creative
projects). Both live as plaintext on the filesystem. The log file IS the
memory; grep is the memory layer.

The `morning` command runs the slot sequence from `slots.md`. It is the
primary invocation. `ritual <slot>` exists as a secondary affordance for
cases that genuinely don't fit the morning window — notably piano updates
after a 4pm practice session — but it is not an equal entry point
(plan §15 rule 1). If ad-hoc use ever starts replacing morning use, the
morning is broken and needs shrinking, not "evolving."

This is not a life tracker, not a shippable product, and not a "plugin
platform." A slot IS the extension mechanism. No scores, no streaks, no
metrics, no quizzes. It is a writing practice that happens to be structured.

## Usage

    ./morning                  run the full morning sequence
    ./morning --only <slot>    run a single slot from the sequence

## Structure

- `morning` — the shell (bash, ~60 lines)
- `slots.md` — ordered list of active slots
- `log/` — symlink to `~/Documents/morning-ritual-log/`
- `log/NOTES.md` — research field notes on the ritual itself
- `log/YYYY-MM-DD.md` — one file per day; slots append under their own `## <slot-name>` header
- `docs/` — plans and idea briefs
- `docs/templates/` — editable prompt templates used by prompt slots
- `gym/` — the algorithmic gym slot (slot 0, built in parallel; see `docs/plan-algorithmic-gym.md`)

## The slot contract

A slot is a subdirectory with an executable `run.sh`. The shell sets these
environment variables before calling it:

- `RITUAL_DATE` — today in `YYYY-MM-DD`
- `RITUAL_LOG`  — path to today's log file
- `RITUAL_MODE` — `morning` or `adhoc`

A slot is expected to append markdown to `$RITUAL_LOG` under a
`## <slot-name>` header. That's the entire contract. No manifest, no
schema, no config file. Slots can also maintain persistent state files
in their own directory — see plan §10 for the workspace pattern.

## The plan

The full design lives in `docs/plan-morning-ritual.md`. The most important
sections:

- **§5** — phased slot rollout (one slot at a time, previous slot must
  survive a week of real mornings first)
- **§9** — the thesis under study, in Brandon's words
- **§15** — the five rules the project now explicitly lives by
- **§16** — self-audit checklist for adding any new slot
- **§17** — the discipline of subtraction (what was deliberately left out)
