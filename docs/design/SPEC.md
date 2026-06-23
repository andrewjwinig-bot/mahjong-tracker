# Let's Mahj — Design Spec (SPEC.md)

Machine-checkable spec for the **5 existing screens + Log-a-Mahj sheet + confetti**. Every value below is lifted verbatim from `Lets Mahj.dc.html`. Diff your CSS against this.

> Surfaces NOT yet designed (onboarding, game scorer, practice sheet, paywall, settings, distinct win/cleared result modals, empty states, member-detail) are tracked separately and are **out of scope for this doc** until designed.

Canvas: **402 × 874** (iOS frame). Screen horizontal gutter: **20px**. Body top padding **54px**, bottom padding **92px** (clears the nav). Fonts (Google): **Bricolage Grotesque**, **Hanken Grotesk**, **Space Mono**. CJK glyphs (萬發中東南西北花) render from the system CJK serif (`'Hiragino Mincho ProN','Yu Mincho','Songti SC',serif`).

---

## A) DESIGN TOKENS

### Per-theme CSS variables
Set these 6 vars on the app root per active theme. `--art` is the banner `url(...)` from `generators.js → bannerURI(theme)`. There are 9 themes; default is **Crak**.

| Theme | `--c1` (accent) | `--screen` (page bg) | `--onbg` (body text on bg) | `--titleColor` (big titles) | `--c1dark` (offset shadow) | banner ground |
|---|---|---|---|---|---|---|
| jade | `#1F6B4E` | `#F1EEE0` | `#23201A` | `#06291B` | `#06291B` | `#ECE6D2` |
| bam | `#15803D` | `#E9F4EC` | `#0A3D24` | `#FFFFFF` | `#053219` | `#1AA45C` |
| dot | `#1E6FCB` | `#EBF1F4` | `#15386E` | `#0A2A4E` | `#0A2C58` | `#EAEFEA` |
| **crak** (default) | `#C0392B` | `#F6EEDD` | `#1A1410` | `#4D0F09` | `#4D0F09` | `#F2E8D6` |
| dragon | `#C8302C` | `#E7F0EA` | `#F3E6C6` | `#F3E6C6` | `#4C0D0B` | `#0E4031` |
| flower | `#DB2777` | `#FAECF3` | `#7A1E48` | `#5C0A30` | `#5C0A30` | `#F7DCE9` |
| joker | `#6A3FC0` | `#F0EBFA` | `#F0EBFA` | `#FFFFFF` | `#281451` | `#6A3FC0` |
| midnight | `#4F46E5` | `#EDEFF6` | `#ECE7D6` | `#ECE7D6` | `#14105C` | `#0A0E1C` |
| felt | `#C0392B` | `#E8F1EA` | `#0E3D28` | `#F4E6C0` | `#0C3325` | `#1C5A3E` |

- `--titleSh` (title text-shadow) is `none` in the current build for every theme. The two-tone *poster* offset uses `--c1dark` only where explicitly applied (logo, Log-sheet title).
- Banner seeds (stable scatter): jade 3, bam 11, dot 7, crak 5, dragon 13, flower 8, joker 21, midnight 17, felt 23.

### Fixed palette (theme-independent — hand notation, badges, illustrations)
| Token | Hex | Use |
|---|---|---|
| Cinnabar | `#C0392B` | hand groups, default accent |
| Pine | `#10B39A` | cleared/got-it green, challenge card, share row, INVITE |
| Pine-alt | `#15803D` / `#1F8A5B` / `#1F6B4E` | bamboo, glyph greens |
| Gold | `#F5A524` | stars, gold badges |
| Gold-deep | `#C9871A` | star stroke, POINTS label |
| Gold-soft | `#F4C84A` | flower centers, points dot |
| Petal | `#E2568F` | 花 avatars, FFF notation |
| Blue | `#2E86D4` | dot tiles, 9999 notation |
| Violet | `#6A3FC0` | joker, +30 badge, "you" avatar |
| Ink | `#1A1410` | primary text |
| Ink-soft | `#2A2A30` | secondary body text |
| Muted | `#6A6A74` / `#8C8C96` / `#9A9AA4` | meta, labels, inactive |
| Muted-faint | `#B6B6BE` | "— OPTIONAL" |
| Paper | `#F4F6FA` | light fills on dark |
| White | `#FFFFFF` | card bg |

### Hairlines / borders
- Standard card/control border: **`2.5px solid rgba(20,22,42,0.09)`** (tiles & inner rows often `2px`).
- Variants: `rgba(20,22,42,0.12)`, `rgba(20,22,42,0.14)` (nav tile), `rgba(20,22,42,0.06)`/`0.07`/`0.08` (inner dividers, nav top border), `rgba(26,20,16,.12)` (notation divider in feed posts).

### Radii
tiles 4–5px · buttons/segmented/cards-small 7px · cards 8px · large inputs/photo/share 11–13px · bottom sheet top corners **24px** · pills/badges 20px · nav-tile 6px.

### Shadows
| Name | Value |
|---|---|
| Card | `0 10px 26px rgba(20,22,42,0.13)` |
| Button | `0 7px 20px rgba(20,22,42,0.11)` |
| Small/avatar | `0 2px 8px rgba(20,22,42,0.12)` and `0 4px 14px rgba(20,22,42,0.10)` |
| Stat tile (layered) | `0 2px 8px rgba(20,22,42,0.12), 0 12px 22px rgba(20,22,42,0.07), inset 0 -5px 9px rgba(20,22,42,0.045)` |
| Nav active tile | `0 3px 6px rgba(20,22,42,0.14), 0 11px 18px rgba(20,22,42,0.12), inset 0 -3px 5px rgba(20,22,42,0.05)` |
| Nav inactive tile | `0 1.5px 3px rgba(20,22,42,0.10), 0 5px 11px rgba(20,22,42,0.06), inset 0 -3px 5px rgba(20,22,42,0.05)` |
| Sheet | `0 -14px 44px rgba(20,22,42,0.30)` |

### Type ramp
| Role | Family | Size / weight / tracking |
|---|---|---|
| Screen title (two-tone) | Bricolage Grotesque 800 | 39px, `-1px`; Card logo 42px `-1.5px`; Tables 24px |
| Log-sheet title | Bricolage 800 | 30px `-1px`, shadow `3px 3px 0 var(--c1dark)` |
| Hand notation | Bricolage 700 | 16–21px, `0.3–1px` |
| Stat number | Bricolage 800 | 42px `-2px`, line-height `.8` |
| Section number (369) | Bricolage | 24px |
| Card title / hero label | Bricolage 800 | 18–23px |
| Uppercase label | Hanken Grotesk 800 | 9–11px, `1.5–3px` tracking |
| Body | Hanken Grotesk 400–600 | 12.5–14px, line-height 1.35–1.55 |
| Meta / counts / timestamps | Space Mono 400/700 | 8–11px |
| Tab label | Hanken 800 | 8px, `.6px` |

---

## B) COMPONENT RECIPES

> Default/Crak accent shown as literal `#C0392B`; in code it is `var(--c1)`. "active" = selected/pressed variant.

### Header art layer (behind every screen header)
`position:absolute; top:0; left:0; right:0; height:252px; z-index:0; pointer-events:none; opacity:0.6;` `background-image:var(--art); background-size:440px auto; background-position:center top; background-repeat:no-repeat;` masked: `mask-image:linear-gradient(180deg,#000 60%,transparent 100%)` (+ `-webkit-` prefix).

### Paper grain overlay (every screen)
`position:absolute; inset:0; z-index:1; pointer-events:none; opacity:.10; mix-blend-mode:multiply; background:` `paperGrainURI()`.

### Tile / avatar chrome (the cream mahjong tile)
bg `#FFFFFF` (avatars) or `linear-gradient(180deg,#FFFEFB,#F1EBDD)` (nav) / `linear-gradient(160deg,#FBF7EC,#EDE3CC)` (collection); border `2px solid rgba(20,22,42,0.09)`; radius 4–5px; shadow `0 2px 8px rgba(20,22,42,0.12)`. Glyph: Bricolage 700 or CJK serif, color from fixed palette. Common sizes: 24×30 (leaderboard), 32×40 (chat/post), 34×42 (tip/post), 38×48 (logo), 40×52 / 42×52 (sheet/table avatar).

### Stat tile  (Card — 3 across)
`flex:1; height:120px; radius:9px;` bg `linear-gradient(180deg,#FFFFFF 0%,#F6F2E8 100%)`; border `2px solid rgba(20,22,42,0.09)`; shadow = **Stat tile (layered)**; column, centered. Number: Bricolage 800 42px `-2px` `#1A1410` line-height `.8`; the `/70` suffix 16px in Pine `#10B39A`. Label: Hanken 800 9.5px `1.6px`, margin-top 13px, colored per tile — CLEARED `#10B39A`, MAHJS `var(--c1)`, POINTS `#C9871A`. On mount: **deal-in** + **count-up** (see §D). `data-deal` / `data-countup-to`.

### Primary button (e.g. SCORE GAME, SEND, ADD FRIEND)
`flex:1; bg:var(--c1); border:2.5px solid rgba(20,22,42,0.09); radius:7px; box-shadow:0 7px 20px rgba(20,22,42,0.11); padding:13px; text-align:center;` label Hanken 800 13px `1px` `#F4F6FA`. **active:** `transform:translateY(2px); box-shadow:0 3px 10px rgba(20,22,42,0.16)`.

### Secondary button (PRACTICE)
Same box; bg `#FFFFFF`, label color `#1A1410`.

### "I GOT MAHJ" hero (Mahjs screen)  — the ONE stripe+shine button
`bg:var(--c1); border:2.5px solid rgba(20,22,42,0.09); radius:10px; box-shadow:0 10px 26px rgba(20,22,42,0.13); padding:14px;` flex row, centered, gap 11px, `overflow:hidden; position:relative`.
- **Stripe overlay** (abs, inset:0, opacity .16): `repeating-linear-gradient(-45deg,#FFFFFF 0,#FFFFFF 2px,transparent 2px,transparent 11px)`.
- **Shine** (abs, top/bottom:0, left:0, width 38%): `linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-130%);` animation `mahjShine 3.4s ease-in-out infinite`.
- **萬 tile** 26×34, radius 4, white, border `2px rgba(20,22,42,0.09)`, color `var(--c1)`, `rotate(-7deg)`.
- **Label** Bricolage 800 18px `1px` `#FFFFFF`, `text-shadow:1.5px 1.5px 0 rgba(0,0,0,.35)`.
- **active:** `translateY(2px); box-shadow:0 4px 12px rgba(20,22,42,0.18)`. (The footer **SAVE MY MAHJ** is the same recipe at 15px label + 22×28 tile, shadow `0 9px 22px rgba(20,22,42,0.18)`.)

### Segmented control (filter ALL/TO GO/GOT IT; leaderboard toggle; Tables tabs)
Container `display:flex; border:2.5px solid rgba(20,22,42,0.09); radius:7px; overflow:hidden`. Segment `flex:1; text-align:center; padding:9px;` Hanken 800 11px `1px`. Dividers `border-left:2.5px solid rgba(20,22,42,0.09)`. **active segment:** bg `var(--c1)`, color `#FFFFFF`. inactive color `#1A1410`. (Leaderboard variant: 2px border, radius 6, padding 7, 10px label.)

### Challenge card (Card screen) — Pine fill
bg `#10B39A`; border `2.5px solid rgba(20,22,42,0.09)`; radius 8; shadow Card; padding 16; `position:relative; overflow:hidden`. Corner **sunburst SVG** (see §C) top `-26px` right `-22px`, 138×138, opacity .18, white. Eyebrow "★ SUMMER CHALLENGE" Hanken 800 10px `2px` **Gold `#F5A524`**. Title Bricolage 23px `#F4F6FA`. Desc 12.5px `rgba(242,232,214,.82)`. Progress: track `height:12px; border:2px rgba(20,22,42,0.09); radius:5; bg:rgba(0,0,0,.18)`; fill `repeating-linear-gradient(90deg,#F5A524 0 8px,rgba(0,0,0,.30) 8px 10px)` width 14%, animation `mahjGrow 1.1s cubic-bezier(.3,.85,.3,1) .35s both`; count `1/42` Space Mono 11px `#F4F6FA`.

### Tip card (Card screen)
flex row, gap 11, centered; bg `#FFFFFF`; border `2.5px solid rgba(20,22,42,0.09)`; radius 8; padding `11px 13px`. Star tile 34×42, white, border `2px`, shadow small, font 18px Gold `#F5A524`. Eyebrow "TIP OF THE DAY" Hanken 800 9px `1.5px` `var(--c1)`. Body 12.5px `#2A2A30`.

### Collection-board cell (the 70 hands) — 7-col grid, gap 6px
`position:relative; aspect-ratio:24/31; radius:5; border:2px rgba(20,22,42,0.09); bg:linear-gradient(160deg,#FBF7EC,#EDE3CC); box-shadow:0 1px 3px rgba(20,22,42,0.10);` centered, overflow hidden.
- **locked:** a 9×9 ring `border:2px solid rgba(31,107,78,0.28); border-radius:50%`.
- **cleared:** white overlay `inset:0`; label Bricolage 700 13px `.3px` in hand color; **check badge** top-2 right-2, 12×12, radius 3, bg `#10B39A`, white ✓ (see §C check).

### Hand row + checkbox (Card list)
flex row gap 11, centered; bg `#FFFFFF`; radius 7; padding 12; margin-bottom 9; cursor pointer. border `2.5px solid rgba(20,22,42,0.09)`; **cleared:** border `2.5px solid #10B39A` + shadow Button. **active:** `transform:scale(0.985)`.
- **Checkbox** 22×22 radius 4 border `2px rgba(20,22,42,0.09)`, `data-check`. unchecked bg `#F4F6FA`, empty. checked bg `#10B39A` with white ✓ (11×9 path). Stamp anim on toggle (§D).
- **Notation** flex:1, Bricolage 700 21px `1px`, each group colored (333 cinnabar, 666 pine, 6666 gold, 9999 blue, FFF petal, DDDD ink, etc.).
- **Points chip** dot 16×16 `border-radius:50%` (Gold `#F5A524` if earned, else `#F4F6FA`) + Space Mono 12px count.

### Leaderboard row + hatched progress bar (Feed)
flex row gap 9, centered, margin-bottom 11. Avatar 24×30 tile (glyph in player color). Right col `flex:1`: name (Hanken 700 13px) + `x/70` (Space Mono 11px, `/70` in `#8C8C96`); below, bar `height:12px; border:2px rgba(20,22,42,0.09); radius:5; overflow:hidden; bg:#F4F6FA` with fill `repeating-linear-gradient(90deg,<color> 0 7px,rgba(0,0,0,.26) 7px 9px)` at the player's %; animation `mahjGrow 1.1s cubic-bezier(.3,.85,.3,1)` staggered `.4/.5/.6/.7s both`.
- **"you" row:** wrapped in tinted panel bg `#F4F6FA`, border `2px rgba(20,22,42,0.09)`, radius 6, padding 8, margin `0 -3px`; avatar bg white; name suffix "· YOU" Space Mono 9px Violet `#6A3FC0`.

### Feed post card
bg `#FFFFFF`; border `2.5px solid rgba(20,22,42,0.09)`; radius 8; shadow Card; padding 14; margin-bottom 16. Header: avatar 34×42 + name (Hanken 700 14px) + time (Space Mono 10px) + **MAHJ badge** (bg `var(--c1)` or `#10B39A`, border 2px, radius 20, padding `3px 11px`, Hanken 800 10px `1px` `#F4F6FA`). Notation row Bricolage 21px, `padding:2px 0 9px; border-bottom:2px solid rgba(26,20,16,.12)`. Caption 13.5px `#2A2A30`. Action row gap 18, Hanken 700 12px: liked `♥ N Likes` in `var(--c1)`, else muted `♡`.

### Chat bubble (Tables)
Row: avatar 32×40 + col. Name Hanken 800 11px `.5px` in player color + time Space Mono 9px. Bubble `display:inline-block; bg:#FFFFFF; border:2px rgba(20,22,42,0.09); border-radius:3px 12px 12px 12px; padding:9px 13px;` 13.5px `#1A1410`. **Inverted variant:** bg `#1A1410`, text `#F4F6FA`.

### Nav tile (bottom tab — 5 across)
Column, gap 5, centered. Tile 32×40 radius 6, bg `linear-gradient(180deg,#FFFEFB 0%,#F1EBDD 100%)`, border `1.5px rgba(20,22,42,0.14)`, `transition:transform .14s ease`. **active:** `transform:translateY(-3px)` + nav-active shadow; icon recolors to `var(--c1)`; label color `var(--c1)`; underline pill 15×3 radius 3 bg `var(--c1)`. **inactive:** nav-inactive shadow; label `#9A9AA4`; underline transparent. Label Hanken 800 8px `.6px`. Icons in §C.

### Bottom sheet (Log-a-Mahj)
Backdrop `position:absolute; inset:0; z-index:40; bg:rgba(20,22,42,0.45)`, anim `mahjFade .22s ease both`. Panel `position:absolute; left/right:0; bottom:0; z-index:41; max-height:95%; bg:#FBF7EC; border-top-left/right-radius:24px; box-shadow:0 -14px 44px rgba(20,22,42,0.30); overflow:hidden;` anim `mahjSheet .36s cubic-bezier(.2,.85,.3,1) both`. Header band bg `var(--c1)`, padding `22px 20px 18px`, stripe overlay opacity .15, drag handle 44×5 radius 4 `rgba(255,255,255,.55)`, scattered confetti specks (gold square 9×9 rotate20, white dot 7, pine square 8 rotate-15, gold-soft dot 6), 萬 tile 40×52 rotate-6, "LOG YOUR WIN" kicker + title (see ramp) + subtitle 12.5px `rgba(255,255,255,.92)`. Body padding `17px 18px 4px; overflow-y:auto`. Footer: CANCEL (white outline, radius 12) + SAVE MY MAHJ (hero recipe), `border-top:2px solid rgba(20,22,42,0.07)`.

### Category chip (sheet)
`padding:8px 13px; radius:8; border:2px; font:Hanken 800 12px`. inactive border `rgba(20,22,42,0.12)`, bg `#FFFFFF`, color `#1A1410`. **active:** border + bg `var(--c1)`, color `#FFFFFF`.

### Line-picker row (sheet)
Container card white, border `2px rgba(20,22,42,0.10)`, radius 11. Header "PICK YOUR LINE…" Hanken 800 9px `1.5px` `#8C8C96` padding `10px 13px 6px`. Row flex gap 11, padding `10px 13px`, `border-top:2px solid rgba(20,22,42,0.06)`. Checkbox 20×20 radius 5 border 2px; **checked** border+bg `#10B39A`, white ✓ glyph 12px. Line Bricolage 700 16px `.5px` in category color. **active row:** bg `rgba(20,22,42,0.03)`.

### iOS toggle (share row)
Track 46×27 radius 14; **on** bg `#10B39A`, **off** bg `#D8D8DE`. Knob 21×21 circle white, shadow `0 1px 3px rgba(0,0,0,.3)`, top 3 left 3; **on** `translateX(19px)`, **off** `translateX(0)`; `transition:transform .18s`. Row: border `2px #10B39A` + bg `rgba(16,179,154,0.10)` when on; border `rgba(20,22,42,0.12)` + bg `#FFFFFF` when off; radius 13, padding `12px 13px`.

### Date-poll chip (Tables)
Card white, border 2.5px, radius 8, shadow Button, padding `12px 14px`. Title "📅 NEXT GAME — VOTE" Hanken 800 10px `1.5px`. Two options flex gap 8: each `flex:1; border:2px rgba(20,22,42,0.09); radius:6; padding:8; text-align:center`. **winning** bg `#F5A524`; date Hanken 800 13px `#1A1410`; count Space Mono 9px ("4 in ✓" / "1 in").

### Poster title (two-tone wordmark)
Card logo: kicker "LET'S" Hanken 800 11px `3px` `var(--titleColor)`; "Mahj…" Bricolage 800 42px `-1.5px` `var(--titleColor)`, `text-shadow:var(--titleSh)`. The italic "…" is Bricolage 700 20px. Screen titles use the same `var(--titleColor)`; accent underline bar **48×6 radius 4 bg var(--c1)** sits under titles (Mahjs/Feed), margin `11px 0 9px`.

### Category section header (369)
Number Bricolage 24px `var(--c1)` + right-aligned "1 / 7 GOT" Space Mono 10px `#8C8C96`, baseline-aligned, margin-bottom 11.

---

## C) ICONS (inline SVG — exact)

> ⚠ **Known issue flagged by design:** the **challenge card corner icon should be the SUNBURST below** (12 rays + 2 rings + dot), not a generic star/medal. Verify each placement against this list.

| Icon | viewBox | Spec | Used on |
|---|---|---|---|
| **Settings** | `0 0 17 17` | 2 dots r2.2 at (5,5)&(12,12) ink; 2 lines `M7.2 5h7.5 / M2.5 12h7.3` stroke `#1A1410` 1.6 round | Card + Mahjs header tile |
| **Collection check / row check** | `0 0 11 9` | `M1 4.5l3 3L10 1` stroke 2–2.6 round, white (`#FFFFFF`/`#F4F6FA`) | collection badge, hand checkbox |
| **Challenge sunburst** | `0 0 100 100` | 12 rays: `line x1=50 y1=4 x2=50 y2=15` rotated every 30°, white 4.5 round; ring `circle r22` white 4.5; center `circle r9` white | Challenge card corner (opacity .18) |
| **Tip star** | — | glyph `★` 18px Gold `#F5A524` (not SVG) | Tip card |
| **Camera (ADD PHOTO)** | `0 0 20 18` | body `rect x1.3 y3.5 w17.4 h13 rx2.6`; lens `circle 10,10.2 r3.6`; bump `M6.5 3.5 L7.7 1.4 H12.3 L13.5 3.5` — all stroke `var(--c1)` 1.7 | sheet photo dropzone |
| **Back chevron** | `0 0 11 13` | `M8 1L2 6.5 8 12` stroke `#1A1410` 2 round | Tables header |
| **Nav · Card** | `0 0 17 19` | card `rect x2.3 y1.9 w12.4 h15.2 rx2.4` white stroke ink 1.4; 3 ruled lines `M5 6.2h7`(cinnabar) `M5 9.5h7`(pine) `M5 12.8h4.6`(blue) 1.7 round | tab |
| **Nav · Mahjs** | `0 0 20 20` | 5-point star path fill `#F5A524` stroke `#C9871A` 1.3; highlight `circle 10,9.1 r1.7` white .6 | tab |
| **Nav · Feed** | `0 0 20 20` | bird: body `ellipse 9,11 rx5 ry4.3` pine; head `circle 13,6.9 r2.7` pine; beak `M15.1 6.4 L18.6 5.3 L15.5 7.9 Z` gold; wing `M4.8 10.2 C1.6 8.8 1.2 11.6 4.5 12.9 Z` petal; legs `M8 15.2 l-0.4 2.8 / M11 15 l0.4 2.8` cinnabar 1.4; eye `circle 13.5,6.6 r0.9` ink | tab |
| **Nav · Tables** | `0 0 20 20` | 4 petals `circle r2.8` at top/right/bottom/left = cinnabar/gold/blue/pine; center `circle r2.5` gold-soft `#F4C84A` stroke `#C9871A` 1 | tab |
| **Nav · Rules** | `0 0 18 18` | dot tile: `circle 9,9 r6.4` white stroke blue `#2E86D4` 2; center `circle 9,9 r2.5` gold | tab |
| **Tile faces (dot / bam / CJK)** | varies | from `generators.js → tileFaceSVG()` | avatars, confetti, collection |

Non-SVG glyph marks used as icons: `★` (challenge/tip eyebrows), `♛` (leaderboard), `⚇` (feed), `⊕` (score), `◎` (practice), `⤴` (invite), `♥/♡` `💬` (post actions), `💬 📅 📷` (Tables tabs), `🀄 🍪` (chat). Keep as text glyphs.

---

## D) ANIMATIONS

### CSS @keyframes
| Name | Frames | Default timing | Applied to |
|---|---|---|---|
| `mahjGrow` | `from { width:0 }` | `1.1s cubic-bezier(.3,.85,.3,1)`, delay `.35–.7s`, `both` | challenge progress fill; all leaderboard bars (staggered) |
| `mahjShine` | `0%{translateX(-130%)} 55%,100%{translateX(360%)}` | `3.4s ease-in-out infinite` | shine sweep on I GOT MAHJ + SAVE MY MAHJ |
| `mahjFade` | `from { opacity:0 }` | `.22s ease both` | sheet backdrop |
| `mahjSheet` | `from { transform:translateY(100%) }` | `.36s cubic-bezier(.2,.85,.3,1) both` | sheet panel slide-up |

### JS-driven (Web Animations API / rAF)
| Behavior | Detail |
|---|---|
| **Stat tile deal-in** | per tile `[data-deal]`: start `opacity:0; translateY(16px) rotate(-3deg)`; `transition: opacity .5s ease, transform .6s cubic-bezier(.2,.85,.3,1.3)`; settle to none at `140 + i*100` ms. Runs once (`_animDone` guard). |
| **Number count-up** | `[data-countup-to]`: ease-out cubic `1-(1-p)^3` over **950ms**, rounding to target. |
| **Hand row flip** | on tap: `perspective(560px) rotateX(0→-26→0)`, **480ms** `cubic-bezier(.3,.85,.3,1)`. |
| **Check stamp** | on check: `scale(0.2) rotate(-22deg) → scale(1.28) rotate(7deg) @0.6 → scale(1) rotate(0)`, **400ms** `cubic-bezier(.3,1.5,.4,1)`; row border → `#10B39A`. Uncheck reverses to neutral. |
| **Share toggle** | knob `translateX 0↔19px` `.18s`; track green↔`#D8D8DE`; row tint/border swap. |
| **Tile confetti** | `rainTiles()` — 46 tiles, start `top:-46px` random x; keyframes fall to `H+120px` with sway `±35px`, spin `±380°`, fade in @0.1 / out @end; delay `0–430ms`, dur `1500–2500ms`, `cubic-bezier(.35,.45,.5,1)`; self-remove `onfinish`. Fires on **open** (80ms after) and **save** (30ms after) of the Log sheet. Full code in `generators.js`. |
| **Button press** | most buttons `:active` → `translateY(1–2px)` + reduced shadow. |

---

## State (current build)
`theme` (string, default `crak`) · `mahjOpen` (bool) · `mahjCat` (string, default `free`) · `mahjLine` (int|null, toggleable) · per-hand-row cleared (local) · share toggle (default on). Category line data: see `CATS` table in source (9 categories, 0–3 lines each).
