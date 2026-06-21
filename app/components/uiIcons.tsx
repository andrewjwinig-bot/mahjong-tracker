// Cohesive custom line-icon set (24x24, currentColor) used in place of generic
// emoji across the chrome. Stroke-based for a consistent, considered look.

import type { ReactNode } from 'react';

type P = { size?: number };
const S = (children: ReactNode, size = 22) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export const IconSettings = ({ size }: P) =>
  S(
    <>
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="15" cy="8" r="2.6" fill="var(--card)" />
      <circle cx="9" cy="16" r="2.6" fill="var(--card)" />
    </>,
    size,
  );

export const IconChat = ({ size }: P) =>
  S(<path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H10l-4 3.5V15H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />, size);

export const IconCalendar = ({ size }: P) =>
  S(
    <>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <line x1="4" y1="9.5" x2="20" y2="9.5" />
      <line x1="8" y1="3.5" x2="8" y2="6.5" />
      <line x1="16" y1="3.5" x2="16" y2="6.5" />
    </>,
    size,
  );

export const IconCamera = ({ size }: P) =>
  S(
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.2" />
    </>,
    size,
  );

export const IconTrophy = ({ size }: P) =>
  S(
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <line x1="12" y1="13" x2="12" y2="17" />
      <path d="M8.5 20h7M9.5 17h5" />
    </>,
    size,
  );

export const IconCard = ({ size }: P) =>
  S(
    <>
      <rect x="3.5" y="6.5" width="13" height="13" rx="2" />
      <path d="M7.5 6.5V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1.5" />
    </>,
    size,
  );

export const IconCrown = ({ size }: P) =>
  S(<path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13L4 8z" />, size);

export const IconInfo = ({ size }: P) =>
  S(
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" />
    </>,
    size,
  );

export const IconPlus = ({ size }: P) =>
  S(
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>,
    size,
  );

export const IconSend = ({ size }: P) =>
  S(<path d="M5 12l15-7-7 15-2.5-5.5L5 12z" />, size);

export const IconShare = ({ size }: P) =>
  S(
    <>
      <path d="M12 16V4" />
      <path d="M8 7.5 12 3.5l4 4" />
      <path d="M6 12v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6" />
    </>,
    size,
  );

export const IconTrash = ({ size }: P) =>
  S(
    <>
      <path d="M5 7h14" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7l.8 11a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9l.8-11" />
      <path d="M10 11v5M14 11v5" />
    </>,
    size,
  );

// Heart — outline by default; pass `fill` to render it solid (liked state).
export const IconHeart = ({ size, fill }: P & { fill?: boolean }) =>
  S(
    <path
      d="M12 20s-7-4.5-9.2-9C1.3 8 2.8 4.8 6 4.8c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.2 0 4.7 3.2 3.2 6.2C19 15.5 12 20 12 20z"
      fill={fill ? 'currentColor' : 'none'}
    />,
    size,
  );

export const IconComment = ({ size }: P) =>
  S(<path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H10l-4 3.5V15H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />, size);

export const IconMedal = ({ size }: P) =>
  S(
    <>
      <path d="M8 3l2.5 6M16 3l-2.5 6" />
      <circle cx="12" cy="15" r="5" />
      <path d="M12 12.5l.9 1.8 2 .3-1.45 1.4.35 2L12 17l-1.8.95.35-2L9.1 14.6l2-.3.9-1.8z" fill="currentColor" stroke="none" />
    </>,
    size,
  );

export const IconFeed = ({ size }: P) =>
  S(
    <>
      <path d="M4 11v2a1 1 0 0 0 1 1h2l8 4V6L7 10H5a1 1 0 0 0-1 1z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </>,
    size,
  );

export const IconBell = ({ size }: P) =>
  S(
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5h-15L6 16z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>,
    size,
  );

export const IconDownload = ({ size }: P) =>
  S(
    <>
      <path d="M12 4v10" />
      <path d="M8 10.5l4 4 4-4" />
      <path d="M5 19h14" />
    </>,
    size,
  );

export const IconSignOut = ({ size }: P) =>
  S(
    <>
      <path d="M14 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8" />
      <path d="M11 12h9M16.5 8.5 20 12l-3.5 3.5" />
    </>,
    size,
  );

export const IconSound = ({ size }: P) =>
  S(
    <>
      <path d="M4 9v6h3.5L13 19V5L7.5 9H4z" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />
    </>,
    size,
  );

export const IconContacts = ({ size }: P) =>
  S(
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <circle cx="12" cy="10" r="2.4" />
      <path d="M8.5 16.5a3.5 3.5 0 0 1 7 0" />
    </>,
    size,
  );

export const IconLock = ({ size }: P) =>
  S(
    <>
      <rect x="5" y="10" width="14" height="10" rx="2.2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>,
    size,
  );

export const IconCheck = ({ size }: P) =>
  S(<path d="M5 12.5l4.5 4.5L19 7" />, size);

export const IconArrowRight = ({ size }: P) =>
  S(<path d="M5 12h14M13 6l6 6-6 6" />, size);

export const IconBulb = ({ size }: P) =>
  S(
    <>
      <path d="M9 17h6M10 20h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.5.7.5 1.1v.5h6v-.5c0-.4 0-.7.5-1.1A6 6 0 0 0 12 3z" />
    </>,
    size,
  );

export const IconShuffle = ({ size }: P) =>
  S(
    <>
      <path d="M4 7h3.5c1.5 0 2.5 1 3.5 2.5M20 7h-3.5c-2.5 0-3.5 3-5.5 5.5S8 17 5 17H4" />
      <path d="M4 17h1c.7 0 1.3-.2 1.9-.6" />
      <path d="M17 4l3 3-3 3M17 14l3 3-3 3" />
    </>,
    size,
  );

export const IconFlame = ({ size }: P) =>
  S(
    <path d="M12 3c1.5 3-1.5 4.5-1.5 7A1.5 1.5 0 0 1 8 8.5C6 10 5 12 5 14a7 7 0 0 0 14 0c0-3-2-5.5-4-7.5-1.2-1.2-2.3-2.5-3-3.5z" />,
    size,
  );

export const IconTap = ({ size }: P) =>
  S(
    <>
      <path d="M9 11V6a1.6 1.6 0 0 1 3.2 0v5" />
      <path d="M12.2 11V9.2a1.5 1.5 0 0 1 3 0V11" />
      <path d="M15.2 11v-.5a1.5 1.5 0 0 1 3 0V15a5 5 0 0 1-5 5h-1.3c-1.5 0-2.6-.6-3.5-1.8L6 14.5c-.7-1 .1-2.3 1.3-2.1.6.1 1.1.4 1.7 1l.9 1" />
    </>,
    size,
  );

export const IconSparkle = ({ size }: P) =>
  S(
    <path
      d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
      fill="currentColor"
      stroke="none"
    />,
    size,
  );

export const IconGrid = ({ size }: P) =>
  S(
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>,
    size,
  );

export const IconTarget = ({ size }: P) =>
  S(
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>,
    size,
  );

export const IconUsers = ({ size }: P) =>
  S(
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6a3 3 0 0 1 0 6M17 14.2a5.5 5.5 0 0 1 3.5 4.8" />
    </>,
    size,
  );

export const IconUser = ({ size }: P) =>
  S(
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </>,
    size,
  );

export const IconBook = ({ size }: P) =>
  S(
    <>
      <path d="M5 4.5h9a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2V4.5z" />
      <path d="M16 6.5h3V20h-3" />
      <path d="M8 8.5h5M8 11.5h5" />
    </>,
    size,
  );

export const IconShield = ({ size }: P) =>
  S(
    <>
      <path d="M12 3l7 3v5c0 4.2-2.8 7.5-7 9-4.2-1.5-7-4.8-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>,
    size,
  );

export const IconHelp = ({ size }: P) =>
  S(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.5 2.3-2.5 4" />
      <circle cx="12" cy="16.6" r="0.6" fill="currentColor" />
    </>,
    size,
  );

export const IconPalette = ({ size }: P) =>
  S(
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.6 1.7-1.6H16a4.5 4.5 0 0 0 4.5-4.5C20.5 6.6 16.7 3.5 12 3.5z" />
      <circle cx="8" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
    </>,
    size,
  );

export const IconCloud = ({ size }: P) =>
  S(
    <path d="M7 18a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.6-1.2A3.8 3.8 0 0 1 17.5 18H7z" />,
    size,
  );

export const IconLeaf = ({ size }: P) =>
  S(
    <>
      <path d="M5 19c0-7 5-12 14-12 0 9-5 13-11 13-1.5 0-3-.4-3-1z" />
      <path d="M9 15c2-2.5 4.5-4 7-5" />
    </>,
    size,
  );

export const IconStar = ({ size }: P) =>
  S(
    <path
      d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9L12 3.5z"
      fill="currentColor"
      stroke="none"
    />,
    size,
  );
