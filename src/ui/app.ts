import { VOICES, isVoiceId } from '../data/voices';
import { STRESS_PATTERNS, type StressPattern } from '../data/words';
import {
  PATTERN_COPY,
  StressRound,
  createPatternSelections,
  stressDescription,
  type CardSelectionResult,
  type PatternSelection,
} from '../domain/game';
import { AudioController } from './audio';

const RESULT_DELAY_MS = 650;
const PLAY_PULSE_MS = 450;

export class StressMatchApp {
  private readonly root: HTMLElement;
  private readonly audio = new AudioController();
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
            <button
              class="target-audio"
              type="button"
              id="target-audio"
              data-word="${escapeHtml(round.selection.word)}"
              aria-label="Hear ${escapeHtml(round.selection.word)}"
            >${speakerIcon()}</button>
            <h1 id="game-title">${escapeHtml(round.selection.word)}</h1>
            ${stressMarks(round.selection.pattern)}
          </div>

          <div class="header-end">
            <div class="game-stats" aria-label="Round progress">
              <p><strong id="match-count">0 / 6</strong><span>matched</span></p>
              <p><strong id="miss-count">0 / 3</strong><span>misses</span></p>
            </div>
            ${this.settingsMenu()}
          </div>
        </header>

        <section class="game-main" aria-labelledby="game-instructions">
          <h2 class="visually-hidden" id="game-instructions">Which words share this rhythm?</h2>
          <p class="feedback" id="feedback" role="status" aria-live="polite">
            Select six words with the same strong beat.
          </p>
          <p class="visually-hidden" id="audio-status" aria-live="polite"></p>

          <div class="word-grid" id="word-grid">
            ${round.cards
              .map(
                (cardItem) => `
              <div class="word-cell">
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
                <button
                  class="card-audio"
                  type="button"
                  data-word="${escapeHtml(cardItem.word)}"
                  aria-label="Hear ${escapeHtml(cardItem.word)}"
                >${speakerIcon()}</button>
              </div>
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
    element('#word-grid').addEventListener('click', (event) => this.handleGridClick(event));
    element<HTMLButtonElement>('#target-audio').addEventListener('click', (event) =>
      this.playFromButton(event.currentTarget as HTMLButtonElement),
    );
    this.bindSettings();
    element<HTMLElement>('.game-screen').focus({ preventScroll: true });
  }

  private settingsMenu(): string {
    const current = this.audio.getVoiceId();
    const options = VOICES.map(
      (voice) => `
        <label class="voice-option">
          <input type="radio" name="voice" value="${voice.id}"${
            voice.id === current ? ' checked' : ''
          } />
          <span class="voice-name">${escapeHtml(voice.label)}</span>
          <span class="voice-desc">${escapeHtml(voice.description)}</span>
        </label>`,
    ).join('');
    return `
      <details class="settings-menu" id="settings-menu">
        <summary aria-label="Voice settings" title="Voice settings">${gearIcon()}</summary>
        <div class="settings-panel">
          <fieldset class="voice-picker">
            <legend>Pronunciation voice</legend>
            ${options}
          </fieldset>
        </div>
      </details>
    `;
  }

  private bindSettings(): void {
    const menu = document.querySelector<HTMLDetailsElement>('#settings-menu');
    if (!menu) return;
    menu.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      if (input.name === 'voice' && isVoiceId(input.value)) {
        this.audio.setVoiceId(input.value);
      }
    });
    document.addEventListener('click', (event) => {
      if (menu.open && !menu.contains(event.target as Node)) {
        menu.open = false;
      }
    });
  }

  private handleGridClick(event: Event): void {
    const audioButton = (event.target as Element).closest<HTMLButtonElement>('.card-audio');
    if (audioButton) {
      this.playFromButton(audioButton);
      return;
    }
    this.handleCardClick(event);
  }

  private playFromButton(button: HTMLButtonElement): void {
    const word = button.dataset.word;
    if (!word) return;
    const { speed } = this.audio.play(word);
    const status = document.querySelector('#audio-status');
    if (status) status.textContent = speed === 'slow' ? `${word}, slower` : word;

    button.classList.add('is-playing');
    window.setTimeout(() => button.classList.remove('is-playing'), PLAY_PULSE_MS);
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

function speakerIcon(): string {
  return `
    <svg class="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M4 9.5h3.2L12 5.2v13.6L7.2 14.5H4z" />
      <path
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        d="M15.5 8.8a4.3 4.3 0 0 1 0 6.4M18 6.5a7.7 7.7 0 0 1 0 11"
      />
    </svg>
  `;
}

function gearIcon(): string {
  return `
    <svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.78 8.9a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.32.66.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.05.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.1.52.02.66-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
      />
    </svg>
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
