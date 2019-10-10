import { h, render } from 'preact'; 
import { expect } from 'chai';

import Home from '../src/routes/home';

describe('the Home component', () => {

  let scratch;

	beforeAll( () => {
		scratch = document.createElement('div');
		(document.body || document.documentElement).appendChild(scratch);
	});

	beforeEach( () => {
		scratch.innerHTML = '';
	});

	afterAll( () => {
		scratch.parentNode.removeChild(scratch);
		scratch = null;
	});

    describe('the Home component', () => {
      it('renders the title', () => {
        const home = <Home />;
        expect(home).to.contain(<h2>Match Game</h2>);
      });
  });
});
