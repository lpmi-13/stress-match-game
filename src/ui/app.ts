import { STRESS_PATTERNS, type StressPattern } from '../data/words';
import {
  PATTERN_COPY,
  StressRound,
  createPatternSelections,
  stressDescription,
  type CardSelectionResult,
  type PatternSelection,
} from '../domain/game';

const RESULT_DELAY_MS = 650;

export class StressMatchApp {
  private readonly root: HTMLElement;
  private selections = createPatternSelections();
  private selectedPattern: StressPattern = '10';
  private round: StressRound | null = null;
  private resultTimer: number | null = null;

  constructor() {
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('Missing required application root: #app');
    this.root = root;
  }

  mount(): void {
    this.renderLanding();
  }

  private renderLanding(): void {
    this.clearResultTimer();
    this.round = null;
    document.body.className = 'is-menu';
    document.title = 'Stress Match — English word-stress practice';

    this.root.innerHTML = `
      <a class="skip-link" href="#pattern-form">Skip to pattern choices</a>
      <div class="start-view">
        <main class="start-screen" id="main-content">
          <section class="start-panel" aria-labelledby="page-title">
            <header class="start-title">
              <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
              <div>
                <p>Word-stress game</p>
                <h1 id="page-title">Stress Match</h1>
              </div>
            </header>

            <p class="start-instruction">Choose the strongest beat, then find the words that match.</p>

            <form id="pattern-form">
              <fieldset class="pattern-picker">
                <legend>Choose a stress pattern</legend>
                <div class="pattern-groups">
                  <div class="pattern-group">
                    <p>Two syllables</p>
                    <div class="pattern-options pattern-options-two">
                      ${this.selections
                        .filter((selection) => selection.pattern.length === 2)
                        .map((selection) => this.patternOption(selection))
                        .join('')}
                    </div>
                  </div>
                  <div class="pattern-group">
                    <p>Three syllables</p>
                    <div class="pattern-options pattern-options-three">
                      ${this.selections
                        .filter((selection) => selection.pattern.length === 3)
                        .map((selection) => this.patternOption(selection))
                        .join('')}
                    </div>
                  </div>
                </div>
              </fieldset>

              <div class="start-action">
                <span>6 matches · 3 misses</span>
                <button type="submit">Start matching <span aria-hidden="true">→</span></button>
              </div>
            </form>

            <p class="start-source">Words adapted from the Academic Word List.</p>
          </section>
        </main>
      </div>
    `;
    resetScroll();

    const form = element<HTMLFormElement>('#pattern-form');
    form.addEventListener('change', () => {
      const value = new FormData(form).get('pattern');
      if (typeof value === 'string' && isStressPattern(value)) {
        this.selectedPattern = value;
      }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.startRound(this.selectionFor(this.selectedPattern));
    });
  }

  private patternOption(selection: PatternSelection): string {
    const copy = PATTERN_COPY[selection.pattern];
    const checked = selection.pattern === this.selectedPattern ? ' checked' : '';
    return `
      <label class="pattern-option">
        <input type="radio" name="pattern" value="${selection.pattern}"${checked} />
        <span class="pattern-option-content">
          <span class="pattern-meta">${copy.syllables}</span>
          <strong>${escapeHtml(selection.word)}</strong>
          <span class="pattern-rhythm">
            ${stressMarks(selection.pattern)}
            <small>${copy.shortName}</small>
          </span>
        </span>
      </label>
    `;
  }

  private startRound(selection: PatternSelection): void {
    this.clearResultTimer();
    this.round = new StressRound(selection);
    this.renderGame();
  }

  private renderGame(): void {
    const round = this.requireRound();
    document.body.className = 'is-playing';
    document.title = `${round.selection.word} · Stress Match`;

    this.root.innerHTML = `
      <a class="skip-link" href="#word-grid">Skip to word cards</a>
      <main class="game-screen" id="main-content" tabindex="-1">
        <header class="game-header">
          <button class="back-button" type="button" id="change-pattern">
            <span aria-hidden="true">←</span> Patterns
          </button>

          <div class="target-lockup">
            <span>Match this rhythm</span>
            <h1 id="game-title">${escapeHtml(round.selection.word)}</h1>
            ${stressMarks(round.selection.pattern)}
          </div>

          <div class="game-stats" aria-label="Round progress">
            <p><strong id="match-count">0 / 6</strong><span>matched</span></p>
            <p><strong id="miss-count">0 / 3</strong><span>misses</span></p>
          </div>
        </header>

        <section class="game-main" aria-labelledby="game-instructions">
          <h2 class="visually-hidden" id="game-instructions">Which words share this rhythm?</h2>
          <p class="feedback" id="feedback" role="status" aria-live="polite">
            Select six words with the same strong beat.
          </p>

          <div class="word-grid" id="word-grid">
            ${round.cards
              .map(
                (cardItem) => `
              <button
                class="word-card"
                type="button"
                data-card-id="${escapeHtml(cardItem.id)}"
                data-match="${String(cardItem.pattern === round.selection.pattern)}"
                aria-label="Check ${escapeHtml(cardItem.word)}"
              >
                <strong>${escapeHtml(cardItem.word)}</strong>
                <span class="card-hint" aria-hidden="true"></span>
              </button>
            `,
              )
              .join('')}
          </div>
        </section>
      </main>
    `;
    resetScroll();

    element<HTMLButtonElement>('#change-pattern').addEventListener('click', () =>
      this.returnToLanding(),
    );
    element('#word-grid').addEventListener('click', (event) => this.handleCardClick(event));
    element<HTMLElement>('.game-screen').focus({ preventScroll: true });
  }

  private handleCardClick(event: Event): void {
    const button = (event.target as Element).closest<HTMLButtonElement>('.word-card');
    if (!button || button.disabled) return;
    const cardId = button.dataset.cardId;
    if (!cardId) return;

    const result = this.requireRound().selectCard(cardId);
    if (result.kind === 'ignored') return;
    this.revealCard(button, result);
    this.updateRoundStatus(result);

    const round = this.requireRound();
    if (round.status !== 'active') {
      for (const cardButton of document.querySelectorAll<HTMLButtonElement>('.word-card')) {
        cardButton.disabled = true;
      }
      this.resultTimer = window.setTimeout(
        () => this.renderResult(),
        reducedMotion() ? 0 : RESULT_DELAY_MS,
      );
    }
  }

  private revealCard(
    button: HTMLButtonElement,
    result: Exclude<CardSelectionResult, { kind: 'ignored' }>,
  ): void {
    const isMatch = result.kind === 'match';
    button.disabled = true;
    button.dataset.state = isMatch ? 'match' : 'miss';
    button.setAttribute(
      'aria-label',
      `${result.card.word}: ${isMatch ? 'matching' : 'different'} stress pattern`,
    );
    const hint = button.querySelector<HTMLElement>('.card-hint');
    if (hint) {
      hint.innerHTML = `${stressMarks(result.card.pattern)}<span>${isMatch ? 'Same rhythm' : 'Different rhythm'}</span>`;
    }
  }

  private updateRoundStatus(result: Exclude<CardSelectionResult, { kind: 'ignored' }>): void {
    const round = this.requireRound();
    element('#match-count').textContent = `${round.matches} / 6`;
    element('#miss-count').textContent = `${round.misses} / 3`;
    const feedback = element('#feedback');

    if (result.kind === 'match') {
      feedback.textContent = `Match — ${result.card.word}.`;
      feedback.dataset.tone = 'success';
    } else {
      feedback.textContent = `Different rhythm — ${result.card.word}.`;
      feedback.dataset.tone = 'error';
    }
  }

  private renderResult(): void {
    this.resultTimer = null;
    const round = this.requireRound();
    const won = round.status === 'won';
    document.body.className = 'is-result';
    document.title = `${won ? 'Round complete' : 'Round over'} · Stress Match`;

    this.root.innerHTML = `
      <main class="result-screen" id="main-content">
        <section class="result-panel" data-result="${round.status}" aria-labelledby="result-title">
          <p class="result-kicker">${won ? 'Pattern complete' : 'Round over'}</p>
          <strong class="result-score">${round.matches} / 6</strong>
          <h1 id="result-title">${won ? 'Rhythm locked in.' : 'Try that rhythm again.'}</h1>
          <p class="result-message">
            ${
              won
                ? `You found all six words that match “${escapeHtml(round.selection.word)}”.`
                : `You found ${round.matches} matches before three misses.`
            }
          </p>

          <div class="result-actions">
            <button class="primary-action" type="button" id="play-again">
              Play again <span aria-hidden="true">↻</span>
            </button>
            <button class="text-action" type="button" id="choose-pattern">Choose another pattern</button>
          </div>
        </section>
      </main>
    `;
    resetScroll();

    element<HTMLButtonElement>('#play-again').addEventListener('click', () => {
      this.selections = createPatternSelections();
      this.startRound(this.selectionFor(this.selectedPattern));
    });
    element<HTMLButtonElement>('#choose-pattern').addEventListener('click', () => {
      this.selections = createPatternSelections();
      this.renderLanding();
    });
    element<HTMLButtonElement>('#play-again').focus({ preventScroll: true });
  }

  private returnToLanding(): void {
    this.selections = createPatternSelections();
    this.renderLanding();
  }

  private selectionFor(pattern: StressPattern): PatternSelection {
    const selection = this.selections.find((item) => item.pattern === pattern);
    if (!selection) throw new Error(`Missing selection for stress pattern ${pattern}.`);
    return selection;
  }

  private requireRound(): StressRound {
    if (!this.round) throw new Error('No stress-matching round is active.');
    return this.round;
  }

  private clearResultTimer(): void {
    if (this.resultTimer !== null) window.clearTimeout(this.resultTimer);
    this.resultTimer = null;
  }
}

function stressMarks(pattern: StressPattern): string {
  return `
    <span class="stress-marks" role="img" aria-label="${stressDescription(pattern)}">
      ${pattern
        .split('')
        .map((syllable) => `<i class="${syllable === '1' ? 'is-stressed' : ''}"></i>`)
        .join('')}
    </span>
  `;
}

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const match = document.querySelector<T>(selector);
  if (!match) throw new Error(`Missing required element: ${selector}`);
  return match;
}

function isStressPattern(value: string): value is StressPattern {
  return STRESS_PATTERNS.some((pattern) => pattern === value);
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resetScroll(): void {
  window.scrollTo({ top: 0, behavior: 'auto' });
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}
