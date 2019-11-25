import collectData from './collectData';
import shuffle from './shuffle';

export default function generateGridCards(stressPattern) {
  const randoArray = collectData(stressPattern);

  const shuffledRando = shuffle(randoArray);

  return [...shuffledRando].map((card, idx) => ({ key: idx, values: card }));
}
