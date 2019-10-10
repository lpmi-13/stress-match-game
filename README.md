# Stress Match Game

A follow-on to the wildly successful [rhyme-match-game](https://github.com/lpmi-13/rhyme-match-game),
this uses the Academic Word List (Coxhead, 2000) as the basis for matching which
words have similar stress patterns. It uses Preact because awesome!

## patterns available in the app

The patterns are as follows:

- STRESSED, unstressed
(example: colleague)

- unstressed, STRESSED
(example: persist)

- STRESSED, unstressed, unstressed
(example: marginal)

- unstressed, STRESSED, unstressed
(example: adjacent)


## local dev
`npm start`

## production build (recommended to deploy on netlify
`npm build`


based off the work of Seif Ghezala in [this article](https://hackernoon.com/how-to-create-a-pwa-game-using-preact-in-5-steps-tutorial-c8b177037c80).

This will eventually be an offline first way for EFL students to practice identifying words that contain similar stress patterns.
