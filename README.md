# Stress Match Game

Stress Match is a static English-learning game for noticing word stress. Learners choose a spoken
rhythm, use a reference word to hear its shape, and find six words with the same stress pattern
before making three misses.

The word set is based on the Academic Word List (Coxhead, 2000). The application has no runtime API,
database, credentials, or server process.

## Stack

- Node.js 24 and npm 11
- Vite 8 and strict TypeScript 7
- Vitest for word-data and game-domain tests
- Playwright with axe-core for desktop, mobile, interaction, and accessibility checks
- Biome for linting and formatting

## Development

Install the Node version declared in `.nvmrc`, then run:

```sh
npm ci
npm run dev
```

Useful commands:

```sh
npm run lint       # static analysis
npm test           # unit tests
npm run test:e2e   # browser and accessibility checks
npm run build      # type-check and create dist/
npm run check      # lint, tests, build, and formatting
```

## Game behaviour

- Five two- and three-syllable stress patterns are available.
- Every round starts with one reference word and a shuffled deck of twelve words.
- Six cards match the reference pattern; six use another pattern with the same syllable count.
- Matching cards reveal the same rhythm. Other cards reveal their different rhythm.
- Finding all six matches completes the round. Three misses end it.
- A new round samples a fresh reference word and deck.
- The interface supports keyboard play, reduced-motion preferences, and small mobile screens.

## Deployment

`npm run build` creates a static site in `dist/`. Vite emits relative asset URLs so the build works at
the site root or under the existing `/stress-game/` path. `netlify.toml` configures the production
build, immutable hashed assets, and restrictive security headers.

The canonical production URL is <https://stress-match.netlify.app/>. Open Graph and Twitter
Card metadata use the committed 1200 × 630 PNG in `static/`; the adjacent SVG is its editable source.

## Project layout

```text
src/data/    Academic Word List entries grouped by stress pattern
src/domain/  deterministic deck creation and round state
src/ui/      DOM application and interaction state
tests/       Vitest data and domain checks
e2e/         Playwright interaction, mobile, and accessibility checks
```

## Licence

The application code is available under the [MIT Licence](LICENSE.txt).
