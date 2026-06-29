'use client';

import { useEffect, useMemo, useState } from 'react';
import Tile from './Tile';
import Avatar from './Avatar';
import type { TileAvatar } from '../lib/social';
import { isCloudEnabled } from '../lib/supabase';
import { isDemoMode } from '../lib/demo';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';
import { useEscape } from '../lib/useEscape';
import {
  type CloudFriend,
  cloudSearchProfiles,
  cloudSendFriendRequest,
  cloudListIncomingRequests,
  cloudListFriends,
  cloudAcceptRequest,
  cloudDeclineRequest,
} from '../lib/cloudFriends';

// Decorative mahjong-tile clusters flanking the "Friends" title.
const HEADER_LEFT = ['peony', 'dragon', 'dot_target'];
const HEADER_RIGHT = ['crane', 'wheel_flower', 'bamboo_three'];
const HEADER_ROT = [-6, 5, -4];

const motifAvatar = (char: string): TileAvatar => ({ face: 'motif', char, color: 'multi' });
// Demo seed for the presence / mutual / suggested features (shown when not on a
// live backend). Real cloud data fills these in once the endpoints exist.
const DEMO_REQUESTS = [
  { id: 'req-grace', name: 'Grace', avatar: motifAvatar('crane'), mutual: 4 },
  { id: 'req-priya', name: 'Priya', avatar: motifAvatar('dot_nine'), mutual: 2 },
];
const DEMO_SUGGESTED = [
  { id: 'sug-karen', name: 'Karen', avatar: motifAvatar('plum'), mutualCount: 6, gamesTogether: 0 },
  { id: 'sug-sophie', name: 'Sophie', avatar: motifAvatar('bamboo_stalk'), mutualCount: 0, gamesTogether: 3 },
  { id: 'sug-ben', name: 'Ben', avatar: motifAvatar('wan'), mutualCount: 5, gamesTogether: 0 },
];

// Deterministic demo presence so the list looks alive without a presence service.
const LAST_SEEN = ['2d', '5h', '1d', '3h', '4d', '20m'];
function presenceFor(id: string, i: number): { online: boolean; last?: string } {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
  const online = (h + i) % 5 < 2; // ~40% online
  return online ? { online: true } : { online: false, last: LAST_SEEN[h % LAST_SEEN.length] };
}

function mutualCaption(mutualCount: number, gamesTogether = 0): string | null {
  if (gamesTogether > 0) return `Played ${gamesTogether} game${gamesTogether === 1 ? '' : 's'} together`;
  if (mutualCount > 0) return `${mutualCount} mutual friend${mutualCount === 1 ? '' : 's'}`;
  return null;
}

interface FriendRow {
  key: string;
  id: string;
  name: string;
  handle: string;
  avatar: TileAvatar;
  online: boolean;
  last?: string;
  status: 'online' | 'new' | 'offline';
  removable: boolean;
}

// Lenient member input so both the leaderboard crew (GroupMember) and a table's
// member list ({ name, avatar }) can be passed straight in.
type MemberInput = { id?: string; name: string; avatar: TileAvatar; isYou?: boolean };

interface Props {
  members?: MemberInput[];
  onAdd: (name: string, avatar: TileAvatar) => void;
  onRemove?: (id: string) => void;
  onClose: () => void;
  handle?: string;
}

export default function FriendsSheet({ members = [], onAdd, onRemove, onClose, handle = 'you' }: Props) {
  const cloud = isCloudEnabled();
  const demo = isDemoMode();
  const swipe = useSwipeDismiss(onClose);
  useEscape(onClose);

  const [q, setQ] = useState('');
  const [results, setResults] = useState<CloudFriend[]>([]);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [cloudRequests, setCloudRequests] = useState<CloudFriend[]>([]);
  const [cloudFriends, setCloudFriends] = useState<CloudFriend[]>([]);
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<{ id: string; name: string; avatar: TileAvatar }[]>([]);
  const [suggested, setSuggested] = useState(() => (demo && !cloud ? DEMO_SUGGESTED : []));
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://clubmahj.com';
  const inviteText = `Come track your mahjong wins with me on Club Mahj — let's race to clear all 70 hands! 🀄`;

  // Load incoming requests + accepted friends (cloud only).
  useEffect(() => {
    if (!cloud) return;
    let live = true;
    void Promise.all([cloudListIncomingRequests(), cloudListFriends()]).then(([reqs, fr]) => {
      if (!live) return;
      setCloudRequests(reqs);
      setCloudFriends(fr);
    });
    return () => {
      live = false;
    };
  }, [cloud]);

  // Search → cloud lookup (debounced) or local sample directory.
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      return;
    }
    if (!cloud) {
      const ql = query.replace(/^@/, '').toLowerCase();
      setResults(SAMPLE_PLAYERS.filter((p) => p.username.toLowerCase().includes(ql) || p.handle.toLowerCase().includes(ql)));
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      cloudSearchProfiles(query).then((r) => live && setResults(r));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, cloud]);

  // Incoming requests (demo seed or cloud), minus any just-handled.
  const requestRows = useMemo(() => {
    const base = cloud
      ? cloudRequests.map((u) => ({ id: u.id, name: u.username, avatar: u.avatar, mutual: 0 }))
      : demo
        ? DEMO_REQUESTS
        : [];
    return base.filter((r) => !declined.has(r.id) && !accepted.some((a) => a.id === r.id));
  }, [cloud, demo, cloudRequests, declined, accepted]);

  // Your friends = leaderboard crew + accepted cloud friends + just-accepted, with presence.
  const friendRows: FriendRow[] = useMemo(() => {
    const crew = members.filter((m) => !m.isYou);
    const crewNames = new Set(crew.map((m) => m.name.toLowerCase()));
    const rows: FriendRow[] = crew.map((m, i) => {
      const id = m.id ?? m.name;
      const p = demo ? presenceFor(id, i) : { online: false, last: undefined };
      return {
        key: id,
        id,
        name: m.name,
        handle: `@${m.name.toLowerCase().replace(/\s+/g, '')}`,
        avatar: m.avatar,
        online: p.online,
        last: p.last,
        status: p.online ? 'online' : 'offline',
        removable: !!(m.id && onRemove),
      };
    });
    cloudFriends
      .filter((f) => !crewNames.has(f.username.toLowerCase()))
      .forEach((f) => rows.push({ key: f.id, id: f.id, name: f.username, handle: `@${f.handle}`, avatar: f.avatar, online: false, last: undefined, status: 'offline', removable: false }));
    accepted.forEach((a) =>
      rows.unshift({ key: a.id, id: a.id, name: a.name, handle: `@${a.name.toLowerCase()}`, avatar: a.avatar, online: true, last: undefined, status: 'new', removable: false }),
    );
    // online first, then the rest
    return rows.sort((a, b) => Number(b.online) - Number(a.online));
  }, [members, cloudFriends, accepted, demo]);

  const ql = q.trim().toLowerCase().replace(/^@/, '');
  const filteredFriends = ql ? friendRows.filter((f) => f.name.toLowerCase().includes(ql) || f.handle.toLowerCase().includes(ql)) : friendRows;
  const searching = ql.length > 0;
  // New accounts (from search) who aren't already friends — keeps add-by-search.
  const friendKeys = new Set(friendRows.map((f) => f.name.toLowerCase()));
  const newResults = searching ? results.filter((u) => !friendKeys.has(u.username.toLowerCase())) : [];

  function acceptRequest(r: { id: string; name: string; avatar: TileAvatar }) {
    if (cloud) void cloudAcceptRequest(r.id);
    setAccepted((a) => [{ id: r.id, name: r.name, avatar: r.avatar }, ...a]);
    onAdd(r.name, r.avatar);
  }
  function declineRequest(id: string) {
    if (cloud) void cloudDeclineRequest(id);
    setDeclined((d) => new Set(d).add(id));
  }
  function addSuggested(s: (typeof DEMO_SUGGESTED)[number]) {
    setAdding((a) => new Set(a).add(s.id));
    window.setTimeout(() => {
      setSuggested((list) => list.filter((x) => x.id !== s.id));
      onAdd(s.name, s.avatar);
    }, 520);
  }
  function addSearchResult(u: CloudFriend) {
    if (cloud) {
      void cloudSendFriendRequest(u.id);
      setRequested((s) => new Set(s).add(u.id));
      return;
    }
    onAdd(u.username, u.avatar);
    onClose();
  }
  function copyLink() {
    const link = `clubmahj.com/i/${handle}`;
    try {
      void navigator.clipboard?.writeText(`${inviteText} ${link}`);
    } catch {
      /* ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  function shareMore() {
    try {
      if (navigator.share) void navigator.share({ title: 'Club Mahj', text: inviteText, url: inviteUrl });
      else copyLink();
    } catch {
      /* user cancelled */
    }
  }
  const openIntent = (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank');
  };

  const showRequests = !searching && requestRows.length > 0;
  const showSuggested = !searching && suggested.length > 0;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet ff-sheet" onClick={(e) => e.stopPropagation()} style={swipe.style}>
        {/* Header band */}
        <div
          className="ff-head"
          onTouchStart={swipe.onTouchStart}
          onTouchMove={swipe.onTouchMove}
          onTouchEnd={swipe.onTouchEnd}
        >
          <span className="ff-head-hatch" aria-hidden />
          <span className="grab ff-grab" aria-hidden />
          <div className="ff-head-row">
            <span className="ff-cluster" aria-hidden>
              {HEADER_LEFT.map((m, i) => (
                <span key={m} className="ff-cluster-tile" style={{ marginLeft: i ? -9 : 0, transform: `rotate(${HEADER_ROT[i]}deg)`, zIndex: i + 1 }}>
                  <Tile face="motif" char={m} color="multi" size={33} />
                </span>
              ))}
            </span>
            <h2 className="ff-title">Friends</h2>
            <span className="ff-cluster" aria-hidden>
              {HEADER_RIGHT.map((m, i) => (
                <span key={m} className="ff-cluster-tile" style={{ marginLeft: i ? -9 : 0, transform: `rotate(${HEADER_ROT[i]}deg)`, zIndex: i + 1 }}>
                  <Tile face="motif" char={m} color="multi" size={33} />
                </span>
              ))}
            </span>
          </div>
          <p className="ff-sub">Search players by username, or invite someone new.</p>
        </div>

        {/* Search */}
        <div className="ff-search-wrap">
          <div className="ff-search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A6A6AE" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="@username or name" />
            {q && (
              <button className="ff-search-clear" onClick={() => setQ('')} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
        </div>

        {/* Scroll body */}
        <div className="ff-body">
          {/* Search results — new accounts to add */}
          {searching && newResults.length > 0 && (
            <div className="ff-section">
              <div className="ff-sec-head">
                <span className="ff-sec-title">ADD A PLAYER</span>
              </div>
              {newResults.map((u) => (
                <div key={u.id} className="ff-row ff-row-sug">
                  <Avatar avatar={u.avatar} size={40} />
                  <div className="ff-row-id">
                    <div className="ff-row-name">{u.username}</div>
                    <div className="ff-row-meta">@{u.handle}</div>
                  </div>
                  <button className={`ff-add${requested.has(u.id) ? ' added' : ''}`} onClick={() => addSearchResult(u)}>
                    {requested.has(u.id) ? 'REQUESTED ✓' : '+ ADD'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* REQUESTS */}
          {showRequests && (
            <div className="ff-section">
              <div className="ff-sec-head">
                <span className="ff-sec-title">REQUESTS</span>
                <span className="ff-sec-count">{requestRows.length}</span>
              </div>
              {requestRows.map((r) => (
                <div key={r.id} className="ff-req">
                  <Avatar avatar={r.avatar} size={42} />
                  <div className="ff-row-id">
                    <div className="ff-row-name">{r.name}</div>
                    {mutualCaption(r.mutual) && <div className="ff-mutual">{mutualCaption(r.mutual)}</div>}
                  </div>
                  <div className="ff-req-actions">
                    <button className="ff-decline" onClick={() => declineRequest(r.id)} aria-label={`Decline ${r.name}`}>
                      ×
                    </button>
                    <button className="ff-accept" onClick={() => acceptRequest(r)}>
                      ACCEPT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* YOUR FRIENDS */}
          <div className="ff-section">
            <div className="ff-sec-head">
              <span className="ff-sec-title">YOUR FRIENDS</span>
              <span className="ff-sec-dim">· {friendRows.length}</span>
            </div>
            {filteredFriends.map((f) => (
              <div key={f.key} className="ff-friend">
                <div className="ff-friend-main">
                  <span className="ff-av">
                    <Avatar avatar={f.avatar} size={42} />
                    <span className={`ff-dot${f.online ? ' online' : ''}`} />
                  </span>
                  <span className="ff-row-id">
                    <span className="ff-name-row">
                      <span className="ff-row-name">{f.name}</span>
                      <span className={`ff-status ff-status-${f.status}`}>
                        {f.status === 'online' ? 'ONLINE' : f.status === 'new' ? 'NEW' : f.last ? `${f.last} ago` : ''}
                      </span>
                    </span>
                    <span className="ff-row-meta">{f.handle}</span>
                  </span>
                </div>
                {f.removable && onRemove && (
                  <button className="ff-remove" onClick={() => onRemove(f.id)} aria-label={`Remove ${f.name}`}>
                    ×
                  </button>
                )}
              </div>
            ))}
            {searching && filteredFriends.length === 0 && newResults.length === 0 && (
              <div className="ff-empty">No friends match “{q}”.</div>
            )}
          </div>

          {/* SUGGESTED */}
          {showSuggested && (
            <div className="ff-section">
              <div className="ff-sec-head">
                <span className="ff-sec-title">SUGGESTED PLAYERS</span>
              </div>
              <div className="ff-sec-note">People you’ve played with, or friends of friends.</div>
              {suggested.map((s) => {
                const added = adding.has(s.id);
                return (
                  <div key={s.id} className="ff-row ff-row-sug">
                    <Avatar avatar={s.avatar} size={40} />
                    <div className="ff-row-id">
                      <div className="ff-row-name">{s.name}</div>
                      <div className="ff-row-meta">{mutualCaption(s.mutualCount, s.gamesTogether)}</div>
                    </div>
                    <button className={`ff-add${added ? ' added' : ''}`} onClick={() => !added && addSuggested(s)}>
                      {added ? 'ADDED ✓' : '+ ADD'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — invite */}
        <div className="ff-foot">
          <div className="ff-foot-head">
            <span className="ff-sec-title">NOT ON CLUB MAHJ YET?</span>
            <span className="ff-invite-link">clubmahj.com/i/{handle}</span>
          </div>
          <button className="ff-invite-cta" onClick={shareMore}>
            <span className="ff-invite-hatch" aria-hidden />
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
            <span>INVITE FROM CONTACTS</span>
          </button>
          <div className="ff-share-row">
            <button className="ff-share" onClick={() => openIntent(`sms:?&body=${encodeURIComponent(`${inviteText} ${inviteUrl}`)}`)}>
              <span className="ff-share-ic" style={{ background: '#34C759' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
                </svg>
              </span>
              <span className="ff-share-lbl">Messages</span>
            </button>
            <button className="ff-share" onClick={() => openIntent(`https://wa.me/?text=${encodeURIComponent(`${inviteText} ${inviteUrl}`)}`)}>
              <span className="ff-share-ic" style={{ background: '#25D366' }}>
                <svg width="23" height="23" viewBox="0 0 24 24" fill="#fff">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.36-.5.05-.97.24-3.27-.68-2.77-1.09-4.5-3.95-4.64-4.13-.13-.18-1.1-1.46-1.1-2.79s.7-1.98.95-2.25c.24-.27.53-.34.71-.34l.51.01c.16.01.39-.06.6.46.24.58.82 2 .89 2.14.07.14.12.31.02.49-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.18 1.53 1.91 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.6-.13.25.09 1.57.74 1.84.88.27.14.45.2.51.31.07.12.07.64-.17 1.32z" />
                </svg>
              </span>
              <span className="ff-share-lbl">WhatsApp</span>
            </button>
            <button className="ff-share" onClick={copyLink}>
              <span className="ff-share-ic ff-share-plain">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={copied ? '#15803D' : '#1A1410'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                  <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                </svg>
              </span>
              <span className="ff-share-lbl" style={copied ? { color: '#15803D' } : undefined}>{copied ? 'COPIED' : 'Copy Link'}</span>
            </button>
            <button className="ff-share" onClick={shareMore}>
              <span className="ff-share-ic ff-share-plain">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1A1410">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </span>
              <span className="ff-share-lbl">More</span>
            </button>
          </div>
          <button className="ff-done" onClick={onClose}>
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}

// Local sample directory for on-device (non-cloud) search.
const SAMPLE_PLAYERS: CloudFriend[] = [
  { id: 'sp-ruth', username: 'Ruth', handle: 'ruthtiles', avatar: { face: 'crack', color: '#E8455F' } },
  { id: 'sp-esther', username: 'Esther', handle: 'estherbam', avatar: { face: 'bam', color: '#1FA85B' } },
  { id: 'sp-grace', username: 'Grace', handle: 'gracem', avatar: { face: 'dot', color: '#2F80ED' } },
  { id: 'sp-dottie', username: 'Dottie', handle: 'dottie', avatar: { face: 'flower', color: '#E84C8A' } },
  { id: 'sp-sylvia', username: 'Sylvia', handle: 'sylviak', avatar: { face: 'dragon', char: '中', color: '#C0392B' } },
  { id: 'sp-joan', username: 'Joan', handle: 'joanjoker', avatar: { face: 'joker', color: '#7C5CE0' } },
];
