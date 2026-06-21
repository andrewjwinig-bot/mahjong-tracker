// Tiny, dependency-free celebration feedback: a short WebAudio arpeggio + a
// haptic buzz. Both fail silently where unsupported or blocked, and respect a
// single on/off preference.

type AC = typeof AudioContext;

const K_FX = 'mahj.fx';

export function fxOn(): boolean {
  try {
    return localStorage.getItem(K_FX) !== '0';
  } catch {
    return true;
  }
}

export function setFx(on: boolean): void {
  try {
    localStorage.setItem(K_FX, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function playMahjChime(): void {
  try {
    const Ctor: AC | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    // C major arpeggio up to the octave — bright + happy.
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.085;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.42);
    });
    setTimeout(() => void ctx.close(), 1300);
  } catch {
    /* audio blocked / unsupported — no-op */
  }
}

export function buzz(): void {
  try {
    navigator.vibrate?.([14, 40, 22]);
  } catch {
    /* unsupported — no-op */
  }
}

// Shared tone-sequence player. notes: [frequency, startOffset(s), duration(s)].
function play(notes: [number, number, number][], type: OscillatorType = 'triangle'): void {
  try {
    const Ctor: AC | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    let end = 0;
    for (const [freq, at, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t = ctx.currentTime + at;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      end = Math.max(end, at + dur);
    }
    setTimeout(() => void ctx.close(), (end + 0.3) * 1000);
  } catch {
    /* audio blocked / unsupported — no-op */
  }
}

/** Big-moment fanfare — a longer ascending run (category/card clears). */
export function playFanfare(): void {
  play([
    [523.25, 0, 0.18], // C5
    [659.25, 0.1, 0.18], // E5
    [783.99, 0.2, 0.18], // G5
    [1046.5, 0.32, 0.22], // C6
    [1318.5, 0.46, 0.32], // E6
  ]);
}

/** Trophy unlocked — a bright two-note ding. */
export function playTrophy(): void {
  if (!fxOn()) return;
  play(
    [
      [987.77, 0, 0.16], // B5
      [1318.5, 0.12, 0.28], // E6
    ],
    'sine',
  );
}
