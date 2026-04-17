# The 7-phase rep protocol

Source of truth. Both Brandon and the `/gym` slash command read this file. Editing this file is how the protocol evolves.

## Mission

Close the gap between what Brandon can ship with AI assistance and what he can rebuild by hand from first principles. Every rep produces a durable artifact. No private practice for its own sake.

## The phases

### Phase 0. Primer (optional)

Runs only when the concept is unfamiliar. Claude teaches the concept from first principles: analogies, worked tiny examples, ASCII diagrams, underlying math without jargon. Brandon asks questions until he can explain the concept back in his own words.

Phase 0 ends when Brandon can teach it, not when a clock runs out. Length: 10 minutes to several hours. It is fine for Phase 0 to be the whole session on a hard rep.

Logged as `### Primer` with a terse summary: topic covered, duration, any crux concept that took extra time.

### Phase 1. Restate

Claude prompts: "Describe the problem in your own words. What is the input shape. What is the output shape."

Brandon answers in chat. Claude does not summarize back. Claude writes the restatement verbatim to the log under `### Restate`.

### Phase 2. Model

Claude prompts: "What data structure holds the input. What is your naive approach in one paragraph."

Brandon answers. No code. Just shape and flow. Logged under `### Model`.

### Phase 3. Predict cost. GATED.

Claude prompts: "Give me a Big O for time and space. Format: O(n), O(n log n), O(n^2). An explicit expression, not a feeling."

`rep.py` validates that the committed expression contains `O(` and `)`. If it does not, `rep.py` exits with `PREDICT_REQUIRED` and Claude cannot advance. If Brandon tries to skip to Phase 4 without logging a prediction, `rep.py` exits with `BLOCKED`.

Claude must not put words in Brandon's mouth. Do not guess the Big O on his behalf. Do not offer "O(n) time, O(1) space" as a suggestion. Keep asking until Brandon names one.

Logged under `### Predict`.

### Phase 4. Code alone

Claude hands off: "Open `~/dev/homebase/gym/tracks/<track>/<rep>/solve.py`. Write the solution. No AI help on the code. Do not open the existing Ralf implementation of this concept. Run `python3 solve.py` when ready. Come back with the answer and wall-clock time."

Claude does not see the code. Claude does not peek at the rep directory. Claude waits.

When Brandon returns, the code is logged under `### Code` as a short note (file, length, runtime). The actual code lives in `solve.py` and is version-controllable but is not pasted into the log.

### Phase 5. Reflect

Claude walks five questions in sequence:

1. Actual runtime in seconds.
2. Did the runtime match the Big O prediction. Yes or no.
3. If no, what is the real Big O and where did the model go wrong.
4. One concept gap: what did you look up or feel shaky on.
5. One sentence lesson for future you.

For Ralf reps (signal-gym track), add a sixth:

6. Compare against the existing Ralf implementation. What differed, which is simpler, did the AI-generated version have a subtle issue.

Logged under `### Reflect` as a short bulleted list.

### Phase 6. Extension prediction

Claude prompts: "Before you extend the rep, predict what changes. For AoC-style: what will Part 2 change. For Ralf reps: what changes if the input scales 10x, or runs on 20 dancers in parallel."

Brandon commits a prediction. Logged under `### Extension prediction`.

Claude then releases Brandon. Part 2 (or the extension) can be done today as a second rep, tomorrow, or never. The streak increments once per calendar day regardless of how many parts were attempted.

## Rules

1. **No peeking at AI-generated code during a rep.** Specifically: do not open the existing Ralf implementation while building the Python version. The gym version must come from Phase 0 plus Brandon's own understanding.

2. **No AI assistance on the solution during Phase 4.** Claude can teach in Phase 0, ask questions in Phases 1 to 3, review in Phases 5 and 6. Claude cannot write solution code.

3. **Hand-port to TypeScript manually.** When a signal-gym rep produces a Python implementation, porting to Ralf's TypeScript runtime is done by hand. The port is where the learning lands.

4. **Phase 3 is gated in `rep.py`, not in Claude's judgment.** The Python script is the enforcement layer. Claude is the prompt-discipline layer.

5. **Every rep produces a durable artifact.** A committed Python file, a JSON patch for Ralf, a crumb.blog draft, a PR, or at minimum a log entry with specific content. If the rep did not produce something, the rep did not happen.

## Log section format

Each rep produces one section under a `## gym: <track> / <rep>` header in `~/Documents/homebase-log/YYYY-MM-DD.md`. The section contains sub-headers for each phase that actually ran.

Example skeleton:

```
## gym: signal-gym / 001-jerkiness-variance

- Started: 07:15
- Finished: 08:02

### Primer
10 minutes. Windowed variance recap. Clarified that jerkiness is variance of acceleration, not third derivative.

### Restate
[brandon's words]

### Model
[brandon's words]

### Predict
O(n) time, O(w) space where w is the window size.

### Code
solve.py, 18 lines. Ran in 45ms on a 10000-frame recorded session.

### Reflect
- Actual: ~45ms, linear as predicted.
- Prediction matched: yes.
- Concept gap: none.
- Lesson: variance of differences is not differences of variances.
- Ralf comparison: existing Rust uses third derivative, NaNs on fast motion. Python version is simpler and correct.

### Extension prediction
20 dancers in parallel: bottleneck is memory not compute. Pre-allocate ring buffers per dancer.

- Streak: 1
```
