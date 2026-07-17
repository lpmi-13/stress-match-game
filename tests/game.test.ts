import { describe, expect, it } from 'vitest';
import words from '../src/data/words';
import {
  StressRound,
  createDeck,
  createPatternSelections,
  stressDescription,
  type PatternSelection,
} from '../src/domain/game';

const selection: PatternSelection = {
  pattern: '10',
  word: words['10'][0] ?? 'colleague',
};

describe('stress-matching domain', () => {
  it('creates one example for every available stress pattern', () => {
    const selections = createPatternSelections(() => 0);

    expect(selections).toHaveLength(5);
    expect(selections.map((item) => item.pattern)).toEqual(['01', '10', '001', '010', '100']);
    expect(selections.every((item) => words[item.pattern].includes(item.word))).toBe(true);
  });

  it('builds a 12-card deck with six matches and same-length distractors', () => {
    const deck = createDeck(selection, () => 0.25);
    const matches = deck.filter((card) => card.pattern === selection.pattern);
    const distractors = deck.filter((card) => card.pattern !== selection.pattern);

    expect(deck).toHaveLength(12);
    expect(new Set(deck.map((card) => card.id)).size).toBe(12);
    expect(matches).toHaveLength(6);
    expect(distractors).toHaveLength(6);
    expect(matches.some((card) => card.word === selection.word)).toBe(false);
    expect(distractors.every((card) => card.pattern.length === selection.pattern.length)).toBe(
      true,
    );
  });

  it('counts a card once and wins after all six matches', () => {
    const round = new StressRound(selection, () => 0.25);
    const matches = round.cards.filter((card) => card.pattern === selection.pattern);
    const first = matches[0];
    if (!first) throw new Error('Expected a matching card.');

    expect(round.selectCard(first.id)).toEqual({ kind: 'match', card: first });
    expect(round.selectCard(first.id)).toEqual({ kind: 'ignored' });

    for (const card of matches.slice(1)) round.selectCard(card.id);

    expect(round.matches).toBe(6);
    expect(round.misses).toBe(0);
    expect(round.status).toBe('won');
  });

  it('ends a round after three different distractors', () => {
    const round = new StressRound(selection, () => 0.25);
    const distractors = round.cards.filter((card) => card.pattern !== selection.pattern);

    for (const card of distractors.slice(0, 3)) round.selectCard(card.id);

    expect(round.matches).toBe(0);
    expect(round.misses).toBe(3);
    expect(round.status).toBe('lost');
    expect(round.selectCard(distractors[3]?.id ?? '')).toEqual({ kind: 'ignored' });
  });

  it('rejects unknown cards while a round is active', () => {
    const round = new StressRound(selection, () => 0.25);
    expect(() => round.selectCard('not-a-card')).toThrow('Unknown card');
  });

  it('turns a pattern into a plain-language description', () => {
    expect(stressDescription('010')).toBe('Stress on the middle syllable');
  });
});
