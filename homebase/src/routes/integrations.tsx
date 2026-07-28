// /integrations — "use your Homebase with AI."
//
// The whole pitch of this page: your entries are already plain markdown in a
// folder you control, which is the most agent-friendly format there is. So the
// straightforward way to "ask an AI about yourself" is to point a tool you
// already have at the folder — no account, no backend, no data leaving your
// machine until you choose to paste it somewhere.
//
// Two affordances, cheapest first:
//   1. Copy the AI primer (teaches any agent your file layout) — for tools that
//      can read the folder directly (Claude Desktop's filesystem connector,
//      Claude Code).
//   2. Copy a recent digest (last 30 days + strategy files, assembled into one
//      markdown block) — for tools that take pasted text (claude.ai, ChatGPT).
//
// Room: white writing-surface register (sibling of /settings), Inter Tight,
// non-italic chrome. See CLAUDE.md "Two rooms, two registers".

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { gatherDigest } from "../lib/reflect/digest";
import { AI_PRIMER } from "../lib/reflect/primer";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
});

const COPIED_RESET_MS = 2000;

function IntegrationsPage() {
  const navigate = useNavigate();
  const [primerCopied, setPrimerCopied] = useState(false);
  const [primerError, setPrimerError] = useState<string | null>(null);
  const [digestCopied, setDigestCopied] = useState(false);
  const [digestBusy, setDigestBusy] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  const copyPrimer = async () => {
    // Unlike the digest below there's nothing to fail in gathering this — the
    // primer is a constant — but the clipboard write itself can still reject
    // (permission denied, or no clipboard API at all), and an unhandled
    // rejection here would leave the button looking like it did nothing.
    setPrimerError(null);
    try {
      await navigator.clipboard.writeText(AI_PRIMER);
      setPrimerCopied(true);
      setTimeout(() => setPrimerCopied(false), COPIED_RESET_MS);
    } catch {
      setPrimerError("Couldn't reach your clipboard. You can select and copy the primer by hand.");
    }
  };

  const copyDigest = async () => {
    setDigestBusy(true);
    setDigestError(null);
    try {
      const digest = await gatherDigest();
      await navigator.clipboard.writeText(digest);
      setDigestCopied(true);
      setTimeout(() => setDigestCopied(false), COPIED_RESET_MS);
    } catch {
      setDigestError("Couldn't read your folder just now. Try again in a moment.");
    } finally {
      setDigestBusy(false);
    }
  };

  return (
    <IntegrationsContent
      onBack={() => navigate({ to: "/" })}
      onCopyPrimer={copyPrimer}
      onCopyDigest={copyDigest}
      primerCopied={primerCopied}
      digestCopied={digestCopied}
      digestBusy={digestBusy}
      digestError={digestError}
      primerError={primerError}
    />
  );
}

interface IntegrationsContentProps {
  onBack: () => void;
  onCopyPrimer: () => void;
  onCopyDigest: () => void;
  primerCopied: boolean;
  digestCopied: boolean;
  digestBusy: boolean;
  digestError: string | null;
  primerError: string | null;
}

// Presentational seam — no router, no clipboard — so it renders cleanly in tests.
export function IntegrationsContent({
  onBack,
  onCopyPrimer,
  onCopyDigest,
  primerCopied,
  digestCopied,
  digestBusy,
  digestError,
  primerError,
}: IntegrationsContentProps) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[640px] px-8 pb-24 pt-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-10 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 py-1.5 font-sans text-[11px] font-medium uppercase text-[#6B7280] hover:text-[#111]"
          style={{ letterSpacing: "0.24em" }}
        >
          <span aria-hidden="true">←</span>
          Done
        </button>

        <h1 className="mb-3 font-sans text-[28px] font-semibold tracking-[-0.02em] text-[#111]">
          Use your Homebase with AI
        </h1>
        <p className="mb-10 font-sans text-[15px] leading-relaxed text-[#4B5563]">
          Everything you write here is plain markdown in your own folder, which happens to be the
          easiest possible format to hand to an AI. So you don't need anything built in. You point a
          tool you already have at your folder and ask. Nothing leaves your machine until you choose
          to share it.
        </p>

        <Section heading="1. Reflect with an AI that can read your folder">
          <p className="mb-3 font-sans text-[15px] leading-relaxed text-[#4B5563]">
            Some assistants can read a local folder directly. In{" "}
            <strong className="font-semibold text-[#111]">Claude Desktop</strong>, add the
            filesystem connector and point it at your Homebase folder. In{" "}
            <strong className="font-semibold text-[#111]">Claude Code</strong>, just open the folder
            in your terminal. Then paste the primer below so it understands your files, and ask:
          </p>
          <ul className="mb-4 ml-5 list-disc font-sans text-[15px] leading-relaxed text-[#4B5563]">
            <li>"Read my last 30 days and name a theme I haven't named myself."</li>
            <li>"Hold my recent days up against my values. Where am I drifting?"</li>
            <li>"I feel stuck. Read the last two weeks and tell me what I sound like."</li>
          </ul>
          <CopyButton
            label="Copy AI primer"
            copied={primerCopied}
            onClick={onCopyPrimer}
            testid="copy-primer"
          />
          {primerError && (
            <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#B91C1C]">
              {primerError}
            </p>
          )}
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#9CA3AF]">
            Tip: you can also save this primer as a file in your folder so any agent picks it up
            automatically. Edit it to sound like the kind of reflection you actually want.
          </p>
        </Section>

        <Section heading="2. Or paste a recent digest">
          <p className="mb-4 font-sans text-[15px] leading-relaxed text-[#4B5563]">
            For tools that take pasted text instead of folder access (claude.ai, ChatGPT), copy a
            digest of your last 30 days of entries plus your strategy files as one markdown block,
            then paste it into a new chat. It's assembled here in your browser and only goes to your
            clipboard.
          </p>
          <CopyButton
            label={digestBusy ? "Gathering…" : "Copy last 30 days"}
            copied={digestCopied}
            onClick={onCopyDigest}
            disabled={digestBusy}
            testid="copy-digest"
          />
          {digestError && (
            <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#B91C1C]">
              {digestError}
            </p>
          )}
        </Section>

        <p
          className="mt-16 border-t pt-5 font-sans text-[13px] leading-relaxed text-[#9CA3AF]"
          style={{ borderColor: "#F3F4F6" }}
        >
          Homebase has no server and no account. These tools just make it easy to hand your own
          writing to an assistant of your choice. Where it goes from there is up to you.
        </p>
      </div>
    </main>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-3 font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function CopyButton({
  label,
  copied,
  onClick,
  disabled,
  testid,
}: {
  label: string;
  copied: boolean;
  onClick: () => void;
  disabled?: boolean;
  testid: string;
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded border border-[#D1D5DB] bg-white px-3 py-2 font-sans text-[14px] font-medium text-[#111] transition-colors hover:border-[#9CA3AF] disabled:cursor-default disabled:opacity-60"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
