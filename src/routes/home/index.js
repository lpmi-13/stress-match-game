
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
        	  <div class={style.head}>
        	    <h2>Stress Match Game</h2>
            </div>
						<button class={style.button} onClick={this.select}>New Game</button>
        	</div>
          )
	}
}
