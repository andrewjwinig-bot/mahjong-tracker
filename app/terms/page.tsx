import type { Metadata } from 'next';
import LegalChrome from '../components/LegalChrome';

export const metadata: Metadata = {
  title: 'Terms of Service · Club Mahj',
  description: 'The terms that govern your use of Club Mahj.',
};

export default function TermsPage() {
  return (
    <LegalChrome title="Terms of Service" updated="June 25, 2026">
      <p>
        These Terms of Service (“Terms”) govern your access to and use of the Club Mahj mobile
        and web application and related services (the “App”), provided by Black Pug Studios LLC
        (“we,” “us,” or “our”). By creating an account or using the App, you agree to these Terms and
        to our Privacy Policy. If you do not agree, do not use the App.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old (or the minimum age of digital consent in your country) to
        use the App. If you are under the age of majority, you may use the App only with the
        involvement of a parent or guardian.
      </p>

      <h2>2. Your account</h2>
      <p>
        You agree to provide accurate information, keep your credentials secure, and be responsible
        for all activity under your account. Notify us promptly of any unauthorized use.
      </p>

      <h2>3. License to use the App</h2>
      <p>
        Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable,
        revocable license to use the App for your own non-commercial use. You may not copy, modify,
        reverse engineer, resell, or create derivative works from the App except as permitted by law.
      </p>

      <h2>4. Your content</h2>
      <p>
        You retain ownership of the content you create or upload — including profile details,
        messages, posts, comments, photos, and the card hands you enter (“Your Content”). You grant us
        a worldwide, non-exclusive, royalty-free license to host, store, reproduce, and display Your
        Content solely to operate and provide the App (for example, showing your post to your table or
        feed). You are responsible for Your Content and represent that you have the rights to share it
        and that it does not violate these Terms or any law or third-party right.
      </p>

      <h2>5. Acceptable use &amp; community rules</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Harass, bully, threaten, or harm others, or post hateful, obscene, or illegal content.</li>
        <li>Impersonate others or misrepresent your affiliation.</li>
        <li>Upload content you don’t have the right to share, or that infringes intellectual property.</li>
        <li>Spam, scrape, or interfere with or disrupt the App or its security.</li>
        <li>Use the App for any unlawful purpose.</li>
      </ul>
      <p>
        We may review, moderate, remove content, and suspend or terminate accounts that violate these
        Terms, at our discretion.
      </p>

      <h2>6. The card; non-affiliation</h2>
      <p>
        The App is an independent scorecard and learning tool. It is <strong>not affiliated with,
        endorsed by, or sponsored by the National Mah Jongg League (NMJL)</strong> or any other
        organization. Any sample hands provided in the App are original and illustrative and are not
        an official card. If you enter or photograph hands from your own card, you are responsible for
        ensuring you have the right to do so for your personal use, and Your Content remains yours.
      </p>

      <h2>7. Our intellectual property</h2>
      <p>
        The App, including its software, design, graphics, tile artwork, themes, and trademarks
        (excluding Your Content), is owned by us or our licensors and protected by intellectual
        property laws. We reserve all rights not expressly granted.
      </p>

      <h2>8. Purchases, subscriptions &amp; billing</h2>
      <p>
        The App may offer paid features, subscriptions, or one-time purchases. Purchases are processed
        by the Apple App Store or Google Play and are subject to their terms. Subscriptions
        automatically renew unless canceled at least 24 hours before the end of the current period;
        manage or cancel in your store account settings. Prices may change with notice as permitted by
        the applicable store. Except where required by law or store policy, purchases are
        non-refundable; refund requests are handled by the applicable app store.
      </p>

      <h2>9. Third-party services</h2>
      <p>
        The App relies on third-party services (such as hosting, authentication, analytics, app
        stores, and notification providers). Your use of those services may be subject to their own
        terms, and we are not responsible for third-party services.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We
        do not warrant that the App will be uninterrupted, error-free, or secure, or that any scoring,
        rules, or tips are accurate or suitable for tournament play.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF DATA, PROFITS, OR GOODWILL. OUR
        TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE APP WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU
        PAID US IN THE 12 MONTHS BEFORE THE CLAIM OR US $50.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from claims, damages, and expenses (including
        reasonable legal fees) arising from Your Content, your use of the App, or your violation of
        these Terms or any law or third-party right.
      </p>

      <h2>13. Termination</h2>
      <p>
        You may stop using the App and delete your account at any time. We may suspend or terminate
        your access if you violate these Terms or to protect the App or other users. Sections that by
        their nature should survive termination will survive.
      </p>

      <h2>14. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of the Commonwealth of Pennsylvania, without regard to
        conflict-of-law rules. Any disputes will be resolved exclusively in the state or federal courts
        located in the Commonwealth of Pennsylvania, and you consent to their jurisdiction, unless
        otherwise required by applicable law.
      </p>

      <h2>15. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will post the updated version with a new
        effective date and, where appropriate, provide additional notice. Continued use of the App
        after changes take effect constitutes acceptance.
      </p>

      <h2>16. Contact</h2>
      <p>
        Black Pug Studios LLC
        <br />
        andrewjwinig@gmail.com
      </p>
    </LegalChrome>
  );
}
