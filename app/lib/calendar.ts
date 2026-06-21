// Calendar helpers for circulating scheduled games. The .ics download opens in
// Apple Calendar (and most desktop/mobile calendars); the Google link opens the
// Google Calendar event composer.

export interface CalEvent {
  title: string;
  /** Event start. */
  start: Date;
  /** Duration in minutes (default 180 — a typical mahjong session). */
  durationMins?: number;
  description?: string;
  location?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local time, formatted for an all-local floating VEVENT / Google link. */
function fmt(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function endOf(ev: CalEvent): Date {
  return new Date(ev.start.getTime() + (ev.durationMins ?? 180) * 60_000);
}

export function buildICS(ev: CalEvent): string {
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@mahjtracker`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mahjong Tracker//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(ev.start)}`,
    `DTEND:${fmt(endOf(ev))}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : '',
    ev.location ? `LOCATION:${esc(ev.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** Download an .ics file (opens in Apple Calendar on tap). */
export function downloadICS(ev: CalEvent): void {
  const blob = new Blob([buildICS(ev)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.title.replace(/[^\w]+/g, '-').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalUrl(ev: CalEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${fmt(ev.start)}/${fmt(endOf(ev))}`,
    details: ev.description ?? '',
    location: ev.location ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
