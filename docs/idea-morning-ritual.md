## Idea Brief: Morning Ritual Control Center

**Problem:** Brandon's mornings have real intent (check-in, piano, meditation, reading, task triage, now an algorithmic gym), but each practice lives in a separate place or nowhere at all, so none of them compound and most of them get skipped under job-search pressure.
**Solution:** A single command Brandon runs each morning that walks him through a configurable sequence of "slots," where each slot is an independent small tool he built when he was ready for it.
**For whom:** Brandon. A senior full-stack engineer in active job search who already has the discipline to do these practices but wants one entry point so they actually happen and accrue into artifacts (drafts, logs, reps).
**Why now:** The bad algorithmic-math interview forced a concrete deliberate-practice plan (the gym), and mid-design Brandon noticed the gym belongs inside a larger ritual he has already been sketching. Capturing the shell now, while the instinct is fresh, prevents the gym from becoming yet another orphaned tool.
**Simplest version:** A `~/dev/morning-ritual/` directory, a one-line launcher, and exactly one active slot: the gym. Other slots get added one at a time, each as its own future planning cycle, only after the previous slot has survived a week of real use.
**The doubt:** Scope creep. Brandon has Neon.ai, narrow-agent research, job applications, and a Tend backlog all competing for the same mornings. Building the ritual shell can easily become a way to avoid doing the work the ritual is supposed to support.

### The slots (future planning cycles, not planned today)
- **Slot 0, Algorithmic gym**: Terminal walkthrough of Advent of Code problems with cost-prediction reps. Connects to: none yet (standalone).
- **Daily check-in**: Guided prompts for the brain dump, sleep, inner weather, compass, and creative threads template. Connects to: crumb.blog (creative threads become breadcrumb candidates).
- **Piano log**: Three-field capture (what clicked, what frustrated, what's next) after morning practice. Connects to: none (pure log, may feed reflections later).
- **Meditation and movement check**: Two-line yes/no plus optional note. Connects to: none.
- **Habit experiment tracker**: Carbs-at-night plus sleep-quality correlation capture. Connects to: the check-in's sleep section.
- **Reading reflections**: Prompted capture after morning reading that produces crumb.blog draft candidates. Connects to: crumb.blog (via the existing narrow-agent-telegram-breadcrumbs pattern).
- **Tend triage**: Read today's tasks from Tend, surface the frog, echo it back into the compass section. Connects to: Tend (tendyourgarden.app, `~/dev/tend`).
- **Inbox and calendar glance** (maybe): Read-only summary of today's first meeting and any overnight flagged email. Connects to: Gmail, Google Calendar. Lowest priority, explicitly optional.

### Architectural principles
- **Shells accrete from use, not designed up front.** The shell starts as almost nothing. Every addition must be justified by a slot that already exists and already hurts without it.
- **Each slot is independently useful.** A slot must be worth running on its own, outside the ritual, or it does not belong.
- **The shell is almost nothing.** Ideally a config file listing active slots and a script that iterates them. No framework, no plugin system, no lifecycle hooks.
- **Language per slot, not per ritual.** The gym is Python because Advent of Code and the tooling ecosystem fit. Other slots can be Bun/TypeScript (matching the narrow-agent pattern), shell, or whatever is smallest for that slot. The shell only cares that each slot is executable.
- **Artifacts over state.** Slots append to dated markdown logs. No database, no cross-day state machine. If a slot needs history, it reads yesterday's log file.
