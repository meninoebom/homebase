// /about: colophon-style explanation of what Homebase is and how to use it.
//
// Reached from the "ABOUT THIS GUIDE" link in the Masthead on /. Mirrors the
// page chrome of horizon.$id.tsx (back link, max-w-[760px] container, centered
// title with eyebrow + rule) so the back-button affordance and visual register
// stay consistent across secondary pages.

import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="strategy-scope min-h-screen">
      <div className="mx-auto max-w-[760px] px-8 pt-10 pb-24">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-14 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 py-1.5 font-sans text-[11px] font-medium uppercase transition-colors hover:text-[var(--ink-1)]"
          style={{ color: "var(--ink-3)", letterSpacing: "0.24em" }}
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
          <div
            className="mb-3 font-sans text-[11px] font-medium uppercase"
            style={{ color: "var(--accent-1)", letterSpacing: "0.24em" }}
          >
            Colophon
          </div>
          <h1
            className="italic"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontWeight: 400,
              fontSize: "calc(72px * var(--display-scale, 1))",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--ink-1)",
            }}
          >
            About
          </h1>
          <div
            aria-hidden="true"
            className="mx-auto mt-[22px] h-px w-12"
            style={{ background: "var(--ink-4)" }}
          />
        </header>

        <div
          className="mx-auto max-w-[62ch] font-serif text-[17px] leading-[1.65]"
          style={{ color: "var(--ink-2)" }}
        >
          <Section title="What this is">
            <p>
              Homebase is a strategic life guide. A quiet surface for naming what your life is
              about, at five nested time horizons: <em>life values</em>, <em>life goals</em>, the{" "}
              <em>year</em>, the <em>month</em>, the <em>week</em>. A sixth row, the <em>day</em>,
              opens the morning ritual.
            </p>
            <p>
              The accordion at the front door is the table of contents. Each horizon is its own
              page, not a form. Writing at one horizon carries forward to the next when a new period
              begins.
            </p>
          </Section>

          <Section title="How to use it">
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <strong>Open in Chrome.</strong> Homebase relies on the File System Access API,
                which today is supported only by Chromium browsers. Chrome, Edge, Brave, and Arc all
                work. Firefox and Safari don't, yet.
              </li>
              <li>
                <strong>Pick a folder.</strong> Anywhere on your disk.{" "}
                <code className="font-mono text-[15px]">~/Documents/homebase-log</code> works well.
                Homebase writes plain markdown there. You can open the same files in any editor.
              </li>
              <li>
                <strong>Begin where there's least resistance.</strong> A blank life-values page can
                feel intimidating; a blank week can't. You don't have to start at the top.
              </li>
              <li>
                <strong>Write a little, often.</strong> Autosave runs in the background.{" "}
                <Key>⌘</Key>
                <Key>↩</Key> commits immediately if you want to see it land.
              </li>
              <li>
                <strong>Let carry-over do the work.</strong> When a new week (or month, or year)
                begins, last period's writing is offered as a draft. Edit it, accept it, or clear
                it.
              </li>
            </ol>
          </Section>

          <Section title="Where your writing lives">
            <p>
              Homebase is hosted as a static site on GitHub Pages, but it has{" "}
              <em>no server and no database</em>. Your writing never leaves your machine. The
              browser's File System Access API lets the app read and write the folder you pick. That
              access ends when you close the tab.
            </p>
            <p>
              You can install Homebase as a desktop app (look for the install button in your address
              bar). The app shell works offline after the first load.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2
        className="mb-5 font-sans text-[11px] font-medium uppercase"
        style={{ color: "var(--accent-1)", letterSpacing: "0.24em" }}
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
        color: "var(--ink-faint, #A39A8A)",
        border: "1px solid var(--hairline-2, #D9D2C0)",
        borderRadius: "3px",
      }}
    >
      {children}
    </span>
  );
}
