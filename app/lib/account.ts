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
