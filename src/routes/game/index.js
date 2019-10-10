import { h, Component } from 'preact';
import { route } from 'preact-router';

import Card from '../../components/card';
import style from './style.css';
import { generateGridCards } from '../../utils';

export default class Game extends Component {
	state = {
		correctCards: {},
		deck: generateGridCards(this.props.rhyme),
		flippedCards: {},
		rhymeToMatch: this.props.rhyme,
		score: 0,
		wrongCards: {},
	};

  getCardRhymeStatus = ({ key, values }) => {

    const { correctCards, flippedCards, wrongCards } = this.state;
    if (correctCards[values.word]) {
	    return 'MATCHED';
    }
      
    if (wrongCards[values.word]) {
	    return 'UNMATCHED';
    }

    if (flippedCards[key] ){
	    return 'FLIPPED'
    }
		
		return 'DEFAULT';
  }

  createCardClickListener = item => () => {
    this.checkCardStatus(item);
  }
	
	checkCardStatus = ({ key, values }) => {
		const { correctCards, flippedCards, rhymeToMatch, score, wrongCards } = this.state;

		this.setState({ flippedCards: { ...flippedCards, key } });
		if (values.rhyme === rhymeToMatch.rhyme) {
			this.setState({
				correctCards: { ...correctCards, [values.word] : true },
				score: score + 1
			}, () => {
				this.countScore();
			});
		} else {
			this.setState({ wrongCards: { ...wrongCards, [values.word] : true },
			}, ()=> {
				 this.countMistakes();
			});
		}
	}

  countScore = () => {
		const { score } = this.state;
		if (score === 6) {
			this.handleWin();
		}
	}

	countMistakes = () => {
		const { wrongCards } = this.state;
		if (Object.keys(wrongCards).length >= 3) {
			this.handleLoss();
		}
	}

	handleWin = () => {
		setTimeout(() => {
			this.setState({
				correctCards: {},
				flippedCards: {},
			});
			route('/rhyme-game/win');
		}, 300);
	}

  handleLoss = () => {
	  setTimeout(() => {
	  	this.setState({
	  		correctCards: {},
	  		flippedCards: {},
	  	});
      route('/rhyme-game/loss');
    }, 300);
	}
				
	render(props, state) {

		return (
			<div class={style.game}>
			  <div>
			    <header class={style.match}>Rhymes with:<br/> {state.rhymeToMatch.word}</header>
			  	<header class={style.score}>Score: {state.score}</header>
			  </div>
				<div class={style.grid}>
					{state.deck.map(item => (
						<Card
						onClick={this.createCardClickListener(item)}
						rhymeStatus={this.getCardRhymeStatus(item)}
						word={item.values.word}
						/>
					))}
				</div>
			</div>
		);
	}
}
