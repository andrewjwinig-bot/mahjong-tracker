// Local social layer (prototype). Models a group, its members, a shared feed
// (with likes + comments), and the local user's profile — entirely on-device,
// seeded with a few demo group-mates so the feed + leaderboard feel alive.
// This is the swap point for a real backend (v2): replace these reads/writes
// with Supabase queries + auth and the UI stays identical.

import { getMeta, setMeta } from './storage';
import type { TileFace } from './tileArt';

/** A mahjong-tile avatar: your initial on a tile, a favorite suit, or a joker. */
export interface TileAvatar {
  face: TileFace;
  char?: string;
  /** Motif color (letters/dragons) + the member's accent color. */
  color: string;
}

export interface Profile {
  name: string;
  handle: string;
  bio: string;
  avatar: TileAvatar;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: TileAvatar;
  isYou: boolean;
  /** Seeded stats for demo members; for "you" these are computed live. */
  handsCleared: number;
  points: number;
}

export interface Comment {
  id: string;
  author: string;
  avatar: TileAvatar;
  text: string;
  createdAt: number;
}

/** The kinds of moments that show in the feed. 'mahj' is a called hand (the
 *  default + the bulk of the feed); the rest are celebratory milestones. */
export type FeedKind =
  | 'mahj'
  | 'game_won'
  | 'section_cleared'
  | 'card_cleared'
  | 'challenge_done'
  | 'joined';

export interface FeedPost {
  id: string;
  memberId: string;
  memberName: string;
  avatar: TileAvatar;
  /** mahj posts: the won hand in colored notation. */
  handLabel: string | null;
  note: string;
  photo: Blob | null;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  /** Event type — defaults to 'mahj' for legacy/un-typed posts. */
  kind?: FeedKind;
  /** Headline for milestone posts ("Cleared all 2025 hands", "Won game night"). */
  title?: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
}

export interface SocialState {
  group: Group;
  members: GroupMember[];
  feed: FeedPost[];
  profile: Profile;
}

const K_SEEDED = 'social.seeded.v4';
const K_GROUP = 'social.group';
const K_MEMBERS = 'social.members';
const K_FEED = 'social.feed.v4';
const K_PROFILE = 'social.profile';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const YOU_ID = 'you';

/** First letter of a name, for initial-style tile avatars. */
export function initialOf(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

export const DEFAULT_PROFILE: Profile = {
  name: 'You',
  handle: 'you',
  bio: '',
  avatar: { face: 'letter', char: 'Y', color: '#0EAD96' },
};

const DEMO_AVATARS: Record<string, TileAvatar> = {
  m_sandra: { face: 'flower', color: '#E8455F' },
  m_bev: { face: 'dragon', char: '發', color: '#1FA85B' },
  m_marsha: { face: 'bam', color: '#1FA85B' },
  m_lois: { face: 'dot', color: '#2F80ED' },
};

async function seedIfNeeded(): Promise<void> {
  if (await getMeta<boolean>(K_SEEDED, false)) return;
  const now = Date.now();

  const group: Group = { id: 'grp_demo', name: 'Tuesday Game', inviteCode: 'MAHJ-2026' };

  const profile = await getMeta<Profile>(K_PROFILE, DEFAULT_PROFILE);

  const members: GroupMember[] = [
    { id: YOU_ID, name: profile.name, avatar: profile.avatar, isYou: true, handsCleared: 0, points: 0 },
    { id: 'm_sandra', name: 'Lily', avatar: DEMO_AVATARS.m_sandra, isYou: false, handsCleared: 31, points: 845 },
    { id: 'm_bev', name: 'Nicole', avatar: DEMO_AVATARS.m_bev, isYou: false, handsCleared: 27, points: 720 },
    { id: 'm_marsha', name: 'Alison', avatar: DEMO_AVATARS.m_marsha, isYou: false, handsCleared: 24, points: 610 },
    { id: 'm_lois', name: 'Matthew', avatar: DEMO_AVATARS.m_lois, isYou: false, handsCleared: 19, points: 505 },
  ];

  const feed: FeedPost[] = [
    {
      id: 'f1', memberId: 'm_sandra', memberName: 'Lily', avatar: DEMO_AVATARS.m_sandra,
      handLabel: 'FFF 2026 222 6666', note: 'Cleared another 2026 — only 4 to go!', photo: null,
      createdAt: now - 2 * HOUR, likes: 5, likedByMe: false,
      comments: [
        { id: 'c1', author: 'Nicole', avatar: DEMO_AVATARS.m_bev, text: 'Get it girl! 🔥', createdAt: now - 1.5 * HOUR },
        { id: 'c2', author: 'Matthew', avatar: DEMO_AVATARS.m_lois, text: 'Teach me your ways', createdAt: now - 1 * HOUR },
      ],
    },
    {
      id: 'f2', memberId: 'm_bev', memberName: 'Nicole', avatar: DEMO_AVATARS.m_bev,
      handLabel: '11 333 55 777 9999', note: 'Singles night came through 🎉', photo: null,
      createdAt: now - 6 * HOUR, likes: 3, likedByMe: false,
      comments: [
        { id: 'c3', author: 'Alison', avatar: DEMO_AVATARS.m_marsha, text: 'Big points!! 👏', createdAt: now - 5 * HOUR },
      ],
    },
    {
      id: 'f3', memberId: 'm_marsha', memberName: 'Alison', avatar: DEMO_AVATARS.m_marsha,
      handLabel: 'NNNN EEE WWW SSSS', note: '', photo: null,
      createdAt: now - 1 * DAY - 3 * HOUR, likes: 2, likedByMe: false, comments: [],
    },
    {
      id: 'f4', memberId: 'm_lois', memberName: 'Matthew', avatar: DEMO_AVATARS.m_lois,
      handLabel: '333 666 6666 9999', note: 'Finally got 369!', photo: null,
      createdAt: now - 2 * DAY, likes: 7, likedByMe: false, comments: [],
    },
    // Milestone posts (typed) interleaved through the feed.
    {
      id: 'f5', memberId: 'm_sandra', memberName: 'Lily', avatar: DEMO_AVATARS.m_sandra,
      kind: 'section_cleared', title: 'Cleared every 2025 hand', handLabel: null,
      note: 'Whole section done — onto Consecutive Run!', photo: null,
      createdAt: now - 9 * HOUR, likes: 9, likedByMe: false, comments: [
        { id: 'c5', author: 'Alison', avatar: DEMO_AVATARS.m_marsha, text: 'Machine! 🙌', createdAt: now - 8 * HOUR },
      ],
    },
    {
      id: 'f6', memberId: 'm_bev', memberName: 'Nicole', avatar: DEMO_AVATARS.m_bev,
      kind: 'game_won', title: 'Won game night', handLabel: null,
      note: 'Nicole +40 · Lily +10 · Matthew −20 · Alison −30', photo: null,
      createdAt: now - 1 * DAY - 1 * HOUR, likes: 6, likedByMe: false, comments: [],
    },
    {
      id: 'f7', memberId: 'm_marsha', memberName: 'Alison', avatar: DEMO_AVATARS.m_marsha,
      kind: 'challenge_done', title: 'Finished Summer Kongs', handLabel: null,
      note: 'Season challenge complete 🏅', photo: null,
      createdAt: now - 3 * DAY, likes: 11, likedByMe: false, comments: [],
    },
    {
      id: 'f8', memberId: 'm_lois', memberName: 'Matthew', avatar: DEMO_AVATARS.m_lois,
      kind: 'card_cleared', title: 'Cleared the whole card!', handLabel: null,
      note: 'All 70 hands. Legendary. 👑', photo: null,
      createdAt: now - 4 * DAY, likes: 23, likedByMe: false, comments: [
        { id: 'c8', author: 'Lily', avatar: DEMO_AVATARS.m_sandra, text: 'ICON behavior 👑', createdAt: now - 4 * DAY + 1 * HOUR },
      ],
    },
  ];

  await Promise.all([
    setMeta(K_GROUP, group),
    setMeta(K_MEMBERS, members),
    setMeta(K_FEED, feed),
    setMeta(K_SEEDED, true),
  ]);
}

export async function loadSocial(): Promise<SocialState> {
  await seedIfNeeded();
  const [group, members, feed, profile] = await Promise.all([
    getMeta<Group>(K_GROUP, { id: 'grp_demo', name: 'Tuesday Game', inviteCode: 'MAHJ-2026' }),
    getMeta<GroupMember[]>(K_MEMBERS, []),
    getMeta<FeedPost[]>(K_FEED, []),
    getMeta<Profile>(K_PROFILE, DEFAULT_PROFILE),
  ]);
  feed.sort((a, b) => b.createdAt - a.createdAt);
  return { group, members, feed, profile };
}

export async function saveProfile(profile: Profile): Promise<void> {
  await setMeta(K_PROFILE, profile);
}

export async function addMember(member: GroupMember): Promise<void> {
  const members = await getMeta<GroupMember[]>(K_MEMBERS, []);
  members.push(member);
  await setMeta(K_MEMBERS, members);
}

export async function addFeedPost(post: FeedPost): Promise<void> {
  const feed = await getMeta<FeedPost[]>(K_FEED, []);
  feed.unshift(post);
  await setMeta(K_FEED, feed.slice(0, 200));
}

export async function toggleLike(id: string, liked: boolean): Promise<void> {
  const feed = await getMeta<FeedPost[]>(K_FEED, []);
  const p = feed.find((x) => x.id === id);
  if (p) {
    p.likedByMe = liked;
    p.likes = Math.max(0, p.likes + (liked ? 1 : -1));
  }
  await setMeta(K_FEED, feed);
}

export async function addComment(id: string, comment: Comment): Promise<void> {
  const feed = await getMeta<FeedPost[]>(K_FEED, []);
  const p = feed.find((x) => x.id === id);
  if (p) p.comments.push(comment);
  await setMeta(K_FEED, feed);
}
