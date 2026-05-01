/* App.jsx — orchestrates Homebase product views */

const TOC_ITEMS = [
  { id: 'values',  num: 'i.',   title: 'Life values', meta: 'PERSISTENT',     accent: false, kind: 'expand' },
  { id: 'goals',   num: 'ii.',  title: 'Life goals',  meta: 'PERSISTENT',     accent: false, kind: 'expand' },
  { id: 'year',    num: 'iii.', title: 'Year',        meta: '2026',           accent: false, kind: 'expand' },
  { id: 'month',   num: 'iv.',  title: 'Month',       meta: 'MAY 2026',       accent: false, kind: 'expand' },
  { id: 'week',    num: 'v.',   title: 'Week',        meta: 'WEEK 18, 2026',  accent: false, kind: 'expand' },
  { id: 'day',     num: 'vi.',  title: 'Day',         meta: 'OPEN MORNING RITUAL', accent: true, kind: 'enter' },
];

const SECTION_BODY = {
  values: {
    body: 'The principles by which a life is measured. Set once, rarely revised.',
    items: ['Devote oneself to the practice of attention.', 'Tell the truth, especially to oneself.', 'Build slowly. Finish what is begun.'],
  },
  goals: {
    body: 'The horizons toward which the next decade leans.',
    items: ['Publish a book of essays by 2030.', 'Move the family closer to the coast.', 'Read every novel of George Eliot.'],
  },
  year: {
    body: 'A single page for the year — a small set of intentions, no more.',
    items: ['Begin a daily writing practice.', 'Visit one museum a month.', 'Run a half-marathon in October.'],
  },
  month: {
    body: 'May 2026 — the month of building.',
    items: ['Draft chapters one through three.', 'Re-read Middlemarch.', 'Plant the side garden.'],
  },
  week: {
    body: 'Week 18 — Monday through Sunday.',
    items: ['Mon · Editing pass on chapter two.', 'Wed · Long walk; no phone.', 'Sat · Family dinner at home.'],
  },
};

function App() {
  const [view, setView] = React.useState('home'); // 'home' | 'ritual'
  const [expanded, setExpanded] = React.useState(null);

  const onRow = (item) => {
    if (item.kind === 'enter') setView('ritual');
    else setExpanded(expanded === item.id ? null : item.id);
  };

  return (
    <div className="app">
      {view === 'home' && (
        <HomeView items={TOC_ITEMS} expanded={expanded} onRow={onRow} />
      )}
      {view === 'ritual' && (
        <RitualView onBack={() => setView('home')} />
      )}
    </div>
  );
}

function HomeView({ items, expanded, onRow }) {
  return (
    <main className="page page--home">
      <Masthead />
      <Ornament />
      <div className="toc">
        {items.map((it) => (
          <React.Fragment key={it.id}>
            <TocRow item={it} expanded={expanded === it.id} onClick={() => onRow(it)} />
            {expanded === it.id && SECTION_BODY[it.id] && (
              <SectionPanel id={it.id} />
            )}
          </React.Fragment>
        ))}
      </div>
      <footer className="page-footer">
        <div className="meta">VOL. I · NO. 4 · &copy; HOMEBASE 2026</div>
      </footer>
    </main>
  );
}

function SectionPanel({ id }) {
  const data = SECTION_BODY[id];
  return (
    <div className="section-panel">
      <p className="lead">{data.body}</p>
      <ol className="section-list">
        {data.items.map((t, i) => (
          <li key={i}>
            <span className="numeral">{['i.','ii.','iii.','iv.','v.'][i]}</span>
            <span className="section-list__text">{t}</span>
          </li>
        ))}
      </ol>
      <TextButton label="Edit this section" />
    </div>
  );
}

function RitualView({ onBack }) {
  const [answers, setAnswers] = React.useState(['', '', '']);
  const prompts = [
    'What is the single most important thing today?',
    'Where might attention drift, and how will you return it?',
    'For what, today, are you grateful?',
  ];
  return (
    <main className="page page--ritual">
      <button className="back" onClick={onBack} aria-label="Back to home">
        <span className="back__arrow">←</span>
        <span className="back__label">HOMEBASE</span>
      </button>
      <div className="ritual-head">
        <div className="eyebrow">VI · MORNING RITUAL</div>
        <h1 className="display-h">A morning, well begun.</h1>
        <div className="meta">THURSDAY · APRIL 30, 2026</div>
        <ShortRule />
      </div>
      <div className="ritual-body">
        {prompts.map((p, i) => (
          <RitualPrompt
            key={i}
            num={['i.','ii.','iii.'][i]}
            prompt={p}
            value={answers[i]}
            onChange={(v) => setAnswers(a => a.map((x, j) => j === i ? v : x))}
          />
        ))}
        <div className="ritual-actions">
          <PrimaryButton label="Complete ritual" />
        </div>
      </div>
    </main>
  );
}

window.App = App;
