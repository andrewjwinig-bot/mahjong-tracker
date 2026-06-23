# Let's Mahj — Component Verification Checklist (CHECKLIST.md)

Tick each item against **SPEC.md**. Covers the **5 core screens + Log-a-Mahj sheet + confetti + Settings + Edit Profile + member-detail sheet**. Missing surfaces (onboarding, scorer, practice, paywall, result modals, empty states) are appended at the bottom as **NOT YET DESIGNED** so nothing is silently dropped.

## Global / shared
- [ ] Canvas 402×874, 20px gutters, body padding 54px top / 92px bottom
- [ ] Fonts loaded: Bricolage Grotesque, Hanken Grotesk, Space Mono; CJK serif fallback for glyphs
- [ ] Theme system: 6 CSS vars set per theme (`--c1 --screen --onbg --titleColor --c1dark --art`), **8 themes, default felt**
- [ ] Header art layer — 252px, opacity .6, bg-size 440px, masked fade to transparent at 60→100%
- [ ] Paper grain overlay — opacity .10, mix-blend multiply, tiling noise
- [ ] Bottom nav — 5 tabs, active tile raised translateY(-3px) + accent icon/label + underline pill
- [ ] Nav icons correct: Card (ruled card), Mahjs (gold star), Feed (bird), Tables (4-petal flower), Rules (dot tile)
- [ ] Standard hairline `2.5px solid rgba(20,22,42,0.09)` used consistently

## Screen 01 — Card (home)
- [ ] Two-tone logo: "LET'S" kicker + "Mahj…" 42px in `--titleColor`
- [ ] Settings tile (38×38) with settings icon
- [ ] 3 stat tiles — 120px, white→cream gradient, layered shadow + inset; numbers 42px; labels CLEARED(pine)/MAHJS(accent)/POINTS(gold-deep)
- [ ] Stat deal-in animation + count-up (950ms) on mount, once
- [ ] Action row: SCORE GAME (primary accent) + PRACTICE (white)
- [ ] Challenge card — pine fill, sunburst corner (opacity .18), gold eyebrow, **slim solid progress fill** (mahjGrow), 1/42
- [ ] Tip card — star tile + TIP OF THE DAY eyebrow + body
- [ ] Filter segmented — ALL active (accent), TO GO, GOT IT
- [ ] Collection board — 7-col grid, 70 cells, aspect 24/31; locked = jade ring; cleared = white + colored label + check badge; header + 1/70
- [ ] "369" section header (24px accent + "1 / 7 GOT")
- [ ] Hand rows — checkbox + colored notation + points chip; cleared row has pine border + filled check
- [ ] Hand row tap → flip (rotateX 480ms) + check stamp (400ms back-ease)

## Screen 02 — Mahjs
- [ ] Title "Your Mahjs" (two-tone) + 48×6 accent underline + subtitle
- [ ] I GOT MAHJ hero — accent fill, diagonal stripe overlay (.16), shine sweep (mahjShine), 萬 tile rotate-7, label with hard text-shadow
- [ ] "RECENT — N MAHJS" header + "+25 this week"
- [ ] Mahj card w/ photo — striped photo placeholder, +points badge, notation, quote, meta line (Space Mono)
- [ ] Mahj card no-photo — notation + violet +30 badge, quote, meta

### Log-a-Mahj sheet (overlay)
- [ ] Backdrop (rgba .45) + mahjFade; panel slide-up mahjSheet, radius-24 top, max-height 95%
- [ ] Header band — accent fill, stripe overlay (.15), drag handle, scattered confetti specks, 萬 tile, "LOG YOUR WIN" kicker, two-tone "I GOT MAHJ!" (shadow c1dark), subtitle
- [ ] WHICH HAND? category chips (9) — active = accent fill
- [ ] Line picker appears for non-Freeform — card w/ "PICK YOUR LINE…" + rows w/ checkbox (toggle single) + colored line
- [ ] NOTE textarea — focus border accent
- [ ] PHOTO dashed dropzone — camera icon + ADD PHOTO (accent)
- [ ] Share row — pine border + tint, 花 avatar, label + "5 PLAYERS WILL SEE IT", iOS toggle (on default)
- [ ] Footer — CANCEL (white outline) + SAVE MY MAHJ (hero recipe)
- [ ] Confetti fires on open (80ms) and save (30ms); 46 tiles, fall+sway+spin, self-remove

## Screen 03 — Feed
- [ ] Title "The Feed" + underline + subtitle
- [ ] Action row: + ADD FRIEND (accent) / ⤴ INVITE (pine)
- [ ] Leaderboard card — ♛ header + 5 PLAYERS; ROWS CLEARED/TOTAL POINTS toggle
- [ ] Player rows — avatar (player color glyph), name, x/70, **slim solid progress bar** (mahjGrow staggered)
- [ ] "you" row — tinted panel, white avatar, "· YOU" violet
- [ ] ⚇ THE FEED header
- [ ] Post cards — avatar + name + time + MAHJ badge; notation row w/ bottom divider; caption; like/comment row (liked = accent ♥)
- [ ] Decorative notation watermark (369 2025 FFFF, ~46px, opacity .12) lower area

## Screen 04 — Tables
- [ ] Header — back chevron + 萬 table avatar + "Tuesday Game" title + "5 PLAYERS" + ⤴ INVITE (pine)
- [ ] Tabs — 💬 CHAT (active accent) / 📅 DATES / 📷 PHOTOS
- [ ] Chat messages — avatar + colored name + time + bubble (radius 3/12/12/12); one inverted ink bubble
- [ ] Date-poll chip — VOTE title + two date options (winning = gold fill, vote counts)
- [ ] Composer — text field + accent SEND

## Screen 05 — Rules
- [ ] Title "The Rules" + underline + subtitle
- [ ] Practice CTA (accent) "◎ PRACTICE: WHAT CAN I MAKE?"
- [ ] Accordion — open "Understanding the tiles" (accent header bar + 萬) listing tile types w/ illustrations
- [ ] Collapsed rows — "How to play", "The Charleston", "Playing with 3 players" (glyph + ▸)

## Screen 06 — Settings
- [ ] Back tile + "Settings" title
- [ ] Profile card — tile avatar + name/handle/email + level pill + chevron (opens Edit Profile)
- [ ] "Let's Mahj Pro" upsell — ink card, gold stripe overlay, gold tile, GO PRO
- [ ] APP THEME 2-col chip grid (banner thumb + accent dot + name; selected ringed + check)
- [ ] PREFERENCES list — iOS toggles (share / push / leaderboards / sound)
- [ ] GAME list — Card year / Default table / Experience level (value + chevron)
- [ ] ACCOUNT list — change password / help / privacy
- [ ] SIGN OUT (cinnabar outline) + v1.0 footer

## Screen 07 — Edit Profile (from Settings profile card)
- [ ] Back tile + "Edit profile" title + subtitle
- [ ] Avatar tile (96×120) shows selected face in selected tile color + cinnabar camera badge
- [ ] YOUR TILE — 5-col grid, 14 faces (monogram, dot1, dot3, circle, bam2, bam3, bird, flower, blossom, star, joker, dragon, 中, 發); selected = accent border + ✓ badge
- [ ] TILE COLOR — 7 swatches (`#10B39A #C0392B #2E86D4 #6A3FC0 #F5A524 #1F8A5B #14162A`); selected ringed; recolors avatar
- [ ] NAME / HANDLE (@ prefix) / BIO inputs — white, 2px border, radius 11, focus accent
- [ ] GAMEPLAY — EXPERIENCE LEVEL segmented (Beginner/Intermediate/Expert) + caption; MY CARD outline button
- [ ] APPEARANCE — Sound & haptics toggle row; COLOR THEME chip grid; SAVE CHANGES primary

## Member-detail sheet (from leaderboard/feed row)
- [ ] Cinnabar header band — stripe overlay, big avatar, name, @handle · FRIEND SINCE, #1 RANK gold chip
- [ ] 3 stat tiles (CLEARED 31/70 / MAHJS / POINTS)
- [ ] COLLECTION PROGRESS solid bar
- [ ] mutual-table chip + RECENT MAHJS list
- [ ] REMOVE FRIEND / VIEW ALL MAHJS footer; dimmed feed behind

## Reusable components (cross-screen — verify once, reuse)
- [ ] Tile/avatar chrome (cream, sizes 24×30 / 32×40 / 34×42 / 38×48 / 40×52)
- [ ] Primary button + active state
- [ ] Secondary button
- [ ] Segmented control (3 sizes: filter / leaderboard / tabs)
- [ ] Hand notation renderer (per-group color map)
- [ ] Badge / pill (MAHJ, points, +N)
- [ ] iOS toggle
- [ ] Progress bar (slim solid fill, mahjGrow)
- [ ] Poster two-tone title + accent underline bar

---

## ⛔ NOT YET DESIGNED — needs design pass before implementation
- [ ] Onboarding / welcome flow (every step)
- [ ] Game Scorer (live scoring flow, all steps) — `SCORE GAME` destination
- [ ] Practice "What can I make?" sheet (input + results) — `PRACTICE` destination
- [ ] Paywall / Pro unlock (the Settings "GO PRO" destination)
- [ ] Win / cleared celebration **result modal** (distinct from confetti rain)
- [ ] Empty states — Mahjs (no wins), Feed (no friends/posts), collection (0/70)
