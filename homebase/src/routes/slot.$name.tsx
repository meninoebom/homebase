import { createFileRoute } from "@tanstack/react-router";

/*
 * Ad-hoc single-slot entry point. URL like /slot/piano opens the piano slot in
 * adhoc mode (RITUAL_MODE=adhoc equivalent), used when Brandon wants to touch
 * a workspace slot outside the morning sequence — typically piano after a 4pm
 * practice session. Placeholder here; real behavior in issue 003/004.
 */
export const Route = createFileRoute("/slot/$name")({
  component: SlotAdhocPlaceholder,
});

function SlotAdhocPlaceholder() {
  const { name } = Route.useParams();
  return (
    <main className="mx-auto flex min-h-screen max-w-[62ch] flex-col justify-center px-8">
      <h1 className="font-serif text-3xl italic text-ink-muted">{name} · adhoc</h1>
      <p className="mt-10 font-sans text-xs uppercase tracking-wider text-ink-faint">
        scaffold placeholder — adhoc entry ships in issue 003
      </p>
    </main>
  );
}
