# Pre-Launch QA Checklist

Work through this before submitting to the App Store / Play Store. Boxes are
grouped by area; “⚠️” marks common store-rejection risks.

## Functional — core loop
- [ ] First launch shows onboarding; account creation validates name/email/password.
- [ ] How-it-works tutorial appears once, then never again (and “Skip” works).
- [ ] Tapping a hand on the Card logs a win, fires confetti, and updates stats.
- [ ] Category-complete and full-card-complete celebrations trigger correctly.
- [ ] “−” decrements; counts never go below 0.
- [ ] Streak chip increments across days (test by changing device date).
- [ ] Trophies unlock + toast fires once per badge; locked badges show goals.

## Functional — wins & sharing
- [ ] Log a win with/without photo and note; it appears in the journal.
- [ ] Share sheet opens; each destination (Messages, WhatsApp, X, Facebook,
      Instagram, native share, Save, Copy) behaves sensibly on device.
- [ ] Generated share-card image renders correctly with the current theme.

## Functional — social
- [ ] Feed likes toggle and persist; comments post and persist.
- [ ] Add friend (manual) appears on the leaderboard.
- [ ] Invite-from-contacts opens the picker (Android) or share sheet (iOS).
- [ ] Tables: create with a custom tile icon; chat sends; date poll votes;
      “Add to Calendar” downloads .ics / opens Google Calendar; photos add.

## Functional — challenges & personalization
- [ ] Active season banner shows correct challenge + progress; “Focus rows” filters.
- [ ] Seasons sheet lists all four with progress and a “Now” tag.
- [ ] All themes apply instantly; wallpapers load; no flash on reload.
- [ ] Pro themes are locked → paywall opens; unlock reveals them.
- [ ] Experience level changes the rules/tips; persists.
- [ ] Settings: profile (avatar/name/handle/bio) saves and reflects everywhere.

## Bring-your-own-card
- [ ] Add/edit/remove hands; categories group correctly; Save activates the card.
- [ ] Reference photo adds, shows thumbnail, opens lightbox; persists; removes.
- [ ] “Use sample card instead” reverts cleanly.

## Data & privacy ⚠️
- [ ] Export my data downloads a JSON with expected contents.
- [ ] Delete all my data clears everything and returns to onboarding (Apple
      requires in-app account deletion).
- [ ] Privacy Policy (/privacy) and Terms (/terms) load and are linked in-app.
- [ ] All [bracketed] fields in the policies are filled; reviewed by counsel.
- [ ] Disclosed practices match what the app actually does at launch.

## Accessibility
- [ ] Keyboard focus rings visible; all controls reachable.
- [ ] Reduced-motion setting calms animations.
- [ ] Toggles announce state (role="switch"); icon buttons have labels.
- [ ] Text remains legible at large system font sizes; color contrast OK.

## PWA / platform
- [ ] Installs to home screen; correct icon + name + splash.
- [ ] Works offline (app shell loads; reasonable offline messaging).
- [ ] Service worker updates on new deploy (no stale cache lock).
- [ ] Safe-area insets respected (notch / home indicator).
- [ ] Looks right on small phones and tablets; both portrait orientations.

## Store-submission gotchas ⚠️
- [ ] App name/subtitle/keywords do **not** use the NMJL trademark.
- [ ] Non-affiliation disclaimer present in the description + in-app.
- [ ] No copy of any official/licensed card ships in the build (sample is original).
- [ ] If accounts/social are live: age rating reflects user-generated content,
      and there’s a way to report/block (add before enabling public content).
- [ ] In-app purchases use the platform IAP; “Restore Purchases” present.
- [ ] Privacy “nutrition label” (App Store) / Data Safety (Play) completed honestly.
- [ ] App icon has no transparency where the store forbids it; all sizes present.
- [ ] Screenshots match the current UI; no placeholder content.
- [ ] Support URL + marketing URL resolve.

## Performance / stability
- [ ] No console errors in production build.
- [ ] Large card (70+ hands) scrolls smoothly; many wins/photos don’t lag.
- [ ] Memory: object URLs for photos are revoked (no leaks over long sessions).
- [ ] Crash/diagnostics reporting wired (e.g., Sentry) before scale.
