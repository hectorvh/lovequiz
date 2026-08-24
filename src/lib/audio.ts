const MUSIC_SRC = '/audio/background.mp3';

let element: HTMLAudioElement | null = null;
let waitingForGesture = false;

/**
 * A single module-level <audio> element so the track survives every route
 * change. Only the mute toggle should ever stop it.
 */
function getElement(): HTMLAudioElement {
  if (!element) {
    element = new Audio(MUSIC_SRC);
    element.loop = true;
    element.preload = 'auto';
    element.volume = 0.45;
  }
  return element;
}

/**
 * Browsers reject autoplay until the user interacts with the page, so a failed
 * play() is retried once on the first tap or key press.
 */
function playWhenAllowed(audio: HTMLAudioElement) {
  audio.play().catch(() => {
    if (waitingForGesture) return;
    waitingForGesture = true;

    const retry = () => {
      waitingForGesture = false;
      document.removeEventListener('pointerdown', retry);
      document.removeEventListener('keydown', retry);
      if (!audio.muted) void audio.play().catch(() => undefined);
    };

    document.addEventListener('pointerdown', retry, { once: true });
    document.addEventListener('keydown', retry, { once: true });
  });
}

export function startMusic(muted: boolean) {
  const audio = getElement();
  audio.muted = muted;
  if (muted) return;
  playWhenAllowed(audio);
}

export function setMuted(muted: boolean) {
  const audio = getElement();
  audio.muted = muted;
  if (muted) {
    audio.pause();
  } else {
    playWhenAllowed(audio);
  }
}
