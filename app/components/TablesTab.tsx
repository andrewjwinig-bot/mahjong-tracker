'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Profile } from '../lib/social';
import type { ChatMsg, PollOption, Table, TablePhoto, TableMember } from '../lib/tables';
import { loadTables, saveTables } from '../lib/tables';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';
import { downloadICS, googleCalUrl, type CalEvent } from '../lib/calendar';
import { downscaleImage } from '../lib/image';
import PageTitle from './PageTitle';
import { track } from '../lib/analytics';
import Avatar from './Avatar';
import Tile from './Tile';
import ShareModal from './ShareModal';
import { AddFriendSheet } from './GroupTab';
import { IconChat, IconCalendar, IconCamera, IconShare, IconCheck, IconPlus, IconUsers } from './uiIcons';
import Paywall from './Paywall';
import ProUpsell from './ProUpsell';
import { usePro } from '../lib/usePro';
import { setPro, FREE_TABLE_LIMIT } from '../lib/pro';
import type { TileAvatar } from '../lib/social';
import type { TileFace } from '../lib/tileArt';

type View = 'chat' | 'dates' | 'photos';

// Custom tile icons a table can pick from.
const TABLE_ICONS: TileAvatar[] = [
  { face: 'crack' as TileFace, color: '#D23B4E' },
  { face: 'bam', color: '#2E9E50' },
  { face: 'dot', color: '#1E73C4' },
  { face: 'flower', color: '#E84C8A' },
  { face: 'dragon', char: '中', color: '#D23B4E' },
  { face: 'dragon', char: '發', color: '#1FA85B' },
  { face: 'wind', char: '東', color: '#2C3A57' },
  { face: 'joker', color: '#7C5CE0' },
];

export default function TablesTab({
  profile,
  openTableId,
  onConsumedOpen,
  onScoreTable,
  onAddFriend,
  friends = [],
}: {
  profile: Profile;
  openTableId?: string | null;
  onConsumedOpen?: () => void;
  onScoreTable: (members: { name: string; avatar: TileAvatar }[]) => void;
  onAddFriend: (name: string, avatar: TileAvatar) => void;
  /** Your in-app friends (the leaderboard crew, minus you) — offered first in the table invite. */
  friends?: TableMember[];
}) {
  const [tables, setTables] = useState<Table[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void loadTables().then((t) => alive && setTables(t));
    return () => {
      alive = false;
    };
  }, []);

  // Deep-link: open a specific table when asked (e.g. from the Feed's next-game
  // card), then clear the request so a later tap re-opens it.
  useEffect(() => {
    if (openTableId) {
      setSelectedId(openTableId);
      onConsumedOpen?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTableId]);

  function update(id: string, fn: (t: Table) => Table) {
    setTables((prev) => {
      if (!prev) return prev;
      const next = prev.map((t) => (t.id === id ? fn(t) : t));
      void saveTables(next);
      return next;
    });
  }

  function remove(id: string) {
    setTables((prev) => {
      if (!prev) return prev;
      const next = prev.filter((t) => t.id !== id);
      void saveTables(next);
      return next;
    });
  }

  if (!tables) {
    return (
      <div className="screen">
        <div className="empty">
          <div className="big">🀄</div>
          Loading your tables…
        </div>
      </div>
    );
  }

  const selected = tables.find((t) => t.id === selectedId) ?? null;

  if (selected) {
    return (
      <TableDetail
        table={selected}
        profile={profile}
        friends={friends}
        onBack={() => setSelectedId(null)}
        onUpdate={(fn) => update(selected.id, fn)}
        onScore={() => onScoreTable(selected.members)}
        onLeave={() => {
          remove(selected.id);
          setSelectedId(null);
        }}
      />
    );
  }

  return <TablesList tables={tables} profile={profile} onAddFriend={onAddFriend} onOpen={setSelectedId} onCreate={(t) => {
    setTables((prev) => {
      const next = [...(prev ?? []), t];
      void saveTables(next);
      return next;
    });
    setSelectedId(t.id);
  }} />;
}

/* ---------------------------------------------------------------- list ---- */

function TablesList({
  tables,
  profile,
  onAddFriend,
  onOpen,
  onCreate,
}: {
  tables: Table[];
  profile: Profile;
  onAddFriend: (name: string, avatar: TileAvatar) => void;
  onOpen: (id: string) => void;
  onCreate: (t: Table) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [iconIdx, setIconIdx] = useState(0);
  const [paywall, setPaywall] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const pro = usePro();
  const atLimit = !pro && tables.length >= FREE_TABLE_LIMIT;

  function startCreate() {
    if (atLimit) setPaywall(true);
    else setCreating(true);
  }

  function create() {
    const n = name.trim();
    if (!n) return;
    const code = `${n.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(1000 + Math.random() * 9000)}`;
    onCreate({
      id: `t_${Date.now()}`,
      name: n,
      icon: TABLE_ICONS[iconIdx],
      inviteCode: code,
      members: [{ name: profile.name, avatar: profile.avatar }],
      messages: [],
      poll: { question: 'When should we play next?', options: [] },
      photos: [],
    });
    void track('table_created');
    setCreating(false);
    setName('');
    setIconIdx(0);
  }

  return (
    <div className="screen">
      <header className="app-header">
        <PageTitle kicker="YOUR" word="Tables" />
        <p className="sub">Your private groups — chat, schedule &amp; share photos.</p>
      </header>

      <button
        className="btn"
        style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
        onClick={startCreate}
      >
        <IconPlus size={17} /> New Table
      </button>
      {atLimit && (
        <p style={{ margin: '8px 2px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
          Free includes {FREE_TABLE_LIMIT} tables — go VIP for unlimited.
        </p>
      )}

      {/* People: add friends to your leaderboard + invite your crew to the app. */}
      <div className="feed-actions" style={{ marginTop: 12 }}>
        <button className="feed-btn primary" onClick={() => setAddOpen(true)}>
          <IconPlus size={16} /> ADD FRIEND
        </button>
        <button className="feed-btn pine" onClick={() => setInviteOpen(true)}>
          <IconShare size={16} /> INVITE
        </button>
      </div>

      {addOpen && (
        <AddFriendSheet
          onAdd={(n, avatar) => {
            onAddFriend(n, avatar);
            setAddOpen(false);
          }}
          onClose={() => setAddOpen(false)}
        />
      )}
      {inviteOpen && (
        <ShareModal
          payload={{
            title: 'Invite Your Crew 👯',
            text: `Come track your mahjong wins with me on Club Mahj — let's race to clear all 70 hands! 🀄`,
            url: typeof window !== 'undefined' ? window.location.origin : '',
          }}
          onClose={() => setInviteOpen(false)}
        />
      )}

      <div style={{ marginTop: 16 }}>
        {tables.map((t) => {
          const last = t.messages[t.messages.length - 1];
          return (
            <button key={t.id} className="table-row" onClick={() => onOpen(t.id)}>
              <Tile face={t.icon.face} char={t.icon.char} color={t.icon.color} size={54} />
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span className="table-name">{t.name}</span>
                <span className="table-meta">
                  {t.members.length + 1} players
                  {last ? ` · ${last.author}: ${last.text}` : ' · Tap to open'}
                </span>
              </span>
              <span style={{ fontSize: 20, color: 'var(--muted)' }}>›</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <ProUpsell copy="Unlimited tables, premium themes & cloud sync." />
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginTop: 22 }}>
        Demo tables live on this device. Real shared tables arrive with accounts (v2).
      </p>

      {paywall && (
        <Paywall
          onUnlock={() => {
            setPro(true);
            setPaywall(false);
          }}
          onClose={() => setPaywall(false)}
        />
      )}

      {creating && (
        <div className="modal-scrim" onClick={() => setCreating(false)}>
          <div className="sheet log-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="log-band">
              <span className="md-stripe" aria-hidden />
              <div className="grab light" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="log-kicker">START A GROUP</div>
                <div className="log-title">NEW TABLE</div>
                <div className="log-band-sub">Start a private group with your crew.</div>
              </div>
            </div>

            <div className="log-body">
              <label className="lbl">Table name</label>
              <input
                className="field"
                value={name}
                autoFocus
                maxLength={28}
                placeholder="Thursday Night Mahj"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
              />

              <label className="lbl" style={{ marginTop: 14 }}>
                Table icon
              </label>
              <div className="avatar-grid">
                {TABLE_ICONS.map((t, i) => (
                  <button
                    key={i}
                    className="avatar-opt"
                    data-active={iconIdx === i}
                    onClick={() => setIconIdx(i)}
                  >
                    <Tile face={t.face} char={t.char} color={t.color} size={42} />
                    {iconIdx === i && <span className="avatar-check" aria-hidden>✓</span>}
                  </button>
                ))}
              </div>

              <div className="log-footer">
                <button className="act-btn" onClick={() => setCreating(false)}>
                  CANCEL
                </button>
                <button className="mahj-hero log-save" onClick={create} disabled={!name.trim()}>
                  <span className="mahj-hero-shine" aria-hidden />
                  <span className="mahj-hero-label">CREATE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- detail ---- */

function TableDetail({
  table,
  profile,
  friends,
  onBack,
  onUpdate,
  onScore,
  onLeave,
}: {
  table: Table;
  profile: Profile;
  friends: TableMember[];
  onBack: () => void;
  onUpdate: (fn: (t: Table) => Table) => void;
  onScore: () => void;
  onLeave: () => void;
}) {
  const [view, setView] = useState<View>('chat');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  return (
    <div className="screen">
      <div className="detail-top">
        <button className="icon-btn" onClick={onBack} aria-label="Back to tables">
          ‹
        </button>
        <Tile face={table.icon.face} char={table.icon.char} color={table.icon.color} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-title">{table.name}</div>
          <div className="detail-sub">{table.members.length + 1} players</div>
        </div>
        <button
          className="btn green plain"
          style={{ width: 'auto', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={() => setInviteOpen(true)}
        >
          <IconShare size={16} /> Invite
        </button>
      </div>

      <button className="score-cta" style={{ marginTop: 14 }} onClick={onScore}>
        <span className="mahj-hero-shine" aria-hidden />
        <span className="score-cta-tile" style={{ color: '#C0392B', transform: 'rotate(-7deg)' }} aria-hidden>
          萬
        </span>
        <span className="score-cta-label">SCORE THIS TABLE</span>
        <span className="score-cta-tile" style={{ color: '#15803D', transform: 'rotate(7deg)' }} aria-hidden>
          發
        </span>
      </button>

      <div className="segmented" style={{ marginTop: 14 }}>
        {(['chat', 'dates', 'photos'] as View[]).map((v) => (
          <button
            key={v}
            data-active={view === v}
            onClick={() => setView(v)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {v === 'chat' ? <IconChat size={17} /> : v === 'dates' ? <IconCalendar size={17} /> : <IconCamera size={17} />}
            {v === 'chat' ? 'Chat' : v === 'dates' ? 'Dates' : 'Photos'}
          </button>
        ))}
      </div>

      {view === 'chat' && <ChatView table={table} profile={profile} onUpdate={onUpdate} />}
      {view === 'dates' && <DatesView table={table} profile={profile} onUpdate={onUpdate} />}
      {view === 'photos' && <PhotosView table={table} profile={profile} onUpdate={onUpdate} />}

      <button
        className="leave-table"
        data-confirm={confirmLeave}
        onClick={() => (confirmLeave ? onLeave() : setConfirmLeave(true))}
        onBlur={() => setConfirmLeave(false)}
      >
        {confirmLeave ? 'Tap again to leave this table' : 'Leave this table'}
      </button>

      {inviteOpen && (
        <InviteToTableSheet
          table={table}
          profile={profile}
          friends={friends}
          onAddMember={(m) => onUpdate((t) => ({ ...t, members: [...t.members, m] }))}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  );
}

/* Invite to a table: pick from your in-app friends who aren't already here,
   then fall back to sharing a link/code for someone new. */
function InviteToTableSheet({
  table,
  profile,
  friends,
  onAddMember,
  onClose,
}: {
  table: Table;
  profile: Profile;
  friends: TableMember[];
  onAddMember: (m: TableMember) => void;
  onClose: () => void;
}) {
  const swipe = useSwipeDismiss(onClose);
  const [shareOpen, setShareOpen] = useState(false);

  // Friends not already at the table (you're always implicitly a member).
  const here = new Set([profile.name, ...table.members.map((m) => m.name)]);
  const available = friends.filter((f) => !here.has(f.name));

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="grab" />
        <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconUsers size={20} /> Invite To This Table
        </h2>
        <p className="sheet-sub">Add a friend, or share the code with someone new.</p>

        <label className="lbl">Your friends</label>
        <div className="search-results">
          {available.length === 0 && (
            <p className="search-empty">
              {friends.length === 0
                ? 'Add friends on the Group tab and they’ll show up here.'
                : 'Everyone you play with is already at this table.'}
            </p>
          )}
          {available.map((f) => (
            <div key={f.name} className="search-row">
              <Avatar avatar={f.avatar} size={36} />
              <div className="search-id">
                <div className="search-name">{f.name}</div>
              </div>
              <button
                className="pick-chip"
                onClick={() => onAddMember({ name: f.name, avatar: f.avatar })}
              >
                <IconPlus size={14} /> Add
              </button>
            </div>
          ))}
        </div>

        <div style={{ height: 1.5, background: 'var(--hairline)', margin: '16px 0' }} />

        <button
          className="btn green plain"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => setShareOpen(true)}
        >
          <IconShare size={18} /> Share Invite Link
        </button>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={onClose}>
          Done
        </button>
      </div>

      {shareOpen && (
        <ShareModal
          payload={{
            title: 'Invite To This Table 👯',
            text: `Join my mahjong table “${table.name}”! Invite code: ${table.inviteCode}`,
            url: typeof window !== 'undefined' ? window.location.origin : '',
          }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* ---- Chat ---------------------------------------------------------------- */

const REACTIONS = ['👍', '❤️', '😂', '🎉', '🀄', '🍪'];

function ChatView({
  table,
  profile,
  onUpdate,
}: {
  table: Table;
  profile: Profile;
  onUpdate: (fn: (t: Table) => Table) => void;
}) {
  const [draft, setDraft] = useState('');
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const msg: ChatMsg = {
      id: crypto.randomUUID(),
      author: profile.name,
      avatar: profile.avatar,
      text,
      createdAt: Date.now(),
    };
    onUpdate((t) => ({ ...t, messages: [...t.messages, msg] }));
    void track('table_message_sent');
    setDraft('');
  }

  function toggleReaction(msgId: string, emoji: string) {
    onUpdate((t) => ({
      ...t,
      messages: t.messages.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions ?? {}) };
        const by = reactions[emoji] ?? [];
        const next = by.includes(profile.name)
          ? by.filter((n) => n !== profile.name)
          : [...by, profile.name];
        if (next.length) reactions[emoji] = next;
        else delete reactions[emoji];
        return { ...m, reactions };
      }),
    }));
    void track('chat_reaction');
    setPickerFor(null);
  }

  return (
    <div style={{ marginTop: 14 }}>
      {table.messages.length === 0 ? (
        <div className="empty">
          <div className="big">💬</div>
          No messages yet. Say hi to your table!
        </div>
      ) : (
        <div className="chat-list">
          {table.messages.map((m) => {
            const mine = m.author === profile.name;
            const chips = Object.entries(m.reactions ?? {}).filter(([, by]) => by.length);
            return (
              <div key={m.id} className={`chat-msg${mine ? ' mine' : ''}`}>
                {!mine && <Avatar avatar={m.avatar} size={30} />}
                <div className="chat-col">
                  <button
                    className="chat-bubble"
                    onClick={() => setPickerFor((p) => (p === m.id ? null : m.id))}
                  >
                    {!mine && <span className="chat-author">{m.author}</span>}
                    {m.text}
                    <span className="chat-time">{timeAgo(m.createdAt)}</span>
                  </button>

                  {pickerFor === m.id && (
                    <div className="react-picker">
                      {REACTIONS.map((e) => (
                        <button key={e} onClick={() => toggleReaction(m.id, e)}>
                          {e}
                        </button>
                      ))}
                    </div>
                  )}

                  {chips.length > 0 && (
                    <div className="react-chips">
                      {chips.map(([emoji, by]) => (
                        <button
                          key={emoji}
                          className="react-chip"
                          data-mine={by.includes(profile.name)}
                          onClick={() => toggleReaction(m.id, emoji)}
                          title={by.join(', ')}
                        >
                          {emoji} {by.length}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="chat-compose">
        <input
          className="field"
          style={{ borderRadius: 999 }}
          placeholder="Message your table…"
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn" style={{ width: 'auto', padding: '12px 16px' }} onClick={send} disabled={!draft.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

/* ---- Dates / scheduling -------------------------------------------------- */

function prettyDate(iso: string, time?: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (!time) return day;
  const [hh, mm] = time.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm);
  return `${day} · ${dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

function eventFor(table: Table, opt: PollOption): CalEvent {
  const [y, m, d] = opt.date.split('-').map(Number);
  const [hh, mm] = (opt.time || '19:00').split(':').map(Number);
  return {
    title: `🀄 Mahjong — ${table.name}`,
    start: new Date(y, m - 1, d, hh, mm),
    durationMins: 180,
    description: `Game night with ${table.name}. Scheduled via Club Mahj.`,
  };
}

function DatesView({
  table,
  profile,
  onUpdate,
}: {
  table: Table;
  profile: Profile;
  onUpdate: (fn: (t: Table) => Table) => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [calFor, setCalFor] = useState<PollOption | null>(null);

  const leader = useMemo(() => {
    return table.poll.options.reduce<PollOption | null>(
      (best, o) => (!best || o.votes.length > best.votes.length ? o : best),
      null,
    );
  }, [table.poll.options]);

  function toggleVote(optId: string) {
    onUpdate((t) => ({
      ...t,
      poll: {
        ...t.poll,
        options: t.poll.options.map((o) => {
          if (o.id !== optId) return o;
          const voted = o.votes.includes(profile.name);
          return { ...o, votes: voted ? o.votes.filter((v) => v !== profile.name) : [...o.votes, profile.name] };
        }),
      },
    }));
    void track('table_poll_voted');
  }

  function addOption() {
    if (!date) return;
    const opt: PollOption = { id: crypto.randomUUID(), date, time: time || undefined, votes: [profile.name] };
    onUpdate((t) => ({ ...t, poll: { ...t.poll, options: [...t.poll.options, opt] } }));
    setDate('');
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div className="poll-hero">
        <h3 className="poll-hero-q">{table.poll.question}</h3>
        <p className="poll-hero-sub">Vote a date below — most votes wins the night.</p>
      </div>

      {table.poll.options.length === 0 && (
        <div className="empty" style={{ padding: '24px 20px' }}>
          No dates yet — propose one below!
        </div>
      )}

      {table.poll.options.map((o) => {
        const voted = o.votes.includes(profile.name);
        const isLeader = leader?.id === o.id && o.votes.length > 0;
        return (
          <div key={o.id} className={`poll-opt${isLeader ? ' lead' : ''}`}>
            <button className="vote-btn" data-on={voted} onClick={() => toggleVote(o.id)}>
              {voted ? <IconCheck size={16} /> : ''}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                {prettyDate(o.date, o.time)}
                {isLeader && <span className="lead-tag">Leading</span>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                {o.votes.length ? `${o.votes.length} in · ${o.votes.join(', ')}` : 'No votes yet'}
              </div>
            </div>
            <button className="icon-btn" aria-label="Add to calendar" onClick={() => setCalFor(o)}>
              <IconCalendar size={18} />
            </button>
          </div>
        );
      })}

      <div className="card" style={{ marginTop: 14 }}>
        <label className="lbl">Propose a date</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="field" type="time" value={time} style={{ maxWidth: 130 }} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button
          className="btn green"
          style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          onClick={addOption}
          disabled={!date}
        >
          <IconPlus size={17} /> Add date
        </button>
      </div>

      {calFor && (
        <div className="modal-scrim" onClick={() => setCalFor(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <h2>Add To Calendar 📅</h2>
            <p className="sheet-sub">{prettyDate(calFor.date, calFor.time)} · {table.name}</p>
            <div className="row" style={{ marginTop: 4 }}>
              <button
                className="btn plain"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => {
                  downloadICS(eventFor(table, calFor));
                  void track('calendar_added', { kind: 'apple' });
                  setCalFor(null);
                }}
              >
                <IconCalendar size={18} /> Apple
              </button>
              <button
                className="btn green plain"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => {
                  window.open(googleCalUrl(eventFor(table, calFor)), '_blank', 'noopener,noreferrer');
                  void track('calendar_added', { kind: 'google' });
                  setCalFor(null);
                }}
              >
                <IconCalendar size={18} /> Google
              </button>
            </div>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setCalFor(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Photos -------------------------------------------------------------- */

function PhotosView({
  table,
  profile,
  onUpdate,
}: {
  table: Table;
  profile: Profile;
  onUpdate: (fn: (t: Table) => Table) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const blob = await downscaleImage(file);
      const photo: TablePhoto = {
        id: crypto.randomUUID(),
        photo: blob,
        caption: '',
        author: profile.name,
        createdAt: Date.now(),
      };
      onUpdate((t) => ({ ...t, photos: [photo, ...t.photos] }));
      void track('table_photo_added');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      <button
        className="btn coral"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        {busy ? 'Adding…' : <><IconCamera size={17} /> Add Photo</>}
      </button>

      {table.photos.length === 0 ? (
        <div className="empty">
          <div className="big">📷</div>
          No photos yet. Snap your prettiest hands &amp; wins!
        </div>
      ) : (
        <div className="photo-grid">
          {table.photos.map((p) => (
            <PhotoThumb key={p.id} photo={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoThumb({ photo }: { photo: TablePhoto }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(photo.photo);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.photo]);
  return (
    <div className="photo-cell">
      {url && <img src={url} alt={photo.caption || 'Table photo'} />}
      <span className="photo-by">{photo.author}</span>
    </div>
  );
}
