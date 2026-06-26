// Card-scan endpoint. Reads a photo of the user's OWN physical card and returns
// the hands as structured rows so they don't have to type ~70 lines by hand.
//
// Design / legal note: the app ships NO card data. The only source of the hand
// data is the user's own uploaded photo, extracted per-request and returned to
// their device — nothing is stored or shared server-side. What we DO encode here
// is the *grammar and rules* of an American Mah Jongg card (a hand is 14 tiles,
// the tile vocabulary, point conventions, how colour denotes suit). Those are
// facts about the game, not anyone's copyrighted selection of hands — and they
// let us guide the read and flag misreads without ever holding the card's data.
// This route is dormant unless an ANTHROPIC_API_KEY is configured; without it,
// scanning returns 503 and the UI keeps manual entry only.

export const runtime = 'nodejs';
export const maxDuration = 60; // Pro honors this; Hobby caps ~10s.

const MODEL = process.env.CARD_SCAN_MODEL || 'claude-opus-4-8';

// Per-hand structured output. tileCount + confidence are what let us validate
// completeness on the server without any reference card to compare against.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    year: { type: 'integer' },
    hands: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          notation: { type: 'string' },
          points: { type: 'integer' },
          concealed: { type: 'boolean' },
          // The model's own count of the tiles in this hand. A valid American
          // hand is exactly 14 — anything else is a misread or a dropped group.
          tileCount: { type: 'integer' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['category', 'notation', 'points', 'concealed', 'tileCount', 'confidence'],
      },
    },
  },
  required: ['year', 'hands'],
};

const PROMPT = `You are transcribing a photograph of an American Mah Jongg "standard hands and rules" card that the user physically owns. The photo may be ONE PANEL of a fold-out card, so transcribe every hand line visible in THIS image — do not invent, merge, reorder, or skip lines, and don't worry about sections that aren't in frame. Accuracy and completeness matter more than speed.

HOW THESE CARDS ARE LAID OUT
- The card is divided into sections, each with a heading. Section HEADINGS are short descriptors (e.g. a year, even-number or odd-number groupings, consecutive runs, winds & dragons, 369, quints, singles & pairs) and are typically CENTERED. The hand rows under them are LEFT-justified. Use that difference to tell a heading apart from a hand row, and don't mistake a heading for a hand.
- Read sections top-to-bottom; within a section read each line top-to-bottom; work left column then right column.
- Each line is one hand: a sequence of tile groups, then its point value at the right edge, sometimes with a concealed marker.
- A line may print TWO alternate forms of the same hand separated by "or" (or "-or-"). Transcribe ONLY the first form (its 14 tiles); ignore everything from the "or" onward. Never combine both forms into one line.

THE TILE VOCABULARY (use these symbols)
- Numbers: the digits 1-9 (each digit is one number tile).
- Flowers: F.
- Dragons: D for a dragon tile; the white/soap dragon counts as a dragon too.
- Winds: N, E, W, S.
- Suits are CRAK, BAM, and DOT. On the card the suit of a number group is shown by its COLOUR, not by a letter. Use colour to determine suit: a group printed in one colour is all one suit; groups printed in different colours are different suits. When a number group's suit is conveyed only by colour, append a suit letter so it is not lost - C = crak, B = bam, D = dot (e.g. a green "111" becomes 111B if green is bam on this card). Keep the same suit letter for every group sharing that colour in the hand, and different letters for different colours.

RULES YOU MUST APPLY (they catch your own mistakes)
- Every hand totals EXACTLY 14 tiles. Count the tiles you transcribed for each line. A pair = 2, a pung = 3, a kong = 4, a quint = 5, a sextet = 6, "FF" = 2 flowers, "NEWS" = 4, "DDDD" = 4, "2025" = 4 number tiles, and so on. Put that total in tileCount. If it is not 14, re-examine the line before moving on.
- Point values are multiples of 5, normally between 25 and 75; 25 is the usual minimum. If you read something outside that, look again.
- Set concealed=true only if the line is marked concealed-only (an "X" or "C" beside it, or it sits under a concealed heading); otherwise false.
- Set confidence to "low" for any line that is blurry, glare-washed, cut off, or that you had to guess at; "medium" if mostly clear; "high" only if you are certain.

For category use the section heading the line sits under, copied as printed. Also return the card's year if it is printed. If part of a line is unreadable, give your best transcription and mark it low confidence rather than dropping it. Return only the structured data.`;

interface Body {
  image?: string; // base64 (no data: prefix)
  mediaType?: string;
}

interface RawHand {
  category?: string;
  notation?: string;
  points?: number;
  concealed?: boolean;
  tileCount?: number;
  confidence?: string;
}

interface ValidatedHand {
  category: string;
  notation: string;
  points: number;
  concealed: boolean;
  tileCount: number;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
  valid: boolean;
}

// Rules-based validation — pure facts about the game, no card data involved.
// Anything flagged here is surfaced to the user for a closer look; nothing is
// silently "corrected" (we have no answer key to correct against, by design).
function validate(h: RawHand): ValidatedHand {
  const notation = (h.notation ?? '').trim();
  const points = Number.isFinite(h.points) ? Math.round(h.points as number) : 0;
  const tileCount = Number.isFinite(h.tileCount) ? Math.round(h.tileCount as number) : 0;
  const confidence = h.confidence === 'high' || h.confidence === 'low' ? h.confidence : 'medium';
  const issues: string[] = [];

  if (notation.length < 2) {
    issues.push('This line looks empty or too short — check it against your card.');
  }
  if (tileCount !== 14) {
    issues.push(
      `Reads as ${tileCount || '?'} tiles — every hand is 14, so a group was likely misread or dropped.`,
    );
  }
  if (points < 25 || points > 75 || points % 5 !== 0) {
    issues.push(`Point value ${points || '?'} is unusual (cards use 25-75 in steps of 5) — double-check.`);
  }
  if (confidence === 'low') {
    issues.push('Low confidence on this line — verify it against your card.');
  }

  return {
    category: (h.category ?? '').trim(),
    notation,
    points: points || 25,
    concealed: !!h.concealed,
    tileCount,
    confidence,
    issues,
    valid: issues.length === 0,
  };
}

export async function POST(req: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const image = body.image?.trim();
  const mediaType = body.mediaType || 'image/jpeg';
  if (!image) {
    return Response.json({ error: 'no_image' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('scan-card upstream error', res.status, detail.slice(0, 500));
      return Response.json({ error: 'upstream' }, { status: 502 });
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const textBlock = data.content?.find((b) => b.type === 'text' && typeof b.text === 'string');
    if (!textBlock?.text) {
      return Response.json({ error: 'empty' }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as { year?: number; hands?: RawHand[] };
    const rawHands = Array.isArray(parsed.hands) ? parsed.hands : [];
    const hands = rawHands
      .filter((h) => typeof h.notation === 'string' && h.notation.trim())
      .map(validate);

    // A read-at-a-glance summary so the user knows what to check.
    const sections = new Set(hands.map((h) => h.category).filter(Boolean));
    const needsReview = hands.filter((h) => !h.valid).length;
    const summary = {
      handCount: hands.length,
      sectionCount: sections.size,
      needsReview,
      tileFlags: hands.filter((h) => h.tileCount !== 14).length,
      lowConfidence: hands.filter((h) => h.confidence === 'low').length,
    };

    return Response.json({ year: parsed.year, hands, summary });
  } catch (err) {
    console.error('scan-card error', err);
    return Response.json({ error: 'failed' }, { status: 500 });
  }
}
