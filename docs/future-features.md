# Future feature ideas

A running list of ideas to revisit. Not committed work — parking lot for things
that come up while building.

## Designer / themed tile sets (unlockable)
A "My Tile Sets" screen where players choose from beautifully crafted tile
collections that change the look of the tiles everywhere (card, scorer, learn,
confetti). Ties into the existing CSS-variable theming.

- Hero: "DESIGNER TILE SETS — Tiles worth looking at. Beautifully crafted
  collections you unlock as you play."
- A "Playing with {set}" feature card + a "Your Sets" list (e.g. Classic
  Porcelain — "Inspired by classic mahjong tiles", Vacay in Venice — "the famous
  canals", Safari Sunset — "the open savannah"), each with a 4-tile preview and
  an "In use" badge on the active set.
- Sets unlock as you play (clear hands / hit milestones), or via Pro — pairs well
  with the existing paywall + cosmetic-pack scaffold.
- Implementation hook: `app/lib/tileArt.ts` already renders all tile faces from
  one place; a tile-set would swap the art/palette tokens it reads, the same way
  themes swap CSS variables today. Add a `tileSet` pref alongside `themePrefs`.

### How tile sets get unlocked (mix-and-match)
Several appealing earn mechanics, all of which fit systems we already have:

- **Invite to unlock** — "Unlock other designs by inviting friends." Each set
  costs N invites (e.g. Vacay in Venice = 1 invite, Safari Sunset = 2). Ties into
  the existing Find Friends / invite flow; count accepted invites toward unlocks.
  Onboarding can hand out a free "starter set" and tease the rest ("INVITE TO
  UNLOCK").
- **Earn by playing (streaks)** — "Play 7 days in a row to unlock this set," with
  a 7-dot streak tracker and a flame/`0/7 days` badge. We already record a daily
  play streak (`recordPlay()` / `bestStreak`); surface a current-streak unlock.
- **Earn via trophies** — gate sets behind milestones we already compute in
  `app/lib/badges.ts` (e.g. clear a section, clear the card, hit a win count).
  "Unlock features by playing" — reuse the trophy shelf as the unlock surface so
  cosmetics reward the goals players already chase.
- Pro tier can unlock the full catalog instantly (existing paywall scaffold), so
  there's a free path (invites/streaks/trophies) and a paid path.

## Learn / training — future expansions
- Per-step "try it" interactions tied to the real card (e.g. tap the matching
  hand on your card after a lesson).
- A daily drill / streak for the practice quizzes.
- Audio pronunciation for tile names (bams, cracks, "soap", etc.).
- More lessons: joker redemption, exposures & what they reveal, scoring & points,
  tournament vs. table rules.
