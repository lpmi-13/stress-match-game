import { h, render } from 'preact'; 
import { expect } from 'chai';

import Win from '../src/routes/win';

describe('the Win component', () => {
  it('renders the win message', () => {
    const win = <Win />;
    expect(win).to.contain(<div>You won!</div>);
  });
});
