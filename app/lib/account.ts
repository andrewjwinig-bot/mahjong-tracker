// Local account + onboarding state. This is the on-device stand-in for real
// accounts — it gates first-launch onboarding and stores the player's
// experience level so the rules + tips can be tailored. A real backend (v2)
// swaps these reads/writes for authenticated API calls; passwords are NOT
// persisted on-device (they belong to the auth service).

export type Experience = 'beginner' | 'intermediate' | 'expert';

export interface Account {
  username: string;
  email: string;
  experience: Experience;
  createdAt: number;
}

const K_ACCOUNT = 'mahj.account';
const K_EXP = 'mahj.experience';

export function getAccount(): Account | null {
  try {
    const raw = localStorage.getItem(K_ACCOUNT);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export function saveAccount(a: Account): void {
  try {
    localStorage.setItem(K_ACCOUNT, JSON.stringify(a));
    localStorage.setItem(K_EXP, a.experience);
  } catch {
    /* ignore */
  }
}

// Sign out: drop the local session (the account gate). A real backend (v2)
// also clears auth tokens here. The player's game data lives in IndexedDB and
// is intentionally preserved so it re-associates when they sign back in.
export function clearAccount(): void {
  try {
    localStorage.removeItem(K_ACCOUNT);
  } catch {
    /* ignore */
  }
}

export function getExperience(): Experience {
  try {
    const e = localStorage.getItem(K_EXP) as Experience | null;
    return e === 'beginner' || e === 'intermediate' || e === 'expert' ? e : 'beginner';
  } catch {
    return 'beginner';
  }
}

export function setExperience(e: Experience): void {
  try {
    localStorage.setItem(K_EXP, e);
    const a = getAccount();
    if (a) saveAccount({ ...a, experience: e });
  } catch {
    /* ignore */
  }
}

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
};

const LEVEL_ORDER: Experience[] = ['beginner', 'intermediate', 'expert'];

/**
 * Auto-progression: as someone actually plays, their experience level advances
 * so the tips deepen — set once at onboarding, then leveled up in the
 * background (never demoted). Thresholds are gentle and tunable: a few sessions
 * in → intermediate; a regular player → expert. Based on total mahjs logged and
 * distinct card hands cleared.
 */
export function earnedLevel(current: Experience, stats: { mahjs: number; cleared: number }): Experience {
  let earned: Experience = 'beginner';
  if (stats.mahjs >= 25 || stats.cleared >= 20) earned = 'expert';
  else if (stats.mahjs >= 8 || stats.cleared >= 6) earned = 'intermediate';
  return LEVEL_ORDER.indexOf(earned) > LEVEL_ORDER.indexOf(current) ? earned : current;
}

const K_TUT = 'mahj.tut';

export function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(K_TUT) === '1';
  } catch {
    return false;
  }
}

export function setTutorialSeen(): void {
  try {
    localStorage.setItem(K_TUT, '1');
  } catch {
    /* ignore */
  }
}
