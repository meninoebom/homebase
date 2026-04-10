# Active slots

<!--
Commitment device (plan §15):
Agent output is a slot appending to the log under its own "## <slot-name>"
header. Full stop. No main supervisor, no memory store, no side channels.
The log is the bus.

Twelve months from now, when a tempting architectural addition comes up —
"what if we had a main agent with a memory store," "what if slots shared
state through a SQLite cache," "what if there was a notification layer" —
this sentence is the test. If the proposal requires an agent to read or
write anything other than the dated log and its own slot directory, the
answer is no.
-->

<!--
Day 1: shipping empty. The algorithmic gym (docs/plan-algorithmic-gym.md)
is slot 0 and will land here as entry 1 once its own build completes.
Inner weather is slot 1 in the phasing (§5) and will be built only after
the gym has survived a week of real mornings. No slot is added until the
self-audit checklist (§16) has been answered in NOTES.md.
-->

## Parked
