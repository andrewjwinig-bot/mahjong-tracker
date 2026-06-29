# Store Listing Copy — Club Mahj

Draft marketing copy for the App Store and Google Play. All original. Replace
[bracketed] values and do a final pass before submission. **Do not** use the
"National Mah Jongg League" / "NMJL" trademark in the name, subtitle, or
keywords; keep the non-affiliation disclaimer in the description (it mirrors the
in-app AboutSheet wording).

**Brand tagline:** _The Original Mahj Social Network_ — the positioning hook for
the subtitle, promo text, and the top of the long description.

**Identifiers:** app name **Club Mahj** · bundle id `com.clubmahj.app` ·
domain `clubmahj.com`.

---

## App name (≤ 30 chars)
- **Club Mahj**  _(9 chars)_
- Alt: `Club Mahj: Cards & Wins`

## Subtitle (Apple, ≤ 30 chars)
- **The mahj social network**  _(23 chars)_
- Alts: `Track wins, play your table` (27), `Your American mahjong card` (26)
- _Note: "The original mahj social network" is 32 chars — too long for the
  subtitle; keep that full phrase for the promo text / description instead._

## Promotional text (Apple, ≤ 170 chars — editable anytime)
> Tap a tile every time you call Mahj, chase a new seasonal challenge, and brag
> to your table. Your whole American mahjong year, in one playful app.

## Keywords (Apple, ≤ 100 chars, comma-separated, no spaces)
```
american mahjong,mahjongg,mahjong card,tile tracker,scorecard,hands,wins,tiles,board game,friends
```

## Promo / What's New (first release)
> Welcome to Club Mahj — the original mahj social network! Track your wins,
> learn the tiles, chase seasonal challenges, earn trophies, and play along with
> your table. Tap a hand each time you win it and watch your card fill in.

---

## Description (App Store / Google Play)

**Club Mahj — the original mahj social network.**

The playful way to track every hand you win, learn the tiles, score your games,
and keep your table connected. Tap a hand each time you call “Mahj!” and watch
your card fill in with a celebration of tumbling tiles.

**🀄 Track your card**
- Tap to log a win on any hand and watch your progress climb.
- See hands cleared, total wins (“mahjs”), and points at a glance.
- Filter to what’s left “To Go” to pick your next target.

**🎉 Celebrate every win**
- A full-screen tile celebration (with an optional chime + haptics) every time
  you call Mahj.
- Earn trophies for milestones, category clears, streaks, and seasons.

**🗓️ Seasonal challenges**
- A new themed challenge every quarter — flowers in spring, dragons in autumn —
  that keeps you playing across your whole card.

**👯 Find your crew**
- Add friends, see who’s online, and discover suggested players you’ve shared a
  table with or who are friends of friends.
- Share wins to a feed; like and comment on your friends’ hands.

**🪑 Your tables**
- Create private Tables to chat, share photos, and run date polls to pick your
  next game — one tap adds it to your calendar.

**🎨 Make it yours**
- Choose a tile-suit color theme with hand-drawn mahjong backgrounds.
- Build a tile avatar — your initial in a bamboo letterform, a dragon, a peony,
  a crane, and more, in any color.
- Tailored rules and tips from beginner to expert.

**🃏 Bring your own card**
- Enter the hands from your own card so it’s always accurate.

**👑 Club Mahj VIP (optional)**
- Unlock every theme and avatar pack, unlimited tables, full win history &
  insights, cloud sync across devices, and a supporter badge. No ads, ever.

Club Mahj is an independent scorecard and learning tool. It is not affiliated
with, endorsed by, or sponsored by the National Mah Jongg League, and the sample
hands included are original and illustrative.

Optional accounts add cloud sync and social features; without an account your
data stays on your device.

---

## Store metadata
- **Primary category:** Games › Board (alt: Lifestyle)
- **Secondary category:** Lifestyle
- **Age rating:** 12+ once the chat/feed (user-generated content) is live; 4+ for
  a tracker-only build. Confirm in the questionnaire.
- **In-app purchases:** Club Mahj VIP — Monthly / Annual (auto-renewing) +
  Lifetime (non-consumable). Product ids in `app/lib/billing.ts`.
- **Support URL:** [https://clubmahj.com/support]
- **Marketing URL:** [https://clubmahj.com]
- **Privacy Policy URL:** https://clubmahj.com/privacy (hosted at /privacy)

## Screenshot plan (6–8, capture from the live app on a 6.7" device)
Use a consistent device frame + one short caption each. Capture in a couple of
different themes to show variety.

1. **Card tab** mid-progress with the gold **Stats & Trophies** bar + a seasonal
   challenge — _“Track your whole card.”_
2. The **CALL MAHJ!** celebration (tiles raining) — _“Celebrate every win.”_
3. **Find Friends** screen (presence dots + suggested players) — _“Find your crew.”_
4. The **Feed** with a win, likes & comments — _“Brag to your table.”_
5. A **Table’s** chat + date poll — _“Plan your next game.”_
6. **Edit Profile** tile-avatar picker (the 15 tiles + colors) — _“Make your tile.”_
7. **App Theme** picker (felt backgrounds) — _“Pick your felt.”_
8. _(optional)_ **Club Mahj VIP** modal — _“Go VIP.”_

## Notes
- Keep the name/subtitle/keywords free of “NMJL” / “National Mah Jongg League”.
  The disclaimer paragraph above is required in the description.
- Mirror the exact `PLANS` prices (`pro.ts`) in App Store Connect before submit.
