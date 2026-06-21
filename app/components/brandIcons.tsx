// Simple, recognizable share-destination glyphs (drawn as SVG, not emoji) so
// the share sheet looks like a real app. Glyphs are white and sit on a colored
// bubble supplied by the parent.

type P = { size?: number };
const svg = (children: React.ReactNode, size = 24) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    {children}
  </svg>
);

export const IconShare = ({ size }: P) =>
  svg(
    <>
      <path d="M12 3v11" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 6.5 12 3l3.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11h2v8h8v-8h2v10H6z" fill="#fff" />
    </>,
    size,
  );

export const IconSave = ({ size }: P) =>
  svg(
    <>
      <path d="M12 3v9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 8.5 12 12l3.5-3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16v3h14v-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </>,
    size,
  );

export const IconMessages = ({ size }: P) =>
  svg(
    <path
      d="M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3.5V16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      fill="#fff"
    />,
    size,
  );

export const IconWhatsApp = ({ size }: P) =>
  svg(
    <>
      <path
        d="M12 3.5A8.5 8.5 0 0 0 4.3 16l-1 3.7 3.8-1A8.5 8.5 0 1 0 12 3.5z"
        fill="#fff"
      />
      <path
        d="M9.4 8.2c.3-.7.9-.7 1.2-.2l.6 1.2c.2.3.1.6-.1.8l-.4.5c-.2.2-.2.4 0 .6.5.8 1.1 1.4 1.9 1.9.3.2.5.1.6 0l.5-.4c.2-.2.5-.3.8-.1l1.2.6c.5.3.5.8.2 1.1-1.4 1.3-3.5.4-5-1.1S8 9.6 9.4 8.2z"
        fill="#25D366"
      />
    </>,
    size,
  );

export const IconX = ({ size }: P) =>
  svg(
    <path
      d="M4 4h3.6l3.2 4.4L14.7 4H18l-5.1 6.4L19 20h-3.6l-3.6-4.9L7 20H3.8l5.5-6.9z"
      fill="#fff"
    />,
    size,
  );

export const IconFacebook = ({ size }: P) =>
  svg(
    <path
      d="M13.2 21v-7.2h2.4l.4-2.8h-2.8V9.2c0-.8.2-1.4 1.4-1.4h1.5V5.3c-.3 0-1.2-.1-2.2-.1-2.1 0-3.6 1.3-3.6 3.7V11H8v2.8h2.3V21z"
      fill="#fff"
    />,
    size,
  );

export const IconInstagram = ({ size }: P) =>
  svg(
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="4.6" stroke="#fff" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.4" stroke="#fff" strokeWidth="2" />
      <circle cx="16.4" cy="7.6" r="1.1" fill="#fff" />
    </>,
    size,
  );

export const IconCopy = ({ size }: P) =>
  svg(
    <>
      <path
        d="M10.5 13.5a3.2 3.2 0 0 0 4.5 0l1.6-1.6a3.2 3.2 0 0 0-4.5-4.5l-.8.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13.5 10.5a3.2 3.2 0 0 0-4.5 0l-1.6 1.6a3.2 3.2 0 0 0 4.5 4.5l.8-.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>,
    size,
  );

export const IconFriends = ({ size }: P) =>
  svg(
    <>
      <circle cx="9" cy="8.5" r="3" fill="#fff" />
      <circle cx="16.5" cy="9.5" r="2.4" fill="#fff" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5z" fill="#fff" />
      <path d="M15 14.2c2.4.2 4.5 2 4.5 4.8H17" fill="#fff" />
    </>,
    size,
  );
