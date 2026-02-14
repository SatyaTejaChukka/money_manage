const FEEDBACK_STORAGE_KEY = 'finance-feedback-enabled';
export const FEEDBACK_CHANGE_EVENT = 'finance-feedback:changed';

let cachedAudioContext = null;

const FEEDBACK_VIBRATION = {
  tap: [12],
  refresh: [18, 12, 18],
  scrub: [8],
  approve: [20, 10, 24],
  alert: [24, 14, 24],
};

const FEEDBACK_TONES = {
  tap: [
    { frequency: 660, duration: 0.05, type: 'sine' },
    { frequency: 830, duration: 0.04, type: 'sine' },
  ],
  refresh: [
    { frequency: 480, duration: 0.06, type: 'triangle' },
    { frequency: 540, duration: 0.06, type: 'triangle' },
    { frequency: 620, duration: 0.07, type: 'triangle' },
  ],
  scrub: [{ frequency: 520, duration: 0.03, type: 'sine' }],
  approve: [
    { frequency: 520, duration: 0.05, type: 'sine' },
    { frequency: 650, duration: 0.05, type: 'sine' },
    { frequency: 780, duration: 0.08, type: 'sine' },
  ],
  alert: [
    { frequency: 360, duration: 0.08, type: 'sawtooth' },
    { frequency: 280, duration: 0.08, type: 'sawtooth' },
  ],
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function getAudioContext() {
  if (!isBrowser()) {
    return null;
  }
  if (cachedAudioContext) {
    return cachedAudioContext;
  }
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) {
    return null;
  }
  cachedAudioContext = new Context();
  return cachedAudioContext;
}

function playToneSequence(toneSequence) {
  const audioContext = getAudioContext();
  if (!audioContext || !Array.isArray(toneSequence) || toneSequence.length === 0) {
    return;
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => undefined);
  }

  let offset = 0;
  for (const tone of toneSequence) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;
    const duration = Math.max(0.02, Number(tone.duration || 0.04));
    const startAt = now + offset;
    const endAt = startAt + duration;

    oscillator.type = tone.type || 'sine';
    oscillator.frequency.setValueAtTime(Number(tone.frequency || 520), startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.05, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.01);

    offset += duration + 0.01;
  }
}

export function readFinanceFeedbackPreference() {
  if (!isBrowser()) {
    return true;
  }
  const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (raw == null) {
    return true;
  }
  return raw === '1';
}

export function writeFinanceFeedbackPreference(enabled) {
  if (!isBrowser()) {
    return;
  }
  const normalized = Boolean(enabled);
  window.localStorage.setItem(FEEDBACK_STORAGE_KEY, normalized ? '1' : '0');
  window.dispatchEvent(
    new CustomEvent(FEEDBACK_CHANGE_EVENT, {
      detail: { enabled: normalized },
    })
  );
}

export function triggerFinanceFeedback(kind = 'tap') {
  if (!isBrowser() || !readFinanceFeedbackPreference()) {
    return;
  }

  const vibrationPattern = FEEDBACK_VIBRATION[kind];
  if (navigator?.vibrate && vibrationPattern) {
    navigator.vibrate(vibrationPattern);
  }

  const toneSequence = FEEDBACK_TONES[kind] || FEEDBACK_TONES.tap;
  playToneSequence(toneSequence);
}

