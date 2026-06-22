// Live game scorer — the on-device replacement for the paper scorepad people
// keep next to the table. Pure logic + localStorage persistence so a game in
// progress survives a reload. Uses the common American-mahjong payout:
//   • Self-pick (won off the wall): each of the 3 others pays 2× the hand value.
//   • Off a discard: the discarder pays 2×, the other two pay 1× each.
//   • Wall game: no exchange (recorded for history).

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Round {
  id: string;
  /** Winner id, or null for a wall game. */
  winnerId: string | null;
  handLabel: string;
  value: number;
  selfPick: boolean;
  /** Who discarded the winning tile (when not self-pick). */
  discarderId: string | null;
  deltas: Record<string, number>;
  createdAt: number;
}

export interface Game {
  players: Player[];
  rounds: Round[];
  createdAt: number;
}

const KEY = 'mahj.game';

export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as Game;
    if (!g || !Array.isArray(g.players) || g.players.length === 0) return null;
    return g;
  } catch {
    return null;
  }
}

export function saveGame(game: Game): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(game));
  } catch {
    /* ignore */
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function newGame(names: string[]): Game {
  const players = names.slice(0, 4).map((name, i) => ({
    id: `p${i}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || `Player ${i + 1}`,
    score: 0,
  }));
  return { players, rounds: [], createdAt: Date.now() };
}

export interface RoundInput {
  winnerId: string | null;
  handLabel: string;
  value: number;
  selfPick: boolean;
  discarderId: string | null;
}

/** Compute the per-player point change for a round, given the table rules. */
export function computeDeltas(players: Player[], input: RoundInput): Record<string, number> {
  const deltas: Record<string, number> = {};
  players.forEach((p) => (deltas[p.id] = 0));
  const { winnerId, value, selfPick, discarderId } = input;
  if (!winnerId || value <= 0) return deltas; // wall game / no points

  if (selfPick) {
    for (const p of players) {
      if (p.id === winnerId) continue;
      deltas[p.id] -= 2 * value;
      deltas[winnerId] += 2 * value;
    }
  } else {
    for (const p of players) {
      if (p.id === winnerId) continue;
      const pay = p.id === discarderId ? 2 * value : value;
      deltas[p.id] -= pay;
      deltas[winnerId] += pay;
    }
  }
  return deltas;
}

export function applyRound(game: Game, input: RoundInput): Game {
  const deltas = computeDeltas(game.players, input);
  const round: Round = {
    id: `r_${Date.now()}`,
    winnerId: input.winnerId,
    handLabel: input.handLabel.trim(),
    value: input.value,
    selfPick: input.selfPick,
    discarderId: input.discarderId,
    deltas,
    createdAt: Date.now(),
  };
  const players = game.players.map((p) => ({ ...p, score: p.score + (deltas[p.id] ?? 0) }));
  const next = { ...game, players, rounds: [round, ...game.rounds] };
  saveGame(next);
  return next;
}

export function undoLastRound(game: Game): Game {
  if (game.rounds.length === 0) return game;
  const [last, ...rest] = game.rounds;
  const players = game.players.map((p) => ({ ...p, score: p.score - (last.deltas[p.id] ?? 0) }));
  const next = { ...game, players, rounds: rest };
  saveGame(next);
  return next;
}

export function leaderId(players: Player[]): string | null {
  if (players.length === 0) return null;
  const max = Math.max(...players.map((p) => p.score));
  if (max <= 0) return null;
  const leaders = players.filter((p) => p.score === max);
  return leaders.length === 1 ? leaders[0].id : null;
}
