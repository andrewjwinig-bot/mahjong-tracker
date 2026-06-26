'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type Game,
  type GameGoal,
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
import { IconTrophy, IconCheck, IconTrash, IconShare, IconLock } from './uiIcons';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';
import { useConfetti } from './Confetti';
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

  // Tap a friend to add them to the roster; tap again to take them back off.
  function toggleFriend(f: Friend) {
    const slot = names.findIndex((n) => n.trim().toLowerCase() === f.name.toLowerCase());
    if (slot !== -1) setName(slot, '', undefined);
    else addFriend(f);
  }

  // Game length: 'open' running tally (default), a set number of hands, or
  // first-to-target score. Chosen on the setup screen before starting.
  const [goalType, setGoalType] = useState<GoalType>('open');
  const [handTarget, setHandTarget] = useState(8);
  const [scoreTarget, setScoreTarget] = useState(100);
  const goalTarget = goalType === 'hands' ? handTarget : scoreTarget;

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
    setGame(applyRound(game, input));
    resetForm();
  }

  function undo() {
    if (game) setGame(undoLastRound(game));
  }

  function endGame() {
    if (!game) return;
    const roster = game.players.map((p) => p.name);
    const rosterAvatars = game.players.map((p) => p.avatar);
    const goal = game.goal;
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
    // A finished game → offer a one-tap rematch with the same crew; an empty
    // game just drops back to the seeded setup.
    if (hadRounds) {
      setPlayAgain({ names: roster, avatars: rosterAvatars, goal });
    } else {
      setNames(initialNames);
      setAvatars(initialAvatars);
    }
  }

  // Start a fresh game directly with a given roster + goal (used by "Play again").
  function startWith(ns: string[], avs: (TileAvatar | undefined)[], goal?: GameGoal) {
    setNames(ns);
    setAvatars(avs);
    const seeds: PlayerSeed[] = ns.map((n, i) => ({ name: n.trim() || `Player ${i + 1}`, avatar: avs[i] }));
    setGame(newGame(seeds, goal));
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

  // The win moment: when the chosen goal is first reached, fire a confetti
  // storm and pop the celebratory game-over modal. Re-arms if a hand is undone
  // back below the goal.
  const { storm } = useConfetti();
  const [showGameOver, setShowGameOver] = useState(false);
  // After a game is saved, offer a one-tap rematch with the same crew.
  const [playAgain, setPlayAgain] = useState<{
    names: string[];
    avatars: (TileAvatar | undefined)[];
    goal?: GameGoal;
  } | null>(null);
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (done && !celebratedRef.current) {
      celebratedRef.current = true;
      setShowGameOver(true);
      storm();
    } else if (!done) {
      celebratedRef.current = false;
    }
  }, [done, storm]);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
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

            {friends.length > 0 && (
              <>
                <div className="scorer-label">ADD FROM FRIENDS</div>
                <div className="friend-chips">
                  {friends.map((f) => {
                    const on = isOnRoster(f);
                    return (
                      <button
                        key={f.name}
                        className="friend-chip2"
                        data-on={on}
                        onClick={() => toggleFriend(f)}
                      >
                        <span className="friend-chip-tile">
                          <Avatar avatar={f.avatar} size={20} />
                        </span>
                        <span className="friend-chip-name">{f.name}</span>
                        <span className="friend-chip-plus">
                          {on ? <IconCheck size={13} /> : '+'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="scorer-label">GAME LENGTH</div>
            <div className="len-seg">
              <button className="len-seg-btn" data-active={goalType === 'open'} onClick={() => setGoalType('open')}>
                OPEN
              </button>
              <button className="len-seg-btn" data-active={goalType === 'hands'} onClick={() => setGoalType('hands')}>
                # HANDS
              </button>
              <button className="len-seg-btn" data-active={goalType === 'score'} onClick={() => setGoalType('score')}>
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
                      data-active={goalTarget === v}
                      onClick={() => (goalType === 'hands' ? setHandTarget(v) : setScoreTarget(v))}
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
                    value={goalTarget}
                    onChange={(e) => {
                      const n = Math.max(1, Number(e.target.value) || 0);
                      if (goalType === 'hands') setHandTarget(n);
                      else setScoreTarget(n);
                    }}
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
            <div className="grab" />
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconTrophy size={20} /> Scorepad
            </h2>
            <p className="sheet-sub">{goalSub}</p>

            {/* Scoreboard */}
            <div className="score-board">
              {game.players.map((p) => (
                <div className="score-cell" key={p.id} data-lead={p.id === lead}>
                  {p.id === lead && (
                    <span className="score-crown" aria-label="Leading">
                      <IconTrophy size={14} />
                    </span>
                  )}
                  {p.avatar && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                      <Avatar avatar={p.avatar} size={28} />
                    </div>
                  )}
                  <div className="score-name">{p.name}</div>
                  <div className="score-num" data-neg={p.score < 0}>
                    {p.score > 0 ? '+' : ''}
                    {p.score}
                  </div>
                </div>
              ))}
            </div>

            {/* Record a hand */}
            <div className="set-section">Record a hand</div>

            <label className="lbl">Who won?</label>
            <div className="picker-row">
              {game.players.map((p) => (
                <button
                  key={p.id}
                  className="pick-chip"
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
              <button
                className="pick-chip"
                data-active={wall}
                onClick={() => {
                  setWall(true);
                  setWinnerId(null);
                }}
              >
                Wall (no win)
              </button>
            </div>

            {!wall && (
              <>
                <label className="lbl" style={{ marginTop: 12 }}>
                  Hand value
                </label>
                <div className="picker-row">
                  {PRESET_VALUES.map((v) => (
                    <button
                      key={v}
                      className="pick-chip"
                      data-active={value === v}
                      onClick={() => setValue(v)}
                    >
                      {v}
                    </button>
                  ))}
                  <input
                    className="field"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    style={{ maxWidth: 84 }}
                    value={value}
                    onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>

                <label className="lbl" style={{ marginTop: 12 }}>
                  How did they win?
                </label>
                <div className="segmented">
                  <button data-active={selfPick} onClick={() => setSelfPick(true)}>
                    Off the wall (self-pick)
                  </button>
                  <button data-active={!selfPick} onClick={() => setSelfPick(false)}>
                    Off a discard
                  </button>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 11.5, fontWeight: 700, margin: '6px 2px 0' }}>
                  {selfPick
                    ? 'Each other player pays double.'
                    : 'The discarder pays double; the others pay single.'}
                </p>

                {!selfPick && (
                  <>
                    <label className="lbl" style={{ marginTop: 12 }}>
                      Who discarded it?
                    </label>
                    <div className="picker-row">
                      {game.players
                        .filter((p) => p.id !== winnerId)
                        .map((p) => (
                          <button
                            key={p.id}
                            className="pick-chip"
                            data-active={discarderId === p.id}
                            onClick={() => setDiscarderId(p.id)}
                          >
                            {p.name}
                          </button>
                        ))}
                    </div>
                  </>
                )}

                <label className="lbl" style={{ marginTop: 12 }}>
                  Hand <span style={{ color: 'var(--muted)' }}>— optional</span>
                </label>
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

            <button
              className="btn"
              style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              disabled={!canRecord}
              onClick={record}
            >
              <IconCheck size={17} /> Record hand
            </button>

            {/* History */}
            {game.rounds.length > 0 && (
              <>
                <div className="set-section">History</div>
                <button
                  className="btn ghost"
                  style={{ marginBottom: 10 }}
                  onClick={undo}
                >
                  Undo last hand
                </button>
                <div className="round-list">
                  {game.rounds.map((r) => (
                    <div className="round-row" key={r.id}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="round-title">
                          {r.winnerId ? `${nameOf(r.winnerId)} won` : 'Wall game'}
                          {r.value > 0 && ` · ${r.value}`}
                          {r.winnerId && (r.selfPick ? ' · self-pick' : ` · off ${nameOf(r.discarderId)}`)}
                        </div>
                        {r.handLabel && r.handLabel !== 'Wall game' && (
                          <div className="round-sub">{r.handLabel}</div>
                        )}
                      </div>
                      {r.winnerId && (
                        <div className="round-pts">
                          +{Math.max(...Object.values(r.deltas))}
                        </div>
                      )}
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
              <div className="row" style={{ marginTop: 16 }}>
                <button
                  className="btn ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: 'var(--accent)' }}
                  onClick={() => setEndConfirm(true)}
                >
                  <IconTrash size={17} /> End game
                </button>
                <button className="btn" onClick={onClose}>
                  Done
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
        <div className="celebrate-scrim" onClick={() => setShowGameOver(false)}>
          <div className="celebrate-card big game-over-card" onClick={(e) => e.stopPropagation()}>
            <div className="boom">🏆</div>
            <p className="cele-hype">
              {game.goal?.type === 'hands'
                ? `${game.goal.target} hand${game.goal.target === 1 ? '' : 's'} played`
                : `First to ${game.goal?.target} 🀄`}
            </p>
            <h2>{winnerName ? (youWon ? 'You win! 🎉' : `${winnerName} wins! 🎉`) : "It's a tie!"}</h2>

            <div className="go-standings">
              {ranked.map((p, i) => (
                <div className="go-stand-row" key={p.id} data-top={i === 0}>
                  <span className="go-rank">{i + 1}</span>
                  {p.avatar ? (
                    <Avatar avatar={p.avatar} size={26} />
                  ) : (
                    <span className="go-stand-dot" aria-hidden />
                  )}
                  <span className="go-stand-name">{p.name}</span>
                  <span className="go-stand-score" data-neg={p.score < 0}>
                    {p.score > 0 ? '+' : ''}
                    {p.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="cele-actions">
              <button className="btn" onClick={endGame}>
                End &amp; save game
              </button>
              <button className="btn ghost" onClick={() => setShowGameOver(false)}>
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}

      {playAgain && (
        <div className="celebrate-scrim" onClick={() => setPlayAgain(null)}>
          <div className="celebrate-card play-again-card" onClick={(e) => e.stopPropagation()}>
            <div className="boom">🀄</div>
            <p className="cele-hype">Saved to your history</p>
            <h2>Play again?</h2>
            <p className="cele-hand">
              Same crew
              {playAgain.goal
                ? playAgain.goal.type === 'hands'
                  ? ` · ${playAgain.goal.target} hand${playAgain.goal.target === 1 ? '' : 's'}`
                  : ` · first to ${playAgain.goal.target}`
                : ''}
            </p>

            <div className="go-standings">
              {playAgain.names
                .map((n, i) => ({ n, av: playAgain.avatars[i] }))
                .filter((x) => x.n.trim())
                .map((x, i) => (
                  <div className="go-stand-row" key={i}>
                    {x.av ? (
                      <Avatar avatar={x.av} size={26} />
                    ) : (
                      <span className="go-stand-dot" aria-hidden />
                    )}
                    <span className="go-stand-name">{x.n}</span>
                  </div>
                ))}
            </div>

            <div className="cele-actions">
              <button
                className="btn"
                onClick={() => {
                  const pa = playAgain;
                  setPlayAgain(null);
                  startWith(pa.names, pa.avatars, pa.goal);
                }}
              >
                Play again
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setPlayAgain(null);
                  onClose();
                }}
              >
                Back to feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
