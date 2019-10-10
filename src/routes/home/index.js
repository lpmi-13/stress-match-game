
import { h, Component } from 'preact';
import { route } from 'preact-router';
import style from './style.css';


export default class Home extends Component{
	select = () => {
		route('/rhyme-game/select');
	};

	render () {
          return (
        	<div class={style.home}>
        	  <div class={style.head}>
        	    <h2>Match Game</h2>
            </div>
						<button class={style.button} onClick={this.select}>New Game</button>
        	</div>
          )
	}
}
