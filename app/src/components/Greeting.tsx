// The first-screen greeting Brandon sees when he opens the app in the morning.
// One italic serif line with the day; no logo, no welcome text, no landing
// page. The interaction agent was explicit: "the app's answer to 'what do I
// do now?' must always be 'the thing in front of you'" (plan §11).

import type { ReactNode } from "react";

interface GreetingProps {
  date: Date;
  /** Optional whisper line — lights up around day 7 when grep has a hit. */
  whisper?: ReactNode;
}

const DAY_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

export function Greeting({ date, whisper }: GreetingProps) {
  const dayText = date.toLocaleDateString(undefined, DAY_FORMAT);

  return (
    <header className="flex flex-col gap-6">
      <h1 className="font-serif text-[44px] italic leading-[1.18] text-ink">{dayText}.</h1>
      {whisper ? (
        <p className="font-serif text-[16px] italic leading-[1.62] text-ink-muted">— {whisper}</p>
      ) : null}
    </header>
  );
}
