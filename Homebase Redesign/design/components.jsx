/* components.jsx — Homebase prototype atoms (Newsreader display + Inter Tight UI) */

const { useState, useEffect, useRef } = React;

/* ---------- Masthead variants ---------- */
function Masthead({ layout, dateline }) {
  if (layout === 'spread') return <MastheadSpread dateline={dateline} />;
  return <MastheadCentered dateline={dateline} />;
}

function MastheadCentered({ dateline }) {
  return (
    <header className="masthead">
      <div className="eyebrow">A STRATEGIC LIFE GUIDE</div>
      <h1 className="masthead__word">Homebase</h1>
      <div className="meta">
        {dateline.weekday} <span aria-hidden="true">·</span> {dateline.date} <span aria-hidden="true">·</span> {dateline.week}
      </div>
      <div className="short-rule" aria-hidden="true"></div>
    </header>
  );
}

function MastheadSpread({ dateline }) {
  return (
    <header className="masthead">
      <div className="eyebrow">A STRATEGIC LIFE GUIDE</div>
      <h1 className="masthead__word">Homebase</h1>
      <div className="dateline-spread" aria-label="Date and edition">
        <span className="seg seg--left">{dateline.volume} <span aria-hidden="true">·</span> {dateline.issue}</span>
        <span className="ornament" aria-hidden="true"></span>
        <span className="seg seg--right">{dateline.weekday} <span aria-hidden="true">·</span> {dateline.date}</span>
      </div>
    </header>
  );
}

/* ---------- TOC row ---------- */
function TocRow({ item, expanded, onClick }) {
  const icon = item.kind === 'enter' ? '→' : (expanded ? '×' : '+');
  return (
    <button
      className={'toc-row' + (expanded ? ' toc-row--open' : '')}
      onClick={onClick}
      aria-expanded={item.kind === 'expand' ? !!expanded : undefined}
    >
      <span className="toc-row__num">{item.num}</span>
      <span className="toc-row__title">{item.title}</span>
      <span className={'toc-row__meta' + (item.accent ? ' toc-row__meta--accent' : '')}>
        {item.meta}
      </span>
      <span className={'toc-row__icon' + (item.accent ? ' toc-row__icon--accent' : '')}>
        {icon}
      </span>
    </button>
  );
}

/* ---------- Section content (used inline + drawer + full-page) ---------- */
function SectionContent({ item, onEnter, dense }) {
  return (
    <>
      <p className="lead">{item.lead}</p>
      <div className="meta-line">
        <span>{item.meta}</span>
        <span className="dot" aria-hidden="true"></span>
        <span>{item.updated}</span>
      </div>
      {item.progress && <ProgressMark progress={item.progress} />}
      {item.items && (
        <ol className="section-list" aria-label={item.title + ' items'}>
          {item.items.map((t, i) => (
            <li key={i}>
              <span className="num">{romanize(i + 1)}.</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="actions">
        <button className="btn-text" onClick={onEnter}>
          Open <span className="btn-text__arrow">→</span>
        </button>
        <button className="btn-text btn-text--quiet">
          Edit <span className="btn-text__arrow">→</span>
        </button>
      </div>
    </>
  );
}

function romanize(n) {
  const r = ['i','ii','iii','iv','v','vi','vii','viii','ix','x'];
  return r[n - 1] || String(n);
}

/* ---------- Progress marks ---------- */
function ProgressMark({ progress }) {
  if (progress.kind === 'year' || progress.kind === 'month') {
    const pct = Math.round((progress.value / progress.of) * 100);
    return (
      <div className="mark mark--year">
        <span className="mark__num">{progress.value}</span>
        <div className="mark__bar"><span className="fill" style={{ width: pct + '%' }} /></div>
        <span className="mark__num">of {progress.of}</span>
      </div>
    );
  }
  if (progress.kind === 'week') {
    const labels = ['M','T','W','T','F','S','S'];
    return (
      <div className="mark mark--week" aria-label="Week progress">
        {labels.map((l, i) => {
          const cls = i === progress.today ? 'day day--today'
                    : i < progress.today ? 'day day--past'
                    : 'day';
          return <div key={i} className={cls}>{l}</div>;
        })}
      </div>
    );
  }
  return null;
}

/* ---------- Drawer ---------- */
function Drawer({ item, onClose, onEnter }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-label={item.title}>
        <div className="drawer__inner">
          <div className="drawer__head">
            <span className="drawer__num">{item.num}</span>
            <button className="drawer__close" onClick={onClose}>Close ×</button>
          </div>
          <h2 className="drawer__title">{item.title}</h2>
          <SectionContent item={item} onEnter={onEnter} />
        </div>
      </aside>
    </>
  );
}

/* ---------- Full-page section ---------- */
function FullPageSection({ item, onClose, onEnter }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <main className="page" style={{ animation: 'revealPanel 320ms cubic-bezier(0.22,0.61,0.36,1) both' }}>
      <button className="back-link" onClick={onClose}>
        <span className="arrow">←</span> Homebase
      </button>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="masthead">
          <div className="eyebrow" style={{ color: 'var(--accent-1)' }}>{item.num.replace(/\.$/,'').toUpperCase()} <span aria-hidden="true">·</span> {item.meta}</div>
          <h1 className="masthead__word" style={{ fontSize: 'calc(72px * var(--display-scale))' }}>{item.title}</h1>
          <div className="short-rule" aria-hidden="true"></div>
        </div>
      </div>
      <SectionContent item={item} onEnter={onEnter} />
    </main>
  );
}

/* ---------- Buttons ---------- */
function PrimaryButton({ label, onClick }) {
  return <button className="btn-primary" onClick={onClick}>{label}</button>;
}
function TextButton({ label, onClick, quiet }) {
  return (
    <button className={'btn-text' + (quiet ? ' btn-text--quiet' : '')} onClick={onClick}>
      {label} <span className="btn-text__arrow">→</span>
    </button>
  );
}

/* ---------- Ritual prompt ---------- */
function RitualPrompt({ num, prompt, placeholder, value, onChange }) {
  return (
    <div className="prompt">
      <div className="prompt__head">
        <span className="prompt__num">{num}</span>
        <span className="prompt__text">{prompt}</span>
      </div>
      <textarea
        className="prompt__field"
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

Object.assign(window, {
  Masthead, TocRow, SectionContent, Drawer, FullPageSection,
  PrimaryButton, TextButton, RitualPrompt, ProgressMark,
});
