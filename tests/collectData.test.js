import expect from 'chai';

import { collectData } from '../src/utils';

describe('`collectData`', () => {
    const rhyme = {'word': 'say', 'rhyme': 'ay'};

    it('returns a filtered array', () => {
        const actual = collectData(rhyme);
        expect(actual).to.not.contain(rhyme.word);
    });
});