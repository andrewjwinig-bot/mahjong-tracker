# Native wrapper (Capacitor) — setup

Wrap the existing PWA as native iOS/Android apps for the App Store / Play Store
and native push. Run these on your machine (macOS + Xcode for iOS). The web app
itself doesn’t change — Capacitor loads it in a native shell.

## Option A — load the hosted site (simplest)
Point the native shell at the deployed URL. Fastest to ship; updates ship from
Vercel without an app-store review (content updates only).

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Mahjong Tracker" com.yourco.mahjongtracker --web-dir=public
```

Then set the server URL in `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourco.mahjongtracker',
  appName: 'Mahjong Tracker',
  webDir: 'public',
  server: { url: 'https://your-production-domain', cleartext: false },
};

export default config;
```

```bash
npx cap add ios
npx cap add android
npx cap open ios       # build & run in Xcode
```

## Option B — bundle a static export (offline-first)
Ship the web build inside the app. Requires a static export of the Next app
(`output: 'export'` in `next.config.mjs`) — note the legal pages and any future
server features must be compatible with static export.

```bash
# next.config.mjs: add `output: 'export'`
npm run build           # produces ./out
# capacitor.config.ts: webDir: 'out' (and drop server.url)
npx cap sync
```

## Icons & splash
```bash
npm install -D @capacitor/assets
# place a 1024x1024 icon.png + splash in ./resources
npx capacitor-assets generate
```
(Current PWA icons live in `public/icons/` and are regenerated via
`npm run icons`.)

## Push notifications
```bash
npm install @capacitor/push-notifications
```
- iOS: enable Push Notifications + Background Modes in Xcode; create an APNs key
  in the Apple Developer portal.
- Android: add Firebase (google-services.json) for FCM.
- Register the device token and store it server-side (a `device_tokens` table)
  so a Supabase Edge Function / cron can send pushes for messages, likes, and
  comments.

## Store submission reminders
- Apple Developer Program ($99/yr); Google Play ($25 once).
- Bump `appId`/version per release; provide privacy labels, screenshots, and the
  hosted Privacy Policy URL (`/privacy`).
- Keep in-app account deletion (wired to the `delete-account` edge function) and
  data export.
