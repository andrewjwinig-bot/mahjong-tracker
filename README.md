# 🀄 Mahjong Tracker

A playful, gamified scorecard for American mahjong: track every hand you win,
learn the tiles, chase seasonal challenges, and play along with friends.

> **Independent project.** Not affiliated with, endorsed by, or sponsored by the
> National Mah Jongg League. The sample card hands included are original and
> illustrative. Players can enter their own card via “Bring your own card.”

## Features

- **Card tracking** — tap a hand each time you win it; see cleared/wins/points and
  filter to what’s left.
- **Celebrations** — full-screen mahjong-tile confetti with optional chime +
  haptics; milestone trophies.
- **Seasonal challenges** — a rotating quarterly goal that spans the whole card.
- **Social** — a public feed (likes + comments), plus private **Tables** with
  chat, photos, and date polls that export to Apple/Google Calendar.
- **Personalization** — tile-suit color themes with hand-drawn backgrounds, tile
  avatars, and rules/tips tailored from beginner to expert.
- **Bring your own card** — enter your own hands (with a reference photo).
- **Privacy-first** — everything is stored on-device today; account export +
  deletion are built in.
- Installable **PWA** (offline-capable via a service worker).

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- Custom CSS design system with CSS-variable theming (`app/globals.css`)
- Hand-drawn **SVG tile artwork** (`app/lib/tileArt.ts`)
- On-device storage: **IndexedDB** (gameplay, photos) + **localStorage** (prefs)
- Deployed on **Vercel**

## Project structure

```
app/
  layout.tsx, page.tsx, globals.css   # shell, fonts, theme tokens
  privacy/ , terms/                   # hosted legal pages
  components/                         # UI (CardTab, WinsTab, GroupTab, TablesTab,
                                      #     Confetti, ShareModal, SettingsSheet, …)
  lib/                                # data + logic (storage, social, tables,
                                      #     challenges, badges, themePrefs, tileArt, …)
public/
  icons/ , patterns/ , manifest.webmanifest, sw.js
scripts/generate-icons.js            # dependency-free PNG icon generator
docs/                                 # store listing, QA checklist
```

The `lib/*` modules are written as a clean “swap point”: today they read/write
on-device storage; a future backend version replaces those calls with
authenticated API requests and the UI stays the same.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run icons      # regenerate app icons from scripts/generate-icons.js
```

## Deployment

Connected to Vercel; pushes to `main` deploy to production automatically.

## Roadmap

- **Backend + accounts** (Supabase): real sign-in, cross-device sync, and a real
  friend/table/feed graph.
- **Push notifications** (messages, likes, comments, tips).
- **Native wrapper** (Capacitor) for App Store / Play Store + native push.
- Pro subscription + cosmetic packs (paywall scaffold already in place).

## License

[Choose a license] — © [Year] [Developer / Company Name].
