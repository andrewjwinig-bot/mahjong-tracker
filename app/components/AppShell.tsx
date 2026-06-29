'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_CARD } from '../lib/cardData';
import type { Win, MahjongCard } from '../lib/types';
import { loadCustomCard, saveCustomCard, purgeLegacyCardPhoto } from '../lib/customCard';
import { isDemoMode } from '../lib/demo';
import { getScanEnabled, setScanEnabled } from '../lib/cardScan';
import * as db from '../lib/storage';
import {
  cloudSignedIn,
  syncGameplay,
  syncCustomCard,
  pushCloudProfile,
  mirrorHandCount,
  mirrorWin,
  mirrorRemoveWin,
} from '../lib/cloudSync';
import {
  loadCloudFeed,
  mirrorCreatePost,
  mirrorToggleLike,
  mirrorAddComment,
  reportPost as cloudReportPost,
  blockUser as cloudBlockUser,
} from '../lib/cloudSocial';
import * as social from '../lib/social';
import BottomNav, { type Tab } from './BottomNav';
import CardTab from './CardTab';
import GroupTab from './GroupTab';
import LoadingWall from './LoadingWall';
import Splash from './Splash';
import TablesTab from './TablesTab';
import { loadTables, unreadCount, resolveGroupTableId, appendTableMessage } from '../lib/tables';
import type { ChatMsg } from '../lib/tables';
import LearnTab from './LearnTab';
import SettingsSheet from './SettingsSheet';
import Onboarding from './Onboarding';
import TrophyShelf from './TrophyShelf';
import Tutorial from './Tutorial';
import BadgeWatcher from './BadgeWatcher';
import CardEditor from './CardEditor';
import GameScorer from './GameScorer';
import PracticeSheet from './PracticeSheet';
import TipPopup from './TipPopup';
import { IconSettings } from './uiIcons';
import { ConfettiProvider } from './Confetti';
import { applyTheme, getStoredTheme, setTheme as persistTheme, type ThemeId } from '../lib/themePrefs';
import {
  getAccount,
  getExperience,
  setExperience as persistExperience,
  earnedLevel,
  clearAccount,
  tutorialSeen,
  setTutorialSeen,
  type Account,
  type Experience,
} from '../lib/account';
import { recordPlay } from '../lib/streak';

/** The chat line posted to your table when you share a mahj. */
function mahjChatText(win: Win): string {
  let text = '🀄 I got mahj!';
  if (win.handLabel) text += ` — ${win.handLabel}`;
  if (win.note) text += ` · ${win.note}`;
  if (win.photo || win.photoUrl) text += ' 📷';
  return text;
}

export default function AppShell() {
  const [tab, setTab] = useState<Tab>('group');
  const [loaded, setLoaded] = useState(false);
  // Cold-launch splash ("Washing the Tiles"). Plays once on mount; a warm resume
  // doesn't remount React, so it naturally only shows on cold start.
  const [splashDone, setSplashDone] = useState(false);
  // Welcome animation floor: keep the "Stacking the wall" greeting up for at
  // least a beat on cold app-open (data loads near-instantly on-device), so it
  // reads as an intentional welcome. Once per open — not on tab switches.
  const [minElapsed, setMinElapsed] = useState(false);
  const [handCounts, setHandCounts] = useState<Record<string, number>>({});
  const [handNotes, setHandNotes] = useState<Record<string, string>>({});
  const [wins, setWins] = useState<Win[]>([]);
  const [socialState, setSocialState] = useState<social.SocialState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Unread chat messages across your tables → a badge on the Tables nav so you
  // don't miss messages from friends. `unreadTick` bumps to force a recompute
  // after a table is opened (marked read).
  const [tablesUnread, setTablesUnread] = useState(0);
  const [unreadTick, setUnreadTick] = useState(0);
  const [theme, setThemeState] = useState<ThemeId>('felt');
  const [account, setAccount] = useState<Account | null>(null);
  const [experience, setExperienceState] = useState<Experience>('beginner');
  const [accountChecked, setAccountChecked] = useState(false);
  // Best streak still feeds trophies/badges; the live day-streak is no longer
  // surfaced in the UI (a daily streak doesn't fit a weekly social game).
  const [bestStreak, setBestStreak] = useState(0);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [card, setCard] = useState<MahjongCard>(SAMPLE_CARD);
  // Demo vs. real data (sample card, friends, feed, tables). Read once on mount
  // from isDemoMode(); a Settings toggle persists it and reloads the app.
  const [demo, setDemo] = useState(true);
  // Card scanning is a runtime toggle (Settings) so one build can demo with or
  // without it.
  const [scanEnabled, setScanEnabledState] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  // "Scan my card" opens the editor straight into the capture flow.
  const [editorAutoScan, setEditorAutoScan] = useState(false);
  // Set when a guided scan finishes, so My Card fires the "hands saved" toast +
  // confetti exactly once on landing.
  const [scanCelebration, setScanCelebration] = useState<{ count: number; year: number } | null>(null);
  const openEditor = useCallback((scan = false) => {
    setEditorAutoScan(scan);
    setEditorOpen(true);
  }, []);
  const [scorerOpen, setScorerOpen] = useState(false);
  // Optional pre-seeded players for the scorer (e.g. a table's members).
  type ScorerSeed = { suggestedNames: string[]; friends: { name: string; avatar: social.TileAvatar }[] };
  const [scorerSeed, setScorerSeed] = useState<ScorerSeed | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  // A table to deep-link into (e.g. from the Feed's "next game" card).
  const [tablesTarget, setTablesTarget] = useState<string | null>(null);

  const openScorer = useCallback((seed?: ScorerSeed) => {
    setScorerSeed(seed ?? null);
    setScorerOpen(true);
  }, []);

  // Reconcile on-device gameplay with the cloud (no-op unless cloud is on AND
  // signed in). Two-way merge doubles as the first-login migration: local-only
  // data is pushed up, cloud-only data is pulled down. Runs in the background
  // after the local-first load and again right after sign-in / sign-up.
  const reconcileCloud = useCallback(async () => {
    if (!(await cloudSignedIn())) return;
    const [counts, w] = await Promise.all([db.loadHandCounts(), db.loadWins()]);
    const merged = await syncGameplay({ handCounts: counts, wins: w });
    if (merged) {
      // The merge ran against a snapshot taken before this await; the UI was
      // already interactive, so fold the cloud result INTO the latest state
      // (max for counts, union by id for wins) instead of replacing it — a bump
      // or new mahj made during the sync window must not be clobbered.
      setHandCounts((prev) => {
        const next = { ...merged.handCounts };
        for (const [h, c] of Object.entries(prev)) next[h] = Math.max(next[h] ?? 0, c);
        return next;
      });
      setWins((prev) => {
        const byId = new Map(merged.wins.map((win) => [win.id, win]));
        for (const win of prev) if (!byId.has(win.id)) byId.set(win.id, win);
        return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
      });
      // Persist the merged view locally so it survives the next cold start.
      await Promise.all(Object.entries(merged.handCounts).map(([h, c]) => db.setHandCount(h, c)));
      await Promise.all(merged.wins.map((win) => db.saveWin(win)));
    }
    const syncedCard = await syncCustomCard(loadCustomCard());
    if (syncedCard) {
      setCard(syncedCard);
      saveCustomCard(syncedCard);
    }
    // Replace the demo feed with the real cloud feed (empty for new users).
    const cloudFeed = await loadCloudFeed();
    if (cloudFeed) setSocialState((prev) => (prev ? { ...prev, feed: cloudFeed } : prev));
  }, []);

  // Load all local state once on mount.
  useEffect(() => {
    let alive = true;
    const t = getStoredTheme();
    setThemeState(t);
    applyTheme(t);
    const acc = getAccount();
    setAccount(acc);
    setExperienceState(getExperience());
    setAccountChecked(true);
    if (acc && !tutorialSeen()) setShowTutorial(true);
    setDemo(isDemoMode());
    const cc = loadCustomCard();
    if (cc) setCard(cc);
    setScanEnabledState(getScanEnabled());
    const sd = recordPlay();
    setBestStreak(sd.best);
    (async () => {
      try {
        const [counts, notes, w, s] = await Promise.all([
          db.loadHandCounts(),
          db.loadHandNotes(),
          db.loadWins(),
          social.loadSocial(),
        ]);
        if (!alive) return;
        setHandCounts(counts);
        setHandNotes(notes);
        setWins(w);
        setSocialState(s);
      } finally {
        // Always dismiss the splash, even if a loader rejects — a failed load
        // should fall back to empty state, never a permanent loading screen.
        if (alive) setLoaded(true);
      }
      // Background reconcile with the cloud once the local-first UI is up.
      void reconcileCloud();
      // One-time cleanup of the no-longer-used card reference photo.
      void purgeLegacyCardPhoto();
    })();
    return () => {
      alive = false;
    };
  }, [reconcileCloud]);

  // Hold the welcome animation for a short minimum so it's actually seen.
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 700);
    return () => clearTimeout(t);
  }, []);

  // Recompute the Tables unread badge once we know who "you" are, and whenever
  // the tab changes or a table is opened/marked read (unreadTick).
  useEffect(() => {
    if (!socialState) return;
    let alive = true;
    void loadTables().then((tables) => {
      if (alive) setTablesUnread(unreadCount(tables, socialState.profile.name));
    });
    return () => {
      alive = false;
    };
  }, [socialState, tab, unreadTick]);

  // Live leaderboard stats for the local user, derived from their tracker.
  const youStats = useMemo(() => {
    let handsCleared = 0;
    let points = 0;
    for (const h of card.hands) {
      const c = handCounts[h.id] ?? 0;
      if (c > 0) handsCleared += 1;
      points += c * h.points;
    }
    return { handsCleared, points };
  }, [handCounts, card]);

  const bumpHand = useCallback((handId: string, delta: number) => {
    setHandCounts((prev) => {
      const next = Math.max(0, (prev[handId] ?? 0) + delta);
      void db.setHandCount(handId, next);
      mirrorHandCount(handId, next);
      return { ...prev, [handId]: next };
    });
  }, []);

  const addWin = useCallback((win: Win) => {
    setWins((prev) => [win, ...prev]);
    void db.saveWin(win);
    mirrorWin(win);
  }, []);

  // Mirror of `wins` for synchronous lookups (e.g. resolving a removed win's
  // hand before its row is filtered out).
  const winsRef = useRef<Win[]>([]);
  useEffect(() => {
    winsRef.current = wins;
  }, [wins]);

  const removeWin = useCallback(
    (id: string) => {
      // Deleting a logged mahj must also un-count its hand — otherwise the row
      // disappears but the hand stays "cleared" and the stats stay inflated.
      const removed = winsRef.current.find((w) => w.id === id);
      setWins((prev) => prev.filter((w) => w.id !== id));
      if (removed?.handId) bumpHand(removed.handId, -1);
      void db.deleteWin(id);
      mirrorRemoveWin(id);
    },
    [bumpHand],
  );

  // Sharing a mahj drops it into the chat of the table you play with (the crew
  // behind your group), so it lands where your friends actually talk — not in a
  // separate feed they'd never check. Routed to the table matching your group.
  const postToGroup = useCallback(
    (win: Win) => {
      if (!socialState) return;
      const { profile, group } = socialState;
      const msg: ChatMsg = {
        id: crypto.randomUUID(),
        author: profile.name,
        avatar: profile.avatar,
        text: mahjChatText(win),
        createdAt: win.createdAt,
      };
      void (async () => {
        const tableId = await resolveGroupTableId(group);
        if (tableId) {
          await appendTableMessage(tableId, msg);
          // Nudge the Tables badge/state to recompute on next read.
          setUnreadTick((n) => n + 1);
        }
      })();
    },
    [socialState],
  );

  // Post a celebratory milestone to the feed (section/card/challenge cleared,
  // game won) — distinct from a mahj post, layered on top of it.
  const postMilestone = useCallback(
    (kind: social.FeedKind, title: string, note = '') => {
      setSocialState((prev) => {
        if (!prev) return prev;
        const post: social.FeedPost = {
          id: crypto.randomUUID(),
          memberId: social.YOU_ID,
          memberName: prev.profile.name,
          avatar: prev.profile.avatar,
          handLabel: null,
          note,
          photo: null,
          createdAt: Date.now(),
          likes: 0,
          likedByMe: false,
          comments: [],
          kind,
          title,
        };
        void social.addFeedPost(post);
        mirrorCreatePost(post);
        return { ...prev, feed: [post, ...prev.feed] };
      });
    },
    [],
  );

  // Checking a hand off the card = an instant mahj: bump progress, log it to
  const toggleLike = useCallback((id: string, liked: boolean) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      void social.toggleLike(id, liked);
      mirrorToggleLike(id, liked);
      return {
        ...prev,
        feed: prev.feed.map((p) =>
          p.id === id ? { ...p, likedByMe: liked, likes: Math.max(0, p.likes + (liked ? 1 : -1)) } : p,
        ),
      };
    });
  }, []);

  const addCommentToPost = useCallback((id: string, text: string) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      const comment: social.Comment = {
        id: crypto.randomUUID(),
        author: prev.profile.name,
        avatar: prev.profile.avatar,
        text,
        createdAt: Date.now(),
      };
      void social.addComment(id, comment);
      mirrorAddComment(id, text);
      return {
        ...prev,
        feed: prev.feed.map((p) =>
          p.id === id ? { ...p, comments: [...p.comments, comment] } : p,
        ),
      };
    });
  }, []);

  // Moderation: flag a post for review, or block a user (hides their content
  // and removes their posts from your feed immediately). Cloud-only.
  const handleReportPost = useCallback((id: string, authorId: string) => {
    cloudReportPost(id, authorId);
  }, []);

  const handleBlockUser = useCallback((memberId: string) => {
    cloudBlockUser(memberId);
    setSocialState((prev) =>
      prev ? { ...prev, feed: prev.feed.filter((p) => p.memberId !== memberId) } : prev,
    );
  }, []);

  const addFriend = useCallback((name: string, avatar: social.TileAvatar) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      const member: social.GroupMember = {
        id: `fr_${Date.now()}`,
        name,
        avatar,
        isYou: false,
        handsCleared: 0,
        points: 0,
      };
      void social.addMember(member);
      return { ...prev, members: [...prev.members, member] };
    });
  }, []);

  const removeFriend = useCallback((id: string) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      void social.removeMember(id);
      return { ...prev, members: prev.members.filter((m) => m.id !== id) };
    });
  }, []);

  // Stable callback so TablesTab's mark-read effect doesn't re-fire in a loop.
  const onTablesRead = useCallback(() => setUnreadTick((n) => n + 1), []);

  const saveProfile = useCallback((profile: social.Profile) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      void social.saveProfile(profile);
      void pushCloudProfile(profile);
      // Reflect new identity on your existing posts + comments + member row.
      return {
        ...prev,
        profile,
        members: prev.members.map((m) =>
          m.isYou ? { ...m, name: profile.name, avatar: profile.avatar } : m,
        ),
        feed: prev.feed.map((p) =>
          p.memberId === social.YOU_ID
            ? { ...p, memberName: profile.name, avatar: profile.avatar }
            : p,
        ),
      };
    });
  }, []);

  const changeTheme = useCallback((id: ThemeId) => {
    persistTheme(id);
    setThemeState(id);
  }, []);

  // Experience auto-levels up in the background as you play (set once at
  // onboarding, never demoted), so the tips deepen over time instead of leaving
  // a beginner on beginner tips forever. Recomputes when wins/progress change.
  useEffect(() => {
    const mahjs = wins.length;
    const cleared = Object.values(handCounts).filter((c) => c > 0).length;
    setExperienceState((prev) => {
      const next = earnedLevel(prev, { mahjs, cleared });
      if (next !== prev) persistExperience(next);
      return next;
    });
  }, [wins, handCounts]);

  const changeScanEnabled = useCallback((on: boolean) => {
    setScanEnabled(on);
    setScanEnabledState(on);
  }, []);

  // The real app is empty until the user scans their own card; demo mode shows
  // the sample as the card. (isDemoMode is read once on mount into `demo`.)
  const needsCard = !demo && card.source !== 'custom';

  const finishOnboarding = useCallback((a: Account, pickedAvatar?: social.TileAvatar, opts?: { isNewUser?: boolean }) => {
    setAccount(a);
    setExperienceState(a.experience);
    // The first-run tour is for brand-new sign-ups only. A returning sign-in
    // skips it — and we mark it seen so it won't surface on later app opens.
    if (opts?.isNewUser === false) setTutorialSeen();
    else if (!tutorialSeen()) setShowTutorial(true);
    // Adopt the chosen username as the profile name + the tile picked at sign-up.
    const initial = a.username.trim().charAt(0).toUpperCase() || 'Y';
    setSocialState((prev) => {
      if (!prev) return prev;
      const avatar: social.TileAvatar = pickedAvatar
        ? { ...pickedAvatar, char: pickedAvatar.face === 'letter' ? initial : pickedAvatar.char }
        : { ...prev.profile.avatar, char: initial };
      const profile: social.Profile = { ...prev.profile, name: a.username, avatar };
      void social.saveProfile(profile);
      void pushCloudProfile(profile);
      return {
        ...prev,
        profile,
        members: prev.members.map((m) => (m.isYou ? { ...m, name: profile.name, avatar } : m)),
      };
    });
    // Now that a session exists, pull this user's cloud data (returning user)
    // or push the on-device data up (first-login migration for a new signup).
    void reconcileCloud();
  }, [reconcileCloud]);

  return (
    <ConfettiProvider>
      {/* Cold-launch splash overlays both onboarding and the app, so it always
          plays once on a fresh load regardless of auth state. */}
      {!splashDone && <Splash ready={loaded} onDone={() => setSplashDone(true)} />}
      {accountChecked && !account ? (
        // First launch → onboarding (account + experience level).
        <Onboarding onDone={finishOnboarding} />
      ) : (
        <>
      <div className="app">
        <button className="gear" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <IconSettings size={22} />
        </button>

        {/* Mount only after the initial load so the "already earned" baseline is
            captured with real data — otherwise prior trophies re-toast on login. */}
        {loaded && <BadgeWatcher card={card} handCounts={handCounts} bestStreak={bestStreak} />}

        {!loaded || !minElapsed ? (
          <div className="screen" style={{ display: 'grid', placeItems: 'center' }}>
            <LoadingWall name={account?.username} />
          </div>
        ) : (
          <>
            {tab === 'card' && (
              <CardTab
                card={card}
                handCounts={handCounts}
                bestStreak={bestStreak}
                handNotes={handNotes}
                wins={wins}
                feed={socialState?.feed ?? []}
                groupName={socialState?.group.name ?? 'your table'}
                onBump={bumpHand}
                onAddWin={addWin}
                onRemoveWin={removeWin}
                onPostToGroup={postToGroup}
                onMilestone={postMilestone}
                onTrophies={() => setTrophyOpen(true)}
                needsCard={needsCard}
                scanEnabled={scanEnabled}
                onAddCard={() => openEditor(false)}
                onScanCard={() => openEditor(true)}
                scanCelebration={scanCelebration}
                onScanCelebrationDone={() => setScanCelebration(null)}
              />
            )}
            {tab === 'group' && socialState && (
              <GroupTab
                members={socialState.members}
                feed={socialState.feed}
                profile={socialState.profile}
                youStats={youStats}
                handCounts={handCounts}
                onToggleLike={toggleLike}
                onAddComment={addCommentToPost}
                onAddFriend={addFriend}
                onRemoveFriend={removeFriend}
                onReport={handleReportPost}
                onBlock={handleBlockUser}
                onScore={() => {
                  // Same behavior as "Score this table": pre-seed the players if
                  // you have a small crew (≤3 friends → you + everyone, all
                  // auto-selected), but with a bigger crew start with nothing
                  // selected so you pick who's at the table.
                  const others = socialState.members
                    .filter((m) => !m.isYou)
                    .map((m) => ({ name: m.name, avatar: m.avatar }));
                  openScorer({
                    suggestedNames:
                      others.length <= 3
                        ? [socialState.profile.name, ...others.map((m) => m.name)]
                        : [socialState.profile.name],
                    friends: others,
                  });
                }}
                onOpenTables={(id) => {
                  setTablesTarget(id);
                  setTab('tables');
                }}
              />
            )}
            {tab === 'tables' && socialState && (
              <TablesTab
                profile={socialState.profile}
                openTableId={tablesTarget}
                onConsumedOpen={() => setTablesTarget(null)}
                onTablesRead={onTablesRead}
                onAddFriend={addFriend}
                friends={socialState.members
                  .filter((m) => !m.isYou)
                  .map((m) => ({ name: m.name, avatar: m.avatar }))}
                onScoreTable={(members) => {
                  const others = members.filter((m) => m.name !== socialState.profile.name);
                  openScorer({
                    suggestedNames: [socialState.profile.name, ...others.map((m) => m.name)].slice(0, 4),
                    friends: others,
                  });
                }}
              />
            )}
            {tab === 'learn' && <LearnTab experience={experience} onPractice={() => setPracticeOpen(true)} />}
          </>
        )}
        <BottomNav tab={tab} onChange={setTab} badges={{ tables: tablesUnread }} />
      </div>

      {/* Daily tip — a once-a-day slide-up on first open, not permanent chrome. */}
      {loaded && minElapsed && <TipPopup experience={experience} />}

      {settingsOpen && socialState && (
        <SettingsSheet
          profile={socialState.profile}
          theme={theme}
          onSignOut={() => {
            clearAccount();
            setSettingsOpen(false);
            setAccount(null);
          }}
          onSaveProfile={saveProfile}
          onTheme={changeTheme}
          scanEnabled={scanEnabled}
          onScanEnabled={changeScanEnabled}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {editorOpen && (
        <CardEditor
          current={card}
          scanEnabled={scanEnabled}
          autoScan={editorAutoScan}
          onSave={(c) => setCard(c)}
          onScanComplete={(info) => {
            // Guided scan committed — land on My Card and celebrate once.
            setTab('card');
            setScanCelebration(info);
          }}
          onClose={() => {
            setEditorOpen(false);
            setEditorAutoScan(false);
          }}
        />
      )}

      {scorerOpen && (
        <GameScorer
          suggestedNames={
            scorerSeed?.suggestedNames ??
            [
              socialState?.profile.name ?? 'You',
              ...(socialState?.members.filter((m) => !m.isYou).map((m) => m.name) ?? []),
            ].slice(0, 4)
          }
          friends={
            scorerSeed?.friends ??
            (socialState?.members ?? [])
              .filter((m) => !m.isYou)
              .map((m) => ({ name: m.name, avatar: m.avatar }))
          }
          me={
            socialState
              ? { name: socialState.profile.name, avatar: socialState.profile.avatar }
              : undefined
          }
          card={card}
          handNotes={handNotes}
          onGameWon={(r) => {
            if (r.winnerName && socialState && r.winnerName === socialState.profile.name) {
              const line = r.players.map((p) => `${p.name} ${p.score > 0 ? '+' : ''}${p.score}`).join(' · ');
              postMilestone('game_won', 'Won game night', line);
            }
          }}
          onClose={() => {
            setScorerOpen(false);
            setScorerSeed(null);
          }}
        />
      )}

      {practiceOpen && <PracticeSheet card={card} onClose={() => setPracticeOpen(false)} />}

      {trophyOpen && socialState && (
        <TrophyShelf
          card={card}
          handCounts={handCounts}
          wins={wins}
          bestStreak={bestStreak}
          memberSince={account?.createdAt}
          profile={socialState.profile}
          onClose={() => setTrophyOpen(false)}
        />
      )}

      {showTutorial && (
        <Tutorial
          onDone={() => {
            setTutorialSeen();
            setShowTutorial(false);
          }}
        />
      )}
        </>
      )}
    </ConfettiProvider>
  );
}
