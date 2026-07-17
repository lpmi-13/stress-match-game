import words, { STRESS_PATTERNS, type StressPattern } from '../data/words';

export interface PatternCopy {
  name: string;
  shortName: string;
  syllables: string;
}

export const PATTERN_COPY: Record<StressPattern, PatternCopy> = {
  '01': {
    name: 'Stress on the second syllable',
    shortName: 'Second syllable',
    syllables: '2 syllables',
  },
  '10': {
    name: 'Stress on the first syllable',
    shortName: 'First syllable',
    syllables: '2 syllables',
  },
  '001': {
    name: 'Stress on the third syllable',
    shortName: 'Third syllable',
    syllables: '3 syllables',
  },
  '010': {
    name: 'Stress on the middle syllable',
    shortName: 'Middle syllable',
    syllables: '3 syllables',
  },
  '100': {
    name: 'Stress on the first of three syllables',
    shortName: 'First syllable',
    syllables: '3 syllables',
  },
};

export interface PatternSelection {
  pattern: StressPattern;
  word: string;
}

export interface GameCard {
  id: string;
  pattern: StressPattern;
  word: string;
}

export type RoundStatus = 'active' | 'won' | 'lost';

export type CardSelectionResult =
  | { kind: 'match'; card: GameCard }
  | { kind: 'miss'; card: GameCard }
  | { kind: 'ignored' };

const MATCH_COUNT = 6;
const DISTRACTOR_COUNT = 6;

export function createPatternSelections(random: () => number = Math.random): PatternSelection[] {
  return STRESS_PATTERNS.map((pattern) => {
    const patternWords = words[pattern];
    const word = patternWords[randomIndex(patternWords.length, random)];
    if (!word) throw new Error(`No example is available for stress pattern ${pattern}.`);
    return { pattern, word };
  });
}

export function createDeck(
  selection: PatternSelection,
  random: () => number = Math.random,
): GameCard[] {
  const matches = words[selection.pattern].filter((word) => word !== selection.word);
  const distractorPatterns = STRESS_PATTERNS.filter(
    (pattern) => pattern !== selection.pattern && pattern.length === selection.pattern.length,
  );
  const distractorPattern = distractorPatterns[randomIndex(distractorPatterns.length, random)];

  if (matches.length < MATCH_COUNT || !distractorPattern) {
    throw new RangeError(
      `Stress pattern ${selection.pattern} does not have enough matching words.`,
    );
  }

  const distractors = words[distractorPattern];
  if (distractors.length < DISTRACTOR_COUNT) {
    throw new RangeError(`Stress pattern ${distractorPattern} does not have enough distractors.`);
  }

  const matchCards = shuffle(matches, random)
    .slice(0, MATCH_COUNT)
    .map((word, index) => card(word, selection.pattern, `match-${index}`));
  const distractorCards = shuffle(distractors, random)
    .slice(0, DISTRACTOR_COUNT)
    .map((word, index) => card(word, distractorPattern, `distractor-${index}`));

  return shuffle([...matchCards, ...distractorCards], random);
}

export class StressRound {
  readonly cards: readonly GameCard[];
  readonly selection: PatternSelection;
  readonly selectedIds = new Set<string>();
  matches = 0;
  misses = 0;
  status: RoundStatus = 'active';

  constructor(selection: PatternSelection, random: () => number = Math.random) {
    this.selection = selection;
    this.cards = createDeck(selection, random);
  }

  selectCard(cardId: string): CardSelectionResult {
    if (this.status !== 'active' || this.selectedIds.has(cardId)) return { kind: 'ignored' };

    const selected = this.cards.find((cardItem) => cardItem.id === cardId);
    if (!selected) throw new RangeError(`Unknown card: ${cardId}.`);
    this.selectedIds.add(cardId);

    if (selected.pattern === this.selection.pattern) {
      this.matches += 1;
      if (this.matches === MATCH_COUNT) this.status = 'won';
      return { kind: 'match', card: selected };
    }

    this.misses += 1;
    if (this.misses === 3) this.status = 'lost';
    return { kind: 'miss', card: selected };
  }
}

export function stressDescription(pattern: StressPattern): string {
  return PATTERN_COPY[pattern].name;
}

function card(word: string, pattern: StressPattern, id: string): GameCard {
  return { id: `${id}-${pattern}-${word}`, pattern, word };
}

function randomIndex(length: number, random: () => number): number {
  if (length < 1) throw new RangeError('Cannot choose from an empty list.');
  return Math.min(length - 1, Math.floor(random() * length));
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const shuffled = [...values];
  for (let current = shuffled.length - 1; current > 0; current -= 1) {
    const target = randomIndex(current + 1, random);
    const currentValue = shuffled[current];
    const targetValue = shuffled[target];
    if (currentValue === undefined || targetValue === undefined) {
      throw new Error('Unable to shuffle the card deck.');
    }
    shuffled[current] = targetValue;
    shuffled[target] = currentValue;
  }
  return shuffled;
}
