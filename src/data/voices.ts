export interface Voice {
  /** Stable short id used in audio file paths and stored settings. */
  readonly id: string;
  /** Microsoft Edge (edge-tts) neural voice used to synthesise the audio. */
  readonly providerVoiceId: string;
  /** Short name shown in the settings menu. */
  readonly label: string;
  /** Accent description shown beside the name. */
  readonly description: string;
}

export const VOICES = [
  { id: 'ava', providerVoiceId: 'en-US-AvaNeural', label: 'Ava', description: 'American English' },
  {
    id: 'sonia',
    providerVoiceId: 'en-GB-SoniaNeural',
    label: 'Sonia',
    description: 'British English',
  },
  {
    id: 'andrew',
    providerVoiceId: 'en-US-AndrewNeural',
    label: 'Andrew',
    description: 'American English',
  },
  {
    id: 'neerja',
    providerVoiceId: 'en-IN-NeerjaNeural',
    label: 'Neerja',
    description: 'Indian English',
  },
  {
    id: 'abeo',
    providerVoiceId: 'en-NG-AbeoNeural',
    label: 'Abeo',
    description: 'Nigerian English',
  },
] as const satisfies readonly Voice[];

export type VoiceId = (typeof VOICES)[number]['id'];

export const DEFAULT_VOICE_ID: VoiceId = 'ava';

/** Playback speeds. The `suffix` is appended to the word to form the file name. */
export const SPEEDS = [
  { id: 'regular', rate: '+0%', suffix: '' },
  { id: 'slow', rate: '-25%', suffix: '.slow' },
] as const;

export type SpeedId = (typeof SPEEDS)[number]['id'];

export function isVoiceId(value: string): value is VoiceId {
  return VOICES.some((voice) => voice.id === value);
}
