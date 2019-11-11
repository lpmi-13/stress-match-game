import data from '../data/expanded-words.js';

export default function collectData(stressPattern) {
  const stressArray = Object.keys(data);
  const stressIndex = stressArray.indexOf(stressPattern.stress);

  const firstStressArray = data[stressPattern.stress].map(word => ({
    word,
    stress: stressPattern.stress,
  }));
  // make sure the word that we "match with" isn't in the cards to click
  const filteredFirstStressArray = firstStressArray.filter(
    t => t.word !== stressPattern.word
  );

  // get a stress pattern that's not the one we selected
  let number = stressIndex;
  while (number === stressIndex) {
    number = Math.floor(Math.random() * Math.floor(stressArray.length));
  }

  const secondStressSound = stressArray[number];
  const secondStressArray = data[secondStressSound].map(word => ({
    word,
    stress: secondStressSound,
  }));

  const shuffledFirst = filteredFirstStressArray.sort(
    () => Math.random() - Math.random()
  );
  const shuffledSecond = secondStressArray.sort(
    () => Math.random() - Math.random()
  );

  return [...shuffledFirst.slice(0, 6), ...shuffledSecond.slice(0, 6)];
}
