import { h, render } from 'preact'; 
import { expect } from 'chai';

import Loss from '../src/routes/loss';

describe('the Loss component', () => {
  it('renders the title', () => {
    const loss = <Loss />;
    expect(loss).to.contain(<div>You lost...</div>);
  });
});
