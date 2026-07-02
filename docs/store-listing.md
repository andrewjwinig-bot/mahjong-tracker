# Store Listing Copy — Club Mahj  (FINAL draft)

Ready-to-paste copy for the App Store & Google Play. All original. Character
counts noted against each platform limit.

**Rules of the road**
- **Never** use "National Mah Jongg League" / "NMJL" in the name, subtitle, or
  keywords (trademark). Keep the non-affiliation disclaimer in the description.
- Every feature named below is **shipped today** — don't add planned-but-unbuilt
  features (deep win insights, CSV export, push) until they exist, or Apple can
  reject for unavailable functionality.
- **Category: Social Networking** (secondary: Lifestyle). Not Games.

**Identifiers:** app name **Club Mahj** · bundle id `com.clubmahj.app` ·
domain `clubmahj.com`.

---

## App name  (Apple ≤30 · Google Play ≤30)
**Recommended:** `Club Mahj: Mahjong Card`  _(23)_
- The daily job is your card, and "Mahjong Card" is a real search term — brand +
  keyword in one.

**Alternatives:**
- `Club Mahj: Mahjong & Friends`  _(28)_ — leans social
- `Club Mahj`  _(9)_ — cleanest, weakest for search (nobody searches the brand yet)

## Subtitle  (Apple ≤30 — indexed for search)
**Recommended:** `American mahjong & friends`  _(26)_
- Adds the high-value "American mahjong" term the name doesn't carry.

**Alternatives:**
- `Track wins with your table`  _(26)_
- `Your card, your wins, your crew`  _(31 — trim)_ → `Your card, wins & crew`  _(22)_

## Google Play — short description  (≤80)
`The mahj social network — track wins, clear your card, play with friends.`  _(72)_

## Keywords  (Apple ≤100, comma-separated, NO spaces, no words already in name/subtitle)
```
mahjongg,scorecard,tile,hands,wins,tracker,score,points,social,group,seasonal,trophies,learn,chat
```
_(97 chars. Deliberately omits mahjong/american/card/friends — already covered by
the name + subtitle — and avoids "league" to stay clear of the NMJL mark.)_

## Promotional text  (Apple ≤170 — editable anytime without review)
> Tap a tile every time you call Mahj, chase a new seasonal challenge, and keep
> up with your table. Your whole American mahjong year, in one playful app.  _(148)_

## What's New — first release  (≤4000)
> Welcome to Club Mahj — the original mahj social network! Track your wins, learn
> the tiles, chase seasonal challenges, earn trophies, and play along with your
> table. Tap a hand each time you win it and watch your card fill in.

---

## Description  (Apple ≤4000 · Google Play full description ≤4000)

**Club Mahj — the original mahj social network.**

The playful way to track every hand you win, learn the tiles, score your games,
and keep your table connected. Tap a hand each time you call "Mahj!" and watch
your card fill in with a celebration of tumbling tiles.

**🀄 Track your card**
- Tap to log a win on any hand and watch your progress climb.
- See hands cleared, total wins ("mahjs"), and points at a glance.
- Filter to what's left "To Go" to pick your next target.

**🎉 Celebrate every win**
- A full-screen tile celebration (with an optional chime + haptics) every time
  you call Mahj.
- Earn trophies for milestones, category clears, streaks, and seasons.

**🗓️ Seasonal challenges**
- A new themed challenge each season — flowers in spring, dragons in autumn —
  that keeps you playing across your whole card.

**🧮 Score live games**
- A live scorepad for your table — add players and tally every hand as you play.
- Save your games, rematch a past one, and share a scorecard.

**👯 Find your crew**
- Add friends, see who's around, and discover suggested players from your tables
  and friends-of-friends.
- Share wins to a feed; like and comment on your friends' hands.

**🪑 Your tables**
- Create private Tables to chat, share photos, and run date polls to pick your
  next game — one tap adds it to your calendar.

**📸 Bring your own card**
- Snap a photo of your card to import the hands in seconds — or type them in
  yourself — so everything stays accurate to the card you actually play.

**🎨 Make it yours**
- Choose a tile-suit color theme with hand-drawn mahjong backgrounds.
- Build a tile avatar — your initial in a bamboo letterform, a dragon, a peony,
  a crane, and more, in any color.
- Tailored rules and tips from beginner to expert.

**👑 Club Mahj VIP (optional)**
- Unlimited private tables and bigger groups, extra themes and the full
  avatar/tile packs, unlimited saved game history with rematch and shareable
  scorecards, cloud sync across your devices, and a supporter badge. No ads, ever.

Club Mahj is an independent scorecard and social app. It is not affiliated with,
endorsed by, or sponsored by the National Mah Jongg League, and the sample hands
included are original and illustrative.

Optional accounts add cloud sync and social features; without an account your
data stays on your device.

---

## Store metadata
- **Primary category:** Social Networking (companion + social app: feed, friends,
  tables/groups, chat — NOT a playable game).
- **Secondary category:** Lifestyle (alt: Entertainment)
- **Age rating:** likely **12+** with the feed/chat (user-generated content) live.
  UGC needs a report + block flow — both are shipped. Confirm in the questionnaire.
- **In-app purchases:** Club Mahj VIP — Monthly ($2.99) / Annual ($14.99,
  auto-renewing) + Lifetime ($24.99, non-consumable). Mirror `PLANS` in
  `app/lib/pro.ts` exactly in App Store Connect / Play.
- **Support URL:** https://clubmahj.com/support  _(needs a page)_
- **Marketing URL:** https://clubmahj.com
- **Privacy Policy URL:** https://clubmahj.com/privacy  (hosted at /privacy)

## Screenshots
Handled separately (Claude Design). Captured references live in
`docs/store-assets/`. Suggested captions: Card — "Track your whole card." · Feed
— "See what your table's up to." · Tables — "A private group for every table." ·
(add) Scorer — "Score live games." · Trophies — "Earn every trophy."

## Final pre-submit checks
- Name/subtitle/keywords free of "NMJL"/"National Mah Jongg League".
- Disclaimer paragraph present in the description.
- IAP prices in App Store Connect match `PLANS` in `pro.ts`.
- Every described feature is live in the shipped build.
