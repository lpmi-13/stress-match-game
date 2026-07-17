import { describe, expect, it } from 'vitest';
import words, { STRESS_PATTERNS } from '../src/data/words';

describe('word data', () => {
  it('contains every supported two- and three-syllable pattern', () => {
    expect(Object.keys(words).sort()).toEqual([...STRESS_PATTERNS].sort());
  });

  it('has enough usable words to generate every round', () => {
    for (const pattern of STRESS_PATTERNS) {
      expect(words[pattern].length).toBeGreaterThanOrEqual(7);
      expect(words[pattern].every((word) => word.trim().length > 0)).toBe(true);
      expect(pattern).toMatch(/^[01]{2,3}$/);
      expect(pattern.match(/1/g)).toHaveLength(1);
    }
  });
});
