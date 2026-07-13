import type { Metadata } from 'next';
import LegalChrome from '../components/LegalChrome';

const SUPPORT_EMAIL = 'blackpugstudios@gmail.com';

export const metadata: Metadata = {
  title: 'Support · Club Mahj',
  description: 'Get help with Club Mahj — contact us and browse answers to common questions.',
};

export default function SupportPage() {
  return (
    <LegalChrome title="Support">
      <p>
        Need a hand with Club Mahj? We’re happy to help. Email us and we’ll get back to you as soon
        as we can — usually within a couple of days.
      </p>
      <p>
        <strong>Contact:</strong>{' '}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Club%20Mahj%20support`}>{SUPPORT_EMAIL}</a>
      </p>
      <p>
        When you write in, it helps to include your device and OS (e.g. “iPhone 15, iOS 18”), the
        app version, and a screenshot if something looks off.
      </p>

      <h2>Common questions</h2>

      <h2>How do I add my card?</h2>
      <p>
        On the <strong>Card</strong> tab, tap to scan a photo of your card and we’ll read the hands
        in for you — or add them by hand. Your card is set once for the season and you can re-open it
        anytime from the “Your card · Edit” row at the bottom of the Card tab.
      </p>

      <h2>How do I invite my table?</h2>
      <p>
        Open a table, tap <strong>Table settings</strong>, then <strong>Invite</strong> — you can add
        friends already on Club Mahj or share a link/code with someone new. You can also invite from
        the feed when you have no friends yet.
      </p>

      <h2>What does Club Mahj VIP include, and how is it billed?</h2>
      <p>
        VIP unlocks unlimited private tables and bigger groups, extra themes and the full avatar/tile
        packs, unlimited saved game history with rematch and shareable scorecards, cloud sync across
        your devices, and a supporter badge. It’s available as a monthly or annual auto-renewing
        subscription, or a one-time lifetime purchase. Subscriptions are billed through your Apple or
        Google account and renew automatically until canceled; manage or cancel anytime in your App
        Store / Google Play account settings.
      </p>

      <h2>I bought VIP on another device — how do I get it back?</h2>
      <p>
        Use <strong>Restore purchases</strong> in Settings. As long as you’re signed in to the same
        App Store / Google Play account you bought with, your VIP access will be restored.
      </p>

      <h2>How do I delete my account?</h2>
      <p>
        In the app, go to <strong>Settings → About &amp; Legal → Delete my account</strong>. This
        permanently removes your account and associated personal data. You can also email us and we’ll
        take care of it.
      </p>

      <h2>Where does my data live, and is it private?</h2>
      <p>
        You can use Club Mahj without an account, in which case your data stays on your device. If you
        sign in, your data syncs to the cloud so it’s available across your devices. We don’t sell your
        personal information and show no third-party ads. See our{' '}
        <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a> for details.
      </p>

      <h2>Still stuck?</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}?subject=Club%20Mahj%20support`}>{SUPPORT_EMAIL}</a> and
        we’ll help you out.
      </p>

      <p style={{ marginTop: 28, opacity: 0.75 }}>
        Club Mahj is an independent scorecard and social app. It is not affiliated with, endorsed by,
        or sponsored by the National Mah Jongg League, and the sample hands included are original and
        illustrative.
      </p>
    </LegalChrome>
  );
}
