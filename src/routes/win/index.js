import { h, Component } from 'preact';
import { route } from 'preact-router';
import style from './style.css';


export default class Win extends Component{
	startGame = () => {
		route('/rhyme-game/select');
	};

	render () {
		return (
			<div class={style.win}>
				<div class={style.head}>
					<div>You won!</div>
				</div>
                <button class={style.button} onClick={this.startGame}>New Game</button>
			</div>
		);

	}
}
