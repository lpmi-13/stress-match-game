
import { h, Component } from 'preact';
import { route } from 'preact-router';
import style from './style.css';
import data from '../../data/expanded-words.js';

const rhymez = Object.keys(data);
const selectedIndex = (rhymeList) => Math.floor(Math.random() * Math.floor(rhymeList.length));

const rhymeSelections = () => rhymez.map(rhyme => {
	const rhymezArray = data[rhyme];
	const randomIndex = selectedIndex(rhymezArray);
	const selectedWord = rhymezArray[randomIndex];
	return {"word": `${selectedWord.word}`, "rhyme": `${rhyme}`}
});

export default class Select extends Component {

  state = {
		rhymeSelections: rhymeSelections(),
	}

	startGame = (selection) => {
    this.props.onSelectRhyme(selection);
		route('/rhyme-game/game');
	};

	render() {
		return (
			<div class={style.select}>
				<div class={style.head}>
					<h2>Choose a rhyme</h2>
				</div>
				<div class={style.rhymeSection}>
				{this.state.rhymeSelections.map((selection) =>
					<button class={style.button} onClick={() => this.startGame(selection)}>{selection.word}</button>
				)}
				</div>
			</div>
		)
	}
}
