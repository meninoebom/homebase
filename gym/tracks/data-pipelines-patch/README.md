# data-pipelines-patch: Data engineering fundamentals for Murmuration

Interview prep track for the Senior Research Engineer role at Murmuration. Built to train the primitives that show up in any warehouse or OLAP system: uniqueness, indexing, dimensional thinking, ingestion patterns. Tool-specific vocabulary (Snowflake, Pinot, AWS) is layered on top later — primitives first.

See `~/dev/job-search/companies/murmuration/data-pipelines-study-guide.md` for the parallel "how to *talk about* this" doc. This track is the "how to *reason about* this" side.

## Reps

### Tier 1. Interview-rich primitives.

- **020-dedupe-and-index** — three access patterns over the same data (count distinct, dedup keeping latest, fast lookup). Shows that UNIQUE, DISTINCT, and indexes are three views of the same concept. Predicts where the cost lives. **Start here if indexing/SQL feels shaky.**

### Tier 2. Pipeline design in code.

- **030-multi-source-normalize** — given three sample voter files with different schemas, write the normalizer that produces a unified schema. Tests key derivation, conflict resolution, idempotency. **The realist rep** — closest to actual Murmuration day-one work.

## Convention

Each rep is a numbered subdirectory: `NNN-short-slug/`.

Created by `rep.py open data-pipelines-patch NNN-short-slug`, which stubs:
- `README.md` with Notes and Gotchas sections
- `solve.py` from the stdlib template
- `input.txt` (empty, fill it in Phase 4 or generate it from the primer)

Every rep produces: (a) a committed `solve.py`, (b) a log entry with Phase 3 prediction and Phase 5 reflection, and (c) one line added to the Civiqs translation table in the study guide so the *talking about it* muscle grows in lockstep with the *reasoning about it* muscle.
