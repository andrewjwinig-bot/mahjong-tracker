// Tiny, dependency-free celebration feedback: a short WebAudio arpeggio + a
// haptic buzz. Both fail silently where unsupported or blocked.

type AC = typeof AudioContext;

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
