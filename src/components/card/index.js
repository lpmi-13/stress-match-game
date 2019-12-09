import { h } from 'preact';
import style from './style.css';

export default function Card({
	onClick,
	stress,
    stressStatus,
	word
}) {

	return (
		<div class={style.card} data-stress-status={stressStatus}>
			<button class={style.front} onClick={onClick}>
				{word}
			</button>
			<div class={style.back}>
				<div class={style.word}>{word}</div>
				<div>{stress}</div>
		    </div>
		</div>
	);
}
