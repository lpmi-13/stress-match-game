const stressMap = {
  '0': '-',
  '1': '\u2022',
};

const stressDotMap = stressPattern =>
  stressPattern.split('').map(syllable => stressMap[syllable]);

export default stressDotMap;
