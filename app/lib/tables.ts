// Private "tables" — the groups you actually play with. Each table has its own
// chat, a date poll for scheduling the next game, and a shared photo wall. All
// on-device for now (v2 = real backend + accounts so tables sync across phones).

import { getMeta, setMeta } from './storage';
import type { TileAvatar } from './social';

export interface TableMember {
  name: string;
  avatar: TileAvatar;
}

export interface ChatMsg {
  id: string;
  author: string;
  avatar: TileAvatar;
  text: string;
  createdAt: number;
  /** Emoji → names who reacted. Tapback-style chat reactions. */
  reactions?: Record<string, string[]>;
}

export interface PollOption {
  id: string;
  /** ISO date string (yyyy-mm-dd). */
  date: string;
  /** Optional HH:mm. */
  time?: string;
  /** Names of voters. */
  votes: string[];
}

export interface DatePoll {
  question: string;
  options: PollOption[];
}

export interface TablePhoto {
  id: string;
  photo: Blob;
  caption: string;
  author: string;
  createdAt: number;
}

export interface Table {
  id: string;
  name: string;
  icon: TileAvatar;
  inviteCode: string;
  members: TableMember[];
  messages: ChatMsg[];
  poll: DatePoll;
  photos: TablePhoto[];
}

const K_TABLES = 'tables.v6';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const A = (face: TileAvatar['face'], color: string, char?: string): TileAvatar => ({ face, color, char });

function isoInDays(days: number): string {
  const d = new Date(Date.now() + days * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function seed(): Table[] {
  const now = Date.now();
  return [
    {
      id: 't_tuesday',
      name: 'Tuesday Game',
      icon: A('crack', '#D23B4E'),
      inviteCode: 'MAHJ-2026',
      members: [
        { name: 'Lily', avatar: A('flower', '#E8455F') },
        { name: 'Nicole', avatar: A('dragon', '#1FA85B', '發') },
        { name: 'Alison', avatar: A('bam', '#1FA85B') },
        { name: 'Matthew', avatar: A('dot', '#2F80ED') },
      ],
      messages: [
        { id: 'm1', author: 'Lily', avatar: A('flower', '#E8455F'), text: 'Who’s in for this week?? 🀄', createdAt: now - 5 * HOUR },
        { id: 'm2', author: 'Nicole', avatar: A('dragon', '#1FA85B', '發'), text: 'Me! Bringing snacks 🍪', createdAt: now - 4.5 * HOUR, reactions: { '❤️': ['Lily', 'Matthew'], '🍪': ['Alison'] } },
        { id: 'm3', author: 'Matthew', avatar: A('dot', '#2F80ED'), text: 'Vote on a date below!', createdAt: now - 4 * HOUR, reactions: { '👍': ['Lily'] } },
      ],
      poll: {
        question: 'When should we play next?',
        options: [
          { id: 'p1', date: isoInDays(3), time: '19:00', votes: ['Lily', 'Nicole'] },
          { id: 'p2', date: isoInDays(5), time: '13:00', votes: ['Matthew'] },
          { id: 'p3', date: isoInDays(7), time: '19:00', votes: [] },
        ],
      },
      photos: [],
    },
    {
      id: 't_moms',
      name: 'Mahjong Moms',
      icon: A('flower', '#E84C8A'),
      inviteCode: 'MOMS-7788',
      members: [
        { name: 'Greg', avatar: A('crack', '#E8455F') },
        { name: 'Hailey', avatar: A('joker', '#7C5CE0') },
        { name: 'Avery', avatar: A('wind', '#2C3A57', '東') },
      ],
      messages: [
        { id: 'm4', author: 'Hailey', avatar: A('joker', '#7C5CE0'), text: 'Brunch + mahjong this weekend? 🥂', createdAt: now - 1 * DAY },
      ],
      poll: {
        question: 'When works for everyone?',
        options: [
          { id: 'p4', date: isoInDays(6), time: '11:00', votes: ['Hailey', 'Greg'] },
          { id: 'p5', date: isoInDays(13), time: '11:00', votes: [] },
        ],
      },
      photos: [],
    },
  ];
}

export async function loadTables(): Promise<Table[]> {
  const existing = await getMeta<Table[] | null>(K_TABLES, null);
  if (existing && existing.length) return existing;
  const seeded = seed();
  await setMeta(K_TABLES, seeded);
  return seeded;
}

export async function saveTables(tables: Table[]): Promise<void> {
  await setMeta(K_TABLES, tables);
}

// ---- Unread chat tracking ------------------------------------------------
// A per-table "last read" timestamp (localStorage) so the Tables nav can badge
// unread messages from your crew. Synchronous so marking-read is instant.
const K_READS = 'mahj.tableReads';

export function getTableReads(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(K_READS) || '{}');
  } catch {
    return {};
  }
}

/** Mark a table's chat as read up to `ts` (defaults to now). */
export function markTableRead(id: string, ts: number = Date.now()): void {
  try {
    const reads = getTableReads();
    reads[id] = Math.max(reads[id] ?? 0, ts);
    localStorage.setItem(K_READS, JSON.stringify(reads));
  } catch {
    /* ignore */
  }
}

/** Unread chat messages in a single table, excluding your own. */
export function tableUnread(t: Table, youName: string): number {
  const last = getTableReads()[t.id] ?? 0;
  return t.messages.filter((m) => m.createdAt > last && m.author !== youName).length;
}

/** Total unread chat messages across all tables, excluding your own. */
export function unreadCount(tables: Table[], youName: string): number {
  return tables.reduce((n, t) => n + tableUnread(t, youName), 0);
}

export interface NextGame {
  tableId: string;
  tableName: string;
  icon: TileAvatar;
  date: string;
  time?: string;
  votes: number;
}

/** The soonest upcoming game across the user's tables — the leading (most-voted)
 *  upcoming date per table, then the soonest of those. Used for the Feed's
 *  "next game" reminder. Returns null if nothing is on the calendar. */
export function nextGame(tables: Table[]): NextGame | null {
  const todayKey = isoInDays(0);
  let best: NextGame | null = null;
  for (const t of tables) {
    const upcoming = t.poll.options.filter((o) => o.date >= todayKey);
    if (!upcoming.length) continue;
    const lead = [...upcoming].sort(
      (a, b) => b.votes.length - a.votes.length || a.date.localeCompare(b.date),
    )[0];
    const cand: NextGame = {
      tableId: t.id,
      tableName: t.name,
      icon: t.icon,
      date: lead.date,
      time: lead.time,
      votes: lead.votes.length,
    };
    if (!best || cand.date < best.date) best = cand;
  }
  return best;
}
