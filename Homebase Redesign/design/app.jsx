/* app.jsx — Homebase prototype root
   Two screens (Home, Morning Ritual) + Tweaks. */

const { useState, useEffect } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "default",
  "rowStyle": "inline",
  "coverLayout": "centered",
  "displayScale": "default"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);
  const [view, setView] = useState('home'); // 'home' | 'ritual' | 'fullpage'
  const [expandedId, setExpandedId] = useState(null); // for inline + drawer
  const [fullpageId, setFullpageId] = useState(null);

  const { HORIZONS, DATELINE, RITUAL_PROMPTS } = window.HOMEBASE_DATA;

  // Apply tweak attributes to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-density', tweaks.density);
    root.setAttribute('data-display', tweaks.displayScale);
  }, [tweaks.density, tweaks.displayScale]);

  const onRow = (item) => {
    if (item.kind === 'enter') {
      setView('ritual');
      return;
    }
    if (tweaks.rowStyle === 'inline') {
      setExpandedId(expandedId === item.id ? null : item.id);
    } else if (tweaks.rowStyle === 'drawer') {
      setExpandedId(item.id);
    } else {
      setFullpageId(item.id);
    }
  };

  const enterDeep = (id) => {
    if (id === 'day') setView('ritual');
    // For non-day rows we don't have a deeper page; close panel as confirmation.
    setExpandedId(null);
    setFullpageId(null);
  };

  // ---------- Render ----------
  if (view === 'ritual') {
    return (
      <div className="app">
        <RitualView prompts={RITUAL_PROMPTS} dateline={DATELINE} onBack={() => setView('home')} />
        <TweaksUi tweaks={tweaks} setTweak={setTweak} />
      </div>
    );
  }

  if (tweaks.rowStyle === 'fullpage' && fullpageId) {
    const item = HORIZONS.find(h => h.id === fullpageId);
    return (
      <div className="app">
        <FullPageSection item={item} onClose={() => setFullpageId(null)} onEnter={() => enterDeep(fullpageId)} />
        <TweaksUi tweaks={tweaks} setTweak={setTweak} />
      </div>
    );
  }

  return (
    <div className="app">
      <HomeView
        items={HORIZONS}
        dateline={DATELINE}
        coverLayout={tweaks.coverLayout}
        rowStyle={tweaks.rowStyle}
        expandedId={expandedId}
        onRow={onRow}
        onEnter={enterDeep}
        onCloseDrawer={() => setExpandedId(null)}
      />
      <TweaksUi tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

function HomeView({ items, dateline, coverLayout, rowStyle, expandedId, onRow, onEnter, onCloseDrawer }) {
  const drawerItem = (rowStyle === 'drawer' && expandedId) ? items.find(i => i.id === expandedId) : null;
  return (
    <main className="page page--home">
      <Masthead layout={coverLayout} dateline={dateline} />
      <div className="toc">
        {items.map((it) => (
          <React.Fragment key={it.id}>
            <TocRow
              item={it}
              expanded={rowStyle === 'inline' && expandedId === it.id}
              onClick={() => onRow(it)}
            />
            {rowStyle === 'inline' && expandedId === it.id && it.kind === 'expand' && (
              <div className="section-panel">
                <SectionContent item={it} onEnter={() => onEnter(it.id)} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <footer className="page-footer">
        <div className="meta">{dateline.volume} <span aria-hidden="true">·</span> {dateline.issue} <span aria-hidden="true">·</span> &copy; HOMEBASE 2026</div>
      </footer>
      {drawerItem && <Drawer item={drawerItem} onClose={onCloseDrawer} onEnter={() => onEnter(drawerItem.id)} />}
    </main>
  );
}

function RitualView({ prompts, dateline, onBack }) {
  const [answers, setAnswers] = useState(prompts.map(() => ''));
  return (
    <main className="ritual-page">
      <button className="back-link" onClick={onBack} aria-label="Back to Homebase">
        <span className="arrow">←</span> Homebase
      </button>
      <div className="ritual-head">
        <div className="eyebrow">VI <span aria-hidden="true">·</span> Morning Ritual</div>
        <h1 className="display-h">A morning, well begun.</h1>
        <div className="meta">{dateline.weekday} <span aria-hidden="true">·</span> {dateline.date}</div>
        <div className="short-rule" aria-hidden="true" style={{ marginTop: 22 }}></div>
      </div>
      <div className="ritual-body">
        {prompts.map((p, i) => (
          <RitualPrompt
            key={i}
            num={p.num}
            prompt={p.prompt}
            placeholder={p.placeholder}
            value={answers[i]}
            onChange={(v) => setAnswers(a => a.map((x, j) => j === i ? v : x))}
          />
        ))}
        <div className="ritual-actions">
          <PrimaryButton label="Complete ritual" onClick={onBack} />
        </div>
      </div>
    </main>
  );
}

/* ---------- Tweaks UI ---------- */
function TweaksUi({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Density">
        <TweakRadio
          value={tweaks.density}
          onChange={(v) => setTweak('density', v)}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'default', label: 'Default' },
            { value: 'airy',    label: 'Airy' },
          ]}
        />
      </TweakSection>
      <TweakSection title="Expanded row" subtitle="How a row reveals its contents">
        <TweakRadio
          value={tweaks.rowStyle}
          onChange={(v) => setTweak('rowStyle', v)}
          options={[
            { value: 'inline',   label: 'Inline' },
            { value: 'drawer',   label: 'Drawer' },
            { value: 'fullpage', label: 'Full page' },
          ]}
        />
      </TweakSection>
      <TweakSection title="Cover layout">
        <TweakRadio
          value={tweaks.coverLayout}
          onChange={(v) => setTweak('coverLayout', v)}
          options={[
            { value: 'centered', label: 'Centered' },
            { value: 'spread',   label: 'Spread' },
          ]}
        />
      </TweakSection>
      <TweakSection title="Display scale" subtitle="Headline contrast">
        <TweakRadio
          value={tweaks.displayScale}
          onChange={(v) => setTweak('displayScale', v)}
          options={[
            { value: 'subtle',   label: 'Subtle' },
            { value: 'default',  label: 'Default' },
            { value: 'dramatic', label: 'Dramatic' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

window.App = App;
