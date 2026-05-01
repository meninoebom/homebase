/* data.jsx — sample content (this is a personal app, so the voice is mine, considered) */

const HORIZONS = [
  {
    id: 'values',
    num: 'i.',
    title: 'Life values',
    meta: 'PERSISTENT',
    kind: 'expand',
    lead: 'The principles by which a life is measured. Set once, rarely revised.',
    items: [
      'Devote oneself to the practice of attention.',
      'Tell the truth, especially to oneself.',
      'Build slowly. Finish what is begun.',
      'Choose people over progress.',
    ],
    updated: 'Revised winter, 2025',
  },
  {
    id: 'goals',
    num: 'ii.',
    title: 'Life goals',
    meta: 'PERSISTENT',
    kind: 'expand',
    lead: 'The horizons toward which the next decade leans.',
    items: [
      'Publish a book of essays by 2030.',
      'Move the family closer to the coast.',
      'Read every novel of George Eliot.',
      'Run a marathon — once is enough.',
    ],
    updated: 'Revised February, 2026',
  },
  {
    id: 'year',
    num: 'iii.',
    title: 'Year',
    meta: '2026',
    kind: 'expand',
    lead: 'A single page for the year — a small set of intentions, no more.',
    items: [
      'Begin a daily writing practice.',
      'Visit one museum a month.',
      'Run a half-marathon in October.',
      'Learn three Bach inventions on the piano.',
    ],
    updated: 'Drafted January 1, 2026',
    progress: { kind: 'year', value: 120, of: 365 }, // ~April 30
  },
  {
    id: 'month',
    num: 'iv.',
    title: 'Month',
    meta: 'MAY 2026',
    kind: 'expand',
    lead: 'May — the month of building.',
    items: [
      'Draft chapters one through three.',
      'Re-read Middlemarch.',
      'Plant the side garden.',
    ],
    updated: 'Set April 30, 2026',
    progress: { kind: 'month', value: 0, of: 31 },
  },
  {
    id: 'week',
    num: 'v.',
    title: 'Week',
    meta: 'WEEK 18, 2026',
    kind: 'expand',
    lead: 'Week eighteen — Monday through Sunday.',
    items: [
      'Mon — Editing pass on chapter two.',
      'Tue — Long walk; no phone.',
      'Wed — Coffee with M. at three.',
      'Thu — Quiet day; piano in the evening.',
      'Fri — Send the draft to A.',
      'Sat — Family dinner at home.',
      'Sun — Plan the week to come.',
    ],
    updated: 'Set Monday',
    progress: { kind: 'week', value: 4, of: 7, today: 4 }, // Thu = index 4 of 0..6 (Mon-start)
  },
  {
    id: 'day',
    num: 'vi.',
    title: 'Day',
    meta: 'OPEN MORNING RITUAL',
    kind: 'enter',
    accent: true,
    lead: 'Today, well begun.',
    updated: 'Thursday, April 30',
  },
];

const RITUAL_PROMPTS = [
  {
    num: 'i.',
    prompt: 'What is the single most important thing today?',
    placeholder: 'One sentence. The thing the day will be measured by.',
  },
  {
    num: 'ii.',
    prompt: 'Where might attention drift, and how will you return it?',
    placeholder: 'Name the temptation. Name the return.',
  },
  {
    num: 'iii.',
    prompt: 'For what, today, are you grateful?',
    placeholder: 'A person, a fact, a small thing.',
  },
];

const DATELINE = {
  weekday: 'THURSDAY',
  date: 'APRIL 30, 2026',
  week: 'WEEK 18',
  volume: 'VOL. I',
  issue: 'NO. 121',
};

window.HOMEBASE_DATA = { HORIZONS, RITUAL_PROMPTS, DATELINE };
