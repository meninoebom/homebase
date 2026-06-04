// HorizonEmblem — a compact, symbolic version of the concentric horizons,
// sized to sit in the rust hero band's left void. Where HorizonRings is a
// full-width interactive diagram on bone, this is a small decorative mark on
// rust: cream frames closing in on a bone "Today" core, stating the six-
// horizons concept without trying to be the navigation (the taper accordion
// below does that job).
//
// Cream-on-rust treatment: frame borders brighten as they near the center,
// the same perspective logic as the bone-band rings, inverted for the dark
// band. Purely presentational — no click targets, aria-hidden.

const RINGS: { label: string; border: string; label_color: string }[] = [
  { label: "Life values", border: "rgba(236,230,218,0.16)", label_color: "rgba(236,230,218,0.55)" },
  { label: "Life goals", border: "rgba(236,230,218,0.22)", label_color: "rgba(236,230,218,0.6)" },
  { label: "This year", border: "rgba(236,230,218,0.30)", label_color: "rgba(236,230,218,0.68)" },
  { label: "This month", border: "rgba(236,230,218,0.40)", label_color: "rgba(236,230,218,0.76)" },
  { label: "This week", border: "rgba(236,230,218,0.54)", label_color: "rgba(236,230,218,0.86)" },
];

export function HorizonEmblem() {
  let node = (
    <div
      className="flex items-center justify-center rounded-[8px]"
      style={{
        background: "var(--paper-1)",
        color: "var(--accent-1)",
        padding: "12px 18px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif-display)",
          fontWeight: 600,
          fontSize: "18px",
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        Today
      </span>
    </div>
  );

  // Wrap from innermost frame (this week) outward to life values.
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const ring = RINGS[i];
    const inner = node;
    node = (
      <div
        className="relative rounded-[14px]"
        style={{ border: `1px solid ${ring.border}`, padding: "26px 18px 18px" }}
      >
        <span
          className="absolute"
          style={{
            top: "8px",
            left: "13px",
            fontFamily: "var(--font-sans-ui)",
            fontWeight: 600,
            fontSize: "10.5px",
            letterSpacing: "0.02em",
            color: ring.label_color,
          }}
        >
          {ring.label}
        </span>
        {inner}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="w-[300px] shrink-0">
      {node}
    </div>
  );
}
