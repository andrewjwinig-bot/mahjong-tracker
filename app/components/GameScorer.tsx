'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  type Game,
  type GameResult,
  type GoalType,
  type PlayerSeed,
  type RoundInput,
  applyRound,
  clearGame,
  goalReached,
  leaderId,
  loadGame,
  loadResults,
  newGame,
  recordResult,
  undoLastRound,
} from '../lib/gameScorer';
import type { TileAvatar } from '../lib/social';
import type { MahjongCard } from '../lib/types';
import { colorNotation } from '../lib/theme';
import Avatar from './Avatar';
import { IconCheck, IconShare, IconLock } from './uiIcons';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';
import { usePro } from '../lib/usePro';
import { setPro } from '../lib/pro';
import Paywall from './Paywall';

export interface Friend {
  name: string;
  avatar: TileAvatar;
}

const PRESET_VALUES = [25, 30, 35, 40, 50];

// Free keeps the most recent game; Pro keeps the full history + rematch-any.
const FREE_HISTORY = 1;

// Leader-card sparkle ring (5 gold twinkles at fixed offsets / out-of-sync timing).
const SPARKLES: { px: number; pos: CSSProperties; dur: string; delay: string }[] = [
  { px: 16, pos: { top: -9, left: '50%', transform: 'translateX(-50%)' }, dur: '1.6s', delay: '.25s' },
  { px: 12, pos: { top: -3, right: 3 }, dur: '1.9s', delay: '0s' },
  { px: 11, pos: { top: 20, left: -6 }, dur: '2.1s', delay: '.5s' },
  { px: 9, pos: { top: 34, right: -4 }, dur: '1.9s', delay: '1s' },
  { px: 10, pos: { bottom: 16, left: 5 }, dur: '2.3s', delay: '.9s' },
];

// Two-tone gold star for the band tile (same glyph as the setup sheet header).
function BandStar() {
  return (
    <svg width="30" height="30" viewBox="0 0 100 100" style={{ display: 'block' }}>
      <path
        d="M50 13 L60 39.25 L88.04 40.64 L66.17 58.25 L73.51 85.36 L50 70 L26.49 85.36 L33.83 58.25 L11.96 40.64 L40.01 39.25 Z"
        fill="#F5A524"
      />
      <path
        d="M50 30 L55.88 44.91 L71.87 45.89 L59.51 56.09 L63.52 71.61 L50 63 L36.48 71.61 L40.49 56.09 L28.13 45.89 L44.12 44.91 Z"
        fill="#FFD874"
      />
      <circle cx="50" cy="50" r="5" fill="#C97A1A" />
    </svg>
  );
}

// 4-point gold sparkle for the leader card + the winner modal (color via
// the parent's `color`; sized by the parent box).
function Spark() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path
        d="M12 0C13.2 8.4 15.6 10.8 24 12 15.6 13.2 13.2 15.6 12 24 10.8 15.6 8.4 13.2 0 12 8.4 10.8 10.8 8.4 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

// 5-point star path — matches the design handoff's star() generator exactly.
function starPath(cx: number, cy: number, r: number, inner: number) {
  let p = '';
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? inner : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    p += (i ? 'L' : 'M') + (cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1);
  }
  return p + 'Z';
}

// Layered gold trophy star (winner-modal emblem).
function GoldStar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <path d={starPath(50, 53, 40, 17)} fill="#F5A524" />
      <path d={starPath(50, 53, 23, 10)} fill="#FFD874" />
      <circle cx="50" cy="50" r="5" fill="#C97A1A" />
    </svg>
  );
}

// Blue 1-dot tile glyph (END GAME button, left).
function DotGlyph() {
  return (
    <svg viewBox="0 0 100 100" width="19" height="19" style={{ display: 'block', color: '#2E86D4' }}>
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="11" />
      <circle cx="50" cy="50" r="12" fill="currentColor" />
    </svg>
  );
}

// Red 中 dragon tile glyph (END GAME button, right) — framed CJK glyph.
function DragonGlyph() {
  const px = 15;
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: px * 1.05,
        height: px * 1.15,
        boxSizing: 'border-box',
        border: '3px solid #C0392B',
        borderRadius: px * 0.18,
        boxShadow: 'inset 0 0 0 2.5px rgba(255,255,255,0.75)',
        fontFamily: "var(--font-display), 'Hanken Grotesk', sans-serif",
        fontWeight: 800,
        fontSize: px * 0.6,
        color: '#C0392B',
        lineHeight: 1,
      }}
    >
      中
    </span>
  );
}

export default function GameScorer({
  suggestedNames,
  friends,
  me,
  card,
  handNotes,
  onClose,
  onGameWon,
}: {
  suggestedNames: string[];
  friends: Friend[];
  /** You — seeded as player 1 with your tile (removable like a friend). */
  me?: Friend;
  card: MahjongCard;
  handNotes: Record<string, string>;
  onClose: () => void;
  onGameWon?: (result: GameResult) => void;
}) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
  const sheetRef = useRef<HTMLDivElement>(null);
  const recapRef = useRef<HTMLDivElement>(null);
  const pro = usePro();
  const [game, setGame] = useState<Game | null>(() => loadGame());
  const [results, setResults] = useState<GameResult[]>(() => loadResults());
  const [paywall, setPaywall] = useState(false);

  const visibleResults = pro ? results.slice(0, 12) : results.slice(0, FREE_HISTORY);
  const lockedCount = pro ? 0 : Math.max(0, results.length - FREE_HISTORY);

  async function shareResult(r: GameResult) {
    const line = r.players.map((p) => `${p.name} ${p.score > 0 ? '+' : ''}${p.score}`).join(' · ');
    const text = `Mahjong scorepad — ${r.winnerName ? `${r.winnerName} won` : 'tie'} over ${r.hands} hand${r.hands === 1 ? '' : 's'}: ${line}`;
    try {
      const nav = navigator as Navigator;
      if (typeof nav.share === 'function') await nav.share({ text });
      else if (nav.clipboard) await nav.clipboard.writeText(text);
    } catch {
      /* user cancelled */
    }
  }

  // ---- Setup (no game yet) ------------------------------------------------
  const initialNames = useMemo(() => {
    const base = [...suggestedNames];
    while (base.length < 4) base.push('');
    return base.slice(0, 4);
  }, [suggestedNames]);
  const [names, setNames] = useState<string[]>(initialNames);
  // The tile avatar for a seeded name: you (player 1) and any seeded friend
  // (e.g. "Score this table") start already picked with their tile — so the
  // setup opens with the crew selected, not just typed in.
  const avatarForName = useMemo(() => {
    const roster = me ? [me, ...friends] : friends;
    return (n: string) =>
      roster.find((f) => f.name.toLowerCase() === n.trim().toLowerCase())?.avatar;
  }, [me, friends]);
  // Auto-select seeded names with their tile avatar. Friends beyond the 4 slots
  // stay available under "Add from friends".
  const initialAvatars = useMemo(
    () => initialNames.map((n) => avatarForName(n)),
    [initialNames, avatarForName],
  );
  const [avatars, setAvatars] = useState<(TileAvatar | undefined)[]>(initialAvatars);
  // The seat just filled from a friend tap → play its slide-in + tile wiggle
  // once the DOM has the filled seat (see effect below).
  const [animSeat, setAnimSeat] = useState<number | null>(null);

  function setName(i: number, name: string, avatar?: TileAvatar) {
    setNames((prev) => prev.map((x, j) => (j === i ? name : x)));
    setAvatars((prev) => prev.map((x, j) => (j === i ? avatar : x)));
  }

  // Drop a friend into the first empty slot (or the last slot if full).
  function addFriend(f: Friend) {
    let slot = names.findIndex((n) => !n.trim());
    if (slot === -1) slot = 3;
    setName(slot, f.name, f.avatar);
    setAnimSeat(slot);
  }

  // Add-a-player motion (exact spec): the seat row slides in and its tile gives
  // a quick wiggle/settle. Runs after the seat renders filled.
  useEffect(() => {
    if (animSeat == null) return;
    setAnimSeat(null);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const row = document.querySelector<HTMLElement>(`[data-seat="${animSeat}"]`);
    if (!row) return;
    row.animate(
      [
        { transform: 'translateX(8px) scale(0.97)', opacity: 0.4 },
        { transform: 'translateX(-3px) scale(1.02)', opacity: 1, offset: 0.6 },
        { transform: 'translateX(0) scale(1)', opacity: 1 },
      ],
      { duration: 420, easing: 'cubic-bezier(.34,1.4,.5,1)' },
    );
    const tile = row.querySelector<HTMLElement>('[data-seattile]');
    tile?.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-4deg)', offset: 0.3 },
        { transform: 'rotate(2.5deg)', offset: 0.6 },
        { transform: 'rotate(-1deg)', offset: 0.82 },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 620, easing: 'ease-in-out' },
    );
  }, [animSeat]);

  const isOnRoster = (f: Friend) =>
    names.some((n) => n.trim().toLowerCase() === f.name.toLowerCase());
  // Only friends not yet seated show as chips — a chip disappears when added
  // and returns (in original order) when its seat is cleared.
  const availableFriends = friends.filter((f) => !isOnRoster(f));

  // Game length: 'open' running tally (default), a set number of hands, or
  // first-to-target score. Chosen on the setup screen before starting.
  const [goalType, setGoalType] = useState<GoalType>('open');
  const [handTarget, setHandTarget] = useState(8);
  const [scoreTarget, setScoreTarget] = useState(100);
  const goalTarget = goalType === 'hands' ? handTarget : scoreTarget;
  // Raw text while the target field is being edited. `null` means "not editing",
  // so the field shows the numeric goalTarget. Keeping a string here lets the user
  // clear the field to type a fresh number instead of it snapping back to 1.
  const [targetText, setTargetText] = useState<string | null>(null);

  function commitTarget(raw: string) {
    const n = Math.max(1, Math.floor(Number(raw) || 0));
    if (goalType === 'hands') setHandTarget(n);
    else setScoreTarget(n);
    setTargetText(null);
  }

  function start() {
    const seeds: PlayerSeed[] = names.map((n, i) => ({ name: n.trim() || `Player ${i + 1}`, avatar: avatars[i] }));
    setGame(newGame(seeds, { type: goalType, target: goalTarget }));
  }

  // ---- Record-a-hand form -------------------------------------------------
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [wall, setWall] = useState(false);
  const [value, setValue] = useState(25);
  const [selfPick, setSelfPick] = useState(true);
  const [discarderId, setDiscarderId] = useState<string | null>(null);
  // The hand is chosen from the card (like "Call Mahj"), not typed: a category
  // chip narrows the lines, then you check the one that won. '' category = none.
  const [handCat, setHandCat] = useState('');
  const [handPickId, setHandPickId] = useState('');
  const [endConfirm, setEndConfirm] = useState(false);

  const handLabelFor = (id: string) => {
    const h = card.hands.find((x) => x.id === id);
    return h ? handNotes[h.id] ?? h.notation : '';
  };

  function resetForm() {
    setWinnerId(null);
    setWall(false);
    setValue(25);
    setSelfPick(true);
    setDiscarderId(null);
    setHandCat('');
    setHandPickId('');
  }

  const canRecord = game && (wall || (winnerId && value > 0 && (selfPick || discarderId)));

  function record() {
    if (!game || !canRecord) return;
    const handLabel = handPickId ? handLabelFor(handPickId) : '';
    const input: RoundInput = wall
      ? { winnerId: null, handLabel: 'Wall game', value: 0, selfPick: false, discarderId: null }
      : { winnerId, handLabel, value, selfPick, discarderId: selfPick ? null : discarderId };
    const next = applyRound(game, input);
    setGame(next);
    if (!wall && winnerId) {
      const last = next.rounds[next.rounds.length - 1];
      celebrateWin(winnerId, last?.deltas?.[winnerId] ?? 0);
    }
    resetForm();
  }

  // The win moment on the scorepad (exact motion from the handoff): the winner's
  // tile flips, their card pops with a floating "+N", and a shower of gold tiles
  // rains down the screen. Imperative WAAPI; respects reduced-motion.
  function celebrateWin(wId: string, gain: number) {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const root = sheetRef.current;
    if (!root) return;
    requestAnimationFrame(() => {
      const byId = (sel: string) =>
        Array.from(root.querySelectorAll<HTMLElement>(`[${sel}]`)).find(
          (el) => el.getAttribute(sel) === wId,
        );
      const tile = byId('data-sptile');
      if (tile) {
        tile.style.transformStyle = 'preserve-3d';
        tile.animate(
          [
            { transform: 'rotateY(0deg) scale(1)' },
            { transform: 'rotateY(180deg) scale(1.18)', offset: 0.45 },
            { transform: 'rotateY(360deg) scale(1.06)', offset: 0.8 },
            { transform: 'rotateY(360deg) scale(1)' },
          ],
          { duration: 780, easing: 'cubic-bezier(.34,1.4,.5,1)' },
        );
      }
      const card = byId('data-spcard');
      if (card) {
        card.animate(
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: 'translateY(-9px) scale(1.05)', offset: 0.4 },
            { transform: 'translateY(-4px) scale(1)' },
          ],
          { duration: 720, easing: 'cubic-bezier(.34,1.5,.5,1)' },
        );
        if (gain > 0) {
          const f = document.createElement('div');
          f.textContent = '+' + gain;
          f.className = 'sp-floatpts';
          card.appendChild(f);
          f.animate(
            [
              { transform: 'translate(-50%,0) scale(.6)', opacity: 0 },
              { transform: 'translate(-50%,-24px) scale(1.1)', opacity: 1, offset: 0.4 },
              { transform: 'translate(-50%,-54px) scale(1)', opacity: 0 },
            ],
            { duration: 1200, easing: 'ease-out' },
          ).onfinish = () => f.remove();
        }
      }
      goldRain();
    });
  }

  // 26 gold mahjong tiles falling past the bottom of the screen.
  function goldRain() {
    const layer = document.createElement('div');
    layer.className = 'gold-rain';
    document.body.appendChild(layer);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const glyphs = ['中', '發', '東', '南', '西', '北', '花'];
    for (let i = 0; i < 26; i++) {
      const w = 15 + Math.round(Math.random() * 10);
      const h = Math.round(w * 1.34);
      const t = document.createElement('div');
      const x = Math.random() * (W - w);
      const g = glyphs[Math.floor(Math.random() * glyphs.length)];
      t.className = 'gold-tile';
      t.style.cssText = `left:${x.toFixed(0)}px;top:${-h - 10}px;width:${w}px;height:${h}px`;
      t.innerHTML = `<span style="font-size:${Math.round(h * 0.56)}px">${g}</span>`;
      layer.appendChild(t);
      const sway = (Math.random() - 0.5) * 60;
      const rot = (Math.random() - 0.5) * 700;
      const dur = 1500 + Math.random() * 1200;
      const delay = Math.random() * 500;
      t.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
          {
            transform: `translate(${(sway * 0.4).toFixed(0)}px,${Math.round(H * 0.28)}px) rotate(${(rot * 0.3).toFixed(0)}deg)`,
            opacity: 1,
            offset: 0.12,
          },
          {
            transform: `translate(${sway.toFixed(0)}px,${H + h + 22}px) rotate(${rot.toFixed(0)}deg)`,
            opacity: 1,
            offset: 0.85,
          },
          {
            transform: `translate(${sway.toFixed(0)}px,${H + h + 44}px) rotate(${rot.toFixed(0)}deg)`,
            opacity: 0,
          },
        ],
        { duration: dur, delay, easing: 'cubic-bezier(.3,.5,.45,1)' },
      );
    }
    setTimeout(() => layer.remove(), 3200);
  }

  // Winner-modal confetti (exact port): ~half gold mahjong tiles, half colored
  // chips, rained over the modal card. Clipped to the modal root (overflow:hidden).
  function recapConfetti(root: HTMLElement | null) {
    if (!root) return;
    const W = root.clientWidth;
    const H = root.clientHeight;
    const glyphs = ['中', '發', '東', '南', '西', '北', '花'];
    const cols = ['#C0392B', '#2E86D4', '#1F8A5B', '#E2568F', '#F5A524'];
    for (let i = 0; i < 34; i++) {
      const tile = Math.random() < 0.5;
      const w = tile ? 14 + Math.round(Math.random() * 9) : 7 + Math.round(Math.random() * 5);
      const h = tile ? Math.round(w * 1.34) : 11 + Math.round(Math.random() * 7);
      const el = document.createElement('div');
      const x = Math.random() * (W - w);
      if (tile) {
        const g = glyphs[Math.floor(Math.random() * glyphs.length)];
        el.style.cssText = `position:absolute;left:${x.toFixed(0)}px;top:${-h - 12}px;width:${w}px;height:${h}px;border-radius:3.5px;background:linear-gradient(158deg,#FCE3A0,#F5A524 55%,#D88E12);border:1px solid rgba(120,82,10,0.5);box-shadow:0 2px 6px rgba(60,40,6,.35),inset 0 1px 0 rgba(255,248,220,.85);display:flex;align-items:center;justify-content:center;z-index:80;pointer-events:none;will-change:transform,opacity`;
        el.innerHTML = `<span style="font-family:serif;font-weight:700;font-size:${Math.round(h * 0.56)}px;line-height:1;color:#5A3D08">${g}</span>`;
      } else {
        const c = cols[Math.floor(Math.random() * cols.length)];
        el.style.cssText = `position:absolute;left:${x.toFixed(0)}px;top:${-h - 12}px;width:${w}px;height:${h}px;border-radius:2px;background:${c};box-shadow:0 1px 3px rgba(0,0,0,.25);z-index:80;pointer-events:none;will-change:transform,opacity`;
      }
      root.appendChild(el);
      const sway = (Math.random() - 0.5) * 70;
      const rot = (Math.random() - 0.5) * 760;
      const dur = 1700 + Math.random() * 1300;
      const delay = Math.random() * 620;
      el.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
          {
            transform: `translate(${(sway * 0.4).toFixed(0)}px,${Math.round(H * 0.28)}px) rotate(${(rot * 0.3).toFixed(0)}deg)`,
            opacity: 1,
            offset: 0.12,
          },
          {
            transform: `translate(${sway.toFixed(0)}px,${H + h + 24}px) rotate(${rot.toFixed(0)}deg)`,
            opacity: 1,
            offset: 0.85,
          },
          {
            transform: `translate(${sway.toFixed(0)}px,${H + h + 48}px) rotate(${rot.toFixed(0)}deg)`,
            opacity: 0,
          },
        ],
        { duration: dur, delay, easing: 'cubic-bezier(.3,.5,.45,1)' },
      ).onfinish = () => el.remove();
    }
  }

  function undo() {
    if (game) setGame(undoLastRound(game));
  }

  function endGame() {
    if (!game) return;
    const hadRounds = game.rounds.length > 0;
    if (hadRounds) {
      const result = recordResult(game);
      setResults(loadResults());
      onGameWon?.(result);
    }
    clearGame();
    setGame(null);
    resetForm();
    setEndConfirm(false);
    setShowGameOver(false);
    // A finished game is already saved to history → close back to the feed. An
    // empty game just drops back to the seeded setup. (To play again with the
    // same crew, the setup's Recent games list has a one-tap Rematch.)
    if (hadRounds) {
      onClose();
    } else {
      setNames(initialNames);
      setAvatars(initialAvatars);
    }
  }

  function rematch(r: GameResult) {
    const ns = r.players.map((p) => p.name).slice(0, 4);
    while (ns.length < 4) ns.push('');
    setNames(ns);
    setAvatars(ns.map((n) => avatarForName(n)));
  }

  const lead = game ? leaderId(game.players) : null;
  const nameOf = (id: string | null) => game?.players.find((p) => p.id === id)?.name ?? '';
  // Goal tracking for an in-progress game: progress line + a "game over" banner
  // once the chosen target (hands played, or first-to-score) is reached.
  const done = !!game && goalReached(game);
  const winnerName = lead ? nameOf(lead) : null;
  const youWon =
    !!winnerName && !!me && winnerName.trim().toLowerCase() === me.name.trim().toLowerCase();
  const goalSub = game?.goal
    ? game.goal.type === 'hands'
      ? `${Math.min(game.rounds.length, game.goal.target)} / ${game.goal.target} hands`
      : `First to ${game.goal.target}`
    : `${game?.rounds.length ?? 0} hand${game?.rounds.length === 1 ? '' : 's'} played`;
  // Final standings (high → low) for the game-over modal.
  const ranked = game ? [...game.players].sort((a, b) => b.score - a.score) : [];

  // The win moment: when the chosen goal is first reached, pop the celebratory
  // Winner modal. Re-arms if a hand is undone back below the goal.
  const [showGameOver, setShowGameOver] = useState(false);
  // After a game is saved, offer a one-tap rematch with the same crew.
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (done && !celebratedRef.current) {
      celebratedRef.current = true;
      setShowGameOver(true);
    } else if (!done) {
      celebratedRef.current = false;
    }
  }, [done]);

  // Rain confetti over the Winner modal while it's open: a burst on appear, then
  // a couple of loops (gated on reduced-motion).
  useEffect(() => {
    if (!showGameOver) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const fire = () => recapConfetti(recapRef.current);
    const t = setTimeout(fire, 400);
    const iv = setInterval(fire, 3400);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGameOver]);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        ref={sheetRef}
        className="sheet scorer"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        {!game ? (
          <>
            <div className="scorer-band">
              <span className="grab light" />
              <span className="scorer-band-tile" aria-hidden>
                <svg width="30" height="30" viewBox="0 0 100 100" style={{ display: 'block' }}>
                  <path
                    d="M50 13 L60 39.25 L88.04 40.64 L66.17 58.25 L73.51 85.36 L50 70 L26.49 85.36 L33.83 58.25 L11.96 40.64 L40.01 39.25 Z"
                    fill="#F5A524"
                  />
                  <path
                    d="M50 30 L55.88 44.91 L71.87 45.89 L59.51 56.09 L63.52 71.61 L50 63 L36.48 71.61 L40.49 56.09 L28.13 45.89 L44.12 44.91 Z"
                    fill="#FFD874"
                  />
                  <circle cx="50" cy="50" r="5" fill="#C97A1A" />
                </svg>
              </span>
              <div className="scorer-band-kicker">LIVE SCORING</div>
              <div className="scorer-band-title">Score a Game</div>
              <div className="scorer-band-sub">
                Track a live game — who won, the hand value &amp; the payouts.
              </div>
            </div>

            <div className="scorer-label">PLAYERS</div>
            <div className="seat-list">
              {names.map((n, i) => {
                const filled = !!avatars[i];
                return (
                  <div key={i} className="seat-row" data-seat={i}>
                    {filled ? (
                      <span className="seat-av" data-seattile>
                        <Avatar avatar={avatars[i]!} size={46} />
                      </span>
                    ) : (
                      <span className="seat-tile-empty">{i + 1}</span>
                    )}
                    {filled ? (
                      <span className="seat-field" data-filled="true">
                        {n}
                      </span>
                    ) : (
                      <input
                        className="seat-field-input"
                        value={n}
                        maxLength={20}
                        placeholder={`Player ${i + 1}`}
                        onChange={(e) => setName(i, e.target.value, undefined)}
                      />
                    )}
                    {filled && (
                      <button
                        className="seat-clear"
                        aria-label={`Remove ${n}`}
                        onClick={() => setName(i, '', undefined)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {availableFriends.length > 0 && (
              <>
                <div className="scorer-label">ADD FROM FRIENDS</div>
                <div className="friend-chips">
                  {availableFriends.map((f) => (
                    <button
                      key={f.name}
                      className="friend-chip2"
                      onClick={() => addFriend(f)}
                    >
                      <span className="friend-chip-tile">
                        <Avatar avatar={f.avatar} size={20} />
                      </span>
                      <span className="friend-chip-name">{f.name}</span>
                      <span className="friend-chip-plus">+</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="scorer-label">GAME LENGTH</div>
            <div className="len-seg">
              <button className="len-seg-btn" data-active={goalType === 'open'} onClick={() => { setTargetText(null); setGoalType('open'); }}>
                OPEN
              </button>
              <button className="len-seg-btn" data-active={goalType === 'hands'} onClick={() => { setTargetText(null); setGoalType('hands'); }}>
                # HANDS
              </button>
              <button className="len-seg-btn" data-active={goalType === 'score'} onClick={() => { setTargetText(null); setGoalType('score'); }}>
                FIRST TO…
              </button>
            </div>
            {goalType !== 'open' && (
              <>
                <div className="picker-row" style={{ marginTop: 10 }}>
                  {(goalType === 'hands' ? [4, 8, 12, 16] : [50, 100, 150, 200]).map((v) => (
                    <button
                      key={v}
                      className="pick-chip"
                      data-active={targetText === null && goalTarget === v}
                      onClick={() => {
                        setTargetText(null);
                        if (goalType === 'hands') setHandTarget(v);
                        else setScoreTarget(v);
                      }}
                    >
                      {v}
                    </button>
                  ))}
                  <input
                    className="field"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    style={{ maxWidth: 84 }}
                    value={targetText ?? String(goalTarget)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setTargetText(raw);
                      // Only push a valid number into state; leave it alone while the
                      // field is empty or mid-edit so the user can retype freely.
                      const n = Math.floor(Number(raw));
                      if (raw !== '' && Number.isFinite(n) && n >= 1) {
                        if (goalType === 'hands') setHandTarget(n);
                        else setScoreTarget(n);
                      }
                    }}
                    onBlur={(e) => commitTarget(e.target.value)}
                  />
                </div>
                <p className="len-hint">
                  {goalType === 'hands'
                    ? `Play ${goalTarget} hands, then the highest score wins.`
                    : `First to ${goalTarget} points wins.`}
                </p>
              </>
            )}

            <button className="score-cta start-cta" onClick={start}>
              <span className="score-cta-shine" aria-hidden />
              <span className="score-cta-tile cta-tile-l" style={{ color: '#C0392B' }}>萬</span>
              <span className="score-cta-label">START GAME</span>
              <span className="score-cta-tile cta-tile-r" style={{ color: '#15803D' }}>發</span>
            </button>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={onClose}>
              Cancel
            </button>

            {results.length > 0 && (
              <>
                <div className="set-section">Recent games</div>
                <div className="round-list">
                  {visibleResults.map((r) => (
                    <div className="round-row" key={r.id}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="round-title">
                          {r.winnerName ? `${r.winnerName} won` : 'Tie game'}
                          {` · ${r.hands} hand${r.hands === 1 ? '' : 's'}`}
                        </div>
                        <div className="round-sub">
                          {new Date(r.endedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          · {r.players.map((p) => `${p.name} ${p.score > 0 ? '+' : ''}${p.score}`).join(', ')}
                        </div>
                      </div>
                      {pro && (
                        <button
                          className="icon-btn"
                          aria-label="Share result"
                          style={{ flex: '0 0 auto' }}
                          onClick={() => shareResult(r)}
                        >
                          <IconShare size={16} />
                        </button>
                      )}
                      <button
                        className="pick-chip"
                        style={{ flex: '0 0 auto' }}
                        onClick={() => rematch(r)}
                      >
                        Rematch
                      </button>
                    </div>
                  ))}
                </div>

                {lockedCount > 0 && (
                  <button className="locked-history" onClick={() => setPaywall(true)}>
                    <span className="lh-ic" aria-hidden>
                      <IconLock size={18} />
                    </span>
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      <span className="lh-title">
                        {lockedCount} more game{lockedCount === 1 ? '' : 's'} saved
                      </span>
                      <span className="lh-sub">
                        Go VIP to keep your full history, rematch any game &amp; share scorecards.
                      </span>
                    </span>
                    <span className="lh-cta">Unlock</span>
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="scorer-band">
              <span className="grab light" />
              <span className="scorer-band-tile" aria-hidden>
                <BandStar />
              </span>
              <div className="scorer-band-kicker">LIVE GAME</div>
              <div className="scorer-band-title">Scorepad</div>
              <div className="scorer-band-sub">{goalSub}</div>
            </div>

            {/* Scoreboard */}
            <div className="sp-board">
              {game.players.map((p, i) => {
                const isLead = p.id === lead && game.rounds.length > 0 && p.score > 0;
                return (
                  <div className="sp-card" key={p.id} data-lead={isLead} data-spcard={p.id}>
                    {isLead && (
                      <span className="sp-sparkles" aria-hidden>
                        {SPARKLES.map((s, k) => (
                          <span
                            key={k}
                            className="sp-spark"
                            style={{ width: s.px, height: s.px, animationDuration: s.dur, animationDelay: s.delay, ...s.pos }}
                          >
                            <Spark />
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="sp-tile" data-sptile={p.id}>
                      {p.avatar ? (
                        <Avatar avatar={p.avatar} size={40} />
                      ) : (
                        <span className="sp-tile-num">{i + 1}</span>
                      )}
                    </span>
                    <div className="sp-name">{p.name}</div>
                    <div className="sp-score" data-neg={p.score < 0} data-zero={p.score === 0}>
                      {p.score > 0 ? '+' : ''}
                      {p.score}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Record a hand */}
            <div className="scorer-label" style={{ marginTop: 4 }}>RECORD A HAND</div>

            <div className="sp-sublabel">Who won?</div>
            <div className="sp-who-grid">
              {game.players.map((p) => (
                <button
                  key={p.id}
                  className="sp-who-btn"
                  data-active={!wall && winnerId === p.id}
                  onClick={() => {
                    setWall(false);
                    setWinnerId(p.id);
                    if (discarderId === p.id) setDiscarderId(null);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              className="sp-who-wall"
              data-active={wall}
              onClick={() => {
                setWall(true);
                setWinnerId(null);
              }}
            >
              Wall (no win)
            </button>

            {!wall && (
              <>
                <div className="sp-sublabel" style={{ marginTop: 16 }}>Hand value</div>
                <div className="sp-vals">
                  {PRESET_VALUES.map((v) => (
                    <button
                      key={v}
                      className="sp-val"
                      data-active={value === v}
                      onClick={() => setValue(v)}
                    >
                      {v}
                    </button>
                  ))}
                  <input
                    className="sp-valbox"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    aria-label="Custom hand value"
                    value={value}
                    onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>

                <div className="sp-sublabel" style={{ marginTop: 16 }}>How did they win?</div>
                <div className="len-seg">
                  <button className="len-seg-btn" data-active={selfPick} onClick={() => setSelfPick(true)}>
                    OFF THE WALL
                  </button>
                  <button className="len-seg-btn" data-active={!selfPick} onClick={() => setSelfPick(false)}>
                    OFF A DISCARD
                  </button>
                </div>
                <p style={{ color: '#8c9690', fontSize: 12, fontWeight: 600, margin: '7px 2px 0' }}>
                  {selfPick
                    ? 'Each other player pays double.'
                    : 'The discarder pays double; the others pay single.'}
                </p>

                {!selfPick && (
                  <>
                    <div className="sp-sublabel" style={{ marginTop: 16 }}>Who discarded it?</div>
                    <div className="sp-pillrow">
                      {game.players
                        .filter((p) => p.id !== winnerId)
                        .map((p) => (
                          <button
                            key={p.id}
                            className="sp-pill"
                            data-active={discarderId === p.id}
                            onClick={() => setDiscarderId(p.id)}
                          >
                            {p.name}
                          </button>
                        ))}
                    </div>
                  </>
                )}

                <div className="sp-sublabel" style={{ marginTop: 16 }}>
                  Hand <span style={{ color: '#c2c8c4' }}>— optional</span>
                </div>
                {handPickId ? (
                  // A line is chosen — collapse the picker to just the winner,
                  // with "Change" to re-open. Saves space on the record form.
                  <div className="line-pick">
                    <div className="line-row" data-picked>
                      <span className="check" data-checked>
                        ✓
                      </span>
                      <span className="notation">
                        {colorNotation(handLabelFor(handPickId)).map((g, i, arr) => (
                          <span key={i} className={g.cls}>
                            {g.text}
                            {i < arr.length - 1 ? ' ' : ''}
                          </span>
                        ))}
                      </span>
                      <button className="change-hand" onClick={() => setHandPickId('')}>
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="chip-wrap">
                      <button
                        className="cat-chip"
                        data-active={handCat === ''}
                        onClick={() => setHandCat('')}
                      >
                        None
                      </button>
                      {card.categories.map((c) => (
                        <button
                          key={c}
                          className="cat-chip"
                          data-active={handCat === c}
                          onClick={() => setHandCat(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {handCat !== '' && (
                      <div className="line-pick">
                        <div className="line-pick-head">Pick your line — check the one that won</div>
                        {card.hands
                          .filter((h) => h.category === handCat)
                          .map((h) => (
                            <button
                              key={h.id}
                              className="line-row"
                              onClick={() => setHandPickId(h.id)}
                            >
                              <span className="check" />
                              <span className="notation">
                                {colorNotation(handNotes[h.id] ?? h.notation).map((g, i, arr) => (
                                  <span key={i} className={g.cls}>
                                    {g.text}
                                    {i < arr.length - 1 ? ' ' : ''}
                                  </span>
                                ))}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <button className="score-cta sp-record" disabled={!canRecord} onClick={record}>
              <span className="score-cta-shine" aria-hidden />
              <span className="score-cta-label sp-record-label">
                <IconCheck size={18} /> RECORD HAND
              </span>
            </button>

            {/* History */}
            {game.rounds.length > 0 && (
              <>
                <div className="scorer-label" style={{ marginTop: 18 }}>HISTORY</div>
                <button className="btn ghost" style={{ marginBottom: 10 }} onClick={undo}>
                  Undo last hand
                </button>
                <div className="sp-hist">
                  {game.rounds
                    .map((r, i) => ({ r, n: i + 1 }))
                    .reverse()
                    .map(({ r, n }) => (
                      <div className="sp-hist-row" key={r.id}>
                        <span className="sp-hist-no">HAND {n}</span>
                        <span className="sp-hist-text">
                          {r.winnerId ? `${nameOf(r.winnerId)} won` : 'Wall — no win'}
                          {r.winnerId && (r.selfPick ? ' · self-pick' : ` · off ${nameOf(r.discarderId)}`)}
                          {r.handLabel && r.handLabel !== 'Wall game' ? ` · ${r.handLabel}` : ''}
                        </span>
                        <span className="sp-hist-pts">
                          {r.winnerId ? `+${Math.max(...Object.values(r.deltas))}` : '—'}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}

            {endConfirm ? (
              <div className="card" style={{ marginTop: 16, padding: 14 }}>
                <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  End this game and clear the scorepad? This can’t be undone.
                </p>
                <div className="row" style={{ marginTop: 0 }}>
                  <button className="btn ghost" onClick={() => setEndConfirm(false)}>
                    Keep playing
                  </button>
                  <button className="btn danger" onClick={endGame}>
                    End game
                  </button>
                </div>
              </div>
            ) : (
              <div className="sp-footer">
                <button className="sp-endgame" onClick={() => setEndConfirm(true)}>
                  END GAME
                </button>
                <button className="score-cta sp-done" onClick={onClose}>
                  <span className="score-cta-shine" aria-hidden />
                  <span className="score-cta-label">DONE</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {paywall && (
        <Paywall
          onUnlock={() => {
            setPro(true);
            setPaywall(false);
          }}
          onClose={() => setPaywall(false)}
        />
      )}

      {showGameOver && game && (
        <div className="recap-scrim" ref={recapRef} onClick={() => setShowGameOver(false)}>
          <div className="recap-card" onClick={(e) => e.stopPropagation()}>
            {/* emblem: gold glow + 3 sparkles + cream trophy tile w/ shine + gold star */}
            <div className="recap-emblem">
              <span className="recap-glow" aria-hidden />
              <span className="recap-emblem-spark" style={{ top: 6, left: 58, width: 17, height: 17, color: '#FFD46A', animationDuration: '1.8s' }}>
                <Spark />
              </span>
              <span className="recap-emblem-spark" style={{ top: 20, right: 54, width: 13, height: 13, color: '#F5B73C', animationDuration: '2.1s', animationDelay: '.5s' }}>
                <Spark />
              </span>
              <span className="recap-emblem-spark" style={{ bottom: 6, left: 74, width: 11, height: 11, color: '#FFD46A', animationDuration: '2.4s', animationDelay: '.9s' }}>
                <Spark />
              </span>
              <div className="recap-tile">
                <span className="recap-shine" aria-hidden />
                <span className="recap-star">
                  <GoldStar size={60} />
                </span>
              </div>
            </div>

            <div className="recap-eyebrow">
              {game.rounds.length} HAND{game.rounds.length === 1 ? '' : 'S'} PLAYED
            </div>
            <div className="recap-titlewrap">
              <span className="recap-title">
                {winnerName ? (youWon ? 'YOU WIN!' : `${winnerName.toUpperCase()} WINS!`) : "IT'S A TIE!"}
              </span>
            </div>

            <div className="recap-ranks">
              {ranked.map((p, i) => {
                const isWinner = i === 0 && p.score > 0;
                return (
                  <div className="recap-rank" key={p.id} data-winner={isWinner}>
                    {isWinner && (
                      <>
                        <span className="recap-rank-spark" style={{ top: -9, left: 46, width: 14, height: 14, color: '#F5B73C', animationDuration: '1.7s' }}>
                          <Spark />
                        </span>
                        <span className="recap-rank-spark" style={{ bottom: -6, right: 78, width: 10, height: 10, color: '#FFD46A', animationDuration: '2.2s', animationDelay: '.7s' }}>
                          <Spark />
                        </span>
                      </>
                    )}
                    <span className="recap-rank-num">{i + 1}</span>
                    <span className="recap-rank-tile" data-winner={isWinner}>
                      {p.avatar ? (
                        <Avatar avatar={p.avatar} size={38} />
                      ) : (
                        <span className="sp-tile-num">{i + 1}</span>
                      )}
                    </span>
                    <span className="recap-rank-name">
                      {p.name}
                      {isWinner && (
                        <span className="recap-rank-badge" style={{ color: '#F5A524' }}>
                          <Spark />
                        </span>
                      )}
                    </span>
                    <span className="recap-rank-score" data-neg={p.score < 0}>
                      {p.score > 0 ? `+${p.score}` : p.score < 0 ? `−${Math.abs(p.score)}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>

            <button className="recap-endgame" onClick={endGame}>
              <span className="score-cta-shine" aria-hidden />
              <span className="recap-eg-tile recap-eg-tile-l">
                <DotGlyph />
              </span>
              <span className="recap-eg-label">END GAME</span>
              <span className="recap-eg-tile recap-eg-tile-r">
                <DragonGlyph />
              </span>
            </button>

            <button className="recap-keep" onClick={() => setShowGameOver(false)}>
              Keep playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
