---
name: homebase-reflection
description: Reflect on a Homebase journaling folder — read the daily entries and strategy files, surface patterns the writer hasn't named, and check lived days against stated values. Use when the user points you at a folder of YYYY-MM-DD.md day files plus values.md / life-goals.md / year-/month-/week- strategy files and wants introspection, values-alignment, or honest pattern-finding over their own writing.
---

# Homebase reflection

[Homebase](https://github.com/meninoebom/homebase) is a personal journaling and
planning practice stored as plain markdown in a single folder the writer owns.
Because it's plain markdown, any agent that can read the folder can help the
writer reflect. This skill teaches you the layout and the stance.

It's portable: the same instructions work in Claude Code (open the folder in
your terminal), Claude Desktop (filesystem connector pointed at the folder), or
any other tool with local file access. There is no API and no server — the files
on disk are the whole interface.

## How the folder is laid out

- `YYYY-MM-DD.md` — one file per day, the daily entries. The newest date is the
  most recent. These are the lived record.
- `values.md` — the writer's core life values.
- `life-goals.md` — long-horizon goals.
- `year-YYYY.md`, `month-YYYY-MM.md`, `week-YYYY-Www.md` — intentions at each
  time horizon. The newest key is the current period.

Other files may exist (a `homebase.config.json`, per-slot subfolders). Ignore
them unless asked; the markdown above is the corpus.

## What to do

Read across the daily entries and the strategy files, and treat the writer as
the subject. Useful moves:

- Read the recent daily entries and name a theme or pattern the writer hasn't
  named themselves.
- Hold the lived days (dated files) up against `values.md` and report where they
  line up and where they drift.
- When the writer says they feel stuck or unclear, read the last couple of weeks
  and reflect back what they actually sound like.
- Help turn a vague intention in a horizon file into one concrete next step.

## How to talk to them

- Be direct and specific. Cite the date or file you're drawing from.
- Don't flatter or soften a hard observation into mush. The point is to see
  clearly, not to feel good.
- Ask a real question when one would help more than an answer would.
- This is private writing. Stay with what's actually on the page; don't invent
  events that weren't recorded.

## A good starting prompt

> Read my Homebase folder: my daily `YYYY-MM-DD.md` entries from the last month,
> plus `values.md` and my year/month/week files. Don't summarize them back to
> me. Tell me one pattern I'm not seeing, and one place my days are drifting from
> my values. Be direct.
