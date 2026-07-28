// InstallLink — a footer link that installs Homebase as a desktop app.
//
// Worth more than the convenience it looks like. Chromium persists File System
// Access permissions automatically for *installed* apps, so installing is the
// supported way to stop the "Welcome back, reconnect" screen (SetupGate's
// `reconnect` state) from reappearing. Until this shipped there was no install
// affordance anywhere in the app, leaving that fix invisible.
//
// The link renders only when the browser has actually offered an install:
// Chromium fires `beforeinstallprompt` when the PWA criteria are met and the
// app isn't installed yet. There is no way to trigger the prompt without that
// event, so a permanently-visible button would be a dead control on every
// browser that never fires it.

import { useEffect, useState } from "react";

/** Chromium-only event; not in TS's DOM lib. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Capture the install prompt, if the browser offers one. Returns null when
 * install isn't available (already installed, non-Chromium, criteria unmet).
 */
export function useInstallPrompt(): (() => void) | null {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      // Chromium shows its own mini-infobar unless the event is cancelled;
      // we want the install to happen from our footer, on the user's terms.
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;
  return () => {
    void event.prompt();
    // The captured event is single-use: Chromium refuses a second prompt()
    // on the same event, so drop it and wait for a fresh one.
    setEvent(null);
  };
}

/** Footer link in the strategic (warm bone) register. Renders nothing when install is unavailable. */
export function InstallLink() {
  const install = useInstallPrompt();
  if (!install) return null;

  return (
    <button
      type="button"
      onClick={install}
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
      Install
    </button>
  );
}
