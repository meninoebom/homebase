import { createFileRoute } from "@tanstack/react-router";

/*
 * Research log view. Renders ~/Documents/morning-ritual-log/NOTES.md as an
 * editable surface so Brandon can jot field notes on the ritual itself without
 * leaving the app. The research log is the canary for ritual health (plan §16:
 * "NOTES.md's last entry is two weeks old" is a warning sign). Placeholder here;
 * real behavior in issue 003.
 */
export const Route = createFileRoute("/notes")({
  component: NotesPlaceholder,
});

function NotesPlaceholder() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[62ch] flex-col justify-center px-8">
      <h1 className="font-serif text-3xl italic text-ink-muted">notes</h1>
      <p className="mt-10 font-sans text-xs uppercase tracking-wider text-ink-faint">
        scaffold placeholder — NOTES.md editor ships in issue 003
      </p>
    </main>
  );
}
