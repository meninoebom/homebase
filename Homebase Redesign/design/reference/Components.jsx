/* Components.jsx — small, reusable Homebase UI atoms */

function Masthead() {
  return (
    <header className="masthead">
      <div className="eyebrow">A STRATEGIC LIFE GUIDE</div>
      <h1 className="masthead__word">Homebase</h1>
      <div className="meta">THURSDAY &middot; APRIL 30, 2026 &middot; WEEK 18</div>
    </header>
  );
}

function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <span className="ornament__rule"></span>
    </div>
  );
}

function ShortRule() {
  return <div className="short-rule" aria-hidden="true"></div>;
}

function TocRow({ item, expanded, onClick }) {
  return (
    <button className={"toc-row" + (expanded ? " toc-row--open" : "")} onClick={onClick}>
      <span className="toc-row__num">{item.num}</span>
      <span className="toc-row__title">{item.title}</span>
      <span className={"toc-row__meta" + (item.accent ? " toc-row__meta--accent" : "")}>
        {item.meta}
      </span>
      <span className={"toc-row__icon" + (item.accent ? " toc-row__icon--accent" : "")}>
        {item.kind === 'enter' ? '→' : (expanded ? '–' : '+')}
      </span>
    </button>
  );
}

function PrimaryButton({ label, onClick }) {
  return (
    <button className="btn-primary" onClick={onClick}>{label}</button>
  );
}

function TextButton({ label, onClick }) {
  return (
    <button className="btn-text" onClick={onClick}>
      {label} <span className="btn-text__arrow">→</span>
    </button>
  );
}

function RitualPrompt({ num, prompt, value, onChange }) {
  return (
    <div className="prompt">
      <div className="prompt__head">
        <span className="prompt__num">{num}</span>
        <span className="prompt__text">{prompt}</span>
      </div>
      <textarea
        className="prompt__field"
        rows={3}
        placeholder="Write a sentence."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

Object.assign(window, {
  Masthead, Ornament, ShortRule, TocRow,
  PrimaryButton, TextButton, RitualPrompt,
});
