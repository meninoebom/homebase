// First-run welcome flag.
//
// Marks that the user just granted a folder for the FIRST time (not a
// reconnect), so the strategic accordion can show a one-time welcome panel
// that gets out of the way on dismiss or first save.
//
// Stored in localStorage rather than homebase.config.json on purpose: this is
// ephemeral, per-origin UI state — a greeting shown once — not user content.
// It shouldn't travel in the user's files or require a config-schema
// migration. If localStorage is unavailable, the greeting simply doesn't show;
// it must never block setup.

const KEY = "homebase:welcome";

export function markWelcomePending(): void {
  try {
    localStorage.setItem(KEY, "show");
  } catch {
    // non-fatal — a greeting is never worth blocking on
  }
}

export function isWelcomePending(): boolean {
  try {
    return localStorage.getItem(KEY) === "show";
  } catch {
    return false;
  }
}

export function dismissWelcome(): void {
  try {
    localStorage.setItem(KEY, "dismissed");
  } catch {
    // non-fatal
  }
}
