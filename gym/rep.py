#!/usr/bin/env python3
"""rep.py — the state machine that drives /gym reps.

Stdlib only. Python 3.10+.

Subcommands:
  start                      print today's state
  open <track> <rep>         create rep dir, stub solve.py, mark start
  log <phase> <body...>      record a phase transition
  close                      finalize the rep, bump the streak
  status                     streak + current rep

The canonical day log lives at ~/Documents/homebase-log/YYYY-MM-DD.md.
Per-day state lives there too, as .state-YYYY-MM-DD.json.

Phase 3 (predict) is gated: rep.py refuses to advance past it without an
explicit Big O expression containing 'O(' and ')'. The /gym slash command
body enforces the prompt-discipline layer; this script enforces the
mechanism layer.

See protocol.md for the seven phases and the rules they live by.
"""

import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

LOG_ROOT = (
    Path.home()
    / "Library"
    / "CloudStorage"
    / "GoogleDrive-afrobot@gmail.com"
    / "My Drive"
    / "homebase-log"
)
REPO_ROOT = Path.home() / "dev" / "homebase"
GYM_ROOT = REPO_ROOT / "gym"

PHASES = ["primer", "restate", "model", "predict", "code", "reflect", "extend"]
GATED_PHASE = "predict"

PHASE_HEADER = {
    "primer": "Primer",
    "restate": "Restate",
    "model": "Model",
    "predict": "Predict",
    "code": "Code",
    "reflect": "Reflect",
    "extend": "Extension prediction",
}

SOLVE_TEMPLATE = """#!/usr/bin/env python3
\"\"\"solve.py — Brandon's solution. No AI assistance on this file.\"\"\"

import sys


def read_input() -> str:
    return sys.stdin.read()


def solve(data: str):
    # TODO
    return None


if __name__ == "__main__":
    print(solve(read_input()))
"""


def today_iso() -> str:
    return date.today().isoformat()


def log_file() -> Path:
    return LOG_ROOT / f"{today_iso()}.md"


def state_file() -> Path:
    return LOG_ROOT / f".state-{today_iso()}.json"


def streak_file() -> Path:
    return LOG_ROOT / ".streak.json"


def ensure_log_root() -> None:
    LOG_ROOT.mkdir(parents=True, exist_ok=True)


def load_state() -> dict:
    if not state_file().exists():
        return {"track": None, "rep": None, "phase_index": -1, "started_at": None}
    return json.loads(state_file().read_text())


def save_state(state: dict) -> None:
    ensure_log_root()
    state_file().write_text(json.dumps(state, indent=2))


def ensure_day_log() -> None:
    ensure_log_root()
    f = log_file()
    if not f.exists():
        f.write_text(f"# {date.today().strftime('%A, %B %d, %Y')}\n\n")


def append_log(text: str) -> None:
    ensure_day_log()
    with log_file().open("a") as f:
        f.write(text)
        if not text.endswith("\n"):
            f.write("\n")


def cmd_start() -> None:
    state = load_state()
    if state["track"] is None:
        print("No rep started today yet.")
        print("Tracks: signal-gym, agent-internals, control-center, interview-patch")
        print("Open one with: python3 rep.py open <track> <rep>")
        return
    phase = (
        PHASES[state["phase_index"]] if state["phase_index"] >= 0 else "not yet started"
    )
    print(f"In progress: {state['track']} / {state['rep']}")
    print(f"Current phase: {phase}")


def cmd_open(track: str, rep: str) -> None:
    rep_dir = GYM_ROOT / "tracks" / track / rep
    rep_dir.mkdir(parents=True, exist_ok=True)

    readme = rep_dir / "README.md"
    if not readme.exists():
        readme.write_text(f"# {rep}\n\n## Notes\n\n## Gotchas\n\n")

    solve = rep_dir / "solve.py"
    if not solve.exists():
        solve.write_text(SOLVE_TEMPLATE)

    input_file = rep_dir / "input.txt"
    if not input_file.exists():
        input_file.write_text("")

    state = load_state()
    if state["track"] is not None and (state["track"] != track or state["rep"] != rep):
        print(
            f"WARN: overwriting in-progress rep: {state['track']} / {state['rep']}",
            file=sys.stderr,
        )
    state["track"] = track
    state["rep"] = rep
    state["phase_index"] = -1
    state["started_at"] = datetime.now().isoformat(timespec="seconds")
    save_state(state)

    started = datetime.now().strftime("%H:%M")
    append_log(f"\n## gym: {track} / {rep}\n\n- Started: {started}\n\n")

    print(f"opened {track} / {rep}")
    print(f"files at: {rep_dir}")
    print(f"log at:   {log_file()}")


def cmd_log(phase: str, body: str) -> None:
    if phase not in PHASES:
        print(
            f"ERROR: unknown phase '{phase}'. Valid: {', '.join(PHASES)}",
            file=sys.stderr,
        )
        sys.exit(2)

    state = load_state()
    if state["track"] is None:
        print(
            "ERROR: no rep in progress. Run 'rep.py open <track> <rep>' first.",
            file=sys.stderr,
        )
        sys.exit(2)

    phase_index = PHASES.index(phase)
    gated_index = PHASES.index(GATED_PHASE)

    if phase_index > gated_index and state["phase_index"] < gated_index:
        print(
            f"BLOCKED: phase {GATED_PHASE} (cost prediction) not complete",
            file=sys.stderr,
        )
        sys.exit(3)

    if phase == GATED_PHASE:
        if not body or "O(" not in body or ")" not in body:
            print(
                "PREDICT_REQUIRED: phase 3 needs an explicit Big O of the form O(...)",
                file=sys.stderr,
            )
            sys.exit(4)

    append_log(f"### {PHASE_HEADER[phase]}\n\n{body}\n")

    state["phase_index"] = max(state["phase_index"], phase_index)
    save_state(state)

    print(f"logged {phase}")


def bump_streak() -> int:
    streak = {"last": None, "count": 0}
    if streak_file().exists():
        streak = json.loads(streak_file().read_text())

    today_str = today_iso()

    if streak.get("last") == today_str:
        return streak.get("count", 0)

    if streak.get("last"):
        last = date.fromisoformat(streak["last"])
        gap = (date.today() - last).days
        if gap == 1:
            streak["count"] = streak.get("count", 0) + 1
        else:
            streak["count"] = 1
    else:
        streak["count"] = 1

    streak["last"] = today_str
    streak_file().write_text(json.dumps(streak))
    return streak["count"]


def cmd_close() -> None:
    state = load_state()
    if state["track"] is None:
        print("no rep to close")
        return

    count = bump_streak()
    finished = datetime.now().strftime("%H:%M")

    append_log(f"- Finished: {finished}\n- Streak: {count}\n\n")

    state_file().unlink(missing_ok=True)

    print(f"closed. streak: {count} day(s).")


def cmd_status() -> None:
    streak = {"count": 0, "last": None}
    if streak_file().exists():
        streak = json.loads(streak_file().read_text())
    state = load_state()

    print(f"streak: {streak.get('count', 0)} day(s) (last: {streak.get('last') or 'never'})")
    if state["track"] is None:
        print("no rep in progress today")
    else:
        phase = (
            PHASES[state["phase_index"]]
            if state["phase_index"] >= 0
            else "not yet started"
        )
        print(f"in progress: {state['track']} / {state['rep']}")
        print(f"current phase: {phase}")


def main() -> None:
    if len(sys.argv) < 2:
        cmd_start()
        return

    cmd = sys.argv[1]
    args = sys.argv[2:]

    if cmd == "start":
        cmd_start()
    elif cmd == "open":
        if len(args) != 2:
            print("usage: rep.py open <track> <rep>", file=sys.stderr)
            sys.exit(2)
        cmd_open(args[0], args[1])
    elif cmd == "log":
        if len(args) < 2:
            print("usage: rep.py log <phase> <body...>", file=sys.stderr)
            sys.exit(2)
        cmd_log(args[0], " ".join(args[1:]))
    elif cmd == "close":
        cmd_close()
    elif cmd == "status":
        cmd_status()
    else:
        print(f"unknown command: {cmd}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
