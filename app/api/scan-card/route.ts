// Card-scan endpoint. Reads a photo of the user's OWN physical card and returns
// the hands as structured rows so they don't have to type ~70 lines by hand.
//
// Design / legal note: the app ships NO card data. The only source of the hand
// data is the user's own uploaded photo, extracted per-request and returned to
// their device — nothing is stored or shared server-side. This route is dormant
// unless an ANTHROPIC_API_KEY is configured; without it, scanning returns 503
// and the UI keeps manual entry only.

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.CARD_SCAN_MODEL || 'claude-opus-4-8';

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
        },
        required: ['category', 'notation', 'points', 'concealed'],
      },
    },
  },
  required: ['year', 'hands'],
};

const PROMPT = `You are reading a photograph of an American Mah Jongg hand card that the user owns a physical copy of. Transcribe every hand line exactly as printed — do not invent, merge, or skip lines.

For each hand return:
- category: the section heading the line sits under (e.g. "2026", "2468", "CONSECUTIVE RUN", "WINDS - DRAGONS", "369", "SINGLES AND PAIRS").
- notation: the tile sequence as written, left to right. Use F for flowers, D for dragons (soap/white included), N/E/W/S for the winds, and digits for numbers. Keep the printed groupings separated by single spaces.
- points: the number printed at the end of that row.
- concealed: true if the row is marked concealed-only (commonly a "C" or "X" beside it), otherwise false.

Read top to bottom, left to right, across all columns. If part of a line is blurry, give your best transcription rather than dropping it. Also return the card's year if it is printed. Return only the structured data.`;

interface Body {
  image?: string; // base64 (no data: prefix)
  mediaType?: string;
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
        max_tokens: 8000,
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
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

    const parsed = JSON.parse(textBlock.text) as { year?: number; hands?: unknown[] };
    return Response.json({ year: parsed.year, hands: parsed.hands ?? [] });
  } catch (err) {
    console.error('scan-card error', err);
    return Response.json({ error: 'failed' }, { status: 500 });
  }
}
