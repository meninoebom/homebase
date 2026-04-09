# Plan: Algorithmic Gym

A daily practice of building CS fundamentals by hand, in service of Ralf and the control center agents.

## Mission

This gym exists to close one specific gap: the distance between what Brandon can ship with AI assistance (a lot) and what he can rebuild by hand from first principles (currently less than interviewers expect). Both skills are legitimate. Shipping with AI help is how real work happens in 2026. Building from first principles is what interviewers test, and what gives grounded confidence to extend systems past where the AI can go on its own.

The gym is not a CS-fundamentals rebuilder in the abstract. It is a daily delivery engine for two public work streams:

1. **Ralf**, the reactive audio locomotion framework bridging moving bodies and programmable music.
2. **Control center agents**, small specific agents wired into the morning ritual as a portfolio piece and positioning statement.

Every rep produces an artifact. Nothing is private practice for its own sake.

## Architecture

Three tracks plus one on-demand sprint.

```
Gym
├── Track 1: Signal Gym (Ralf Hardening)       daily core
├── Track 2: Agent Internals + Control Center  weekly ship
├── Track 3: Frontier Audio Exposure           deferred to Q3
└── Sprint: Interview Patch                    reactivates on demand
```

Every rep follows a 7-phase protocol (the classic 6 plus a new Phase 0).

## Protocol

Phase 0 is optional. Phases 1 to 6 are mandatory.

**Phase 0: Concept primer.** When the rep involves a concept Brandon does not already own cleanly, pause before the rep starts. Claude teaches the concept from first principles using analogies, worked tiny examples, ASCII diagrams, and the underlying math without jargon. Brandon asks questions until he can explain the concept back in his own words. Phase 0 ends when he can teach it, not when a clock runs out.

**Phase 1: Restate.** Brandon describes the problem in his own words. Input shape, output shape, desired behavior. Claude writes the restatement verbatim into the rep log.

**Phase 2: Model.** Brandon describes the data structure and a naive approach in one paragraph. No code, just shape and flow.

**Phase 3: Predict cost.** Brandon commits to a Big O estimate for time and space before writing any code. Format must be explicit: O(n), O(n log n), O(n^2). This phase is gated. The rep cannot proceed to Phase 4 without it.

**Phase 4: Code alone.** Brandon writes the solution in Python, stdlib plus numpy when needed. No AI assistance on the code. No peeking at AI-generated implementations in his own codebases. Claude does not help. Claude does not see the code until Phase 5.

**Phase 5: Reflect.** After the code runs, Claude walks Brandon through five questions: actual runtime, prediction match, concept gap, lesson for future self, and (for Ralf reps) a comparison against the existing implementation. What differed, which is simpler, did the AI-generated version have subtle issues, did the hand-written one.

**Phase 6: Extension prediction.** Before extending the rep, Brandon predicts what changes. For AoC problems this is Part 2. For Ralf reps this is usually "what changes if the input scales 10x" or "what changes on 20 dancers in parallel."

## Rules

1. **No peeking at AI-generated code during a rep.** Brandon cannot open the existing Ralf implementation while building the Python version. The gym version must come from Phase 0 plus Brandon's own understanding, not from reverse-engineering code he did not supervise line by line.

2. **No AI assistance on the solution during Phase 4.** Claude can teach in Phase 0, can ask questions in Phases 1 to 3, and can review in Phases 5 and 6. Claude cannot write code during Phase 4.

3. **Hand-port from Python to TypeScript, always manually.** When a Ralf rep produces a Python implementation, the port to Ralf's TypeScript runtime must be done by hand. The port is where the learning lands.

4. **Phase 3 is gated.** `rep.py` refuses to advance past Phase 3 until Brandon has committed an explicit Big O estimate containing `O(` and `)`.

5. **Every rep produces a durable artifact.** Options: a Python file committed to the gym repo, a JSON patch for Ralf, a crumb.blog draft, a PR to Ralf's TypeScript runtime, or a log entry. If the rep does not produce something durable, the rep does not count.

## Directory structure

The gym lives inside the morning-ritual project at `~/dev/morning-ritual/gym/`, alongside future slots. The whole morning-ritual directory is a git repo backed up to GitHub.

```
~/dev/morning-ritual/
  README.md
  NOTES.md                      research field notes
  docs/
    plan-algorithmic-gym.md     this file
    plan-morning-ritual.md
    idea-morning-ritual.md
    reading-list.md
    templates/
      inner-weather.md
  gym/
    README.md
    protocol.md                 the 7 phases, verbatim
    rep.py                      stdlib state machine
    tracks/
      signal-gym/               Track 1: Ralf hardening
        README.md
        001-jerkiness-variance/
          primer.md
          solve.py
          test_solve.py
          patch.json             TypeScript-adoptable output
        002-hysteresis-gate/
        003-one-euro-sweep/
        004-windowed-pearson/
        005-dtw-from-scratch/
        006-kalman-trajectory/
      agent-internals/          Track 2a: frontier literacy
        001-constrained-decoding/
        002-mcp-server-client/
        003-durable-execution/
      control-center/           Track 2b: shippable agents
        parents-agent/
        tend-agent/
      frontier-audio/           Track 3 (deferred)
        README.md
      interview-patch/          Sprint, on demand
        001-bresenham/
  log/
    YYYY-MM-DD.md               daily log, shared across slots
    streak.json
```

## Track 1: Signal Gym (Ralf Hardening)

Six reps ordered by difficulty. Each rep fixes a real problem in Ralf or adds a feature Ralf needs. Each rep is Python first, then hand-ported to Ralf's TypeScript runtime.

### Tier 1: accessible with light primers

**Rep 001. Jerkiness as windowed variance of acceleration.** Fixes a known Ralf bug (current implementation uses third derivative, which is numerical garbage on noisy pose data). Primer: ~10 minutes on windowed variance and acceleration. Output: Python implementation, validated against a recorded pose session, JSON patch for the TypeScript runtime. **Start here.**

**Rep 002. Hysteresis gate with dwell time.** Proper Schmitt-trigger with minimum dwell. Primer: ~10 minutes on two-state machines with hysteresis. Output: Python reference, unit tests with adversarial noisy inputs, port to Ralf's gate primitive.

**Rep 003. One-euro filter parameter sweep harness.** Brandon currently uses one-euro as a black box throughout Ralf. Primer: ~20 minutes on what the one-euro filter actually does mathematically. Output: CSV plus ASCII Pareto plot of latency vs jitter across the min_cutoff/beta parameter space, adopted into Ralf docs.

### Tier 2: accessible with moderate primers

**Rep 004. Windowed Pearson correlation + cross-dancer synchrony.** Uses Welford-style online statistics. Primer: ~30 minutes on numerically stable streaming statistics. Output: Python implementation, validated on two synthetic signals with known lag then on two recorded dancers, adopted as a Ralf primitive. Unblocks the scaffolded-but-unfinished relational qualities work.

### Tier 3: hard, significant primers required

**Rep 005. DTW from scratch with Sakoe-Chiba band and LB_Keogh.** Primer: 1 to 3 hours on dynamic programming over a 2D cost matrix, sequence alignment, recurrence relations. Output: Python DTW that matches the existing Rust recognizer's output on the holdout set within epsilon. This is the rep that most directly answers the interview question "can you build DTW by hand."

**Rep 006. Trajectory tracker with a constant-velocity Kalman filter.** Primer: multi-session on state space models, Gaussian state estimation, the predict-update cycle, covariance intuition. Output: 4-state (x, y, vx, vy) Kalman filter in ~60 lines of numpy, validated on recorded motion, promoted to a Ralf primitive. **This is the "trajectory as first-class signal" unsolved problem. Solving this rep ships a real Ralf feature. Capstone of Track 1.**

Do the reps in order. Do not skip ahead. The tiers build prerequisites for each other.

## Track 2: Agent Internals + Control Center

Two sub-tracks that run in parallel.

### 2a. Frontier literacy (3 reps)

**Rep 001. Constrained decoding with a JSON schema.** Primer: how LLM token generation and sampling work, what rejection sampling is. Output: a tiny constrained sampler in Python, then graduation to Outlines or llguidance with a real JSON schema.

**Rep 002. MCP server + MCP client.** Primer: the MCP resource/tool/prompt distinction. Output: ~150 lines of Python, an MCP server exposing one real tool from Brandon's life (Tend todo creation, crumb.blog drafting), and a client that consumes it.

**Rep 003. Durable execution toy.** Primer: the Temporal or Inngest step-function model, what "durable" means for long-running workflows. Output: a toy agent where every tool call is a checkpoint and the loop resumes from disk after a crash.

### 2b. Control center agents (shippable portfolio)

Build 2 to 3 small agents wired into the morning ritual. The critical constraint: **start with two agents that must hand off state.** Solo agents are table stakes. State handoff is the real portfolio piece.

**Recommended starting pair:**
- **Parents-interaction agent** receives a message, extracts commitments.
- **Tend todo agent** receives a commitment, files it as a task.

The handoff between them is the hard problem. Solve it with MCP servers as the tool interface and a durable event log as the handoff mechanism. If the solution is easy, the positioning is folk theory and Brandon should pivot to something harder. If the solution is hard, that is the portfolio piece.

Subsequent agents (crumb.blog publishing, Google Calendar, etc.) get added one at a time, each justifying its slot by proving it is worth running on its own.

Each shipped agent gets a crumb.blog writeup.

## Track 3: Frontier Audio Exposure (deferred to Q3)

Contents reserved for later:
- DDSP resynthesis driven by Ralf gesture streams (Engel et al, ICLR 2020)
- MusicGen text-prompt mapping from Ralf quality streams (feel the latency wall)
- Motion VQ tokenizer plus a tiny next-token model in ~200 lines of PyTorch (MotionGPT)

**Prerequisites before reactivating:** an ML foundations mini-track covering linear algebra refresher, probability, gradient descent from scratch in numpy, a tiny MLP from scratch, then PyTorch basics. Roughly 8 to 12 reps of its own.

Reactivate when the control center ship and Ralf hardening are both in motion and Brandon has bandwidth.

## Sprint: Interview Patch (reactivates on demand)

10 geometry and grid problems, done with the 7-phase protocol, in a 2-week sprint. Reactivates only when an interview loop is scheduled. Does not run continuously.

Contents:
- Bresenham line drawing (the original Fractional failure, three ways: float, Bresenham, DDA, with tests)
- Flood fill
- Point in polygon
- A* on a weighted grid
- Convex hull (gift wrap then Graham scan)
- Line segment intersection
- Rotate a matrix 90 degrees in place
- Manhattan distance path search
- Wu's antialiased line
- One rotating calipers problem

## The `/gym` command

A Claude Code slash command at `~/.claude/commands/gym.md`. The command:

1. Reads `~/dev/morning-ritual/gym/protocol.md` as the source of truth for the 7 phases.
2. Runs `python3 ~/dev/morning-ritual/gym/rep.py start`.
3. Asks which track (`signal-gym`, `agent-internals`, `control-center`, `interview-patch`).
4. Asks which rep (suggests the next un-done rep in that track).
5. Walks through Phases 0 to 6 in order. Phase 0 only runs when the concept needs a primer.
6. Calls `rep.py log <phase> <args>` at each transition.
7. Enforces the Phase 3 gate.
8. Closes with `rep.py close` which bumps the streak and prints a summary.

## Log format

One file per day at `~/dev/morning-ritual/log/YYYY-MM-DD.md`. The gym contributes one section per rep. Other slots (check-in, piano log, etc.) append sibling sections.

```
# 2026-04-10

## Gym

### Signal Gym Rep 001: Jerkiness as windowed variance

- Track: signal-gym
- Primer: 12 minutes (windowed variance, acceleration, third-derivative bug)
- Started: 07:15
- Finished: 08:02

#### Restate
...

#### Model
...

#### Predict
O(n) time with window size w, O(w) space.

#### Code
solve.py, 18 lines. Ran in 45ms on a 10,000-frame recorded session.

#### Reflect
- Actual: ~45ms, linear as predicted.
- Prediction matched: yes.
- Concept gap: initially confused windowed variance with EMA variance. Primer cleared it.
- Lesson: variance of differences is not the same as differences of variances.
- Ralf comparison: existing Rust implementation uses third derivative, produces NaN on fast motion. Python version is simpler and correct. Filed PR.

#### Extension prediction
If windowed variance has to run on 20 dancers in parallel, the bottleneck is memory not compute. Pre-allocate ring buffers per dancer.
```

## 12-week ship plan

**Weeks 1-6: Control center agents plus essay.**

- Ship 2 to 3 control center agents (Track 2b) with state handoff via MCP plus durable log.
- Publish a crumb.blog essay on the control center architecture philosophy.
- Run Signal Gym Reps 001 to 003 (Tier 1) as the daily practice during this period.

**Weeks 7-12: Ralf trajectory plus technical writeup.**

- Finish Signal Gym Reps 004 to 006 (Tier 2 to 3).
- Rep 006 (Kalman filter trajectory tracker) IS the "trajectory as first-class signal" Ralf feature. Shipping the rep ships the feature.
- Publish a technical writeup on Ralf's architecture and the trajectory work, targeted at both system design interviews and grant reviewers.

**Ongoing throughout:**

- Track 2a (agent internals) happens in parallel with Track 2b as primers allow.
- Dancer rehearsal scheduled but not blocked on.
- Track 3 stays deferred.
- Interview Patch sprint reactivates only if a loop is scheduled.

## How to talk about Ralf in interviews

The art context is the hook. The engineering is the meat.

**System design talking points:**
- Adapter pattern isolating sensor sources from translators (swap MediaPipe for MoveNet without touching translators)
- Backpressure and frame-drop policy in a soft-real-time 30fps pipeline
- DTW similarity thresholds learned from small-N training data
- VAD state machine as a denoising layer for gesture segmentation
- OSC as a message bus to SuperCollider
- Four-layer architecture: adapters, runtime, translators, sound engines

**What makes interviewers glaze over:** vibes about embodied intelligence, 70,000 years of anything, grant committee names. Save that register for grant applications.

**Practice telling the Ralf story in three lengths:**
- **4 minutes** for a recruiter screen
- **15 minutes** for a technical phone screen
- **45 minutes** for an onsite panel or system design interview

## What got cut and why

- **Crafting Interpreters.** Parsing is not on any critical path right now. Revisit only if Ralf eventually needs a scripting layer for performers.
- **Advent of Code as a track.** Puzzle trivia. Unanimous cut from all three expert reviews.
- **The broad 10-algorithm music ladder.** Brandon has an instrument, not a palette. Reps should be Ralf sub-problems.
- **Algorithms from Phenomena (boids, wave function collapse, etc.).** Palette expansion for someone without a practice. Brandon has one.
- **Broad "build your own X" CLIs from codingchallenges.fyi.** Pivoted away once the real portfolio was on the table.
- **Private gym practice with no artifact.** Do it for life, not for the pipeline.

## Next action

Tomorrow morning: run `/gym` for the first time. The rep is Signal Gym Rep 001 (jerkiness as windowed variance of acceleration).

Phase 0 will take roughly 10 minutes. The full rep will take 30 to 60 minutes. At the end, Brandon will have fixed a real Ralf bug and understood every line.

That is what the gym is for.
