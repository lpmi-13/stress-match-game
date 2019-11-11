import collectData from './collectData';

export default function generateGridCards(stressPattern) {
  const randoArray = collectData(stressPattern);

  const shuffledRando = randoArray.sort(() => Math.random() - Math.random());

  return [...shuffledRando].map((card, idx) => ({ key: idx, values: card }));
}
