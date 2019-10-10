import { h } from 'preact';
import style from './style.css';

export default function Card({
	onClick,
    stressStatus,
	word
}) {

	return (
		<div class={style.card} data-stress-status={stressStatus}>
			<button class={style.front} onClick={onClick}>
				{word}
			</button>
			<div class={style.back}></div>
		</div>
	);
}
