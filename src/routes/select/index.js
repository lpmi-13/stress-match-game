
import { h, Component } from 'preact';
import { route } from 'preact-router';

import { setupPath, stressDotMap } from '../../utils';
import style from './style.css';
import data from '../../data/expanded-words';

const stressez = Object.keys(data);
const selectedIndex = (stressList) => Math.floor(Math.random() * Math.floor(stressList.length));

const stressSelections = () => stressez.map(stressPattern => {
	const stressezArray = data[stressPattern];
	const randomIndex = selectedIndex(stressezArray);
	const selectedWord = stressezArray[randomIndex];
	return {"word": `${selectedWord}`, "stress": `${stressPattern}`}
});

export default class Select extends Component {

  state = {
		stressSelections: stressSelections(),
	}

	startGame = (selection) => {
    this.props.onSelectStress(selection);
		route(`${setupPath()}/game`);
	};

	render() {
		return (
			<div class={style.select}>
				<div class={style.head}>
					<h2>Choose a stress pattern</h2>
				</div>
				<div class={style.stressSection}>
				{this.state.stressSelections.map((selection) =>
					<button class={style.button} onClick={() => this.startGame(selection)}><div class={style.buttonWord}>{selection.word}</div><div class={style.buttonStress}>{stressDotMap(selection.stress)}</div></button>
				)}
				</div>
			</div>
		)
	}
}
