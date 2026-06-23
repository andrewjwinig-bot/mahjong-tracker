# Handoff: Let's Mahj — Themeable mobile app

## Overview
"Let's Mahj" is a mobile app for American Mahjong players to track wins, work through the 70 hands on the annual card, follow friends, coordinate game tables, and learn the rules. This package documents a **high-fidelity design** of five core screens, a celebratory "Log a Mahj" flow, plus a **Settings** screen and an **Edit Profile** screen, built as a live, fully themeable system (**8 color themes**, default **Felt**, that re-skin the entire app instantly).

The design's signature ideas:
- A **two-tone poster headline** treatment (heavy display title in the theme accent, dropped behind a hard offset in a darker tone of the same hue) used selectively on the logo and each screen's big title.
- A **mahjong-tile visual vocabulary** — tiles appear as avatars, nav icons, progress segments, collection cells, and confetti.
- **Live theming**: tapping a theme chip re-skins every surface, including a generated SVG "art" banner behind each screen header.

## About the Design Files
The files in this bundle are **design references created as a single self-contained HTML "Design Component"** (`Lets Mahj.dc.html`). They are a prototype showing intended look and behavior — **not production code to ship directly**. The `.dc.html` format uses a small in-house template+logic runtime (`support.js`); **do not** try to port that runtime.

Your task: **recreate these screens in the target codebase's environment** (React Native / Expo, Flutter, Swift/SwiftUI, or a React web app — whatever the team uses) following its established component patterns, navigation, and state management. If no codebase exists yet, React Native + Expo is the natural fit for this product (it's a phone app). Treat the HTML as the spec for layout, color, type, spacing, copy, and interaction — re-implement, don't transpile.

## Fidelity
**High-fidelity.** Colors, typography, spacing, border treatments, shadows, and interactions are all final-intent. Recreate pixel-closely using the codebase's own UI primitives. The one exception is the generated SVG banner art per theme (see "Theme art" below) — that's a nice-to-have flourish, not load-bearing.

## Screens / Views

All screens are phone-sized (designed in a 402×874 iOS frame, ~20px horizontal gutters) and share: a status bar, a **header zone** (top ~252px) with a faint themed SVG art banner behind it (fades to transparent at the bottom), a scrollable body, and a fixed **bottom tab bar**.

### Global: Bottom tab bar
- Five tabs: **Card, Mahjs, Feed, Tables, Rules**.
- Each tab = a little **mahjong-tile icon** (cream tile face, rounded) above an 8px uppercase label + a 3px accent underline pill on the active tab.
- The active tab's tile is raised (translateY -3px) with a stronger shadow; its icon, label, and underline use the theme accent `--c1`. Inactive icons are multi-color mini illustrations (see "Iconography").
- Tile icon container: 32×40px, radius 6, `linear-gradient(180deg,#FFFEFB,#F1EBDD)`, 1.5px border `rgba(20,22,42,0.14)`.

### 1. Card — home & the 70 hands
Purpose: daily home. See progress, start scoring, browse/track the 70 hands.
Layout (top→bottom):
- **Logo** ("LET'S" kicker + "Mahj…" display, two-tone) + settings tile, in a row.
- **3 stat tiles** (CLEARED `1/70`, MAHJS `1`, POINTS `25`): equal flex, 120px tall, white→cream gradient, radius 9, 2px border, layered shadow + inset. Big Bricolage numbers (42px, -2px tracking). On mount these "deal in" (stagger fade + translateY + slight rotate) and numbers count up.
- **Action row**: `SCORE GAME` (primary, accent fill) + `PRACTICE` (white). Both radius 7, 2.5px border, bold 13px label, 1px letter-spacing.
- **Challenge card** (`#10B39A` pine fill): "★ SUMMER CHALLENGE" eyebrow (gold), "Summer Kongs" title, description, and a **slim solid progress bar** (rounded, animated grow) + `1/42` count.
- **Tip of the day** card (white, star tile + text).
- **Filter segmented control**: ALL / TO GO / GOT IT (active segment = accent fill, white text).
- **The 70 Hands collection board** (signature feature): header "★ THE 70 HANDS — YOUR COLLECTION" + `1 / 70`. A **7-column grid of 70 tile cells** (`aspect-ratio:24/31`, radius 5, 2px border, cream gradient). Cleared cells flip face-up: white bg, colored hand label (e.g. "369"), and a green check badge top-right. Locked cells show a faint jade ring motif.
- **"369" section** + a list of **hand rows**. Each row: a checkbox tile, the hand in colored notation (see "Hand notation"), and a points chip. Tapping a row **flips it like a tile** (rotateX) and stamps/un-stamps the green check (springy scale-in); cleared rows get a green border.

### 2. Mahjs — log every win
Purpose: log wins with photo + note; review your Mahjs.
Layout:
- Title "Your Mahjs" (two-tone) + accent underline bar (48×6, radius 4) + subtitle.
- **`I GOT MAHJ!` hero button** (accent fill): diagonal **stripe texture** overlay (`repeating-linear-gradient(-45deg, #FFF 0 2px, transparent 2px 11px)` at .16 opacity) + an animated **shine** sweep + a tilted 萬 tile + bold label with hard text-shadow. This is the app's exclamation point — the ONLY button that gets the stripe+shine treatment.
- "RECENT — N MAHJS" header + `+25 this week`.
- **Mahj cards**: photo area (placeholder), points badge, hand in colored notation, a quote/note, and a meta line (`TABLE · DATE` in Space Mono).

#### Log-a-Mahj sheet (opens from `I GOT MAHJ!`)
A celebratory **bottom sheet** (slides up, dim backdrop, radius-24 top corners). On open, **confetti of mahjong tiles rains down the full screen** (see "Tile confetti").
- **Celebratory header band** (accent fill): drag handle, diagonal stripes overlay, scattered confetti specks (gold square, white dot, pine square), a tilted white 萬 tile, "LOG YOUR WIN" kicker, big two-tone **"I GOT MAHJ!"** title, and subtitle "Log it before the tiles get scooped up."
- **WHICH HAND?** — a wrap of **category chips** (Freeform, 2025, 369, 2468, NEWS, 13579, Singles & Pairs, Consec Run, Winds & Dragons). Selected chip = accent fill, white text. Selecting a category (except Freeform) **drops down a line picker**: a bordered list titled "PICK YOUR LINE — CHECK THE ONE YOU WON" with each specific hand line (colored notation) and a checkbox; tapping one checks it (green box + ✓), tapping again unchecks.
- **NOTE (optional)** — textarea, placeholder "Tuesday game with the girls…", focus border = accent.
- **PHOTO (optional)** — dashed "ADD PHOTO" button with a camera glyph, all in accent.
- **Share to [Table]** — a green-bordered row (`#10B39A`) with a 花 tile avatar, label + "5 PLAYERS WILL SEE IT", and an iOS-style toggle (on by default; off = grey track, knob slides left).
- **Footer**: `CANCEL` (white outline) + `SAVE MY MAHJ` (accent fill, stripes + shine + 萬 tile). Saving closes the sheet and fires a second tile-confetti burst.

### 3. Feed — leaderboard & the crew
Purpose: social feed + friends leaderboard.
- Title "The Feed" (two-tone) + underline + subtitle.
- **Action row**: `+ ADD FRIEND` (accent) / `⤴ INVITE` (`#10B39A`).
- **Friends leaderboard** card: "♛ FRIENDS LEADERBOARD" + player count; a ROWS CLEARED / TOTAL POINTS segmented toggle; **player rows** each with a tile avatar (CJK glyph in a theme color), name, `x/70`, and a **slim solid progress bar** (rounded, animated grow). The "you" row is highlighted on a tinted panel.
- "⚇ THE FEED" header + **post cards**: avatar tile + name + time + a "MAHJ" badge; the hand in colored notation on a divider; optional caption; like/comment row.
- A faint oversized **hand-notation watermark** (`369 2025 FFFF`, ~46px, .12 opacity) fills the empty lower area as decorative brand texture.

### 4. Tables — your standing game
Purpose: group chat + scheduling for a recurring game.
- Header: back tile, a 萬 table-avatar tile, "Tuesday Game" title (themed via `--titleColor`) + "5 PLAYERS", `⤴ INVITE` (`#10B39A`).
- **Tabs**: 💬 CHAT / 📅 DATES / 📷 PHOTOS (active = accent).
- **Chat messages**: each = avatar tile + name (in that player's color) + time + a bubble (radius `3px 12px 12px 12px`). One message uses an inverted ink bubble.
- **Date-poll chip**: "📅 NEXT GAME — VOTE" with two date options (winning one filled gold, vote counts).
- **Composer**: text field + accent `SEND`.

### 5. Rules — tiles, Charleston & strategy
Purpose: learn/reference.
- Title "The Rules" (two-tone) + underline + subtitle.
- A practice CTA button (accent): "◎ PRACTICE: WHAT CAN I MAKE?".
- **Accordion**: an open "Understanding the tiles" section (accent header bar, 萬 tile) listing tile types (Bams, Cracks, Dots, Winds, Dragons, Flowers & Seasons, Jokers) — each a row with a small tile illustration + name + description. Then collapsed rows: "How to play — the 60-second version", "The Charleston — step-by-step", "Playing with 3 players" (each with a tile glyph + ▸).

### 6. Settings — profile, theme & preferences
Purpose: account hub. Layout (top→bottom): back tile + "Settings" title; a **profile card** (tile avatar + name/handle/email + an INTERMEDIATE level pill + chevron — tapping it opens **Edit Profile**); a **“Let's Mahj Pro” upsell** (ink card, gold stripe overlay, gold tile, GO PRO button); an **APP THEME** 2-col grid of theme chips (banner thumbnail + accent dot + name, selected one ringed in the accent with a check); **PREFERENCES** list (iOS toggles: share mahjs / push / leaderboards / sound & haptics); **GAME** list (Card year, Default table, Experience level — rows with value + chevron); **ACCOUNT** list (change password / help / privacy); a **SIGN OUT** button (cinnabar outline) + `v1.0` footer.

### 7. Edit Profile — customize your tile & identity (opens from the Settings profile card)
Purpose: personalize avatar, name and play level. Layout:
- Back tile + **“Edit profile”** title + subtitle.
- **Avatar**: a large mahjong tile (96×120, radius 11, cream gradient) showing the selected tile face in the selected tile color, with a round cinnabar **camera badge** bottom-right.
- **YOUR TILE** picker: a 5-col grid of **14 tile faces** the user picks from — a letter **monogram (D)**, a single **dot**, a **three-dot**, a **concentric “target”**, **two-stalk** and **three-stalk bamboo**, a **bird** (1-bamboo sparrow), a **flower**, a **plum blossom**, a **star**, a **joker** (ringed-bird emblem), a **dragon** (coiled, horned), and the characters **中** and **發**. Each is a single-color SVG/glyph on a cream tile; the selected one gets an accent border + a small ✓ badge. Faces are built by `faceSVG(type)` / `faceNode(face,px,color)` in the source (all use `currentColor` so they recolor).
- **TILE COLOR**: a row of 7 swatch circles — `#10B39A #C0392B #2E86D4 #6A3FC0 #F5A524 #1F8A5B #14162A` — selected swatch gets a same-color ring. Changing it recolors the avatar (and the monogram).
- **NAME** input (defaultValue “drew”), **HANDLE** input (`@` prefix, Space Mono), **BIO** textarea (“Mahjong addict. Chasing all 70.”). All white, 2px border, radius 11, focus border = accent.
- **GAMEPLAY** section divider; **EXPERIENCE LEVEL** segmented control (Beginner / Intermediate / Expert, selected = accent fill) + caption “Tailors your rules & tips.”; a **MY CARD — BRING YOUR OWN** outline button (document glyph).
- **APPEARANCE** divider; a **Sound & haptics** toggle row (speaker glyph + iOS toggle); a **COLOR THEME** 2-col theme-chip grid (same as Settings); a **SAVE CHANGES** primary button.

### Member detail (sheet from a leaderboard/feed row)
A bottom-sheet profile: cinnabar header band (stripe overlay, big avatar tile, name, `@handle · FRIEND SINCE`, a `#1 RANK` gold chip), three stat tiles (CLEARED `31/70`, MAHJS, POINTS), a **COLLECTION PROGRESS** solid bar, a “you both play …” mutual-table chip, a RECENT MAHJS list, and REMOVE FRIEND / VIEW ALL MAHJS footer buttons. The feed behind is dimmed.

## Interactions & Behavior
- **Theme switching**: tapping a theme chip (top of the design page) sets CSS vars (`--c1`, `--screen`, `--onbg`, `--c1dark`, `--titleColor`) and swaps the generated banner art. In production this is a theme context/provider; the chip row itself is a design-harness control, not an app screen.
- **Stat tiles**: on first mount, stagger-animate in (opacity + translateY(16px) + rotate(-3deg) → settle) and numbers count up over ~950ms with an ease-out cubic.
- **Hand rows (Card)**: tap → flip (perspective rotateX 0→-26°→0, ~480ms) and toggle a green check that stamps in (scale 0.2→1.28→1 with a back-ease, ~400ms); row border toggles to `#10B39A`.
- **`I GOT MAHJ!`**: tap → open Log-a-Mahj sheet (slide up ~360ms `cubic-bezier(.2,.85,.3,1)`, backdrop fade) AND fire tile confetti.
- **Hand category chips**: tap → set active category, reveal/replace the line picker; reset selected line.
- **Line picker rows**: tap → toggle that single line's checkbox.
- **Share toggle**: tap row → flip on/off (knob translateX 0↔19px, track green↔grey, row tint/border).
- **SAVE MY MAHJ**: close sheet, then fire a second confetti burst.
- **Buttons** generally: `:active` depresses (translateY ~2px, reduced shadow).

### Tile confetti (celebration)
On open and on save, ~46 **mini mahjong-tile** elements spawn across the full width at the top of the screen (`top:-46px`, random x), each a cream tile (16–27px wide, h = w×1.32, radius 4, border, shadow) containing a random face: a CJK glyph (萬/發/中/東/花/北 in a theme color), a **dot** (concentric circles), or **bamboo** (two rounded bars). They animate down past the bottom with horizontal sway, rotation (±~760°), staggered start (≤~430ms), 1.5–2.5s duration, fading out at the end; elements remove themselves on finish. Implement with whatever particle/animation approach suits the platform (e.g. Reanimated, a confetti lib themed with custom tile shapes, or a Lottie).

## State Management
- `theme` (string) — active theme key; drives all color tokens + banner art. **Default `felt`.**
- **Edit Profile state**: `profFace` (int, index into the 14 tile faces), `profColor` (hex tile color), `profLevel` (int 0–2 — Beginner/Intermediate/Expert), `profSound` (bool). These drive the live avatar + selection states; in production back them with the user's profile record.
- `mahjOpen` (bool) — Log-a-Mahj sheet visibility.
- `mahjCat` (string) — selected hand category key (default `free`).
- `mahjLine` (int | null) — selected line index within the category (toggleable).
- Per-hand-row cleared state (Card list) — local/optimistic; in production backed by the user's progress data.
- Share toggle state (default on).
- Data needed: user stats (cleared count, mahjs, points), the 70 hands (with cleared flags + notation + category), challenges, friends + leaderboard, feed posts, tables (members, messages, date polls), rules content.

## Design Tokens

### Themes (each defines accent `c1`, screen bg, on-bg text, banner ground, dark offset, title color)
| Theme | c1 (accent) | screen | onbg | banner ground | c1dark (offset) | title |
|---|---|---|---|---|---|---|
| Bam | `#15803D` | `#E9F4EC` | `#0A3D24` | `#1AA45C` | `#053219` | `#FFFFFF` |
| Dot | `#1E6FCB` | `#EBF1F4` | `#15386E` | `#EAEFEA` | `#0A2C58` | `#0A2A4E` |
| Crak | `#C0392B` | `#F6EEDD` | `#1A1410` | `#F2E8D6` | `#4D0F09` | `#4D0F09` |
| Dragon | `#C8302C` | `#E7F0EA` | `#F3E6C6` | `#0E4031` | `#4C0D0B` | `#F3E6C6` |
| Flower | `#DB2777` | `#FAECF3` | `#7A1E48` | `#F7DCE9` | `#5C0A30` | `#5C0A30` |
| Joker | `#6A3FC0` | `#F0EBFA` | `#F0EBFA` | `#6A3FC0` | `#281451` | `#FFFFFF` |
| Wind | `#2E7D8C` | `#EAF2F3` | `#143B42` | `#E3EEEF` | `#0A2E34` | `#0E353C` |
| Felt (default) | `#C0392B` | `#E8F1EA` | `#0E3D28` | `#1C5A3E` | `#0C3325` | `#FFFFFF` |

`--titleColor` is the high-contrast color used for the big screen titles (chosen to pop off that theme's banner art). `--c1dark` is the hard-offset shadow color for the two-tone headline (and the Log sheet title shadow).

### Fixed accent palette (used regardless of theme, for the hand-notation colors, badges, illustrations)
- Cinnabar `#C0392B`, Pine `#10B39A`, Gold `#F5A524` (deep gold `#C9871A` / `#F4C84A`), Petal `#E2568F`, Blue `#2E86D4`, Violet `#6A3FC0`, Jade green `#1F6B4E` / `#15803D`.
- Ink (text) `#1A1410`; secondary text `#6A6A74` / `#8C8C96`; paper `#F4F6FA` / white.

### Typography
- **Display / headings**: Bricolage Grotesque (weights 400–800), tight tracking (-0.5 to -2px on large sizes). Two-tone titles are weight 800.
- **Body / labels**: Hanken Grotesk (400–800). Uppercase labels are weight 800, 1.5–3px letter-spacing, 9–11px.
- **Meta / monospace accents**: Space Mono (400/700) for timestamps, counts, eyebrow meta.
- **Hand notation**: Bricolage 700, ~16–21px, 0.5–1px letter-spacing; each tile-group colored from the fixed palette (e.g. `333` cinnabar, `666` pine, `6666` gold, `9999` blue, `FFF` petal, `DDDD` ink).

### Shape / spacing / shadow
- Border radii: tiles 4–7px, cards 8px, sheet 24px (top), pills/badges 20px, segmented controls 7px.
- Standard borders: `2px`–`2.5px solid rgba(20,22,42,0.09)` (and `0.12`/`0.14` variants).
- Card shadow: `0 10px 26px rgba(20,22,42,0.13)`; button shadow `0 7px 20px rgba(20,22,42,0.11)`; tile inset `inset 0 -5px 9px rgba(20,22,42,0.045)`.
- Screen gutters ~20px; section gaps 14–24px.
- A faint multiply **paper-noise texture** overlays each screen at ~10% opacity (an SVG fractal-noise turbulence).

### Iconography (bottom nav — multi-color mini illustrations)
- **Card**: white card outline (ink) with cinnabar/pine/blue ruled lines.
- **Mahjs**: gold star (fill `#F5A524`, deep-gold stroke) with a soft white highlight.
- **Feed**: a pine bird with a gold beak, petal wing, cinnabar legs, ink eye.
- **Tables**: a four-circle flower in cinnabar/gold/blue/pine with a gold center.
- **Rules**: a "dot" tile — white face, blue ring, gold center.
Active state recolors to the theme accent + raises the tile + shows the underline pill.

### Theme art (banner behind each header)
Each theme generates an SVG banner (motif of bamboo / dot rings / crak character / dragon burst / flowers / jokers / wind gusts + 風 medallion / felt table with tiles), rendered with a hand-drawn "rough" displacement filter + paper texture, on the theme's banner-ground color, masked to fade out toward the bottom. This is a flourish — reproduce with static themed illustrations/images per theme if generating SVG at runtime isn't worth it.

## Assets
No external image assets — everything is CSS/SVG. Photo areas (table photos, post images) are placeholders the user fills. Fonts are Google Fonts: **Bricolage Grotesque, Hanken Grotesk, Space Mono**. CJK tile glyphs (萬 發 中 東 南 西 北 花) render from the system CJK font.

## Files
- `Lets Mahj.dc.html` — the full hi-fi design (5 core screens + Log-a-Mahj sheet + **Settings** + **Edit Profile** + member-detail sheet + theming + animations). **Primary reference, and the source of truth for all icons / banner generators.**
- `Lets Mahj (backup before custom).dc.html` — earlier version before the collection board / confetti / felt theme / tile-rack progress were added (kept for reference only).
- `support.js` — the in-house runtime that renders `.dc.html`. **Do not port**; it's only here so the HTML opens in a browser.
- `ios-frame.jsx` — the device-bezel wrapper used to present each screen as a phone. Not part of the app.

### How to preview the reference
Open `Lets Mahj.dc.html` in a browser. Tap the theme chips at the top to see the system re-skin. Tap `I GOT MAHJ!` on the Mahjs screen to see the celebration + log sheet.
