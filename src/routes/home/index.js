
import { h, Component } from 'preact';
import { route } from 'preact-router';

import { setupPath } from '../../utils';
import style from './style.css';


export default class Home extends Component{
	select = () => {
		route(`${setupPath()}/select`);
	};

	render () {
          return (
        	<div class={style.home}>
        	  <span class={style.head}>Stress Match Game</span>
				<button class={style.button} onClick={this.select}>New Game</button>
        	</div>
          )
	}
}
