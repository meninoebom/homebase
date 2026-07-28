# Roadmap

Homebase is a personal-tool project, so this is a sketch, not a contract. The "shipping now" list is what's actively being worked on; "next" is what's most likely to land in the following weeks; "someday" is on the table but not scheduled.

If you want to help with anything here, comment on the linked issue (or open one if it doesn't exist yet) before starting work — it saves both of us time.

## Shipping now

- Polishing the strategic accordion on `/` (the home page horizons surface).
- Day-page autosave reliability and clearer error surfaces when writes fail.
- General bug bash from real daily use — see [open issues](https://github.com/meninoebom/homebase/issues).

## Next

- **Reflect with AI.** Your entries are plain markdown, which makes them easy to hand to an assistant for reflection. Shipping in stages: (1) the `/integrations` page and a portable reflection skill that teaches any local agent your folder layout, so you can point Claude Desktop or Claude Code at your folder today; (2) an opt-in in-app "Reflect" chat where you plug in your own bot — a local model (no key, nothing leaves your machine) or your own API key. The source of truth stays your folder; there is no Homebase-hosted model or backend.
- Richer markdown editing inside slots — bold, headers, lists — without giving up the plain-text source of truth on disk. Tracked in [#75](https://github.com/meninoebom/homebase/issues/75).
- Better first-run experience for users who haven't seen a File System Access permission prompt before. Partly done: the gate explains what the folder is for before prompting, a starter practice seeds the day page, and there's a [landing page](https://homebase.you/welcome/) to read first.
- A clearer story for "where do I back this up?" — likely a Customize-page hint pointing at `git init`.
- More languages for the default prompt set. English is the only one shipping today; translations are a great way to contribute without touching the build.

## Someday

- Optional iCloud / Dropbox / git-sync helpers for users who want their homebase folder to follow them across machines. The constraint: the source of truth has to stay "your folder on disk" — no Homebase-hosted backend.
- A slot kind for recurring practices with reps or streaks. Only if it can be done without becoming a habit-tracker app — see the "Adding a slot kind" note in [CONTRIBUTING.md](CONTRIBUTING.md).
- A briefing source pluggable enough that someone can point it at their own quote file, RSS feed, or local note.
- Mobile, but not on this architecture. Homebase is desktop-Chromium only because the File System Access API is, and that isn't a shipping delay: [WebKit](https://github.com/WebKit/standards-positions/issues/28) and [Mozilla](https://github.com/mozilla/standards-positions/issues/154) have both formally opposed the local-filesystem part, and no mobile browser implements the directory picker, Chrome on Android included. Reaching a phone would mean a native wrapper (Tauri) or a sandboxed-storage tier with explicit export, not waiting for the platform.

- A demo mode for the ~70% of visitors whose browser can't run Homebase at all. Origin Private File System storage works nearly everywhere, including phones, so a sandboxed "try it without picking a folder" tier is possible — the constraint is that OPFS files are invisible to Finder, grep, and git, so it can only ever be a trial with an export button, never the real thing.

## Explicit non-goals

- Accounts, login, sync server, telemetry. None of these. Your data lives on your disk; the app is a static site.
- A plugin marketplace. The codebase is small enough to fork; that's the plugin system.
- Becoming a general-purpose note-taking app. Homebase is for a specific shape of personal writing practice; if you want Obsidian, use Obsidian.

## How priorities get set

Roughly in this order:

1. Things that are broken for someone's daily use.
2. Things that lower the barrier for new contributors (docs, scoped issues, first-run polish).
3. Things I personally want to use tomorrow.
4. Everything else.

If you think something should jump the queue, open a Discussion and make the case.
