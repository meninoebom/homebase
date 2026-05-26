// /about — what Homebase is, how to use it.
//
// Layout: centered 760px reading column with a small fixed TOC in the
// left gutter (lg+ only). The TOC anchors to each section by id and
// highlights the section currently in view via IntersectionObserver,
// so a first-time reader can see at a glance what's covered without
// scrolling, and click straight to the part they need.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const SECTIONS: { id: string; title: string }[] = [
  { id: "what-it-is", title: "What it is" },
  { id: "home-page", title: "The home page" },
  { id: "daily-page", title: "The daily page" },
  { id: "customize", title: "Customize it" },
  { id: "practical", title: "Practical" },
];

function AboutPage() {
  const navigate = useNavigate();
  const activeId = useActiveSection(SECTIONS.map((s) => s.id));

  return (
    <div className="strategy-scope min-h-screen">
      <TableOfContents sections={SECTIONS} activeId={activeId} />

      <div className="mx-auto max-w-[760px] px-8 pt-10 pb-24">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-14 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 py-1.5 font-sans text-[12px] font-medium uppercase transition-colors hover:text-[var(--ink-1)]"
          style={{ color: "var(--ink-2)", letterSpacing: "0.22em" }}
        >
          <span
            aria-hidden="true"
            className="italic"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "16px",
              transform: "translateY(-1px)",
            }}
          >
            ←
          </span>
          Homebase
        </button>

        <header className="mb-12 text-center">
          <h1
            className="italic"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontWeight: 400,
              fontSize: "calc(64px * var(--display-scale, 1))",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--ink-1)",
            }}
          >
            About Homebase
          </h1>
          <div
            aria-hidden="true"
            className="mx-auto mt-[22px] h-px w-12"
            style={{ background: "var(--ink-4)" }}
          />
        </header>

        <div
          className="mx-auto max-w-[62ch] font-serif text-[17px] leading-[1.65]"
          style={{ color: "var(--ink-1)" }}
        >
          <Section id="what-it-is" title="What it is">
            <p>
              Homebase is a personal writing tool with two surfaces: a <em>home page</em> for
              reflection at long horizons (your values, your goals, the year, the month, the week),
              and a <em>daily page</em> for whatever you want to write today.
            </p>
            <p>
              Everything you write is plain markdown saved to a folder you choose on your own
              computer. There is no server, no account, no sync. Open the same files in any text
              editor; back them up however you back up files.
            </p>
          </Section>

          <Section id="home-page" title="The home page">
            <p>
              The accordion at <code className="font-mono text-[15px]">/</code> is your map. Each
              row is a horizon — Life values, Life goals, Year, Month, Week. Click to expand, write,
              collapse. Writing at one horizon carries forward to the next when a new period begins,
              so a fresh week starts with last week's draft instead of a blank page.
            </p>
            <p>The Day row at the bottom doesn't open inline; it links to your daily page.</p>
          </Section>

          <Section id="daily-page" title="The daily page">
            <p>
              Whatever you do every day. Some people use it as a morning ritual. Some journal in the
              evening. Some leave it open and add to it through the day. It's just a writing page
              with sections you arrange to suit your practice.
            </p>
            <p>
              Sections are called <em>slots</em>, and there are two kinds.
            </p>

            <h3
              className="mt-6 mb-2 font-sans text-[12px] font-medium uppercase tracking-[0.16em]"
              style={{ color: "var(--ink-2)" }}
            >
              Prompt slots
            </h3>
            <p>
              A single writing field with an optional question above it. Each day starts blank.
              Write, save, move on. Examples: Dreams, Inner Weather, Gratitude, Today.
            </p>

            <h3
              className="mt-6 mb-2 font-sans text-[12px] font-medium uppercase tracking-[0.16em]"
              style={{ color: "var(--ink-2)" }}
            >
              Workspace slots
            </h3>
            <p>
              Two areas stacked. A <em>persistent</em> area at the top that{" "}
              <em>doesn't change day to day</em> — a small whiteboard you only edit when something
              genuinely changes. Below it, an optional today-writing field that does reset each day,
              like a prompt slot.
            </p>
            <p>
              Use a workspace when there's standing context you want to see <em>before</em> writing
              today's entry. Goals for a project. The book you're reading. The instrument you're
              practicing. "Working on" lists. Anything where "what was I doing here?" is a useful
              question to answer first.
            </p>
            <p>
              Most slots will probably be prompts. Workspaces are for the few areas where a small
              dashboard above the day's writing earns its place.
            </p>
          </Section>

          <Section id="customize" title="Customize it">
            <p>
              Click <strong>Customize</strong> in either page's footer (home or daily) to open
              settings. From there you can:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Reorder slots by dragging the handle</li>
              <li>
                Rename a slot's title (the <em>id</em> stays fixed so your history doesn't break)
              </li>
              <li>Edit prompts and the small hint chips</li>
              <li>Add a new prompt or workspace</li>
              <li>Remove a slot — its file stays on disk; it just stops rendering</li>
              <li>Toggle the briefing panel and supply your own quotes</li>
            </ul>
            <p>
              All edits save to a file called{" "}
              <code className="font-mono text-[15px]">homebase.config.json</code> in your log
              folder. You can hand-edit it in any text editor. If you break it, Homebase shows a
              recovery screen with a "Reset to defaults" button.
            </p>
          </Section>

          <Section id="practical" title="Practical">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Browser:</strong> Chrome, Edge, Brave, Arc — anything Chromium-based.
                Homebase uses the File System Access API; Firefox and Safari don't support it yet.
              </li>
              <li>
                <strong>Folder:</strong> <code className="font-mono text-[15px]">~/Homebase</code>{" "}
                works well — keeping it out of{" "}
                <code className="font-mono text-[15px]">Documents</code> avoids iCloud sync-conflict
                copies. You only pick it once.
              </li>
              <li>
                <strong>Offline:</strong> install Homebase as a desktop app via the install button
                in your address bar. The shell works offline after the first load.
              </li>
              <li>
                <strong>Save:</strong> autosave runs in the background. <Key>⌘</Key>
                <Key>↩</Key> commits immediately if you want to see it land.
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}

function TableOfContents({
  sections,
  activeId,
}: {
  sections: { id: string; title: string }[];
  activeId: string | null;
}) {
  return (
    <nav
      aria-label="Page contents"
      className="pointer-events-none fixed top-24 left-6 z-10 hidden w-[160px] lg:block"
    >
      <div className="pointer-events-auto">
        <p
          className="mb-3 font-sans text-[10px] font-medium uppercase"
          style={{ color: "var(--ink-3)", letterSpacing: "0.22em" }}
        >
          Contents
        </p>
        <ul className="flex flex-col gap-2">
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block cursor-pointer font-sans text-[12px] leading-snug transition-colors"
                  style={{
                    color: isActive ? "var(--accent-1)" : "var(--ink-2)",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {s.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-20">
      <h2
        className="mb-5 font-sans text-[13px] font-medium uppercase"
        style={{ color: "var(--accent-1)", letterSpacing: "0.22em" }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mx-[3px] inline-block px-[7px] py-[2px] font-sans text-[10px] uppercase tracking-[0.1em] not-italic"
      style={{
        color: "var(--ink-3)",
        border: "1px solid var(--hairline-2, #D9D2C0)",
        borderRadius: "3px",
      }}
    >
      {children}
    </span>
  );
}

/**
 * Track which section is currently in view as the user scrolls.
 * Uses IntersectionObserver with a top-of-viewport rootMargin so the
 * "active" section flips when its heading reaches the upper third of
 * the screen — feels right for reading flow, where the eye lands
 * above the middle.
 */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost section currently intersecting; falls back
        // to whichever section's heading is closest to the top of the
        // viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        // Activate when the heading is in the top ~third of the viewport.
        rootMargin: "0px 0px -66% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
