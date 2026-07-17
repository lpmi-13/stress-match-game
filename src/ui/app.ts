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
    document.body.className = '';
    document.title = 'Stress Match — English word-stress practice';

    this.root.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to pattern choices</a>
      <div class="site-shell">
        <header class="site-header">
          <a class="brand" href="#main-content" aria-label="Stress Match home">
            <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>Stress Match</span>
          </a>
          <span class="arcade-score" aria-hidden="true"><b>1UP</b> HI-SCORE&nbsp;00600</span>
          <a class="header-link" href="#how-to-play">How to play <span aria-hidden="true">↓</span></a>
        </header>

        <main class="landing-main" id="main-content">
          <section class="hero-copy" aria-labelledby="page-title">
            <p class="arcade-callout" aria-hidden="true">Round 01 // select your rhythm</p>
            <p class="eyebrow"><span>Arcade pronunciation practice</span> Academic Word List</p>
            <h1 id="page-title">Hear the shape.<em>Match the stress.</em></h1>
            <p class="hero-intro">
              Build an instinct for English word stress by finding six words with the same spoken
              rhythm.
            </p>

            <form id="pattern-form">
              <fieldset class="pattern-picker">
                <legend>Choose a rhythm</legend>
                <div class="pattern-options">
                  ${this.selections.map((selection) => this.patternOption(selection)).join('')}
                </div>
              </fieldset>

              <div class="start-row">
                <button class="primary-action" type="submit">
                  Start matching <span aria-hidden="true">▶</span>
                </button>
                <span id="round-summary">12 cards · find 6 matches · 3 misses allowed</span>
              </div>
            </form>
          </section>

          <aside class="rhythm-board" aria-label="Selected rhythm preview">
            <div class="board-topline">
              <span><i aria-hidden="true"></i> Rhythm monitor</span>
              <span id="preview-syllables"></span>
            </div>
            <div class="board-screen">
              <p>Reference word</p>
              <strong id="preview-word"></strong>
              <div id="preview-marks"></div>
              <span id="preview-name"></span>
            </div>
            <div class="beat-track" id="preview-beats" aria-hidden="true"></div>
            <p class="board-note">A larger beat marks the stressed syllable.</p>
          </aside>
        </main>

        <section class="how-to" id="how-to-play" aria-labelledby="how-title">
          <div>
            <p class="section-number">01</p>
            <h2 id="how-title">One rhythm.<br />Twelve words.</h2>
          </div>
          <ol>
            <li><span>Choose</span><p>Pick a two- or three-syllable stress pattern.</p></li>
            <li><span>Compare</span><p>Say each word and listen for its strongest beat.</p></li>
            <li><span>Match</span><p>Find all six matches before making three misses.</p></li>
          </ol>
        </section>

        <footer class="site-footer">
          <p>Made for focused English practice.</p>
          <p>Word set adapted from the Academic Word List (Coxhead, 2000).</p>
        </footer>
      </div>
    `;
    resetScroll();

    const form = element<HTMLFormElement>('#pattern-form');
    form.addEventListener('change', () => {
      const value = new FormData(form).get('pattern');
      if (typeof value === 'string' && isStressPattern(value)) {
        this.selectedPattern = value;
        this.updatePreview();
      }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.startRound(this.selectionFor(this.selectedPattern));
    });
    this.updatePreview();
  }

  private patternOption(selection: PatternSelection): string {
    const copy = PATTERN_COPY[selection.pattern];
    const checked = selection.pattern === this.selectedPattern ? ' checked' : '';
    return `
      <label class="pattern-option">
        <input type="radio" name="pattern" value="${selection.pattern}"${checked} />
        <span class="pattern-option-content">
          <span class="pattern-meta">${copy.syllables}<b>${selection.pattern}</b></span>
          <strong>${escapeHtml(selection.word)}</strong>
          ${stressMarks(selection.pattern)}
          <small>${copy.shortName}</small>
        </span>
      </label>
    `;
  }

  private updatePreview(): void {
    const selection = this.selectionFor(this.selectedPattern);
    const copy = PATTERN_COPY[selection.pattern];
    element('#preview-word').textContent = selection.word;
    element('#preview-marks').innerHTML = stressMarks(selection.pattern);
    element('#preview-name').textContent = copy.name;
    element('#preview-syllables').textContent = copy.syllables;
    element('#preview-beats').innerHTML = selection.pattern
      .split('')
      .map((beat) => `<i class="${beat === '1' ? 'is-strong' : ''}"></i>`)
      .join('');
  }

  private startRound(selection: PatternSelection): void {
    this.clearResultTimer();
    this.round = new StressRound(selection);
    this.renderGame();
  }

  private renderGame(): void {
    const round = this.requireRound();
    const copy = PATTERN_COPY[round.selection.pattern];
    document.body.className = 'is-playing';
    document.title = `${round.selection.word} · Stress Match`;

    this.root.innerHTML = `
      <a class="skip-link" href="#word-grid">Skip to word cards</a>
      <div class="game-screen" tabindex="-1">
        <header class="game-header">
          <a class="brand brand-light" href="#" id="game-home" aria-label="Leave this round">
            <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>Stress Match</span>
          </a>
          <span class="arcade-score game-score" aria-hidden="true"><b>1UP</b> READY!</span>

          <div class="target-lockup">
            <span>Pattern to match</span>
            <h1 id="game-title">${escapeHtml(round.selection.word)}</h1>
            ${stressMarks(round.selection.pattern)}
          </div>

          <div class="game-stats" aria-label="Round progress">
            <p><span>Matched</span><strong id="match-count">0 / 6</strong></p>
            <p><span>Misses</span><strong id="miss-count">0 / 3</strong></p>
            <button type="button" id="change-pattern">Change pattern</button>
          </div>
        </header>

        <main class="game-main">
          <div class="game-brief">
            <div>
              <p>${copy.syllables} / ${round.selection.pattern}</p>
              <h2>Which words share this rhythm?</h2>
            </div>
            <p class="feedback" id="feedback" role="status" aria-live="polite">
              Say a word aloud, then tap it to check.
            </p>
          </div>

          <div class="word-grid" id="word-grid">
            ${round.cards
              .map(
                (cardItem, index) => `
              <button
                class="word-card"
                type="button"
                data-card-id="${escapeHtml(cardItem.id)}"
                data-match="${String(cardItem.pattern === round.selection.pattern)}"
                aria-label="Check ${escapeHtml(cardItem.word)}"
              >
                <span class="card-number">${String(index + 1).padStart(2, '0')}</span>
                <strong>${escapeHtml(cardItem.word)}</strong>
                <span class="card-hint">Tap to check</span>
              </button>
            `,
              )
              .join('')}
          </div>
        </main>

        <footer class="game-footer">
          <p><span aria-hidden="true">●</span> Find all six matches</p>
          <p>${stressDescription(round.selection.pattern)}</p>
        </footer>
      </div>
    `;
    resetScroll();

    element<HTMLAnchorElement>('#game-home').addEventListener('click', (event) => {
      event.preventDefault();
      this.returnToLanding();
    });
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
      feedback.textContent = `Match — ${result.card.word} shares the same strong beat.`;
      feedback.dataset.tone = 'success';
    } else {
      feedback.textContent = `Different rhythm — listen again to ${result.card.word}.`;
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
        <div class="result-card" data-result="${round.status}">
          <div class="result-signal" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i>
          </div>
          <p class="eyebrow"><span>${won ? 'Pattern complete' : 'Round complete'}</span> ${round.selection.pattern}</p>
          <h1>${won ? 'Rhythm locked in.' : 'Reset. Listen. Try again.'}</h1>
          <p class="result-message">
            ${
              won
                ? `You found all six words that match “${escapeHtml(round.selection.word)}”.`
                : `Three words followed a different rhythm. You still found ${round.matches} of the six matches.`
            }
          </p>

          <dl class="result-stats">
            <div><dt>Matches</dt><dd>${round.matches} / 6</dd></div>
            <div><dt>Misses</dt><dd>${round.misses} / 3</dd></div>
            <div><dt>Pattern</dt><dd>${round.selection.pattern}</dd></div>
          </dl>

          <div class="result-actions">
            <button class="primary-action" type="button" id="play-again">
              Play this rhythm <span aria-hidden="true">↻</span>
            </button>
            <button class="text-action" type="button" id="choose-pattern">Choose another pattern</button>
          </div>
        </div>
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
