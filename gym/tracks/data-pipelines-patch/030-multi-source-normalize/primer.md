# Primer: Schema normalization across heterogeneous sources

Target duration: 20 to 30 minutes. Goal: Brandon can name the three load-bearing decisions in a multi-source ingestion pipeline — key derivation, field normalization, conflict resolution — and can predict which will be the expensive one before writing code.

## The setup

Murmuration ingests voter files from multiple state vendors. Each state ships a different format: different column names, different date formats, different address conventions, different ways of encoding party registration. The pipeline's job is to produce a single unified schema that downstream analytics can query without knowing or caring which state the record came from.

This rep simulates that with three tiny CSVs — each representing a different "vendor" — and asks you to write the normalizer.

## The three load-bearing decisions

### 1. Key derivation

You need a *cross-source identity* for each voter. Possibilities:

- A vendor-provided stable ID (rare in practice — each state has its own)
- A composite key: `(state, state_voter_id)` — stable within a state
- A derived key: hash of `(first_name, last_name, dob, address_zip)` — stable across sources but fragile to typos

The interview-rich answer: "No single key is right; the pipeline needs *both* a within-source stable key and a cross-source fuzzy-match layer. The fuzzy match is its own problem."

### 2. Field normalization

Every field that's not an integer needs a normalizer. Sample problems:

- Dates: `"2026-04-15"`, `"04/15/2026"`, `"15-Apr-2026"` → one format
- Addresses: `"123 Main St"`, `"123 MAIN STREET"`, `"123 Main Street, Apt 4"` → USPS-normalized
- Party: `"D"`, `"DEM"`, `"Democratic"`, `"democrat"` → one taxonomy

The trap: you'll be tempted to inline normalization in the main loop. Resist. Each field's normalizer is its own function so it can be tested in isolation and reused across sources.

### 3. Conflict resolution

When two sources disagree about the same voter, who wins?

- **Recency**: highest `updated_at`. Simple, but wrong when a vendor ships stale data.
- **Source authority**: "state voter files outrank commercial vendors." Requires maintaining a source priority list.
- **Field-level merge**: authority per field — "state wins for address, commercial wins for phone." More accurate, more complex.

The senior answer: "It depends on the field and on how much the business trusts each source. I'd start with source authority by field, with recency as the tiebreaker, and make the authority map a config file — not code — so non-engineers can tune it."

## Worked example of the data shape

Three input files, same three voters, different schemas:

**`state_ca.csv`**
```
voter_id,first_name,last_name,party_code,last_updated
CA-001,Jane,Doe,DEM,2026-03-01
CA-002,John,Smith,REP,2026-03-01
CA-003,Maria,Garcia,IND,2026-03-01
```

**`vendor_acme.csv`**
```
person_id,fname,lname,affiliation,ts
P-1001,Jane,Doe,Democrat,2026-02-15T08:00:00
P-1002,John,Smyth,Republican,2026-02-15T08:00:00
```
(Note: "Smyth" vs "Smith" — classic fuzzy-match problem. Out of scope for this rep. Just flag it in `input.txt`.)

**`vendor_beta.csv`**
```
id|first|last|party|date
B-77|Jane|Doe|D|2026-04-01
B-78|Maria|García|I|2026-04-01
```
(Note: pipe-delimited, and "Garcia" vs "García" — unicode normalization.)

The unified output shape:

```
unified_id, first_name, last_name, party, sources, last_seen
```

Where `sources` is a list like `["state_ca", "vendor_acme", "vendor_beta"]` for traceability.

## What to predict in Phase 3

- **Time** to normalize n rows across k sources: should be O(?) — what dominates?
- **Space**: O(?) — do you hold all rows in memory, or can you stream?
- **Which of the three decisions (key / normalize / resolve) will be the most expensive in practice?** Commit to one before you code.

Interview-rich: predict what breaks at 50M rows per source. (Answer: holding the unified map in memory. Solution: external sort by key, then merge.)

## What Brandon writes in Phase 4

`solve.py` reads three CSVs (or one multi-section CSV for simplicity) and produces a unified CSV on stdout. Structure it as:

```python
def normalize_source_ca(row) -> UnifiedRow: ...
def normalize_source_acme(row) -> UnifiedRow: ...
def normalize_source_beta(row) -> UnifiedRow: ...

def resolve_conflicts(rows: list[UnifiedRow]) -> UnifiedRow: ...

def merge(sources: dict[str, list[UnifiedRow]]) -> list[UnifiedRow]: ...
```

Keep each normalizer dumb. All of the cleverness lives in `resolve_conflicts`. This is the shape that survives production.

Generate the input manually — you'll learn more from crafting a test dataset with real edge cases than from a synthetic generator.

## Extension seed for Phase 6

Two options:

1. **Late-arriving data.** A vendor ships a correction to a record you processed last week. How does your pipeline handle it without reprocessing everything? (Hint: idempotent upserts, versioned records, or a "last_seen per source" column.)
2. **Schema evolution.** State CA adds a new column next month. Does your pipeline break? If not, is that because your normalizer is robust, or because you're silently dropping the new field?

Late-arriving is the more interview-relevant extension — it's the question that separates "I've written ETL" from "I've operated ETL."

## The lesson future-you should internalize

Schema normalization looks like a data-cleaning problem and is actually an *organizational* problem: whose data wins, who gets to change the rules, and how do you debug it a year later when someone asks "why did this voter's party change?" The answer has to live in the code — not in tribal knowledge.
