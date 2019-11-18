import { h, Component } from 'preact';
import { route } from 'preact-router';

import { setupPath } from '../../utils';
import style from './style.css';


export default class Loss extends Component{
	startGame = () => {
		route(`${setupPath()}/select`);
	};
	
	render () {
		return (
			<div class={style.win}>
				<div class={style.head}>
					<div>You lost...</div>
				</div>
				<button class={style.button} onClick={this.startGame}>New Game</button>
			</div>
		);

	}
}
