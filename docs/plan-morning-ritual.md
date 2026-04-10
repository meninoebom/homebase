# Plan: Morning Ritual Control Center

## 1. Summary
Create `~/dev/morning-ritual/` as a thin shell that runs a configurable sequence of slot subdirectories. Day 1 ships with the algorithmic gym as the only active slot; every future slot is its own idea brief and planning cycle, added one at a time after the previous one has proven itself in a week of real mornings.

**The broader bet (see sections 9–13):** this is a personal workspace shaped like a bullet journal — dated log pages for the **time-axis** (what happened today) and topical slot directories for the **topic-axis** (what Brandon is currently working on in piano, his standing practices, the books he's reading, the creative projects that are maturing). Both live as plaintext on the filesystem.

**The morning is the center of gravity**, not one of several equal entry points. `morning` is the primary command and runs the full slot sequence when Brandon sits down in the morning. `ritual <slot>` is a secondary affordance for the cases that genuinely don't fit the morning window — a piano note after a 4pm practice session, a dream captured spontaneously. It is not an equal entry point. If adhoc use ever starts replacing morning use, the morning is broken and needs shrinking, not "evolving."

It is not a life tracker (no scores, no streaks, no metrics, no quizzes), not a shippable product, and not a "plugin platform" — a slot IS the extension mechanism, and there is no plugin API distinct from the slot protocol. Research framings (crumb.blog essay series, PhD application) are available as a bonus, not as the primary driver. The project is load-bearing because Brandon already runs this ritual every morning and has for months, and because piano in particular needs ongoing support beyond the morning window; the writing is the point.

## 2. Directory structure

```
~/dev/morning-ritual/
  README.md              # Day 1. One paragraph: what this is, how to run it.
  morning                # Day 1. Executable entry point. See section 3.
  slots.md               # Day 1. Ordered list of active slots. See section 3.
  gym/                   # Day 1. Owned by the gym planning agent. Do not touch here.
    run.sh               # Day 1. Slot contract entry point. See section 4.
    ...                  # Everything else is the gym agent's call.
  log/                   # Day 1 (empty). Dated markdown artifacts.
    .gitkeep
  # Reserved for future slots, created one at a time:
  # checkin/
  # piano/
  # reading/
  # tend/
  # habits/
```

**Day 1 creates:** `README.md`, `morning`, `slots.md`, `log/.gitkeep`. The `gym/` subdirectory is created by the parallel gym planning cycle; this plan only reserves the path.

**Not created on Day 1:** any other slot directory, any shared library, any config schema, any `lib/` or `common/` directory. If two slots later need the same helper, that is the moment to extract it, not before.

## 3. The shell

**What `/morning` does on Day 1:**
1. Reads `slots.md`.
2. For each active slot in order, prints a header (slot name, date) and executes `<slot>/run.sh`.
3. Exits.

That is the entire shell. No argument parsing beyond an optional `--only <slot>` for skipping ahead when Brandon is short on time. No retry, no parallelism, no error recovery beyond letting a failing slot print its error and continuing to the next one (or halting, Brandon's call; start with halting because it is simpler and surfaces breakage).

**`slots.md` format (Day 1):**

```markdown
# Active slots

1. gym
```

Plain markdown, parsed by grabbing numbered lines. Brandon edits it by hand. Comments allowed. No YAML, no TOML, no JSON. When a slot is being paused, it moves out of the numbered list into a "## Parked" section below. That is the entire slot management system.

**The `morning` script (sketch, not code):** a short bash or Python file that reads `slots.md`, iterates the slot names, and invokes `./<slot>/run.sh` with the current date as an environment variable (`RITUAL_DATE`) and the log path as another (`RITUAL_LOG=log/YYYY-MM-DD.md`). Roughly 20 to 40 lines total. If it grows past 100, something is wrong.

**What the shell does on Day 30:** exactly the same thing, just with more entries in `slots.md`. The shell should not change as slots get added. If it has to, that is a signal the slot protocol is wrong, not that the shell needs features.

## 4. Slot protocol

A slot is a subdirectory of `~/dev/morning-ritual/` that contains:

- **`run.sh`** (required). Executable. Called by the shell. Receives `RITUAL_DATE` and `RITUAL_LOG` via environment. Responsible for its own interactivity, its own language, its own dependencies.
- **`README.md`** (required). One paragraph explaining what the slot does and why it exists.
- **Anything else the slot wants.** Python venv, Bun project, config files, scratch data. The shell does not care.

A slot's `run.sh` is expected to (optionally) append a section to `$RITUAL_LOG`, using a header like `## gym` so the day's log is a single scrollable artifact. Slots that do not want to log anything simply do not append. There is no schema for the log file. It is a markdown scratchpad that the day writes into.

**What is deliberately NOT in the slot protocol:**
- No manifest file, no `slot.json`, no version field.
- No lifecycle hooks (`pre`, `post`, `setup`, `teardown`).
- No dependency declaration between slots.
- No standardized output format beyond "markdown, if you feel like it."
- No testing contract. Slots are tested by being used.

If a future slot needs something the protocol does not offer, that is a conversation, not a feature. The protocol should be allowed to grow once, reluctantly, and only when two independent slots both need the same thing.

## 5. Phased rollout

The list below is the morning sequence order AND the rough build order. Each entry is a future idea brief, not a commitment. **This list was rewritten April 10** after the Tauri pivot and Brandon's confirmation that workout/practices and creative writing prompts are not near-term needs.

1. **Slot 1, Dreams.** Wide-aperture capture with a single header (`## Dreams`) over an empty writing area. First in the morning sequence because dream memory is perishable — by the time inner weather, piano, and gym are done, the dream is gone. Also the first slot to build in the Tauri rebuild because it is the simplest possible prompt slot (one header, one textarea, Cmd-Enter to advance) and proves the full-bleed + Cmd-Enter + `template.md` pattern with minimum complexity.

2. **Slot 2, Inner weather.** Five-header emotional check-in (what's weighing / what's avoided / what needs to be said / what's giving life / gratitude). Template at `src/slots/inner-weather/template.md`, seeded from `.llm/inner-weather-template.md`. Free-form writing under each header; skipping a header is indistinguishable from filling it in. Built second because it extends the Dreams slot's primitives to a multi-header template and proves the skippable-section pattern.

3. **Slot 3, Piano (workspace).** The richest slot in the initial set, because piano is where Brandon most wants ongoing support. Structure: `piano/state.md` is a persistent file — *"currently working on Chopin Op. 9 No. 1 LH voicing; next up: phrase shaping bars 12–16"* — that Brandon edits whenever his practice focus shifts. Morning mode prints `state.md` and asks one optional skippable prompt. Adhoc mode (`/slot/piano` at 4pm after a practice session) opens a richer reflection editor. First slot that demonstrates the workspace pattern (§10) and the morning-vs-adhoc mode distinction.

4. **Slot 4, Gym.** The algorithmic gym. 7-phase protocol from `docs/plan-algorithmic-gym.md`, reimplemented in TypeScript as an XState machine or plain reducer (not a Python subprocess — see `.llm/active-plan.md` §6). Phase 3 is a hard gate on an explicit Big O prediction; Phase 4 has Claude structurally absent from the DOM, not just hidden. Built fourth because it is by far the most complex slot in the app — gated multi-phase state + AI-on/off by phase + rich input handling — and should inherit every primitive from slots 1–3. Not built first despite interview pressure because shipping the simpler slots first earns the phasing rule and gives Brandon an app he can open on day 2 of the rebuild instead of day 14.

5. **Slot 5, Reflections.** Wide-aperture capture for what Brandon has been taking in — books, articles, videos, podcasts, essays. A small number of free-form headers (probably a single *"What's in my head from what I've been taking in lately"* or a two-or-three split by medium). This is where the ritual starts producing public artifacts: reflections feed crumb.blog drafts via the existing `narrow-agent-telegram-breadcrumbs` pattern (§6). Probably the first slot to activate the sidecar bus (§10) once a later "crumb.blog draft" slot reads its output.

6. **Slot 6, Creative project check-in.** Workspace slot with `creative/state.md` tracking projects that are surfacing or maturing. Two or three free-form headers, no status tracking, no percentages. Built after reflections because the natural data flow is reflections → creative (a book catalyzes an idea).

7. **Slot 7, Daily briefing.** Promoted to MVP on April 10 after Brandon named it as "a pretty solid place to start." Minimum viable version: a rotating quote pulled from a local text file Brandon maintains, plus today's date formatted in the Lapham typography style. Later versions add a calendar peek (next event of the day, read-only) and optional elder-care digest. First fetch slot (vs. prompt slot), introduces the "cloud-optional, offline-degradable" pattern that future integration slots will follow. The quote-and-date version ships without any network dependency at all — the pattern earns its integration complexity one source at a time.

8. **Slot 8 (deferred), Tend read-only surface.** Reads today's tasks and the frog from Tend's API, echoes them into the log. Explicitly read-only; project planning stays in Tend. Ships first as a three-line fetch slot that just prints a link to `tendyourgarden.app/today`; full API integration earns itself later. Deferred past the MVP because the ritual must work offline and because Tend's value is complementary, not central.

**Dropped from the phasing (April 10):**
- **Workout / practices reminder.** Brandon: *"I know how to do my workout. I don't need a reminder."* If standing practices ever need surfacing later, they earn their own slot on a new idea brief.
- **Creative writing prompt.** Brandon: *"I don't do a lot of poetry or fiction. Later I might come back for a slot that captures whatever's going through my head, but that's not now."*

**Previously dropped (April 9):** the brain dump slot, the compass slot (values check + frog + day plan), the habit-experiment tracker (carbs, sleep). These were scaffolding for a life-tracker framing Brandon rejected. The values named in the original Capacities template (curiosity, compassion, courage, consistency) stay as personal context in `NOTES.md`, not as a daily check-in.

**Rule of thumb, unchanged since v1:** no slot gets planned until the previous slot has been used in real mornings for at least a week without being abandoned.

## 6. Connections to existing systems

- **crumb.blog (`~/dev/breadcrumbs`).** The reading reflections slot and eventually the check-in's creative threads section will produce draft content. The existing `narrow-agent-telegram-breadcrumbs` agent already knows how to post to crumb.blog via `X-API-Key`, so the integration pattern is proven. The slot's job is to capture the thought and hand it to an existing tool, not to reinvent the publishing flow.
- **Tend (`~/dev/tend`, tendyourgarden.app).** The Tend slot will read today's tasks from Tend's API (Brandon owns both sides, so the API can evolve as needed) and surface the frog. It may also echo the day's plan back into the log. No writes to Tend from the ritual in the first version. Read-only is enough.
- **Algorithmic gym (`~/dev/morning-ritual/gym/`).** Lives inside the ritual directory from Day 1. The gym is a slot like any other, except it happens to be the first one. The gym agent owns everything inside `gym/`.

No other integrations are in scope. No Slack, no Notion, no Obsidian, no Apple Notes, no iCloud sync, no Raycast extension. If Brandon wants any of those later, each is its own idea brief.

## 7. What is NOT in this plan

Explicitly deferred or rejected:

- Email integration.
- Calendar integration.
- State persistence across days beyond dated markdown log files.
- Any database. No SQLite, no Postgres, no key-value store.
- Web UI.
- Mobile app.
- Notifications, reminders, or scheduling. Brandon runs `morning` when he sits down; the ritual does not chase him.
- Cross-slot dependencies or a DAG of slots.
- A plugin or extension API.
- Configuration beyond `slots.md`.
- Tests for the shell. The shell is small enough to read in one sitting.
- Any slot other than slot 0 on Day 1.
- Any AI agent in the shell itself. Individual slots may call LLMs; the shell does not.
- Syncing the ritual across machines.
- Metrics, analytics, streaks, gamification.

## 8. Open questions for Brandon

1. **Halt or continue on slot failure?** Proposal: halt, because it surfaces breakage loudly and the ritual is short enough that restart is cheap. Confirm or override.
2. **Where does the log live?** Proposal: `~/dev/morning-ritual/log/YYYY-MM-DD.md`, in the repo, gitignored by default. Alternative: `~/Documents/morning-ritual-log/` so the logs survive repo nuking. Preference?
3. **Is the shell bash or Python?** Proposal: bash, because it is 20 lines and bash is universally available. Counter: Python makes `slots.md` parsing cleaner and matches the gym's language. Either works. Pick one and commit.
4. **Gym first, or check-in first, inside a single morning?** The plan above builds the gym first but implies the check-in should eventually run before the gym on the clock (brain dump clears the head for the gym). Confirm the intended running order once the check-in exists, so slot 1 slots into position 1 in `slots.md`, not position 2.
5. **Does this compete with Neon.ai and narrow-agent work for the next two weeks?** Honest answer seems to be yes. The main risk named in the idea brief is scope creep and competing priorities. Is the Day 1 scope (directory, shell, gym slot wrapper, nothing else) small enough to ship in one sitting without displacing Neon.ai? If not, the plan is still too big.
6. **Should `slots.md` support per-slot arguments or environment?** Proposal: no, not until a second slot needs it. Confirm you are comfortable letting the first slot that needs args force that design decision when the time comes.
7. **Is the gym's `run.sh` wrapper something the gym agent should create, or should this plan create a stub?** Proposal: the gym agent creates it, since they know the gym's invocation. This plan only reserves the path.

---

# v2: Broadened scope (April 2026)

The original sections 1–8 stay. Their discipline was right and survives the bigger scope. Sections 9–13 describe what the ceiling for this project actually is, now that the ambition has grown past "wrapper for the gym."

## 9. The thesis under study

Brandon's framing (April 9), in his voice:

> What is a flexible enough substrate to support a variety of tools and a variety of changing tools — writing prompts, calendar, a quote, an elder-care update, maybe reminders — such that pieces can be added and removed as I figure out which ones work for me, without destroying the thing underneath?

And the load-bearing corollary:

> **This is not a life tracker. It is a writing practice that happens to be structured.**

That second sentence cut several slots from the v1 phasing — brain dump, compass (values check / frog / day plan), habit-experiment tracker — see §5. It also constrains every future slot: no scores, no streaks, no metrics dashboards, no quizzes. Prompts serve writing; they are not inputs.

The bigger claim about personalized software — that the unit is not the app, but a dated plaintext log plus a manifest of slots that read and write it — is available as a secondary framing if Brandon decides to pursue it (crumb.blog essay series, PhD application). It is NOT load-bearing. The project is load-bearing because Brandon already runs this ritual every morning and has for months. The writing practice is the point; the research angle is a bonus.

Position against: MemGPT / Rewind / Personal.ai (vector stores, SaaS, chat-as-primary-UI). Position with: Simon Willison's tools/research repos, Geoffrey Litt / Ink & Switch malleable software, local-first.

## 10. Slot taxonomy (v2)

The v1 slot protocol stays (§4). Two clarifications and exactly one additive change.

**Two kinds of slot, clarified:**
- **Prompt slots** — the slot asks Brandon something and writes his answer. "Forms" and "chat" collapse here; the difference is whether `template.md` is fixed or free-form. Inner weather, piano log, brain dump.
- **Fetch slots** — the slot asks the world (files, APIs, LLMs, long-running agents) and writes what it learned. "Generated," "integration," and "plug-in agents" all collapse here; they differ only in what they fetch. Daily briefing, calendar peek, elder-care digest.

Long-running agents (elder care, job search) are fetch slots with a 3-line `run.sh` that wraps the agent's own endpoint (`curl -s localhost:7331/digest | tee -a $RITUAL_LOG`). The agent's lifecycle — process supervision, auth, state — lives outside the ritual, in its own repo. The shell never learns what a long-running agent is.

**Slot state and workspace slots (April 9 refinement):**

Slots are not one-shot scripts. A slot directory is a **persistent workspace** that can hold state files Brandon edits over time — `piano/state.md` for what he's currently working on, `practices/reminder.md` for standing daily practices, `reading/currently.md` for the books in flight, `creative/projects.md` for projects that are maturing. The `morning` shell reads `slots.md` and runs each slot's `run.sh`, but the slot itself can behave in several ways using its state:

- **Reminder slot** — `run.sh` prints a state file and exits. No prompt, no log append. Minimum viable; perfect for practices Brandon wants to acknowledge but not track (meditation, movement).
- **Workspace slot with surfacing** — `run.sh` prints the state file and then asks one small prompt. Piano: prints what he's working on, optionally asks for a one-line addition from yesterday's practice. The state file is the collection; the day log catches the session notes.
- **Pure prompt slot** — no state file, just questions and capture. Inner weather's pattern.
- **Fetch slot** — goes to the world and writes. Briefing's pattern.

The shell does not need to know which pattern a slot uses. A state file is just a file in the slot dir; there is no manifest declaring it. The slot protocol (§4) is unchanged. This is a usage pattern, not a new slot kind or a new contract.

**The one new env var: `RITUAL_MODE`.** The shell sets `RITUAL_MODE=morning` when invoked via `morning`, and `RITUAL_MODE=adhoc` when invoked via `ritual <slot>`. Slots are free to ignore it or use it to branch. Piano's `run.sh` uses it: in `morning` mode it prints state and asks a light one-liner; in `adhoc` mode (after a 4pm practice session) it opens `$EDITOR` for a full session reflection and optionally edits `state.md`. One env var, three possible values if `evening.md` is introduced later (`RITUAL_MODE=evening`), no schema, no config.

**Upgrade path for any slot.** Start with the minimum (meditation prints a reminder line). If Brandon ever wants to write more, he edits the slot's `run.sh` to also prompt. Nothing else in the system has to change. The slot grows; the shell stays dumb. This is how practices-reminder graduates individual practices into their own richer slots over time (§5 slot 3).

**The one additive change — sidecar bus:**

When a slot needs to read another slot's output, it reads from `$RITUAL_LOG.d/<slot-name>.md` — a sidecar file the upstream slot wrote alongside its log append. The day log stays a scrollable artifact; the sidecar directory is the composition bus. This is the ONE place v1's "no cross-slot deps" rule bends, and it bends exactly once.

Slots that depend on other slots declare it by listing slot names (one per line) in an optional `inputs` file inside the slot dir. The shell uses this to topologically order `slots.md`; on a cycle, it halts with an error. No manifest, no schema, no registry. The shell grows by ~10 lines to support this, and never more.

**Rule: introduce the sidecar bus only when a slot actually needs it.** Day 1 through slot 2 do not. Probably the crumb.blog draft slot is the first one that does (it reads creative-threads). Force the rule to earn itself.

**Editable templates:** prompt slots keep their questions in `<slot>/template.md` — plain markdown, `## section` headers, optional `{{RITUAL_DATE}}` placeholders. No Jinja, no YAML frontmatter. Brandon edits `template.md` by hand; no code change required. This is the answer to "how do I make the questions editable without learning a config format."

**Opt-in per-slot config:** `slot.env` (plain `KEY=value`) is sourced before `run.sh`. API keys for calendar / Tend / crumb.blog live here, one file per slot, never shared. No central config.

**The one hard rule, and the only one:** every slot appends to `$RITUAL_LOG` under a header `## <slot-name>`. This is the invariant that makes the log greppable by any future slot, including ones that do not exist yet (a "six months of mornings" reflection slot, a trend-line slot, a PhD-worthy analysis script). Reject any slot that wants to skip the header or emit JSON "for analytics." The whole project dies the day the log stops being a for-loop-over-grep.

## 11. UX: logbook, not dashboard

Dominant metaphor: **a logbook you add a page to, not a dashboard you monitor.** The terminal is the pen. The ritual is writing a page in a book that is already thick. This metaphor reinforces every v1 rejection (no notifications, no web UI, no mobile app, no streaks) and earns several consequences for free.

**The daily arc:**
- First thing Brandon sees: yesterday's log filename + a one-line greeting ("Thursday, April 9. Third day back after the weekend."). Then slot 1 begins. No landing screen, no menu.
- Wide-aperture capture → `$EDITOR` opens with the section header prefilled. Empty canvas, no questions. For: dreams, creative writing prompts, reading reflections, creative project check-ins. The header is a single line; everything else is Brandon's. Questions would narrow the aperture he's trying to widen.
- Narrow-aperture capture → stdin prompts, one question at a time, Enter to advance. For: inner weather, compass, frog, piano log. Typing one answer into a blinking cursor is lower friction than facing a six-section form in vim.
- Chat UI is the escape hatch, not the norm. If a slot truly needs a conversation, its `run.sh` spins up a local HTTP server on a random port (FastAPI+HTMX, or a Bun script), opens the browser, posts answers back to `$RITUAL_LOG`, and exits. The shell waits on the process. The shell itself never learns what HTTP is.

**Invocation — morning is the default, adhoc is the exception:**
- `morning` — run the full ordered sequence from `slots.md`. This is what Brandon types when he sits down in the morning, and it is the overwhelmingly dominant entry point.
- `ritual <slot>` — run one slot outside the morning sequence, for the specific cases that genuinely don't fit morning (piano after a 4pm practice, a spontaneous dream capture). Not a replacement for `morning`; if `ritual` starts replacing `morning`, the morning is broken, not the ritual (§15, rule 1).
- `ritual thought "..."` — one-liner, appends a timestamped note under `## notes`. For thoughts that arrive mid-day and would otherwise be lost.

No `morning --evening`, no scheduled runs, no cron, no background watchers. Slots are invoked, never invoking (§15, rule 3).

**The day-7 "knows me" moment:**

Before the check-in slot prompts for today's inner weather, it prints one line: *"Yesterday you wrote you were avoiding the Neon.ai demo. Is that still true?"* This is a literal `grep` of yesterday's log for the "avoided" section, echoed back. **No embeddings, no LLM required for V1.** The cheapest possible continuity, and the one Brandon would feel most. Upgrade path: once three weeks of logs exist, an optional LLM-powered "threads still open" summary across the week. But day 7's moment is plain grep. The logbook remembering yesterday is the whole pitch.

**The two failure modes the UX must prevent:**
1. **Ritual creep.** The sequence grows past 15 minutes; skipping begins. Mitigation: `slots.md` has a `## Parked` section, the shell prints total elapsed time at the end, slots averaging over 3 minutes per morning for a week are parking candidates. No gamification — just visibility.
2. **The logbook becomes a graveyard.** He writes but never re-reads. Mitigation: the day-7 grep moment. Every morning quotes yesterday. He literally cannot start a new page without seeing the old ones are alive.

## 12. Research framing and the "product" trap

This project is designed toward **writing practice first, research material second, shippable product never.** The design consequences below are the same whether the research framing ever pays out — plaintext, no schemas, no DB, anti-tracker — because those are the right choices for a writing practice Brandon actually runs every morning. The "not a product" discipline is load-bearing regardless.

**Design consequences:**

- **Logs live in `~/Documents/morning-ritual-log/YYYY-MM-DD.md`**, symlinked into the repo as `log/`. The repo is disposable; the log is the data. This resolves v1 open question #2. iCloud syncs the directory to the phone for free, at zero cost to the project. *Without this single decision, a future `rm -rf morning-ritual/` kills the longitudinal record and the research framing collapses.*

- **`NOTES.md` ships on Day 1**, next to the log directory. It is the *research log* — field notes on the ritual itself. What broke. What you skipped and why. What you wanted. What you noticed about yourself that you could not have named on day 1. The distinction between "using the tool" and "studying yourself using the tool" lives in this one file.

- **No structured slot output, ever.** No JSON output, no frontmatter metadata, no schema. The discipline: any slot that ever exists must be implementable as a for-loop over `grep '## creative-threads' log/*.md`. Protect this against every future "we could just add a small YAML block" temptation. YAML is the first step back toward the database.

### The "control center" / "plugin platform" trap (rejected)

The original prompt used the language of "control center," "plugin architecture," "central hub." Those framings pull toward config schemas, auth, a web UI, a registry, and eventually abandon. The reframing: **a slot IS the plugin**; there is no plugin API distinct from the slot protocol (§4, §10). Elder care plugs in by being a 3-line fetch slot that wraps its own long-running agent's endpoint. If the agent isn't running, the slot degrades to a note in the log and the morning continues. That is the entire extension mechanism, and it is enough.

### Success test at month 3

Two questions decide "research artifact worth publishing" vs. "another dead productivity system":

1. **Is there a written observation in `NOTES.md` that could not have been made on day 1?** Not "I added a piano slot" — something like "the check-in slot's value collapsed the week the gym slot got hard, and here is why." If yes, the project is generative. If no, it is decoration.
2. **Has at least one crumb.blog post come out of the ritual — not about the tool, but from it?** A reading reflection, a creative thread that matured into an essay, a dream that became something. If month 3 has zero, the loop from private ritual to public thought is not closing and the research framing is a fantasy.

If both are yes at month 3, this is worth publishing. If either is no, cut slots, don't grow them.

## 13. Open questions — v2 additions

v1's open questions are updated or extended below. Questions 1, 4, 5, 6, 7 from §8 stand unchanged.

- **Q2 (log location) — resolved.** `~/Documents/morning-ritual-log/YYYY-MM-DD.md`, symlinked into the repo as `log/`. Survives repo nuking. Syncs to phone via iCloud.
- **Q3 (bash or Python for the shell) — proposal.** Bash. The shell is ~40 lines; slots own their own language. Revisit only when a second shell helper becomes necessary.
- **Q8 (new): When does the sidecar bus activate?** Proposal: not on Day 1. Slots 0–2 don't need composition. Introduce `$RITUAL_LOG.d/` the first time a slot actually needs another slot's output (probably the crumb.blog draft slot reading creative-threads). Force the rule to earn itself.
- **Q9 (new): The research question in `NOTES.md`.** §9 proposes *"what is the minimum viable substrate for personalized software that survives a decade of model and vendor churn?"* That phrasing is a first draft. **Brandon should own this wording**, because the research framing is load-bearing for every anti-goal and every future "should I add X?" decision. See contribution request below.
- **Q10 (new): The first prompt-slot template, `inner-weather/template.md`.** This encodes the values (curiosity, compassion, courage, consistency) and the questions Brandon wants to face every morning. The questions he writes will shape the ritual's emotional tone for months. **Brandon should write this himself.** See contribution request below.
- **Q11 (new): Does the elder-care integration live as a slot from the start, or does it wait until the elder-care agent itself has a stable endpoint?** Proposal: wait. The slot is 3 lines when the agent is ready; there is no reason to stub it earlier.
- **Q12 (new): Project planning and todo integration — in scope or in Tend?** Proposal: stays in Tend. Tend is Brandon's own app and already solves this. The Tend slot is read-only (surfaces today's tasks and the frog), never the home of project planning. The logbook is not a project tracker.

## 14. Brandon's contributions (the parts the tool cannot write)

Two small pieces of writing that shape the whole project and that *should not* be generated.

### 14.1 The research question for `NOTES.md` — drafted April 9

Brandon's framing from the April 9 conversation is saved as `.llm/notes-seed.md`. It has both halves: the substrate question (flexible enough to support changing tools, add/remove without destroying what's underneath) and the self-study question (which prompts genuinely help the writing, thinking, sharing — vs. which were life-tracker scaffolding). The load-bearing line — *this is not a tracker, it's a writing practice that happens to be structured* — sits at the bottom.

On Day 1, `.llm/notes-seed.md` moves to `~/Documents/morning-ritual-log/NOTES.md`. Review and edit before then if anything rings false.

### 14.2 `inner-weather/template.md` — drafted April 9

Saved as `.llm/inner-weather-template.md`. Five headers in Brandon's order:

- What's weighing on you
- What are you avoiding
- What needs to be said
- What's giving you life
- What you have gratitude for

Two sides — three negative-space headers (what's weighing / avoiding / needs to be said) and two positive-space (giving life / gratitude). Free-form writing under each; any header can be skipped on a given morning. Brandon's April 9 phrasing: *"some emotional work, even if it's just two things"* — so on hard mornings the template collapses to two headers without protest.

On Day 1, `.llm/inner-weather-template.md` moves to `~/dev/morning-ritual/inner-weather/template.md`. Edit the file directly to change the questions; no code change required.

---

# v3: The five rules and the self-audit (April 9 simplification)

After the v2 scope expansion (sections 9–14), three sub-agents surveyed prior art (Obsidian daily notes, org-mode, Logseq, Day One, Brett Terpstra's `doing`/`jrnl`, Capacities, TiddlyWiki), the 2026 agent landscape (Letta/MemGPT, Rabbit/Humane postmortems, Reflect, Raycast AI, Simon Willison's `llm` ecosystem, Ink & Switch malleable software), and human-centered product design (Norman, Cooper, Fadell, Shneiderman, Krug). **All three converged on the same load-bearing rule stated three different ways: nothing sits above the log. The log is the bus.**

This section is not more architecture. It is the minimum set of rules the plan now *explicitly* lives by, so that future-Brandon can refuse the next tempting architectural addition without re-litigating everything above. It is also where v2's sprawl gets compressed back into something Brandon can hold in his head.

## 15. The five rules

1. **The morning is the center of gravity, not one of several equal entry points.** `morning` is the primary invocation. `ritual <slot>` is a secondary affordance for cases that genuinely don't fit the morning window (piano after 4pm practice, spontaneous dream capture). If adhoc use starts replacing morning use, the morning is broken and needs shrinking, not "evolving." The directory name `morning-ritual/` is kept deliberately — it honors the center of gravity instead of pretending to be a broader platform.

2. **No agent sits above the log.** If any slot ever uses an LLM, its output is a log append under a clearly labeled header (e.g. `## briefing:generated`) that sits *below* Brandon's own writing in the day's file. There is no main agent, no supervisor, no memory store, no embeddings cache. Agents cite Brandon back to himself — *"on April 4 you wrote that you were avoiding the Neon.ai demo"* — they never explain Brandon to Brandon (*"I sense you've been stressed"*). If an agent slot cannot quote a specific line from the log with a date, it cannot say the thing it wants to say.

3. **Slots are invoked, never invoking.** No cron, no daemon, no background watcher, no passive capture, no notifications. The ritual does not chase Brandon — ever. This is the rule that keeps the project from becoming a panopticon, and it is the exact lesson from the Rabbit R1 / Humane Pin / Rewind postmortems. Non-negotiable.

4. **Grep is the memory layer.** If a slot ever needs historical context, it greps `log/*.md`. No vector store, no embeddings, no SQLite cache "just for search." Grep is auditable; vectors are not. This rule is the immune response to every *"let's just add a small index"* temptation. The "knows me" moment on day 7 (§11) is literal grep; that is the ceiling, not the floor.

5. **Every slot earns a one-sentence goal-state before it ships.** Before building a slot, Brandon writes one sentence describing what state of mind the slot leaves him in. *"I have named what I'm carrying."* *"I know what I am currently working on at the piano."* *"I have written something I wouldn't have written otherwise."* If the sentence is *"I feel productive"* or *"I feel organized,"* the slot is decoration — cut it. This is Alan Cooper's goal-directed design reduced to a single writing exercise.

### The commitment device — one sentence to save twelve months from now

> **Agent output is a slot appending to the log under its own `## <slot-name>` header. Full stop.**

This line goes at the top of `slots.md` as a comment, and at the top of `NOTES.md`. Twelve months from now, when a tempting architectural addition comes up — *"what if we had a main agent with a memory store," "what if slots shared state through a SQLite cache," "what if there was a notification layer,"* — this sentence is the test. If the proposal requires an agent to read or write anything other than the dated log and its own slot directory, the answer is no. Every architectural question downstream of this rule can be deferred until a real slot forces it.

## 16. Self-audit checklist for any new slot

Before adding a slot — before writing a line of its `run.sh` — Brandon answers these eight questions in `NOTES.md`. The questions are specific enough that a bad slot fails them on contact.

1. **If I skipped this slot for a week, what specific sentence could I not have written?** Not *"I'd feel less centered."* An actual sentence that would not exist.
2. **What is the one-line goal-state this slot leaves me in?** If I can't write it in one sentence, the slot is not ready.
3. **Does this slot produce writing I might re-read, or data I will only ever append to?** Append-only is the graveyard path.
4. **Am I adding this because the previous slot got hard this week?** Slot-shopping is the most common symptom of avoidance. If the honest answer is yes, don't add the new slot — go back to the hard one.
5. **What would it feel like to delete this slot in six weeks?** Relief = do not build it. Loss = build it.
6. **Can I name a morning in the last month when this slot would have caught something I missed?** Concrete memory, not hypothetical.
7. **Is the friction in the right place — effort inside the writing, zero effort to launch?** Or did I get that backwards?
8. **Would I still want this if no one, not even future-me rereading, ever saw it?** If the answer depends on an audience, the slot is performance, not practice.

### Three warning signs the ritual is dying (visible in weeks, not months)

- **The "quick morning" appears.** Brandon starts using `--only` regularly, or running `morning` at 2pm to "catch up," or inventing a shorter variant. *Corrective:* park a slot in `slots.md`. Do not optimize the shell. The ritual got too long; shrink it, don't speedrun it.

- **Entries start rhyming.** Three consecutive inner-weather entries read like three versions of the same paragraph. This is form-fatigue: the template has become a groove the hand follows without the mind. *Corrective:* edit `template.md` and change one question. The template is not sacred; the practice is. (The whole point of editable markdown templates is exactly this upgrade path — use it.)

- **`NOTES.md`'s last entry is two weeks old.** The research log is the canary. When Brandon stops studying the ritual, the ritual has become autopilot, and autopilot is the last stage before abandonment. *Corrective:* write one honest line today, even if it is *"I haven't wanted to write in here and I'm not sure why."* That line is the practice defending itself.

## 17. What this section DIDN'T add (the discipline of subtraction)

Things the three agents floated that were deliberately not added to the plan:

- **A "today view" / dashboard home page.** Every PKM tool has one (Obsidian home notes, Notion dashboards, Logseq journal queries, Tana's "Today"). They all rot. If Brandon wants an overview, `ls -lt log/ | head` is the overview. Rejected.
- **A main synthesizer agent watching all slots.** Rejected as a category by rule 2. Any synthesis slot (e.g. a "threads still open" summarizer) is just another slot that greps and appends — it has no special status, is ordered in `slots.md` like anything else, and can be parked.
- **Block references / backlinks across slots.** The Roam/Logseq trap. The sidecar bus in §10 is the only composition mechanism, and it only activates when a real slot demands it.
- **A config schema, a slot manifest, a plugin registry.** All rejected as the YAML-gateway-drug (the first structured-data addition that kills every plaintext tool).
- **Streaks, counters, gamification, metrics.** Already anti-goal in v1; named explicitly here because the Day One / Stoic / Reflectly postmortems all point to the same failure: users start writing to the streak, not to themselves, and quit when they miss a day.
- **`morning --evening` and scheduled runs.** Removed from §11 this round. Not asked for. If Brandon ever wants an evening ritual, it will be its own idea brief.

The one thing the agents said Brandon had ALREADY gotten right, unprompted: **the rule that no slot gets planned until the previous one has survived a week of real mornings.** Every dead personal tool in history was built in a single weekend by someone who imagined ten slots at once. That single constraint is worth more than the rest of the architecture combined. Protect it above everything else in this document.
