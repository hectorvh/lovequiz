/** Played in order, with a short breather between tracks, looping forever. */
const PLAYLIST = [
  '/audio/accidentally-in-love.mp3',
  '/audio/viviendo-de-noche.mp3',
  '/audio/cant-take-my-eyes-off-you.mp3',
  '/audio/your-song.mp3',
  '/audio/one-day.mp3',
];
const GAP_MS = 1500;

let element: HTMLAudioElement | null = null;
let trackIndex = 0;
/** Non-null while sitting in the silence between two tracks. */
let gapTimer: number | null = null;
let waitingForGesture = false;
/** Music stays silent until Play is pressed (or the player lands mid-session). */
let musicRequested = false;
/** Pause/resume of the current track — volume is never ducked. */
let paused = false;

/**
 * A single module-level <audio> element so the playlist survives every route
 * change. Only the speaker button should ever pause it.
 */
function getElement(): HTMLAudioElement {
  if (!element) {
    element = new Audio(PLAYLIST[trackIndex]);
    element.preload = 'auto';
    element.loop = false;
    element.volume = 0.45;
    element.addEventListener('ended', queueNextTrack);
  }
  return element;
}

function queueNextTrack() {
  if (gapTimer !== null) return;

  gapTimer = window.setTimeout(() => {
    gapTimer = null;
    const nextIndex = trackIndex + 1;
    // After the last song, start the playlist again from the first track.
    trackIndex = nextIndex >= PLAYLIST.length ? 0 : nextIndex;
    const audio = getElement();
    audio.loop = false;
    audio.src = PLAYLIST[trackIndex];
    audio.currentTime = 0;
    if (!paused) playWhenAllowed(audio);
  }, GAP_MS);
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
      if (!paused && gapTimer === null) void audio.play().catch(() => undefined);
    };

    document.addEventListener('pointerdown', retry, { once: true });
    document.addEventListener('keydown', retry, { once: true });
  });
}

export function startMusic(isPaused: boolean) {
  musicRequested = true;
  paused = isPaused;
  if (paused || gapTimer !== null) return;
  playWhenAllowed(getElement());
}

export function setMuted(isPaused: boolean) {
  paused = isPaused;
  if (!musicRequested) return;
  const audio = getElement();
  if (isPaused) {
    audio.pause();
  } else if (gapTimer === null) {
    playWhenAllowed(audio);
  }
}
