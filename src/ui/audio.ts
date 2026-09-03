import { DEFAULT_VOICE_ID, SPEEDS, type SpeedId, type VoiceId, isVoiceId } from '../data/voices';

const STORAGE_KEY = 'stress-match:voice';

/**
 * Plays word pronunciations. Each successive play of the same word alternates
 * between regular and slowed-down speed (play 1 regular, play 2 slow, play 3
 * regular, and so on). The chosen voice is remembered across visits.
 */
export class AudioController {
  private voiceId: VoiceId = DEFAULT_VOICE_ID;
  private readonly playCounts = new Map<string, number>();
  private audio: HTMLAudioElement | null = null;

  constructor() {
    this.voiceId = readStoredVoice();
  }

  getVoiceId(): VoiceId {
    return this.voiceId;
  }

  setVoiceId(voiceId: VoiceId): void {
    this.voiceId = voiceId;
    try {
      localStorage.setItem(STORAGE_KEY, voiceId);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies); the voice
      // still applies for this session.
    }
  }

  /** Play `word` and report which speed was used so the UI can reflect it. */
  play(word: string): { speed: SpeedId } {
    const count = this.playCounts.get(word) ?? 0;
    this.playCounts.set(word, count + 1);
    const speed = SPEEDS[count % SPEEDS.length] ?? SPEEDS[0];
    void this.playUrl(clipUrl(this.voiceId, word, speed.suffix));
    return { speed: speed.id };
  }

  private async playUrl(url: string): Promise<void> {
    if (!this.audio) this.audio = new Audio();
    const audio = this.audio;
    try {
      audio.pause();
      audio.src = url;
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // A missing clip, an autoplay restriction, or an environment without media
      // support should never break the game.
    }
  }
}

function clipUrl(voiceId: VoiceId, word: string, suffix: string): string {
  // Resolve against the document base so the audio works whether the app is
  // served from the site root or under a sub-path (e.g. /stress-game/).
  return new URL(`audio/${voiceId}/${word}${suffix}.mp3`, document.baseURI).href;
}

function readStoredVoice(): VoiceId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isVoiceId(stored)) return stored;
  } catch {
    // Ignore storage errors and fall back to the default voice.
  }
  return DEFAULT_VOICE_ID;
}
