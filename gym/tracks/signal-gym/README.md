# signal-gym: Ralf hardening

Six reps, ordered by difficulty. Each rep fixes a real problem in Ralf or adds a feature Ralf needs. Each rep is Python first, then hand-ported to Ralf's TypeScript runtime.

See `docs/plan-algorithmic-gym.md` in this repo for the fuller rationale.

## Reps

### Tier 1. Light primers.

- **001-jerkiness-variance** — windowed variance of acceleration. Fixes the known third-derivative bug. ~10 min primer. **Start here.**
- **002-hysteresis-gate** — Schmitt-trigger with minimum dwell. ~10 min primer.
- **003-one-euro-sweep** — parameter sweep harness producing a latency-vs-jitter Pareto curve. ~20 min primer.

### Tier 2. Moderate primers.

- **004-windowed-pearson** — windowed Pearson correlation + cross-dancer synchrony using Welford-style online stats. ~30 min primer.

### Tier 3. Hard. Significant primers.

- **005-dtw-from-scratch** — DTW with Sakoe-Chiba band and LB_Keogh lower bound. 1 to 3 hour primer. The interview-gold rep.
- **006-kalman-trajectory** — 4-state constant-velocity Kalman filter tracking (x, y, vx, vy). Multi-session primer. Capstone. Solving this rep ships the "trajectory as first-class signal" Ralf feature.

Do them in order. Do not skip ahead. Prerequisites build.

## Convention

Each rep is a subdirectory: `NNN-short-slug/`.

Created by `rep.py open signal-gym NNN-short-slug`, which stubs:
- `README.md` with Notes and Gotchas sections
- `solve.py` from the stdlib template
- `input.txt` (empty, fill it in Phase 4)

Every rep ends with a JSON patch or code snippet that can be hand-ported to the Ralf TypeScript runtime at `~/dev/ralf/`.
