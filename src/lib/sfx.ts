/**
 * Sound-effect hooks — wired but silent by design.
 *
 * No cue files exist yet. Drop MP3s at the paths below and they start playing
 * with no code change; until then every call is a silent no-op.
 */
export type SfxName = 'correct' | 'incorrect' | 'timeout';

const SOURCES: Record<SfxName, string> = {
  correct: '/audio/sfx/correct.mp3',
  incorrect: '/audio/sfx/incorrect.mp3',
  timeout: '/audio/sfx/timeout.mp3',
};

const cache = new Map<SfxName, HTMLAudioElement>();
const missing = new Set<SfxName>();

export function playSfx(name: SfxName, muted: boolean) {
  if (muted || missing.has(name)) return;

  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(SOURCES[name]);
    audio.volume = 0.6;
    audio.addEventListener('error', () => missing.add(name), { once: true });
    cache.set(name, audio);
  }

  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}
