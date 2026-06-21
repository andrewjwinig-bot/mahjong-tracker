// Daily play streak — counts consecutive calendar days the app was opened.

export interface Streak {
  current: number;
  best: number;
  lastDay: string; // yyyy-mm-dd
}

const K = 'mahj.streak';

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function load(): Streak {
  try {
    const raw = localStorage.getItem(K);
    if (raw) return JSON.parse(raw) as Streak;
  } catch {
    /* ignore */
  }
  return { current: 0, best: 0, lastDay: '' };
}

function save(s: Streak): void {
  try {
    localStorage.setItem(K, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Record today as a play day and return the updated streak. */
export function recordPlay(date = new Date()): Streak {
  const today = ymd(date);
  const data = load();
  if (data.lastDay === today) return data; // already counted today

  const yesterday = ymd(new Date(date.getTime() - 86_400_000));
  const current = data.lastDay === yesterday ? data.current + 1 : 1;
  const next: Streak = { current, best: Math.max(data.best, current), lastDay: today };
  save(next);
  return next;
}
