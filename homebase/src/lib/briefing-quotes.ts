// Curated briefing quotes — drawn from non-dual, contemplative, and deeper
// Stoic traditions. Tone: disciplined, courageous, soulful. Selection is
// deterministic per local calendar day, so the quote is stable from morning
// to evening and rotates at midnight.

export interface BriefingQuote {
  text: string;
  source: string;
}

export const briefingQuotes: ReadonlyArray<BriefingQuote> = [
  {
    text: "The wound is the place where the Light enters you.",
    source: "Rumi",
  },
  {
    text: "Set your life on fire. Seek those who fan your flames.",
    source: "Rumi",
  },
  {
    text: "The Self, ever radiant, dances in every act of seeing, knowing, doing.",
    source: "Abhinavagupta",
  },
  {
    text: "To study the self is to forget the self. To forget the self is to be enlightened by all things.",
    source: "Dōgen",
  },
  {
    text: "If you cannot find the truth right where you are, where else do you expect to find it?",
    source: "Dōgen",
  },
  {
    text: "Your own Self-realization is the greatest service you can render the world.",
    source: "Ramana Maharshi",
  },
  {
    text: "Wisdom tells me I am nothing. Love tells me I am everything. Between the two, my life flows.",
    source: "Nisargadatta Maharaj",
  },
  {
    text: "I wish I could show you, when you are lonely or in darkness, the astonishing light of your own being.",
    source: "Hafiz",
  },
  {
    text: "Mastering others is strength; mastering yourself is true power.",
    source: "Lao Tzu",
  },
  {
    text: "Flow with whatever may happen and let your mind be free. Stay centered by accepting whatever you are doing.",
    source: "Chuang Tzu",
  },
  {
    text: "Waste no more time arguing what a good man should be. Be one.",
    source: "Marcus Aurelius",
  },
  {
    text: "Difficulties strengthen the mind, as labor does the body.",
    source: "Seneca",
  },
  {
    text: "Only to the extent that we expose ourselves over and over to annihilation can that which is indestructible in us be found.",
    source: "Pema Chödrön",
  },
  {
    text: "The essence of warriorship is refusing to give up on anyone or anything.",
    source: "Chögyam Trungpa",
  },
  {
    text: "The most precious gift we can offer anyone is our attention.",
    source: "Thich Nhat Hanh",
  },
  {
    text: "If a problem can be solved, why worry? If it cannot be solved, what use is there in worrying?",
    source: "Shantideva",
  },
  {
    text: "Wherever you are is the entry point.",
    source: "Kabir",
  },
  {
    text: "Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage.",
    source: "Rainer Maria Rilke",
  },
  {
    text: "Not knowing how near the truth is, we seek it far away — what a pity.",
    source: "Hakuin",
  },
  {
    text: "The mind unborn does not arise; it does not pass away. Stop trying to grasp it, and it is right here.",
    source: "Bankei",
  },
];

/**
 * Pick a quote deterministically from a YYYY-MM-DD key, so the same day
 * always yields the same quote and the rotation advances at midnight.
 */
export function quoteForDate(date: Date = new Date()): BriefingQuote {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // Cantor-pairing-ish mash; we just need a stable integer per day.
  const dayIndex = y * 372 + m * 31 + d;
  return briefingQuotes[dayIndex % briefingQuotes.length];
}
