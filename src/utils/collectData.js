import data from '../data/expanded-words';
import shuffle from './shuffle';

export default function collectData(stressPattern) {
  const stressArray = Object.keys(data);
  const stressIndex = stressArray.indexOf(stressPattern.stress);
  const syllablesInFirstPattern = stressPattern.stress.length;

  const firstStressArray = data[stressPattern.stress].map(word => ({
    word,
    stress: stressPattern.stress,
  }));
  // make sure the word that we "match with" isn't in the cards to click
  const filteredFirstStressArray = firstStressArray.filter(
    t => t.word !== stressPattern.word
  );

  // get a stress pattern that's not the one we selected
  // also use same number of syllables for the distractor items
  let number = stressIndex;
  let syllablesInSecondPattern = 0;
  while (number === stressIndex || syllablesInFirstPattern !== syllablesInSecondPattern) {
    number = Math.floor(Math.random() * Math.floor(stressArray.length));
    syllablesInSecondPattern = stressArray[number].length;
  }

  const secondStressSound = stressArray[number];
  const secondStressArray = data[secondStressSound].map(word => ({
    word,
    stress: secondStressSound,
  }));

  const shuffledFirst = shuffle(filteredFirstStressArray);
  const shuffledSecond = shuffle(secondStressArray);

  return [...shuffledFirst.slice(0, 6), ...shuffledSecond.slice(0, 6)];
}
