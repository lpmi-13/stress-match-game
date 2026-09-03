// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { AudioController } from '../src/ui/audio';

describe('AudioController', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom does not implement media playback; stub it to keep test output clean.
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
  });

  it('alternates regular and slow speed on repeated plays of a word', () => {
    const controller = new AudioController();
    expect(controller.play('example').speed).toBe('regular');
    expect(controller.play('example').speed).toBe('slow');
    expect(controller.play('example').speed).toBe('regular');
    expect(controller.play('example').speed).toBe('slow');
  });

  it('tracks the play count for each word independently', () => {
    const controller = new AudioController();
    expect(controller.play('alpha').speed).toBe('regular');
    expect(controller.play('beta').speed).toBe('regular');
    expect(controller.play('alpha').speed).toBe('slow');
    expect(controller.play('beta').speed).toBe('slow');
  });

  it('resets to regular speed when the voice changes', () => {
    const controller = new AudioController();
    expect(controller.play('example').speed).toBe('regular');
    controller.setVoiceId('andrew');
    expect(controller.play('example').speed).toBe('regular');
    expect(controller.play('example').speed).toBe('slow');
  });

  it('defaults to Ava and remembers a chosen voice across instances', () => {
    expect(new AudioController().getVoiceId()).toBe('ava');
    const controller = new AudioController();
    controller.setVoiceId('sonia');
    expect(controller.getVoiceId()).toBe('sonia');
    expect(new AudioController().getVoiceId()).toBe('sonia');
  });
});
