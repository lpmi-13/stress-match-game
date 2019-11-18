import { h, Component } from 'preact';
import { route } from 'preact-router';

import { setupPath } from '../../utils';
import Card from '../../components/card';
import style from './style.css';
import { generateGridCards, stressDotMap } from '../../utils';

export default class Game extends Component {
	state = {
		correctCards: {},
		deck: generateGridCards(this.props.stress),
		flippedCards: {},
		stressToMatch: this.props.stress,
		score: 0,
		wrongCards: {},
	};

  getCardStressStatus = ({ key, values }) => {

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
		const { correctCards, flippedCards, stressToMatch, score, wrongCards } = this.state;

		this.setState({ flippedCards: { ...flippedCards, key } });
		if (values.stress === stressToMatch.stress) {
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
			route(`${setupPath()}/win`);
		}, 300);
	}

  handleLoss = () => {
	  setTimeout(() => {
	  	this.setState({
	  		correctCards: {},
	  		flippedCards: {},
	  	});
      route(`${setupPath()}/loss`);
    }, 300);
	}
				
	render(props, state) {

		return (
			<div class={style.game}>
			  <div>
				<div class={style.stressMatch}>
			      <div class={style.match}>Stress Pattern to Match:</div>
				  <div class={style.pattern}>{stressDotMap(state.stressToMatch.stress).join('')}</div>
                </div>
                <div class={style.score}>Score: {state.score} / 6</div>
			  </div>
				<div class={style.grid}>
					{state.deck.map(item => (
						<Card
						onClick={this.createCardClickListener(item)}
						stressStatus={this.getCardStressStatus(item)}
						word={item.values.word}
						/>
					))}
				</div>
			</div>
		);
	}
}
