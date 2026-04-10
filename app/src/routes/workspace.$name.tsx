import { createFileRoute } from "@tanstack/react-router";

/*
 * Topic-axis workspace view. URL like /workspace/piano renders the slot's
 * persistent state (state.md) as an editable surface — Brandon's current piano
 * focus, the reading list, the creative project board. Different mental register
 * from the morning sequence: this is "flip to the piano collection in the
 * bullet journal" (plan §1 metaphor). Placeholder here; real behavior in 003+.
 */
export const Route = createFileRoute("/workspace/$name")({
  component: WorkspacePlaceholder,
});

function WorkspacePlaceholder() {
  const { name } = Route.useParams();
  return (
    <main className="mx-auto flex min-h-screen max-w-[62ch] flex-col justify-center px-8">
      <h1 className="font-serif text-3xl italic text-ink-muted">{name} · workspace</h1>
      <p className="mt-10 font-sans text-xs uppercase tracking-wider text-ink-faint">
        scaffold placeholder — workspace view ships in issue 003
      </p>
    </main>
  );
}
