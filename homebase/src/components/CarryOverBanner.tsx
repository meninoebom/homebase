// CarryOverBanner — minimal pass-through implementation. The polished
// "marginalia" version (※ reference mark, dotted hairline, terracotta
// clear link, italic Newsreader register) lands in #10. This file
// exists so HorizonRow can render the carry-over flow end-to-end now;
// expect #10 to replace the body wholesale, keeping the same props.

import { PeriodKey, type Horizon } from "../lib/period-key";

/**
 * Props accept any Horizon for ergonomic JSX in HorizonRow. In practice
 * the banner only renders when state.carryOver is non-null, which only
 * happens for time-bound horizons; PeriodKey.format will throw if the
 * caller violates that invariant.
 */
interface Props {
  horizon: Horizon;
  sourcePeriod: string;
  onClear: () => void;
}

export function CarryOverBanner({ horizon, sourcePeriod, onClear }: Props) {
  const sourceLabel = PeriodKey.format(horizon, sourcePeriod);
  return (
    <div
      className="mb-3 pb-2 pt-2 font-serif text-[14px] italic"
      style={{ color: "var(--ink-muted, #7A7268)" }}
    >
      Carried from <strong className="not-italic">{sourceLabel}</strong> — review and edit, or{" "}
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer border-b border-dotted bg-transparent p-0 not-italic"
        style={{ color: "var(--terracotta, #B8472D)", borderColor: "var(--terracotta, #B8472D)" }}
      >
        clear
      </button>
      .
    </div>
  );
}
