// SectionPreview — the expanded body of a strategic accordion row.
//
// A *projection* of the row's markdown, not the editor itself: the user
// sees a one-line lead, an optional progress mark (year/month/week),
// and the top-level items as a numbered list. They click "Open" to
// drill into the full editor at /horizon/:id.
//
// If the markdown has neither a lead nor items, the parent (HorizonRow)
// shows the empty-state invitation instead — that branch never reaches
// here. Defense-in-depth: this component still renders gracefully if
// both come back empty.
//
// Per the redesign prototype's SectionContent component.

import { ProgressMark } from "./ProgressMark";
import type { Horizon } from "../lib/period-key";
import { extractItems, extractLead } from "../lib/markdown-preview";

const ROMAN_LIST = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

interface Props {
  horizon: Horizon;
  content: string;
  onOpen: () => void;
  onEdit: () => void;
}

export function SectionPreview({ horizon, content, onOpen, onEdit }: Props) {
  const lead = extractLead(content);
  const items = extractItems(content);
  const isTimeBound = horizon === "year" || horizon === "month" || horizon === "week";

  return (
    <div>
      {lead && (
        <p
          className="my-2 mb-[18px] italic"
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "22px",
            lineHeight: 1.35,
            letterSpacing: "-0.005em",
            color: "var(--ink-1)",
            maxWidth: "540px",
          }}
        >
          {lead}
        </p>
      )}

      {isTimeBound && <ProgressMark horizon={horizon} />}

      {items.length > 0 && (
        <ol
          className="m-0 mb-1.5 flex list-none flex-col gap-[14px] pt-[22px]"
          style={{
            borderTop: "1px solid var(--paper-edge)",
            padding: 0,
            paddingTop: "22px",
          }}
          aria-label={`Items`}
        >
          {items.map((text, i) => (
            <li
              key={i}
              className="grid items-baseline gap-3"
              style={{
                gridTemplateColumns: "26px 1fr",
                fontFamily: "var(--font-serif-text)",
                fontSize: "17px",
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              <span
                className="italic"
                style={{
                  fontFamily: "var(--font-numeral)",
                  fontSize: "15px",
                  color: "var(--ink-4)",
                }}
              >
                {ROMAN_LIST[i] ?? String(i + 1)}.
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-[22px] flex flex-wrap items-center gap-7">
        <ActionButton label="Open" onClick={onOpen} />
        <ActionButton label="Edit" onClick={onEdit} quiet />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  quiet,
}: {
  label: string;
  onClick: () => void;
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-0 bg-transparent p-0 py-1 font-sans text-[11px] font-semibold uppercase transition-colors"
      style={{
        color: quiet ? "var(--ink-3)" : "var(--accent-1)",
        letterSpacing: "0.22em",
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {label}
      <span
        aria-hidden="true"
        className="italic"
        style={{
          fontFamily: "var(--font-serif-display)",
          fontSize: "16px",
          transform: "translateY(-1px)",
        }}
      >
        →
      </span>
    </button>
  );
}
