# Primer: Uniqueness, DISTINCT, and indexes are the same idea wearing three hats

Target duration: 20 to 30 minutes. Goal: Brandon can explain why UNIQUE constraints, DISTINCT queries, and index lookups are three access patterns over the same underlying structure — and can predict where the cost lives in each.

## The unifying framing

All three operations answer a version of the same question: *"for a given key, what do we know?"*

- **UNIQUE constraint** answers at write time: "does this key already exist — if so, reject or upsert."
- **DISTINCT query** answers at read time: "how many different keys did we see."
- **Index lookup** answers any time: "where are the records for this key."

The underlying structure in all three cases is a map from key → something. The differences are *when* the map is built, *what* it stores, and *who pays the cost*.

## Where the cost lives

| Operation | Cost paid | Typical complexity | What you spend |
|---|---|---|---|
| UNIQUE constraint | On every write | O(log n) per insert with B-tree, O(1) with hash | Write latency |
| DISTINCT query | On every read | O(n) scan + hash set of O(k) where k = distinct count | Query time + memory |
| Index lookup | Amortized (build once, query many) | O(log n) per query after O(n) build | Storage + write overhead |

The senior-engineer move in an interview is to name the *tradeoff*, not just the mechanism. "UNIQUE makes writes slower to make reads deterministic. DISTINCT makes reads slower because we didn't pay the cost at write time. An index makes both faster but we paid for it in storage and on every write forever."

## The three paths on voter data

Imagine a stream of voter records, 100k rows, with ~5% duplicates (same voter_id appearing multiple times — think "three states reported the same person"):

```
voter_id, state, updated_at, party, address
V-0001,   CA,    2026-01-15, D,     123 Main St
V-0001,   CA,    2026-03-02, D,     456 Oak Ave   # update
V-0002,   NY,    2026-02-10, R,     789 Pine Rd
V-0001,   CA,    2026-01-15, D,     123 Main St   # exact dup
...
```

Three questions to answer:

1. **Count distinct voters.** How many unique voter_ids are in this file?
2. **Dedup keeping latest.** Return one record per voter_id, preferring the highest `updated_at`.
3. **Fast lookup.** Given a voter_id, return all records for that voter in O(1) or O(log n).

Each question is a different access pattern over the same data. Each has a different cost profile. Each maps to a real engineering decision in a warehouse.

## Warehouse correspondences (for vocabulary)

- **Count distinct** in Snowflake: `COUNT(DISTINCT voter_id)` is exact but scales poorly. `APPROX_COUNT_DISTINCT` uses HyperLogLog — O(1) space, ~2% error. Senior answer: "exact or approximate is a business question."
- **Dedup keeping latest** in Snowflake: `QUALIFY ROW_NUMBER() OVER (PARTITION BY voter_id ORDER BY updated_at DESC) = 1`. Pinot's equivalent is an upsert table with primary key + time column.
- **Fast lookup** in Pinot: an inverted index on voter_id. In Snowflake: clustering key on voter_id if access is predictable, or search optimization service if ad-hoc.

You don't need to memorize these — just know that each question has a warehouse-native answer, and the reason the warehouse has to offer three different answers is that the three access patterns have genuinely different cost profiles.

## What to predict in Phase 3

For each of the three questions, commit to a Big O for **both time and space** before writing any code.

Starter frame (do not accept these without Brandon's own reasoning):

- Q1 (count distinct): time O(?), space O(?)
- Q2 (dedup keeping latest): time O(?), space O(?)
- Q3 (fast lookup after index build): build time O(?), query time O(?), space O(?)

The senior move: predict what *changes* if dup rate goes from 5% to 90%. Does your space bound shift?

## What Brandon writes in Phase 4

`solve.py` takes a CSV on stdin (generate it from the primer schema or write a tiny generator). Three functions:

1. `count_distinct(rows) -> int`
2. `dedup_keeping_latest(rows) -> list[row]`
3. `build_index(rows) -> dict` + `lookup(index, voter_id) -> list[row]`

Keep it pure stdlib. No pandas. The point is to feel the structures in your hands.

Validation: generate 100k rows with known dup rate, verify the counts are self-consistent (distinct_count == len(deduped)). Measure wall-clock for each; compare to your predictions.

## Extension seed for Phase 6

Two ways to extend:

1. **Approximate count.** Implement a HyperLogLog sketch in ~40 lines. Compare its count and memory to the exact hash-set approach on 1M rows. This is what `APPROX_COUNT_DISTINCT` does under the hood.
2. **External sort dedup.** What if the input doesn't fit in memory? How would you dedup a 10GB file with 1GB of RAM? (Answer: external merge sort, then linear scan. This is what warehouses do under the hood when a GROUP BY spills.)

Pick one. The HLL extension is the interview-richer one.

## The lesson future-you should internalize

Every data structure choice is a bet on an access pattern. Warehouses give you knobs (clustering, indexes, materialized views) so you can express the bet. The job of a senior data engineer is to name the access pattern *first*, then pick the structure.
