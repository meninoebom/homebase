# Save architecture

Last updated: 2026-04-10

Every piece of writing Brandon enters into the morning-ritual app lives in one or two places at any given moment. This document is the authoritative picture of where things go, when, and what guarantees each location provides. **If the code drifts from this document, the code is wrong — fix the document to match the new reality, or fix the code to match the document.**

## The three locations

### 1. In-memory (React + Zustand)

- **Where:** `useRitualStore` in `app/src/store/ritual.ts`, held in the webview's JavaScript heap while the app is running.
- **Contents:** The active slot sequence, which slot Brandon is on right now, any in-progress drafts the user has typed but not yet committed, `startedAt` and `completedAt` timestamps for the current morning.
- **Lifetime:** Alive as long as the app is running. Freed when Brandon closes the window.
- **Used for:** Every frame of the running UI. React components subscribe to this store via selectors and re-render on change.

### 2. Browser localStorage (Zustand persist middleware)

- **Where:** The Tauri webview's localStorage, on macOS at roughly `~/Library/Application Support/dev.morningritual.app/EBWebView/*/local-storage/`.
- **Contents:** A full JSON snapshot of the ritual store (sequence, drafts, mode, `startedAt`, `completedAt`). Written on every state change by Zustand's `persist` middleware.
- **Lifetime:** Survives app restarts and machine reboots. Does NOT survive deleting the Tauri app data directory or clearing the webview's storage.
- **Used for:** Crash recovery within a day. If Brandon is mid-dream and the app or machine crashes, the localStorage snapshot lets Zustand rehydrate the draft on the next launch so he doesn't lose what he typed. Stale sessions from previous days are detected in `startMorning` via an `isSameDay(startedAt, now)` check and reset automatically.
- **Guarantee:** Updated within a few milliseconds of every state change. Writes are synchronous from Zustand's perspective but the OS may buffer before actually landing on disk. Treat as "very fast, not durable across OS crashes."

### 3. Day log file (canonical)

- **Where:** `~/Documents/homebase-log/<YYYY-MM-DD>.md`. One plain markdown file per day. Outside the app bundle, outside the repo.
- **Contents:** A `# <human date>` header at the top, then one `## <slot-name>` section per slot Brandon has committed today, in the order they were committed. Body text is exactly what Brandon wrote — no escaping, no metadata, no JSON, no frontmatter.
- **Lifetime:** Permanent. Survives deleting the repo, deleting the app, reinstalling the app, or reformatting the machine if iCloud Drive is syncing the Documents folder.
- **Used for:** The thing Brandon actually goes back and reads. The substrate hypothesis from plan §9 is that THIS is the memory — the log file outlives every tool that writes into it, including this app. `grep` is the query language, any text editor can read it, any future version of Claude can parse it.
- **Guarantee:** See "Guarantees" below. Short version: `fsync(2)` runs before the Rust command returns, so the data survives OS crashes and power loss once the next slot (or the end-of-morning screen) appears.

## The flow: Brandon typing a dream

```
                        ┌──────────────────────┐
                        │  DreamsSlot (TipTap) │
                        │  React component     │
                        └──────────┬───────────┘
                                   │ editor.getText() on every edit
                                   ▼
                        ┌──────────────────────┐
                        │  onDraft(text)       │
                        │  (SlotProps)         │
                        └──────────┬───────────┘
                                   │ store.setDraft(slotId, text)
                                   ▼
    ┌──────────────────────────────────────────────────┐
    │  useRitualStore                                  │
    │  drafts[slotId] = text                           │
    └──────────┬───────────────────────────────────────┘
               │ Zustand persist middleware fires
               ▼
    ┌──────────────────────────────────────────────────┐
    │  localStorage (webview)                          │
    │  key: "morning-ritual-state"                     │
    │  value: JSON snapshot of the full store          │
    └──────────────────────────────────────────────────┘
```

Every keystroke lands in locations (1) and (2) before the next character is typed. Location (3) is still untouched — the draft is not yet in the canonical log.

## The flow: Brandon pressing Cmd-Enter

```
                        ┌──────────────────────┐
                        │  MorningRunner       │
                        │  window keydown      │
                        └──────────┬───────────┘
                                   │ handleCommit() reads draft from store
                                   ▼
                        ┌──────────────────────┐
                        │  completeSlot(       │
                        │    slotId, body)     │
                        └──────────┬───────────┘
                                   │ appendSection(today, slot, body)
                                   ▼
    ┌──────────────────────────────────────────────────┐
    │  @tauri-apps/api/core invoke                     │
    │    "append_section", { date, slot, body }        │
    └──────────┬───────────────────────────────────────┘
               │ IPC to Rust
               ▼
    ┌──────────────────────────────────────────────────┐
    │  commands::log::append_section (Rust)            │
    │    → ritual_log_dir(app)                         │
    │    → fs::create_dir_all(log_dir)                 │
    │    → OpenOptions::append().open()                │
    │    → writeln!(file, "## <slot>\n\n<body>\n")     │
    │    → file.flush()                                │
    │    → file.sync_all()  ← fsync(2), durable        │
    └──────────┬───────────────────────────────────────┘
               │ Rust command returns Ok(())
               ▼
    ┌──────────────────────────────────────────────────┐
    │  store.completeSlot resolves:                    │
    │    delete drafts[slotId]                         │
    │    currentIndex++                                │
    │    completedAt = Date.now() (if last slot)       │
    └──────────┬───────────────────────────────────────┘
               │ Zustand persist snapshots the new state
               ▼
    ┌──────────────────────────────────────────────────┐
    │  localStorage updated — draft for this slot is   │
    │  gone; canonical log has the content.            │
    └──────────────────────────────────────────────────┘
```

After this flow completes, the slot's writing lives in location (3) permanently, and is also cleared from locations (1) and (2).

If the Rust command fails (disk full, permission denied, impossibly bad luck), `completeSlot` throws, the store is not updated, the draft stays in locations (1) and (2) for retry. The UI currently surfaces the failure only via `console.error` — a visible error banner is a polish for a later commit.

## Stale session detection

**The problem:** Zustand `persist` keeps the whole store in localStorage. If Brandon runs the ritual on April 10 and doesn't open the app until April 11, the store rehydrates with April 10's `startedAt`, `currentIndex`, drafts, etc. Without detection, the app would resume yesterday's morning on the wrong day.

**The fix:** `startMorning` checks `isSameDay(state.startedAt, Date.now())`. If the persisted session is from the same local calendar day, leave it alone (resume-in-progress or show end-of-morning for already-completed). If it's from any other day, reset to fresh state and start a new morning.

**What gets discarded on reset:** uncommitted drafts from the previous day. Committed writing is in the canonical log file and is never touched.

**What does NOT get discarded:** the canonical log files. They are outside the store's responsibility entirely.

## Guarantees

### What we guarantee

1. **No writing is lost to app crashes within the same day.** Every keystroke is persisted to localStorage by the time the next keystroke is processed. A webview crash loses at most the last few characters typed.
2. **Committed writing is durable against OS crashes and power loss.** `fsync(2)` runs before the `append_section` command returns, so once Brandon sees the next slot (or the end-of-morning screen), the data is on disk.
3. **Writing outlives the tool.** The log directory is in `~/Documents/`, outside the app bundle. Deleting the morning-ritual app, deleting the repo, reinstalling, migrating to a new machine with iCloud Drive — none of these lose a single dream.
4. **Writing is readable without the app.** Plain markdown with `## <slot>` section headers. Any text editor, any grep, any agent, any future version of Claude can read these files.
5. **Stale sessions don't leak across days.** On the first run of a new day, `startMorning` detects that `startedAt` is from a previous date and resets the store to a fresh state. Uncommitted drafts from yesterday are discarded; they never made it into the canonical log, so they're treated as never-happened.

### What we do NOT guarantee

1. **No data loss from deleting the log directory.** If Brandon deletes `~/Documents/homebase-log/`, everything is gone. Backup is Brandon's responsibility (iCloud Drive, Time Machine, or manual).
2. **No collision on concurrent writers.** Two instances of the app writing to the same day file simultaneously can interleave at a write-syscall granularity. In practice Brandon runs one instance; this is theoretical.
3. **No conflict resolution.** If Brandon edits the day log file in a text editor while the app is running, the next append from the app just adds to the end — no merge, no check. The file is append-only from the app's perspective.
4. **No draft persistence across Tauri data-dir wipes.** If Brandon clears the webview's app data (unusual but possible), in-progress drafts that haven't been committed yet are lost. Committed writing in the log directory is unaffected.
5. **No atomic multi-section commit.** Each slot's `append_section` call is independently fsync'd. A crash between two slot completions leaves the first slot's section on disk and the second's lost. This is fine because Brandon is the only writer and completes slots one at a time.

## Extensibility

New slot types add to the flow without changing the save mechanism:

- **Prompt slots** (Dreams, inner weather, reflections): use the flow above exactly as described. Component calls `onDraft` on change, morning runner calls `completeSlot` on Cmd-Enter. Zero changes to Rust or the store.
- **Workspace slots** (piano, creative project): will have persistent `state.md` files in addition to the daily log section. When these ship, two new Rust commands (`read_slot_state`, `write_slot_state`) join `append_section` in the `log.rs` module. State files live in `~/Documents/homebase-log/states/<slot>.md` so they share the "outside the app bundle, under `~/Documents`" property with the day logs.
- **Fetch slots** (daily briefing): generate content via Rust (LLM calls, calendar reads) and hand the output to the same `append_section` command. Generated content goes under a `## <slot>:generated` header to stay visually subordinate to Brandon's own writing (plan §15 rule 2).
- **Gated multi-phase slots** (gym): the state machine lives in the React component; each completed phase appends its own section to the day log via `append_section`. The gym's 7 phases result in 7 sections in the same day file.

None of these require a new save format, a database, a cache, or any schema. The flow from location (1) → (2) → (3) holds for every slot the app will ever have.

## Portability

The log directory is the unit of data portability. To move Brandon's writing to a new machine:

1. Copy `~/Documents/homebase-log/` to the new machine.
2. Install the morning-ritual app.
3. The app writes new files into the existing directory without noticing or caring about the files that were already there.

To move Brandon's writing to a different tool:

1. Point the tool at `~/Documents/homebase-log/`.
2. Every file is already plain markdown with `## <slot>` headers.
3. Done.

To archive Brandon's writing:

```bash
tar czf dreams-2026.tgz ~/Documents/homebase-log/
```

Every operation on the log directory is one shell command because every file is plain text in a well-known location. This is the whole point of plan §9 — the substrate outlives the tool.

## When this document should be updated

- New save location added (e.g., a `states/` subdirectory for workspace slot state files)
- New data flow added (e.g., a fetch slot that writes from Rust directly without going through a prompt slot)
- Any change to the three-location model
- Any change to the Rust commands in `app/src-tauri/src/commands/log.rs`
- Any change to the Zustand store's save-related actions in `app/src/store/ritual.ts`

If this document ever falls out of date with the code, the code is the source of truth. Fix the document.
