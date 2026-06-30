'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import OfficialCardCallout from './OfficialCardCallout';
import PageTitle from './PageTitle';
import Tile from './Tile';
import LessonModal from './LessonModal';
import { useConfetti } from './Confetti';
import type { TileFace } from '../lib/tileArt';
import type { Experience } from '../lib/account';
import { TOTAL_HANDS } from '../lib/cardData';
import {
  LESSONS,
  loadCompleted,
  markCompleted,
  isUnlocked,
  type IconKey,
  type Lesson,
} from '../lib/lessons';
import {
  IconTarget,
  IconShuffle,
  IconUsers,
  IconUser,
  IconCard,
  IconShield,
  IconHelp,
  IconCheck,
  IconStar,
  IconLock,
  IconBook,
} from './uiIcons';

const LESSON_ICON: Record<IconKey, (s: number) => ReactNode> = {
  card: (s) => <IconCard size={s} />,
  shuffle: (s) => <IconShuffle size={s} />,
  target: (s) => <IconTarget size={s} />,
  meld: (s) => <IconUsers size={s} />,
  compass: (s) => <IconStar size={s} />,
  shield: (s) => <IconShield size={s} />,
};

// Two tracks, in our voice. Indices map into LESSONS in order.
const TRACKS: { name: string; tag: string; ids: string[] }[] = [
  { name: 'The basics', tag: 'START HERE', ids: ['tiles', 'charleston', 'card', 'melds'] },
  { name: 'Playing to win', tag: 'STRATEGY', ids: ['choose', 'defense'] },
];

interface Section {
  icon: ReactNode;
  title: string;
  body: React.ReactNode;
  levels?: Experience[];
}

/* ---- Visual tile guide (reference) ---------------------------------------- */

function TileRow({
  tiles,
  name,
  desc,
}: {
  tiles: { face: TileFace; char?: string; color?: string }[];
  name: string;
  desc: string;
}) {
  return (
    <div className="tg-row">
      <div className="tg-tiles">
        {tiles.map((t, i) => (
          <Tile key={i} face={t.face} char={t.char} color={t.color} size={34} />
        ))}
      </div>
      <div className="tg-text">
        <div className="tg-name">{name}</div>
        <div className="tg-desc">{desc}</div>
      </div>
    </div>
  );
}

function TileGuide() {
  return (
    <div className="tile-guide">
      <TileRow tiles={[{ face: 'bam' }]} name="Bams (Bamboo) · 1–9" desc="One of the three suits. The “1 Bam” is traditionally drawn as a little bird." />
      <TileRow tiles={[{ face: 'crack' }]} name="Cracks (Characters) · 1–9" desc="The 萬 (“wan”) suit, 1 through 9 — the top symbol is the number." />
      <TileRow tiles={[{ face: 'dot' }]} name="Dots (Circles) · 1–9" desc="Circles, 1 through 9. Also called “bings.” Three suits total: bams, cracks, dots." />
      <TileRow
        tiles={[
          { face: 'wind', char: 'N' },
          { face: 'wind', char: 'E' },
          { face: 'wind', char: 'W' },
          { face: 'wind', char: 'S' },
        ]}
        name="Winds · N E W S"
        desc="Four winds — North, East, West, South. On the card they show as the letters N, E, W, S."
      />
      <TileRow
        tiles={[
          { face: 'dragon', char: '中', color: '#E8455F' },
          { face: 'dragon', char: '發', color: '#1FA85B' },
          { face: 'dragon', char: '白', color: '#2F80ED' },
        ]}
        name="Dragons · Red · Green · White"
        desc="Three dragons — Red 中, Green 發, and White (the “soap”). Each pairs with a suit."
      />
      <TileRow tiles={[{ face: 'flower' }]} name="Flowers & Seasons" desc="Eight bonus tiles. Often interchangeable on the card and shown as “F.”" />
      <TileRow tiles={[{ face: 'joker' }]} name="Jokers" desc="Wild! Jokers stand in for any tile inside a pung, kong, or quint — never in a pair or single." />
    </div>
  );
}

/* ---- Small reference visuals (match the lesson look without modal flows) --- */

// A felt table showing who sits where + which Charleston passes are legal, for
// the 3- and 2-player house variations. Empty seats are ghosted so the missing
// "across" pass reads at a glance.
function TableDiagram({ players }: { players: 3 | 2 }) {
  const filled =
    players === 3
      ? { bottom: 'You', left: ' ', right: ' ', top: null }
      : { bottom: 'You', top: 'Them', left: null, right: null };
  const passes =
    players === 3
      ? [{ d: 'Right', ok: true }, { d: 'Across', ok: false }, { d: 'Left', ok: true }]
      : [{ d: 'Right', ok: true }, { d: 'Left', ok: true }];
  return (
    <div className="rg-table">
      <div className="rg-felt">
        {(['top', 'left', 'right', 'bottom'] as const).map((p) => {
          const label = filled[p];
          if (label === null) return <span key={p} className={`rg-seat rg-seat-${p} ghost`} aria-hidden />;
          return (
            <span key={p} className={`rg-seat rg-seat-${p}${label === 'You' ? ' is-you' : ''}`}>{label.trim()}</span>
          );
        })}
        <span className="rg-felt-mark" aria-hidden><b>CLUB</b><i>Mahj</i></span>
      </div>
      <div className="rg-passes">
        {passes.map((p) => (
          <span key={p.d} className={`rg-pass ${p.ok ? 'ok' : 'no'}`}>{p.d} {p.ok ? '✓' : '✕'}</span>
        ))}
      </div>
    </div>
  );
}

// A mini "collect them all" board: light up every cell to clear the card.
function ClearBoard() {
  const cleared = Math.round(TOTAL_HANDS * 0.62); // illustrative fill, not live progress
  return (
    <div className="rg-board">
      <div className="rg-board-grid">
        {Array.from({ length: TOTAL_HANDS }).map((_, i) => (
          <span key={i} className="rg-cell" data-on={i < cleared} />
        ))}
      </div>
      <div className="rg-board-cap">
        <span aria-hidden>👑</span> Light up all {TOTAL_HANDS} hands before next year’s card.
      </div>
    </div>
  );
}

/* ---- Reference sections (the old deep-dive content, kept for lookups) ------ */

const SECTIONS: Section[] = [
  { icon: <IconCard size={18} />, title: 'Tile reference', body: <TileGuide /> },
  {
    icon: <IconUsers size={18} />,
    title: 'Playing with 3 players',
    body: (
      <>
        <TableDiagram players={3} />
        <p>The card is built for four, but three works great with a couple of house tweaks (most casual tables play it this way):</p>
        <ul>
          <li>Deal as normal — each player still gets 13 tiles.</li>
          <li>In the Charleston, <strong>skip the “across” passes</strong> (there’s no one across) — just do the right and left passes.</li>
          <li>Everything else is identical: draw, discard, call, and aim for a hand on the card.</li>
          <li>Hands tend to go faster and the wall lasts longer, so you’ll see more tiles.</li>
        </ul>
      </>
    ),
  },
  {
    icon: <IconUser size={18} />,
    title: 'Playing with 2 players',
    body: (
      <>
        <TableDiagram players={2} />
        <p>Two-player mahjong is a quick, punchy version — perfect for practice:</p>
        <ul>
          <li>Each player draws 13 tiles.</li>
          <li>Charleston is reduced to a single <strong>pass right, then pass left</strong> (or skip it entirely).</li>
          <li>Take turns drawing and discarding; you can call the other player’s discards as usual.</li>
          <li>Same card, same jokers, same goal — just faster and more tactical.</li>
        </ul>
        <p style={{ color: 'var(--muted)', fontWeight: 700 }}>(2- and 3-player rules are common house variations, not official NMJL tournament rules.)</p>
      </>
    ),
  },
  {
    icon: <IconCheck size={18} />,
    title: 'What does “clearing the card” mean?',
    body: (
      <>
        <ClearBoard />
        <p>The yearlong challenge: win <strong>every hand on the card at least once</strong> before next April’s new card drops. It’s the “collect them all” of mahjong.</p>
        <p>The <strong>Card</strong> tab shows how many hands you’ve cleared, your total wins, and your points. Use the <strong>To Go</strong> filter to see what’s left to hunt.</p>
      </>
    ),
  },
  {
    icon: <IconHelp size={18} />,
    title: 'FAQ',
    body: (
      <>
        <p><strong>Is my data private?</strong> You can use the app without an account — then your data stays on your device. If you create an account, your gameplay and profile sync securely to the cloud, and you can export or delete everything anytime. See our{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
        <p><strong>Is this the official NMJL card?</strong> No. This is a sample card so you can try the app. Licensed/official cards are planned.</p>
        <p><strong>What happens in April?</strong> A new card comes out each spring. Future versions will let you load the new year without losing your history.</p>
      </>
    ),
  },
];

const SUBTITLE: Record<Experience, string> = {
  beginner: 'New to the tiles? Start here, bam-beginner. 🀐',
  intermediate: 'Sharpen up — lessons, the Charleston & strategy. 🀄',
  expert: 'Deep cuts — strategy & defense for sharks. 🐉',
};

/* ---- Lesson path node ----------------------------------------------------- */

function LessonNode({
  lesson,
  index,
  state,
  onOpen,
}: {
  lesson: Lesson;
  index: number;
  state: 'done' | 'current' | 'open' | 'locked';
  onOpen: () => void;
}) {
  const locked = state === 'locked';
  return (
    <button className="lp-node" data-state={state} disabled={locked} onClick={locked ? undefined : onOpen}>
      <span className="lp-dot" aria-hidden>
        {state === 'done' ? <IconCheck size={20} /> : locked ? <IconLock size={16} /> : LESSON_ICON[lesson.icon](20)}
        {state === 'current' && <span className="lp-ring" />}
      </span>
      <span className="lp-info">
        <span className="lp-row1">
          <span className="lp-num">{String(index + 1).padStart(2, '0')}</span>
          <span className="lp-title">{lesson.title}</span>
          {state === 'current' && <span className="lp-pill">{lessonStartedHint(lesson)}</span>}
          {state === 'done' && <span className="lp-pill done">Done</span>}
        </span>
        <span className="lp-blurb">{lesson.blurb}</span>
        <span className="lp-min">{lesson.minutes} min{locked ? ' · locked' : ''}</span>
      </span>
    </button>
  );
}

function lessonStartedHint(_l: Lesson) {
  return 'Up next';
}

/* ---- Tab ------------------------------------------------------------------ */

export default function LearnTab({
  experience,
  onPractice,
}: {
  experience: Experience;
  onPractice: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null); // reference accordion
  const [completed, setCompleted] = useState<string[]>([]);
  const [active, setActive] = useState<Lesson | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false); // expand finished lessons to replay
  const { storm } = useConfetti();
  const wasGraduated = useRef(false);

  useEffect(() => {
    const c = loadCompleted();
    setCompleted(c);
    // Mark as already-graduated on mount so revisiting the tab doesn't re-fire.
    wasGraduated.current = c.length >= LESSONS.length;
  }, []);

  const doneCount = completed.length;
  const total = LESSONS.length;
  const pct = Math.round((doneCount / total) * 100);
  const graduated = doneCount >= total;

  // Celebrate the moment the final lesson is completed (once per session).
  useEffect(() => {
    if (graduated && !wasGraduated.current) {
      wasGraduated.current = true;
      storm();
    }
  }, [graduated, storm]);

  function stateFor(lesson: Lesson): 'done' | 'current' | 'open' | 'locked' {
    const idx = LESSONS.findIndex((l) => l.id === lesson.id);
    if (completed.includes(lesson.id)) return 'done';
    if (!isUnlocked(idx, completed)) return 'locked';
    // current = first unlocked, not-yet-done lesson
    const firstOpen = LESSONS.find((l, i) => isUnlocked(i, completed) && !completed.includes(l.id));
    return firstOpen?.id === lesson.id ? 'current' : 'open';
  }

  const sections = SECTIONS.filter((s) => !s.levels || s.levels.includes(experience));

  const tracks = TRACKS.map((track) => {
    const lessons = track.ids.map((id) => LESSONS.find((l) => l.id === id)).filter(Boolean) as Lesson[];
    const trackDone = lessons.filter((l) => completed.includes(l.id)).length;
    return (
      <div className="lp-track" key={track.name}>
        <div className="lp-track-head">
          <span className="lp-track-name">{track.name}</span>
          <span className="lp-track-tag">{track.tag}</span>
          <span className="lp-track-count">{trackDone}/{lessons.length}</span>
        </div>
        <div className="lp-line">
          {lessons.map((lesson) => (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              index={LESSONS.findIndex((l) => l.id === lesson.id)}
              state={stateFor(lesson)}
              onOpen={() => setActive(lesson)}
            />
          ))}
        </div>
      </div>
    );
  });

  return (
    <div className="screen">
      <header className="app-header">
        <PageTitle kicker="THE" word="Rules" />
        <p className="sub">{SUBTITLE[experience]}</p>
      </header>

      {/* ── Learn Mahjong curriculum ── */}
      <div className="learn-hero">
        <div className="learn-hero-top">
          <span className="learn-hero-ic" aria-hidden><IconBook size={20} /></span>
          <div>
            <div className="learn-hero-kicker">FREE · TAP-THROUGH LESSONS</div>
            <div className="learn-hero-title">Learn Mahjong</div>
          </div>
        </div>
        <p className="learn-hero-sub">
          From your first tile to your first win — short interactive lessons walk you through every step.
        </p>
        <div className="learn-prog">
          <div className="learn-prog-bar"><span style={{ width: `${pct}%` }} /></div>
          <span className="learn-prog-txt">{doneCount} of {total} complete</span>
        </div>
      </div>

      {graduated && (
        <div className="learn-grad" role="status">
          <div className="learn-grad-medal" aria-hidden>
            <span className="learn-grad-cap">🎓</span>
            <span className="learn-grad-shine" />
          </div>
          <div className="learn-grad-text">
            <div className="learn-grad-kicker">TROPHY UNLOCKED</div>
            <div className="learn-grad-title">Mahjong Scholar</div>
            <p>You finished every lesson. The trophy’s on your shelf — now go clear the card. 🀄</p>
          </div>
        </div>
      )}

      {/* Lesson path. Once every lesson is done it collapses into a slim
          "review" bar so the finished curriculum doesn't dominate the tab. */}
      {graduated ? (
        <div className="lp-review">
          <button
            className="lp-review-bar"
            data-open={reviewOpen}
            onClick={() => setReviewOpen((v) => !v)}
            aria-expanded={reviewOpen}
          >
            <span className="lp-review-ic" aria-hidden><IconCheck size={16} /></span>
            <span className="lp-review-txt">All {total} lessons complete</span>
            <span className="lp-review-act">{reviewOpen ? 'Hide' : 'Review'}</span>
            <span className="chev" aria-hidden>▶</span>
          </button>
          {reviewOpen && <div className="lp-review-body">{tracks}</div>}
        </div>
      ) : (
        tracks
      )}

      {/* ── Full reference (the old deep content) ── */}
      <div className="learn-ref-head">Full reference</div>
      <div>
        {sections.map((s, i) => (
          <div className="acc" key={i} data-open={open === i}>
            <button onClick={() => setOpen(open === i ? null : i)}>
              <span className="acc-ico" aria-hidden>{s.icon}</span>
              <span style={{ flex: 1 }}>{s.title}</span>
              <span className="chev">▶</span>
            </button>
            {open === i && <div className="acc-body">{s.body}</div>}
          </div>
        ))}
      </div>

      <button
        className="btn learn-practice"
        onClick={onPractice}
      >
        <IconTarget size={18} /> Practice: what can I make?
      </button>

      <div style={{ marginTop: 18 }}>
        <OfficialCardCallout blurb="These lessons use an original sample card. To play real games, use your official National Mah Jongg League card — they release a new one each year." />
      </div>

      {active && (
        <LessonModal
          lesson={active}
          onClose={() => setActive(null)}
          onComplete={(id) => setCompleted(markCompleted(id))}
        />
      )}
    </div>
  );
}
