// "/" — the strategic accordion as front door of Homebase.
//
// Pre-2026-04-30 this route redirected to /morning (the morning ritual was
// the center of gravity). The strategic-layer plan (#13) flips that: "/"
// is the strategic accordion — life values, life goals, year, month, week
// — and the day page is reachable via the Day-row portal. The day page
// itself was renamed from /morning to /day on 2026-05-15.
//
// State preservation across the Day → /day → back round-trip is
// inherited from Zustand: useStrategyStore is module-scoped, so unmounting
// and remounting the accordion (route nav out and back) leaves the row
// state intact. No persist-middleware required for the in-session round-
// trip; persistent reload state is out of scope for v1.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FeedbackLink, FeedbackModal } from "../components/FeedbackModal";
import { HorizonRow } from "../components/HorizonRow";
import { Masthead } from "../components/Masthead";
import { WelcomePanel } from "../components/WelcomePanel";
import { dismissWelcome, isWelcomePending } from "../lib/welcome";

export const Route = createFileRoute("/")({
  component: StrategyAccordion,
});

function StrategyAccordion() {
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(isWelcomePending);
  const feedbackTriggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div className="strategy-scope min-h-screen">
      <div className="mx-auto max-w-[1040px] px-10 pt-14 pb-16 md:px-20">
        <Masthead />
        {showWelcome && (
          <WelcomePanel
            onDismiss={() => {
              dismissWelcome();
              setShowWelcome(false);
            }}
          />
        )}
        <div className="toc flex flex-col">
          <HorizonRow horizon="life-values" />
          <HorizonRow horizon="life-goals" />
          <HorizonRow horizon="year" />
          <HorizonRow horizon="month" />
          <HorizonRow horizon="week" />
          <HorizonRow horizon="day" onDayClick={() => navigate({ to: "/day" })} />
        </div>
        <footer className="mt-14 pt-5" style={{ borderTop: "1px solid var(--paper-edge)" }}>
          <div className="mb-5 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => navigate({ to: "/settings" })}
              className="cursor-pointer border-0 bg-transparent p-0 transition-colors hover:text-[var(--ink-1)]"
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              Customize
            </button>
            <FeedbackLink
              variant="strategic"
              onOpen={() => setFeedbackOpen(true)}
              triggerRef={feedbackTriggerRef}
            />
          </div>
          <FeedbackModal
            isOpen={feedbackOpen}
            onClose={() => setFeedbackOpen(false)}
            triggerRef={feedbackTriggerRef}
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              Volume one · No. 121
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              Homebase 2026
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
