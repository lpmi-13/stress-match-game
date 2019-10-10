import collectData from './collectData';

export default function generateGridCards(rhyme) {
  const randoArray = collectData(rhyme);

  const shuffledRando = randoArray.sort(() => Math.random() - Math.random());

  return [...shuffledRando].map((card, idx) => ({ key: idx, values: card }));
}
