'use client';

import { useMemo, useState } from 'react';
import {
  type Game,
  type GameResult,
  type PlayerSeed,
  type RoundInput,
  applyRound,
  clearGame,
  leaderId,
  loadGame,
  loadResults,
  newGame,
  recordResult,
  undoLastRound,
} from '../lib/gameScorer';
import type { TileAvatar } from '../lib/social';
import Avatar from './Avatar';
import { IconTrophy, IconCheck, IconTrash, IconShare, IconLock, IconPlus } from './uiIcons';
import { useEscape } from '../lib/useEscape';
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
  onClose,
  onGameWon,
}: {
  suggestedNames: string[];
  friends: Friend[];
  onClose: () => void;
  onGameWon?: (result: GameResult) => void;
}) {
  useEscape(onClose);
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
  const [avatars, setAvatars] = useState<(TileAvatar | undefined)[]>([undefined, undefined, undefined, undefined]);

  function setName(i: number, name: string, avatar?: TileAvatar) {
    setNames((prev) => prev.map((x, j) => (j === i ? name : x)));
    setAvatars((prev) => prev.map((x, j) => (j === i ? avatar : x)));
  }

  // Drop a friend into the first empty slot (or the last slot if full).
  function addFriend(f: Friend) {
    let slot = names.findIndex((n) => !n.trim());
    if (slot === -1) slot = 3;
    setName(slot, f.name, f.avatar);
  }

  const isOnRoster = (f: Friend) =>
    names.some((n) => n.trim().toLowerCase() === f.name.toLowerCase());

  // Tap a friend to add them to the roster; tap again to take them back off.
  function toggleFriend(f: Friend) {
    const slot = names.findIndex((n) => n.trim().toLowerCase() === f.name.toLowerCase());
    if (slot !== -1) setName(slot, '', undefined);
    else addFriend(f);
  }

  function start() {
    const seeds: PlayerSeed[] = names.map((n, i) => ({ name: n.trim() || `Player ${i + 1}`, avatar: avatars[i] }));
    setGame(newGame(seeds));
  }

  // ---- Record-a-hand form -------------------------------------------------
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [wall, setWall] = useState(false);
  const [value, setValue] = useState(25);
  const [selfPick, setSelfPick] = useState(true);
  const [discarderId, setDiscarderId] = useState<string | null>(null);
  const [handLabel, setHandLabel] = useState('');
  const [endConfirm, setEndConfirm] = useState(false);

  function resetForm() {
    setWinnerId(null);
    setWall(false);
    setValue(25);
    setSelfPick(true);
    setDiscarderId(null);
    setHandLabel('');
  }

  const canRecord = game && (wall || (winnerId && value > 0 && (selfPick || discarderId)));

  function record() {
    if (!game || !canRecord) return;
    const input: RoundInput = wall
      ? { winnerId: null, handLabel: handLabel || 'Wall game', value: 0, selfPick: false, discarderId: null }
      : { winnerId, handLabel, value, selfPick, discarderId: selfPick ? null : discarderId };
    setGame(applyRound(game, input));
    resetForm();
  }

  function undo() {
    if (game) setGame(undoLastRound(game));
  }

  function endGame() {
    if (game && game.rounds.length > 0) {
      const result = recordResult(game);
      setResults(loadResults());
      onGameWon?.(result);
    }
    clearGame();
    setGame(null);
    resetForm();
    setEndConfirm(false);
    setNames(initialNames);
    setAvatars([undefined, undefined, undefined, undefined]);
  }

  function rematch(r: GameResult) {
    const ns = r.players.map((p) => p.name).slice(0, 4);
    while (ns.length < 4) ns.push('');
    setNames(ns);
    setAvatars(ns.map((n) => friends.find((f) => f.name.toLowerCase() === n.toLowerCase())?.avatar));
  }

  const lead = game ? leaderId(game.players) : null;
  const nameOf = (id: string | null) => game?.players.find((p) => p.id === id)?.name ?? '';

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet scorer" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />

        {!game ? (
          <>
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconTrophy size={20} /> Score a Game
            </h2>
            <p className="sheet-sub">Track a live game — who won, the hand value, and the payouts.</p>

            <label className="lbl">Players</label>
            {names.map((n, i) => {
              // A slot filled from a friend is locked to that identity — name +
              // tile icon, no free typing. Remove it to free the seat back up.
              const locked = !!avatars[i];
              return (
                <div key={i} className="player-slot">
                  {avatars[i] ? (
                    <Avatar avatar={avatars[i]!} size={34} />
                  ) : (
                    <span className="player-num">{i + 1}</span>
                  )}
                  {locked ? (
                    <>
                      <span className="player-locked">{n}</span>
                      <button
                        className="player-remove"
                        aria-label={`Remove ${n}`}
                        onClick={() => setName(i, '', undefined)}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <input
                      className="field"
                      style={{ flex: 1 }}
                      value={n}
                      maxLength={20}
                      placeholder={`Player ${i + 1}`}
                      onChange={(e) => setName(i, e.target.value, undefined)}
                    />
                  )}
                </div>
              );
            })}

            {friends.length > 0 && (
              <>
                <label className="lbl" style={{ marginTop: 12 }}>
                  Add from friends
                </label>
                <div className="picker-row">
                  {friends.map((f) => {
                    const on = isOnRoster(f);
                    return (
                      <button
                        key={f.name}
                        className="friend-chip"
                        data-on={on}
                        onClick={() => toggleFriend(f)}
                      >
                        <Avatar avatar={f.avatar} size={22} />
                        {f.name}
                        {on ? <IconCheck size={13} /> : <IconPlus size={13} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <button className="btn" style={{ marginTop: 14 }} onClick={start}>
              Start Game
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
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconTrophy size={20} /> Scorepad
            </h2>
            <p className="sheet-sub">
              {game.rounds.length} hand{game.rounds.length === 1 ? '' : 's'} played
            </p>

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
                  Hand (optional)
                </label>
                <input
                  className="field"
                  value={handLabel}
                  maxLength={40}
                  placeholder="e.g. FF 2026 2026 DDDD"
                  onChange={(e) => setHandLabel(e.target.value)}
                />
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
    </div>
  );
}
