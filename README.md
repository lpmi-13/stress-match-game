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
- Every word can be heard by tapping the speaker in the top-left of its card (and the reference
  word). Each repeat of the same word alternates regular and slowed-down speed.
- A settings menu switches the pronunciation voice between Ava (US), Sonia (UK), Andrew (US),
  Neerja (India), and Abeo (Nigeria); the choice is remembered in the browser.
- The interface supports keyboard play, reduced-motion preferences, and small mobile screens.

## Audio

Word pronunciations are pre-generated with [`edge-tts`](https://github.com/rany2/edge-tts) (the same
provider used in the sibling `napkin-chats` project) and normalised with `ffmpeg`. Each of the 1,241
words is rendered in five voices at two speeds (regular and ~25% slower), producing the committed
clips under `static/audio/<voice>/<word>[.slow].mp3` that Vite serves at `/audio/…`.

Generation is a one-time preparation step and requires `edge-tts` 7.3.1 or newer
(`pip install 'edge-tts>=7.3.1'`) and `ffmpeg` on the PATH:

```sh
npm run audio:generate   # synthesise + normalise any missing clips (resumable)
npm run audio:validate   # confirm every word/voice/speed clip exists
```

Raw masters land in the gitignored `generated/audio-masters/`; only the normalised `static/audio/`
clips are committed. Re-run `audio:generate` after adding words to `src/data/words.ts`; the runtime
degrades gracefully (silent) for any word without a clip.

## Deployment

`npm run build` creates a static site in `dist/`. Vite emits relative asset URLs so the build works at
the site root or under the existing `/stress-game/` path. `netlify.toml` configures the production
build, immutable hashed assets, and restrictive security headers.

The canonical production URL is <https://stress-match.netlify.app/>. Open Graph and Twitter
Card metadata use the committed 1200 × 630 PNG in `static/`; the adjacent SVG is its editable source.

## Project layout

```text
src/data/      Academic Word List entries grouped by stress pattern, and voice definitions
src/domain/    deterministic deck creation and round state
src/ui/        DOM application, interaction state, and audio playback
scripts/       audio.ts — edge-tts + ffmpeg generation and validation
static/audio/  committed, normalised pronunciation clips served at /audio/
tests/         Vitest data, domain, and audio checks
e2e/           Playwright interaction, mobile, and accessibility checks
```

## Licence

The application code is available under the [MIT Licence](LICENSE.txt).
