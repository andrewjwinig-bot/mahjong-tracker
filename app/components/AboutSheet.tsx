'use client';

export default function AboutSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>About &amp; Legal</h2>
        <p className="sheet-sub">Mahjong Tracker · v1.0</p>

        <div className="legal">
          <p>
            <strong>Not affiliated with the NMJL.</strong> Mahjong Tracker is an independent scorecard
            and learning tool. It is not affiliated with, endorsed by, or sponsored by the National
            Mah Jongg League.
          </p>
          <p>
            The hands shown are an <strong>original sample</strong> for illustration only — they are
            not the official card. Use “Bring your own card” to enter the hands from your year’s
            official card.
          </p>
          <p>
            <strong>Your privacy.</strong> For now everything lives on this device — no account,
            nothing leaves your phone. Cloud accounts &amp; sync arrive with the App Store release.
          </p>
          <p>
            American Mahjong is a public-domain game enjoyed for nearly a century. This app helps you
            track wins, learn the tiles, and play with friends.
          </p>
          <p className="legal-fine">
            A full Privacy Policy and Terms of Service will be published before the App Store launch.
          </p>
        </div>

        <button className="btn ghost" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
