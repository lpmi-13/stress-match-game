import { h } from 'preact';
import style from './style.css';

export default function Card({
	onClick,
    rhymeStatus,
	word
}) {

	return (
		<div class={style.card} data-rhyme-status={rhymeStatus}>
			<button class={style.front} onClick={onClick}>
				{word}
			</button>
			<div class={style.back}></div>
		</div>
	);
}
