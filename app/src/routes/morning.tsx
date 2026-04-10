import { createFileRoute } from "@tanstack/react-router";

/*
 * Placeholder morning runner. Replaced in issue 003 (morning runner shell) with
 * the real sequence runner: greeting, slot transitions, Cmd-Enter advance,
 * end-of-morning. For now this is just enough to verify the scaffold compiles
 * and the route renders.
 */
export const Route = createFileRoute("/morning")({
  component: MorningPlaceholder,
});

function MorningPlaceholder() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-[62ch] flex-col justify-center px-8">
      <h1 className="font-serif text-4xl italic text-ink">{today}.</h1>
      <p className="mt-10 font-sans text-xs uppercase tracking-wider text-ink-faint">
        scaffold placeholder — morning runner ships in issue 003
      </p>
    </main>
  );
}
