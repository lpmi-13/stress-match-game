import { h, render } from 'preact'; 
import { expect } from 'chai';

import Game from '../src/routes/game';

describe('the Game component', () => {
  it('renders the title', () => {
    const defaultProps = { 'rhyme': {"word": "say", "rhyme": "ay"}}
    const game = <Game {...defaultProps}/>;
    expect(game).to.contain('header');
  });
});
