'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SAMPLE_CARD } from '../lib/cardData';
import type { Hand, Win, MahjongCard } from '../lib/types';
import { loadCustomCard } from '../lib/customCard';
import * as db from '../lib/storage';
import * as social from '../lib/social';
import BottomNav, { type Tab } from './BottomNav';
import CardTab from './CardTab';
import WinsTab from './WinsTab';
import GroupTab from './GroupTab';
import TablesTab from './TablesTab';
import LearnTab from './LearnTab';
import SettingsSheet from './SettingsSheet';
import Onboarding from './Onboarding';
import TrophyShelf from './TrophyShelf';
import Tutorial from './Tutorial';
import BadgeWatcher from './BadgeWatcher';
import CardEditor from './CardEditor';
import GameScorer from './GameScorer';
import { IconSettings } from './uiIcons';
import { clearCustomCard } from '../lib/customCard';
import { ConfettiProvider } from './Confetti';
import { applyTheme, getStoredTheme, setTheme as persistTheme, type ThemeId } from '../lib/themePrefs';
import {
  getAccount,
  getExperience,
  setExperience as persistExperience,
  tutorialSeen,
  setTutorialSeen,
  type Account,
  type Experience,
} from '../lib/account';
import { recordPlay } from '../lib/streak';

export default function AppShell() {
  const [tab, setTab] = useState<Tab>('card');
  const [loaded, setLoaded] = useState(false);
  const [handCounts, setHandCounts] = useState<Record<string, number>>({});
  const [handNotes, setHandNotes] = useState<Record<string, string>>({});
  const [wins, setWins] = useState<Win[]>([]);
  const [socialState, setSocialState] = useState<social.SocialState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setThemeState] = useState<ThemeId>('jade');
  const [account, setAccount] = useState<Account | null>(null);
  const [experience, setExperienceState] = useState<Experience>('beginner');
  const [accountChecked, setAccountChecked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [card, setCard] = useState<MahjongCard>(SAMPLE_CARD);
  const [editorOpen, setEditorOpen] = useState(false);
  const [scorerOpen, setScorerOpen] = useState(false);

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
    const cc = loadCustomCard();
    if (cc) setCard(cc);
    const sd = recordPlay();
    setStreak(sd.current);
    setBestStreak(sd.best);
    (async () => {
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
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

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
      return { ...prev, [handId]: next };
    });
  }, []);

  const addWin = useCallback((win: Win) => {
    setWins((prev) => [win, ...prev]);
    void db.saveWin(win);
  }, []);

  const removeWin = useCallback((id: string) => {
    setWins((prev) => prev.filter((w) => w.id !== id));
    void db.deleteWin(id);
  }, []);

  const postToGroup = useCallback((win: Win) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      const post: social.FeedPost = {
        id: crypto.randomUUID(),
        memberId: social.YOU_ID,
        memberName: prev.profile.name,
        avatar: prev.profile.avatar,
        handLabel: win.handLabel,
        note: win.note,
        photo: win.photo,
        createdAt: win.createdAt,
        likes: 0,
        likedByMe: false,
        comments: [],
      };
      void social.addFeedPost(post);
      return { ...prev, feed: [post, ...prev.feed] };
    });
  }, []);

  // Checking a hand off the card = an instant mahj: bump progress, log it to
  // your Mahjs journal, auto-post it to the feed, and hand back the Win so the
  // celebration can offer sharing.
  const cardMahj = useCallback(
    (hand: Hand): Win => {
      const win: Win = {
        id: crypto.randomUUID(),
        handId: hand.id,
        handLabel: hand.notation,
        note: '',
        photo: null,
        createdAt: Date.now(),
      };
      bumpHand(hand.id, +1);
      addWin(win);
      postToGroup(win);
      return win;
    },
    [bumpHand, addWin, postToGroup],
  );

  const toggleLike = useCallback((id: string, liked: boolean) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      void social.toggleLike(id, liked);
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
      return {
        ...prev,
        feed: prev.feed.map((p) =>
          p.id === id ? { ...p, comments: [...p.comments, comment] } : p,
        ),
      };
    });
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

  const saveProfile = useCallback((profile: social.Profile) => {
    setSocialState((prev) => {
      if (!prev) return prev;
      void social.saveProfile(profile);
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

  const changeExperience = useCallback((e: Experience) => {
    persistExperience(e);
    setExperienceState(e);
  }, []);

  const finishOnboarding = useCallback((a: Account) => {
    setAccount(a);
    setExperienceState(a.experience);
    if (!tutorialSeen()) setShowTutorial(true);
    // Adopt the chosen username as the profile name.
    setSocialState((prev) => {
      if (!prev) return prev;
      const profile: social.Profile = {
        ...prev.profile,
        name: a.username,
        avatar: { ...prev.profile.avatar, char: a.username.trim().charAt(0).toUpperCase() || 'Y' },
      };
      void social.saveProfile(profile);
      return {
        ...prev,
        profile,
        members: prev.members.map((m) =>
          m.isYou ? { ...m, name: profile.name, avatar: profile.avatar } : m,
        ),
      };
    });
  }, []);

  // First launch → onboarding (account + experience level).
  if (accountChecked && !account) {
    return <Onboarding onDone={finishOnboarding} />;
  }

  return (
    <ConfettiProvider>
      <div className="app">
        <button className="gear" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <IconSettings size={22} />
        </button>

        <BadgeWatcher card={card} handCounts={handCounts} bestStreak={bestStreak} />

        {!loaded ? (
          <div className="screen" style={{ display: 'grid', placeItems: 'center' }}>
            <div className="empty">
              <div className="big">🀄🀫🀐</div>
              Stacking the wall…
            </div>
          </div>
        ) : (
          <>
            {tab === 'card' && (
              <CardTab
                card={card}
                handCounts={handCounts}
                onBump={bumpHand}
                onMahj={cardMahj}
                experience={experience}
                streak={streak}
                onScore={() => setScorerOpen(true)}
              />
            )}
            {tab === 'wins' && (
              <WinsTab
                card={card}
                handNotes={handNotes}
                wins={wins}
                groupName={socialState?.group.name ?? 'your table'}
                onAddWin={addWin}
                onRemoveWin={removeWin}
                onBump={bumpHand}
                onPostToGroup={postToGroup}
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
              />
            )}
            {tab === 'tables' && socialState && <TablesTab profile={socialState.profile} />}
            {tab === 'learn' && <LearnTab experience={experience} />}
          </>
        )}
        <BottomNav tab={tab} onChange={setTab} />
      </div>

      {settingsOpen && socialState && (
        <SettingsSheet
          profile={socialState.profile}
          theme={theme}
          experience={experience}
          onSaveProfile={saveProfile}
          onTheme={changeTheme}
          onExperience={changeExperience}
          onTrophies={() => {
            setSettingsOpen(false);
            setTrophyOpen(true);
          }}
          onEditCard={() => {
            setSettingsOpen(false);
            setEditorOpen(true);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {editorOpen && (
        <CardEditor
          current={card}
          onSave={(c) => setCard(c)}
          onUseSample={() => {
            clearCustomCard();
            setCard(SAMPLE_CARD);
          }}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {scorerOpen && (
        <GameScorer
          suggestedNames={[
            socialState?.profile.name ?? 'You',
            ...(socialState?.members.filter((m) => !m.isYou).map((m) => m.name) ?? []),
          ].slice(0, 4)}
          onClose={() => setScorerOpen(false)}
        />
      )}

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
    </ConfettiProvider>
  );
}
