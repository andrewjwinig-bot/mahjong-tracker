import type { Metadata } from 'next';
import LegalChrome from '../components/LegalChrome';

export const metadata: Metadata = {
  title: 'Privacy Policy · Mahjong Tracker',
  description: 'How Mahjong Tracker collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <LegalChrome title="Privacy Policy" updated="[Effective Date]">
      <p className="legal-banner">
        Template — review with a qualified attorney before publishing. Replace every [bracketed] value.
      </p>

      <p>
        This Privacy Policy explains how [Developer / Company Name] (“we,” “us,” or “our”) collects,
        uses, shares, and protects information in connection with the Mahjong Tracker mobile and web
        application and related services (the “App”). By using the App you agree to this Policy.
      </p>

      <h2>1. The short version</h2>
      <ul>
        <li>Today, the App runs primarily on your device and stores your data locally.</li>
        <li>
          When account and cloud features launch, we will collect the information you provide (like
          your email and profile) and gameplay/social content you create, so the App can sync and
          power social features.
        </li>
        <li>We do not sell your personal information.</li>
        <li>You can access, correct, export, and delete your data, including deleting your account.</li>
      </ul>

      <h2>2. Information we collect</h2>
      <p>
        <strong>Account information.</strong> When you create an account, we collect a username,
        email address, and a password. Passwords are stored only in hashed/encrypted form by our
        authentication provider — we never store your plaintext password.
      </p>
      <p>
        <strong>Profile information.</strong> Display name, handle, avatar choice, short bio, and your
        selected experience level.
      </p>
      <p>
        <strong>Gameplay data.</strong> Your card progress, logged wins (“mahjs”), points, streaks,
        challenge progress, and trophies.
      </p>
      <p>
        <strong>Social content.</strong> Tables you create or join, chat messages, posts, comments,
        likes, invite codes, and any photos or captions you add. This content may be visible to other
        members of your tables or to your friends, depending on where you share it.
      </p>
      <p>
        <strong>Photos.</strong> If you add a photo, we process the image you select. Photos you post
        to a table or the feed are shared with those audiences.
      </p>
      <p>
        <strong>Contacts.</strong> If you choose “Invite from contacts,” your device’s contact picker
        lets you select people to invite by message. We do not upload, store, or read your full
        address book on our servers.
      </p>
      <p>
        <strong>Device &amp; usage data.</strong> Basic technical data such as app version, device
        type, operating system, language, general region, and diagnostic/crash and analytics events
        used to keep the App working and improve it.
      </p>
      <p>
        <strong>Purchases.</strong> If you buy a subscription or other in-app purchase, the
        transaction is processed by Apple or Google. We receive your purchase/entitlement status — not
        your full payment card details.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>Provide, maintain, and secure the App and your account.</li>
        <li>Sync your data across your devices and power social features (tables, feed, leaderboards).</li>
        <li>Tailor content such as rules and tips to your experience level.</li>
        <li>Send service messages and, with your consent where required, notifications.</li>
        <li>Diagnose problems, prevent abuse, and improve the App.</li>
        <li>Comply with legal obligations and enforce our Terms.</li>
      </ul>

      <h2>4. Legal bases (EEA/UK users)</h2>
      <p>
        Where the GDPR or UK GDPR applies, we process personal data on the bases of performance of a
        contract (providing the App), your consent (e.g., push notifications), our legitimate
        interests (security and improvement), and compliance with legal obligations.
      </p>

      <h2>5. How we share information</h2>
      <p>We do not sell your personal information. We share it only as follows:</p>
      <ul>
        <li>
          <strong>With other users</strong> — content you choose to post is shown to the relevant
          tables, friends, or public feed.
        </li>
        <li>
          <strong>Service providers</strong> — vendors who host and operate the App on our behalf
          (for example, hosting, database/authentication, analytics, crash reporting, and push
          delivery), bound by contractual confidentiality and security obligations.
        </li>
        <li>
          <strong>App stores &amp; platforms</strong> — Apple and Google for purchases and push
          notifications.
        </li>
        <li>
          <strong>Legal &amp; safety</strong> — when required by law, or to protect rights, safety,
          and the integrity of the App.
        </li>
        <li>
          <strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of
          assets, subject to this Policy.
        </li>
      </ul>

      <h2>6. Data retention</h2>
      <p>
        We keep personal data for as long as your account is active or as needed to provide the App,
        then delete or anonymize it within a reasonable period, unless a longer retention is required
        by law. Data stored only on your device remains until you delete the App or clear its data.
      </p>

      <h2>7. Security</h2>
      <p>
        We use reasonable administrative, technical, and organizational measures to protect your
        information. No method of transmission or storage is 100% secure, and we cannot guarantee
        absolute security.
      </p>

      <h2>8. Your rights &amp; choices</h2>
      <ul>
        <li>Access, correct, or update your profile and account information in the App.</li>
        <li>
          <strong>Delete your account</strong> and associated personal data from within the App
          (Settings) or by contacting us.
        </li>
        <li>Request a copy/export of your data.</li>
        <li>Turn notifications and certain features on or off.</li>
        <li>
          Depending on your location (e.g., EEA/UK “GDPR” or California “CCPA/CPRA”), you may have
          additional rights to access, portability, deletion, restriction, objection, and to lodge a
          complaint with a regulator. We do not discriminate against you for exercising these rights.
        </li>
      </ul>
      <p>To exercise any right, contact us at [Contact Email].</p>

      <h2>9. Children’s privacy</h2>
      <p>
        The App is not directed to children under 13 (or the minimum age required in your country),
        and we do not knowingly collect personal information from them. If you believe a child has
        provided us personal information, contact us and we will delete it.
      </p>

      <h2>10. International transfers</h2>
      <p>
        We may process and store information in countries other than your own. Where required, we use
        appropriate safeguards (such as standard contractual clauses) for cross-border transfers.
      </p>

      <h2>11. Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. We will post the updated version with a new
        effective date and, where appropriate, provide additional notice.
      </p>

      <h2>12. Contact us</h2>
      <p>
        [Developer / Company Name]
        <br />
        [Mailing Address]
        <br />
        [Contact Email]
      </p>
    </LegalChrome>
  );
}
