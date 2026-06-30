'use client';

import { useEffect, useMemo, useState } from 'react';
import Tile from './Tile';
import { useEscape } from '../lib/useEscape';
import { DECODE_HEX, type DecodeGroup, type HeroKind, type Lesson, type Step, type TileSpec } from '../lib/lessons';
import { IconCheck } from './uiIcons';

const XMark = () => <span aria-hidden style={{ fontSize: 17, lineHeight: 1, fontWeight: 700 }}>✕</span>;

/* ── small animated hero illustrations ─────────────────────────────────────── */

function HeroArt({ kind }: { kind: HeroKind }) {
  if (kind === 'table') {
    return (
      <div className="ls-hero ls-hero-table" aria-hidden>
        <div className="ls-felt">
          {['top', 'right', 'bottom', 'left'].map((p) => (
            <span key={p} className={`ls-seat ls-seat-${p}`} />
          ))}
          <span className="ls-felt-mark">中</span>
        </div>
      </div>
    );
  }
  if (kind === 'card') {
    return (
      <div className="ls-hero" aria-hidden>
        <div className="ls-mini-card">
          <span style={{ color: DECODE_HEX.red }}>FF</span>{' '}
          <span style={{ color: DECODE_HEX.green }}>2026</span>{' '}
          <span style={{ color: DECODE_HEX.blue }}>2026</span>{' '}
          <span style={{ color: DECODE_HEX.ink }}>DDDD</span>
        </div>
      </div>
    );
  }
  if (kind === 'win') {
    return (
      <div className="ls-hero ls-hero-win" aria-hidden>
        <span className="ls-crown">👑</span>
      </div>
    );
  }
  // tiles
  const fan: TileSpec[] = [
    { face: 'crack', name: '', desc: '' },
    { face: 'bam', name: '', desc: '' },
    { face: 'dot', name: '', desc: '' },
    { face: 'dragon', char: '中', color: '#E8455F', name: '', desc: '' },
  ];
  return (
    <div className="ls-hero ls-hero-fan" aria-hidden>
      {fan.map((t, i) => (
        <span key={i} className="ls-fan-tile" style={{ ['--i' as string]: i } as React.CSSProperties}>
          <Tile face={t.face} char={t.char} color={t.color} size={46} />
        </span>
      ))}
    </div>
  );
}

/* ── tap-to-reveal tile cards ──────────────────────────────────────────────── */

function TileFlips({ tiles }: { tiles: TileSpec[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <div className="ls-tilegrid">
      {tiles.map((t, i) => {
        const flipped = open.has(i);
        return (
          <button
            key={i}
            className="ls-flip"
            data-flipped={flipped}
            onClick={() => setOpen((s) => new Set(s).add(i))}
            aria-label={flipped ? t.name : `Reveal ${t.name}`}
          >
            <span className="ls-flip-inner">
              <span className="ls-flip-front">
                <Tile face={t.face} char={t.char} color={t.color} size={48} />
                <span className="ls-flip-tap">Tap</span>
              </span>
              <span className="ls-flip-back">
                <span className="ls-flip-name">{t.name}</span>
                <span className="ls-flip-desc">{t.desc}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── animated Charleston ───────────────────────────────────────────────────── */

const PASSES = [
  { dir: 'RIGHT', cls: 'right', note: 'Pass 3 tiles to the player on your right.' },
  { dir: 'ACROSS', cls: 'across', note: 'Pass 3 tiles straight across the table.' },
  { dir: 'LEFT', cls: 'left', note: 'Pass 3 to your left — this one can be blind.' },
];

function Charleston() {
  const [pass, setPass] = useState(0);
  const [tick, setTick] = useState(0); // remount key to replay the fly animation
  const done = pass >= PASSES.length;
  const cur = PASSES[Math.min(pass, PASSES.length - 1)];
  return (
    <div className="ls-charleston">
      <div className="ls-felt ls-felt-lg" key={tick}>
        {['top', 'right', 'bottom', 'left'].map((p) => (
          <span key={p} className={`ls-seat ls-seat-${p}${p === 'bottom' ? ' is-you' : ''}`}>
            {p === 'bottom' ? 'You' : ''}
          </span>
        ))}
        {!done && (
          <span className={`ls-packet ls-packet-${cur.cls}`}>
            <i /><i /><i />
          </span>
        )}
        <span className="ls-felt-mark">中</span>
      </div>

      <div className="ls-charleston-label">
        {done ? (
          <strong style={{ color: 'var(--green, #2E7D43)' }}>Charleston done — East starts! 🀄</strong>
        ) : (
          <>
            <strong>Pass {pass + 1} of 3 · {cur.dir}</strong>
            <span>{cur.note}</span>
          </>
        )}
      </div>

      {!done ? (
        <button
          className="ls-mini-btn"
          onClick={() => {
            setPass((p) => p + 1);
            setTick((t) => t + 1);
          }}
        >
          {pass === 0 ? 'Play the first pass' : 'Play next pass'} ›
        </button>
      ) : (
        <button className="ls-mini-btn ghost" onClick={() => { setPass(0); setTick((t) => t + 1); }}>
          ↻ Replay
        </button>
      )}
    </div>
  );
}

/* ── the four winds — a tap-through NEWS compass ───────────────────────────── */

const WINDS = [
  { pos: 'n', letter: 'N', name: 'North', fact: 'The fourth seat. Play moves counter-clockwise: East → North → West → South.' },
  { pos: 'e', letter: 'E', name: 'East', fact: 'East is the dealer — they start the game and the Charleston. The seat of honor.' },
  { pos: 's', letter: 'S', name: 'South', fact: 'Sits to East’s right and plays second. Each round the East seat rotates.' },
  { pos: 'w', letter: 'W', name: 'West', fact: 'The third seat. On the card, winds always show as these letters — N, E, W, S.' },
];

function WindCompass() {
  const [open, setOpen] = useState<string>('e');
  const cur = WINDS.find((w) => w.letter === open) ?? WINDS[1];
  return (
    <div className="ls-winds">
      <div className="ls-compass">
        <span className="ls-compass-ring" aria-hidden />
        <span className="ls-compass-rose" aria-hidden>✦</span>
        {WINDS.map((w) => (
          <button
            key={w.letter}
            className={`ls-wind ls-wind-${w.pos}`}
            data-active={open === w.letter}
            onClick={() => setOpen(w.letter)}
            aria-label={w.name}
          >
            <Tile face="wind" char={w.letter} size={46} />
          </button>
        ))}
      </div>
      <div className="ls-wind-card" key={open}>
        <span className="ls-wind-letter">{cur.letter}</span>
        <div>
          <div className="ls-explain-label">{cur.name}</div>
          <div className="ls-explain-text">{cur.fact}</div>
        </div>
      </div>
    </div>
  );
}

/* ── tap-to-decode a card hand ─────────────────────────────────────────────── */

// Real tiles for a decode group, so the shorthand is mirrored as a tile rack.
function groupTiles(g: DecodeGroup): React.ReactNode[] {
  const hex = DECODE_HEX[g.color];
  const out: React.ReactNode[] = [];
  for (let n = 0; n < g.count; n++) {
    const key = `${g.text}-${n}`;
    if (g.tileFace === 'flower') {
      out.push(<Tile key={key} face="flower" size={30} />);
    } else if (g.tileFace === 'dragon') {
      out.push(<Tile key={key} face="dragon" char={g.tileChar} color={g.tileColor} size={30} />);
    } else {
      // Number tile (bam/dot/crack): render the year digit, tinted to the suit.
      // In year hands the "0" is the white dragon (the "soap"), so show that.
      const digit = Number(g.text[n] ?? g.text[0]);
      if (digit === 0) {
        out.push(<Tile key={key} face="dragon" char="0" color={hex} size={30} />);
      } else {
        out.push(<Tile key={key} face={g.tileFace} count={digit} color={hex} size={30} />);
      }
    }
  }
  return out;
}

function Decode({ groups }: { groups: DecodeGroup[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const running = useMemo(
    () => [...seen].reduce((s, i) => s + groups[i].count, 0),
    [seen, groups],
  );
  const total = groups.reduce((s, g) => s + g.count, 0);
  const g = open != null ? groups[open] : null;
  return (
    <div className="ls-decode">
      <div className="ls-hand">
        {groups.map((grp, i) => (
          <button
            key={i}
            className="ls-grp"
            data-active={open === i}
            data-seen={seen.has(i)}
            style={{ color: DECODE_HEX[grp.color] }}
            onClick={() => {
              setOpen(i);
              setSeen((s) => new Set(s).add(i));
            }}
          >
            {grp.text}
          </button>
        ))}
      </div>

      <div className="ls-count" data-complete={running >= total}>
        <span style={{ fontFamily: 'var(--font-mono), monospace' }}>{running}</span> / {total} tiles
        {running >= total ? ' ✓' : ''}
      </div>

      <div className="ls-explain" key={open ?? -1}>
        {g ? (
          <>
            <span className="ls-explain-chip" style={{ background: DECODE_HEX[g.color] }}>{g.text}</span>
            <div>
              <div className="ls-explain-label">{g.label}</div>
              <div className="ls-explain-text">{g.explain}</div>
              <div className="ls-decode-rack">{groupTiles(g)}</div>
            </div>
          </>
        ) : (
          <span className="ls-explain-hint">Tap a colored group above to decode it.</span>
        )}
      </div>
    </div>
  );
}

/* ── meld building blocks ──────────────────────────────────────────────────── */

const MELDS = [
  { n: 2, name: 'Pair', note: 'Two matching tiles.' },
  { n: 3, name: 'Pung', note: 'Three of a kind.' },
  { n: 4, name: 'Kong', note: 'Four of a kind.' },
  { n: 5, name: 'Quint', note: 'Five — jokers help here.' },
];

function Melds() {
  return (
    <div className="ls-melds">
      {MELDS.map((m) => (
        <div className="ls-meld-row" key={m.name}>
          <div className="ls-meld-tiles">
            {Array.from({ length: m.n }).map((_, i) => (
              <span key={i} className="ls-meld-tile" style={{ ['--i' as string]: i } as React.CSSProperties}>
                <Tile face="crack" size={30} />
              </span>
            ))}
          </div>
          <div className="ls-meld-text">
            <span className="ls-meld-name">{m.name} <em>· {m.n}</em></span>
            <span className="ls-meld-note">{m.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── quiz ──────────────────────────────────────────────────────────────────── */

function Quiz({ step, onAnswered }: { step: Extract<Step, { k: 'quiz' }>; onAnswered: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked != null;
  return (
    <div className="ls-quiz">
      <div className="ls-quiz-q">{step.q}</div>
      <div className="ls-quiz-opts">
        {step.options.map((opt, i) => {
          const isCorrect = i === step.answer;
          const state = !answered ? '' : i === picked ? (isCorrect ? 'right' : 'wrong') : isCorrect ? 'right' : '';
          return (
            <button
              key={i}
              className="ls-opt"
              data-state={state || undefined}
              disabled={answered}
              onClick={() => {
                if (answered) return;
                setPicked(i);
                onAnswered();
              }}
            >
              <span className="ls-opt-mark" aria-hidden>
                {answered && (isCorrect ? '✓' : i === picked ? '✕' : '')}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="ls-quiz-explain" data-ok={picked === step.answer}>
          <strong>{picked === step.answer ? 'Correct!' : 'Not quite.'}</strong> {step.explain}
        </div>
      )}
    </div>
  );
}

/* ── the modal ─────────────────────────────────────────────────────────────── */

export default function LessonModal({
  lesson,
  onClose,
  onComplete,
}: {
  lesson: Lesson;
  onClose: () => void;
  onComplete: (id: string) => void;
}) {
  useEscape(onClose);
  const [i, setI] = useState(0);
  // Quiz steps gate the Continue button until answered.
  const [answered, setAnswered] = useState<Set<number>>(new Set());

  const steps = lesson.steps;
  const step = steps[i];
  const last = i === steps.length - 1;
  const gated = step.k === 'quiz' && !answered.has(i);

  // Lock background scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function next() {
    if (last) {
      onComplete(lesson.id);
      onClose();
      return;
    }
    setI((n) => Math.min(n + 1, steps.length - 1));
  }

  return (
    <div className="ls-scrim" role="dialog" aria-modal="true" aria-label={lesson.title}>
      <div className="ls-sheet">
        <div className="ls-top">
          <button
            className="ls-icon-btn"
            onClick={() => (i === 0 ? onClose() : setI((n) => n - 1))}
            aria-label={i === 0 ? 'Close' : 'Back'}
          >
            {i === 0 ? <XMark /> : '‹'}
          </button>
          <div className="ls-progress" aria-hidden>
            {steps.map((_, n) => (
              <span key={n} className="ls-prog-seg" data-on={n <= i} />
            ))}
          </div>
          <button className="ls-icon-btn" onClick={onClose} aria-label="Close lesson">
            <XMark />
          </button>
        </div>

        <div className="ls-body" key={i}>
          <StepView step={step} onAnswered={() => setAnswered((s) => new Set(s).add(i))} />
        </div>

        <div className="ls-foot">
          <button className="ls-cta" onClick={next} disabled={gated} data-done={last}>
            {last ? (
              <>
                <IconCheck size={18} /> Complete lesson
              </>
            ) : gated ? (
              'Pick an answer'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepView({ step, onAnswered }: { step: Step; onAnswered: () => void }) {
  switch (step.k) {
    case 'intro':
      return (
        <div className="ls-slide ls-center">
          <HeroArt kind={step.hero} />
          <h2 className="ls-title">{step.title}</h2>
          <p className="ls-text">{step.body}</p>
        </div>
      );
    case 'note':
      return (
        <div className="ls-slide">
          {step.hero && <HeroArt kind={step.hero} />}
          <h2 className="ls-title">{step.title}</h2>
          <p className="ls-text">{step.body}</p>
          {step.bullets && (
            <ul className="ls-bullets">
              {step.bullets.map((b, k) => (
                <li key={k}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      );
    case 'tiles':
      return (
        <div className="ls-slide">
          <h2 className="ls-title">{step.title}</h2>
          {step.body && <p className="ls-text">{step.body}</p>}
          <TileFlips tiles={step.tiles} />
        </div>
      );
    case 'charleston':
      return (
        <div className="ls-slide ls-center">
          <h2 className="ls-title">{step.title}</h2>
          {step.body && <p className="ls-text">{step.body}</p>}
          <Charleston />
        </div>
      );
    case 'wind':
      return (
        <div className="ls-slide ls-center">
          <h2 className="ls-title">{step.title}</h2>
          {step.body && <p className="ls-text">{step.body}</p>}
          <WindCompass />
        </div>
      );
    case 'decode':
      return (
        <div className="ls-slide">
          <h2 className="ls-title">{step.title}</h2>
          {step.body && <p className="ls-text">{step.body}</p>}
          <Decode groups={step.groups} />
        </div>
      );
    case 'meld':
      return (
        <div className="ls-slide">
          <h2 className="ls-title">{step.title}</h2>
          {step.body && <p className="ls-text">{step.body}</p>}
          <Melds />
        </div>
      );
    case 'quiz':
      return (
        <div className="ls-slide">
          <div className="ls-kicker">Quick check</div>
          <Quiz step={step} onAnswered={onAnswered} />
        </div>
      );
    case 'recap':
      return (
        <div className="ls-slide ls-center">
          <div className="ls-recap-badge">
            <IconCheck size={34} />
          </div>
          <h2 className="ls-title">{step.title}</h2>
          <ul className="ls-recap-list">
            {step.points.map((p, k) => (
              <li key={k} style={{ ['--i' as string]: k } as React.CSSProperties}>
                <IconCheck size={15} /> {p}
              </li>
            ))}
          </ul>
        </div>
      );
  }
}
