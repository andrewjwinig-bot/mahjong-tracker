'use client';

// Cohesive custom icon set (24x24, currentColor) used in place of generic emoji
// across the chrome. Block-print style: bold solid silhouettes with carved-out
// negative space (via SVG masks so the cuts are genuinely transparent and the
// glyph still tints to currentColor on any background). Feels hand-stamped /
// linocut rather than UI-kit.

import { useId, type ReactNode } from 'react';

type P = { size?: number };

// A flat solid silhouette (no carved detail).
const Solid = (body: ReactNode, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    {body}
  </svg>
);

// A carved silhouette: `children` are mask shapes — fill #fff to show ink,
// fill/stroke #000 to carve a transparent hole. The whole glyph paints in
// currentColor.
function Carved({ size = 22, children }: { size?: number; children: ReactNode }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#000" />
        {children}
      </mask>
      <rect width="24" height="24" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}

export const IconSettings = ({ size }: P) => (
  <Carved size={size}>
    <rect x="3" y="6.2" width="18" height="3.4" rx="1.7" fill="#fff" />
    <rect x="3" y="14.4" width="18" height="3.4" rx="1.7" fill="#fff" />
    <circle cx="15" cy="7.9" r="3.3" fill="#fff" />
    <circle cx="9" cy="16.1" r="3.3" fill="#fff" />
    <circle cx="15" cy="7.9" r="1.3" fill="#000" />
    <circle cx="9" cy="16.1" r="1.3" fill="#000" />
  </Carved>
);

const Bubble = ({ size }: P) => (
  <Carved size={size}>
    <path
      d="M5 4.5h14a2.2 2.2 0 0 1 2.2 2.2v6.2a2.2 2.2 0 0 1-2.2 2.2H10l-4.2 3.4V15.1H5a2.2 2.2 0 0 1-2.2-2.2V6.7A2.2 2.2 0 0 1 5 4.5z"
      fill="#fff"
    />
    <circle cx="8.5" cy="10.8" r="1.15" fill="#000" />
    <circle cx="12" cy="10.8" r="1.15" fill="#000" />
    <circle cx="15.5" cy="10.8" r="1.15" fill="#000" />
  </Carved>
);
export const IconChat = Bubble;
export const IconComment = Bubble;

export const IconCalendar = ({ size }: P) => (
  <Carved size={size}>
    <rect x="3" y="5" width="18" height="15" rx="3.2" fill="#fff" />
    <rect x="7" y="2.4" width="2.6" height="4.4" rx="1.3" fill="#fff" />
    <rect x="14.4" y="2.4" width="2.6" height="4.4" rx="1.3" fill="#fff" />
    <rect x="3" y="9.1" width="18" height="1.7" fill="#000" />
    <circle cx="7.5" cy="13" r="1.05" fill="#000" />
    <circle cx="12" cy="13" r="1.05" fill="#000" />
    <circle cx="16.5" cy="13" r="1.05" fill="#000" />
    <circle cx="7.5" cy="16.4" r="1.05" fill="#000" />
    <circle cx="12" cy="16.4" r="1.05" fill="#000" />
  </Carved>
);

export const IconCamera = ({ size }: P) => (
  <Carved size={size}>
    <path
      d="M3.2 8h3l1.4-2h7.8L16 8h3a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H3.2a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
      fill="#fff"
    />
    <circle cx="12" cy="13.4" r="3.6" fill="#000" />
    <circle cx="12" cy="13.4" r="1.5" fill="#fff" />
  </Carved>
);

export const IconTrophy = ({ size }: P) =>
  Solid(
    <>
      <path d="M7 3.8h10v3.4a5 5 0 0 1-10 0V3.8z" />
      <path d="M6.6 4.6H4v1.8a3 3 0 0 0 2.6 3z" />
      <path d="M17.4 4.6H20v1.8a3 3 0 0 1-2.6 3z" />
      <rect x="10.8" y="12.3" width="2.4" height="3.6" rx="0.6" />
      <path d="M8 19.8h8l-.8-2.8H8.8L8 19.8z" />
    </>,
    size,
  );

export const IconCard = ({ size }: P) => (
  <Carved size={size}>
    <rect x="7" y="3" width="13.5" height="13.5" rx="3" fill="#fff" />
    <rect x="2.5" y="5.5" width="15.5" height="15.5" rx="3.6" fill="#000" />
    <rect x="3.5" y="6.5" width="13.5" height="13.5" rx="3" fill="#fff" />
  </Carved>
);

export const IconCrown = ({ size }: P) => (
  <Carved size={size}>
    <path d="M3 8.2l4 3 5-6.2 5 6.2 4-3-2 10.4H5L3 8.2z" fill="#fff" />
    <circle cx="7" cy="18" r="1.1" fill="#000" />
    <circle cx="12" cy="18" r="1.1" fill="#000" />
    <circle cx="17" cy="18" r="1.1" fill="#000" />
  </Carved>
);

export const IconInfo = ({ size }: P) => (
  <Carved size={size}>
    <circle cx="12" cy="12" r="9" fill="#fff" />
    <rect x="11" y="10.6" width="2" height="6" rx="1" fill="#000" />
    <circle cx="12" cy="7.6" r="1.2" fill="#000" />
  </Carved>
);

export const IconPlus = ({ size }: P) =>
  Solid(<path d="M10.2 4h3.6v6.2H20v3.6h-6.2V20h-3.6v-6.2H4v-3.6h6.2z" />, size);

export const IconSend = ({ size }: P) =>
  Solid(<path d="M4 11.6l16-7.4-7.4 16-2.6-5.9L4 11.6z" />, size);

export const IconShare = ({ size }: P) =>
  Solid(
    <>
      <path d="M4 11.5h16V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19v-7.5z" />
      <path d="M12 3.2l4.4 4.4-2 2L13 10.2V16h-2v-5.8L9.6 9.6l-2-2L12 3.2z" />
    </>,
    size,
  );

export const IconTrash = ({ size }: P) => (
  <Carved size={size}>
    <rect x="3.8" y="5.8" width="16.4" height="2.4" rx="1.2" fill="#fff" />
    <path
      d="M6 9h12l-1 10.4a1.6 1.6 0 0 1-1.6 1.45H8.6A1.6 1.6 0 0 1 7 19.4L6 9z"
      fill="#fff"
    />
    <path d="M9.2 4h5.6a1 1 0 0 1 1 1v1.4h-7.6V5a1 1 0 0 1 1-1z" fill="#fff" />
    <rect x="9.4" y="11" width="1.4" height="6" rx="0.7" fill="#000" />
    <rect x="13.2" y="11" width="1.4" height="6" rx="0.7" fill="#000" />
  </Carved>
);

const heartPath =
  'M12 20.2s-7.4-4.6-9.6-9.3C.9 7.7 2.6 4.3 6.1 4.3c2.2 0 3.6 1.4 4.4 2.7.8-1.3 2.2-2.7 4.4-2.7 3.5 0 5.2 3.4 3.7 6.6C19.4 15.6 12 20.2 12 20.2z';
// Solid when liked; carved outline otherwise.
export const IconHeart = ({ size = 22, fill }: P & { fill?: boolean }) =>
  fill ? (
    Solid(<path d={heartPath} />, size)
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={heartPath} stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );

export const IconMedal = ({ size }: P) => (
  <Carved size={size}>
    <rect x="7.4" y="2.4" width="2.2" height="7" rx="1" fill="#fff" transform="rotate(-18 8.5 5.9)" />
    <rect x="14.4" y="2.4" width="2.2" height="7" rx="1" fill="#fff" transform="rotate(18 15.5 5.9)" />
    <circle cx="12" cy="15.2" r="5.4" fill="#fff" />
    <path
      d="M12 12.1l1 2.1 2.3.34-1.66 1.6.4 2.28L12 17.3l-2.04 1.12.4-2.28L8.7 14.54l2.3-.34L12 12.1z"
      fill="#000"
    />
  </Carved>
);

export const IconFeed = ({ size }: P) =>
  Solid(
    <>
      <path d="M3.6 11v2.2a1.2 1.2 0 0 0 1.2 1.2h2.1l8.1 4.2V5.8L6.9 10H4.8a1.2 1.2 0 0 0-1.2 1z" />
      <path d="M17.6 8.6a4.4 4.4 0 0 1 0 6.8L16.3 14a2.6 2.6 0 0 0 0-4l1.3-1.4z" />
    </>,
    size,
  );

export const IconBell = ({ size }: P) =>
  Solid(
    <>
      <path d="M5.6 16.4V10.8a6.4 6.4 0 0 1 12.8 0v5.6l1.7 2.8H3.9l1.7-2.8z" />
      <path d="M9.7 19.4a2.3 2.3 0 0 0 4.6 0H9.7z" />
    </>,
    size,
  );

export const IconDownload = ({ size }: P) =>
  Solid(
    <>
      <path d="M11 3.5h2v7.3l2.3-2.3 1.4 1.4-4.7 4.7-4.7-4.7 1.4-1.4 2.3 2.3z" />
      <path d="M4.5 14h2.4v3.1h10.2V14h2.4v3.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V14z" />
    </>,
    size,
  );

export const IconSignOut = ({ size }: P) =>
  Solid(
    <>
      <path d="M5 4.5h7v2.2H7.2v10.6H12V19.5H5z" />
      <path d="M13 7.5l5 4.5-5 4.5v-3.2H9.5v-2.6H13z" />
    </>,
    size,
  );

export const IconSound = ({ size }: P) =>
  Solid(
    <>
      <path d="M3.6 9v6h3.6L13 19.2V4.8L7.2 9H3.6z" />
      <path d="M15.8 9.2a3.6 3.6 0 0 1 0 5.6L14.4 13.4a1.8 1.8 0 0 0 0-2.8l1.4-1.4z" />
      <path d="M18.2 6.8a7 7 0 0 1 0 10.4l-1.4-1.4a5 5 0 0 0 0-7.6l1.4-1.4z" />
    </>,
    size,
  );

export const IconContacts = ({ size }: P) => (
  <Carved size={size}>
    <rect x="3.5" y="4" width="17" height="16" rx="3" fill="#fff" />
    <circle cx="12" cy="10" r="2.6" fill="#000" />
    <path d="M7.8 16.8a4.2 4.2 0 0 1 8.4 0H7.8z" fill="#000" />
  </Carved>
);

export const IconLock = ({ size }: P) => (
  <Carved size={size}>
    <rect x="4.6" y="10" width="14.8" height="10.4" rx="2.6" fill="#fff" />
    <path
      d="M7.6 10V7.4a4.4 4.4 0 0 1 8.8 0V10h-2.2V7.4a2.2 2.2 0 0 0-4.4 0V10H7.6z"
      fill="#fff"
    />
    <circle cx="12" cy="14.4" r="1.7" fill="#000" />
    <rect x="11.2" y="14.4" width="1.6" height="3.2" rx="0.8" fill="#000" />
  </Carved>
);

export const IconCheck = ({ size }: P) =>
  Solid(<path d="M9.4 17.8l-5.2-5.2 2.3-2.3 2.9 2.9 7.6-7.7 2.3 2.3z" />, size);

export const IconArrowRight = ({ size }: P) =>
  Solid(<path d="M4 10.4h9V6l7 6-7 6v-4.4H4z" />, size);

export const IconBulb = ({ size }: P) =>
  Solid(
    <>
      <path d="M12 2.6a6.6 6.6 0 0 0-3.9 11.9c.5.4.6.7.6 1.2v.6h6.6v-.6c0-.5.1-.8.6-1.2A6.6 6.6 0 0 0 12 2.6z" />
      <rect x="8.6" y="17" width="6.8" height="1.9" rx="0.95" />
      <rect x="9.6" y="20" width="4.8" height="1.8" rx="0.9" />
    </>,
    size,
  );

export const IconShuffle = ({ size = 22 }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 7h3.2c1.6 0 2.7 1.1 3.8 2.6M20 7h-3.4c-2.6 0-3.7 3-5.6 5.6S8.4 17 5.4 17H4" />
    <path d="M17 4l3.2 3-3.2 3M17 14l3.2 3-3.2 3" />
  </svg>
);

export const IconFlame = ({ size }: P) =>
  Solid(
    <path d="M12 2.6c1.6 3.2-1.6 4.8-1.6 7.5A1.6 1.6 0 0 1 7.7 8.6C5.6 10.2 4.6 12.3 4.6 14.5a7.4 7.4 0 0 0 14.8 0c0-3.2-2.1-5.8-4.2-7.9-1.3-1.3-2.4-2.6-3.2-4z" />,
    size,
  );

export const IconTap = ({ size }: P) =>
  Solid(
    <path d="M15.4 10.2a1.6 1.6 0 0 1 3.2 0V15a5.4 5.4 0 0 1-5.4 5.4h-1.4c-1.6 0-2.8-.65-3.75-1.95L5.7 14.7c-.75-1.05.1-2.45 1.4-2.25.65.1 1.2.45 1.8 1.05l1 1.05V5.8a1.7 1.7 0 0 1 3.4 0v4.8a1.6 1.6 0 0 1 3.2 0z" />,
    size,
  );

export const IconSparkle = ({ size }: P) =>
  Solid(<path d="M12 2.6l2 5.7 5.7 2-5.7 2-2 5.7-2-5.7-5.7-2 5.7-2 2-5.7z" />, size);

export const IconStar = ({ size }: P) =>
  Solid(
    <path d="M12 3.2l2.7 5.5 6.1.9-4.4 4.3 1.05 6.05L12 17.1l-5.45 2.85L7.6 13.9 3.2 9.6l6.1-.9L12 3.2z" />,
    size,
  );

export const IconGrid = ({ size }: P) =>
  Solid(
    <>
      <rect x="3.6" y="3.6" width="7.4" height="7.4" rx="2" />
      <rect x="13" y="3.6" width="7.4" height="7.4" rx="2" />
      <rect x="3.6" y="13" width="7.4" height="7.4" rx="2" />
      <rect x="13" y="13" width="7.4" height="7.4" rx="2" />
    </>,
    size,
  );

export const IconTarget = ({ size }: P) => (
  <Carved size={size}>
    <circle cx="12" cy="12" r="9" fill="#fff" />
    <circle cx="12" cy="12" r="6.4" fill="#000" />
    <circle cx="12" cy="12" r="3.6" fill="#fff" />
    <circle cx="12" cy="12" r="1.1" fill="#000" />
  </Carved>
);

export const IconUsers = ({ size }: P) =>
  Solid(
    <>
      <circle cx="9" cy="8.4" r="3.2" />
      <path d="M3 19.6a6 6 0 0 1 12 0H3z" />
      <circle cx="16.4" cy="8.8" r="2.6" />
      <path d="M14.8 14.4a5.4 5.4 0 0 1 5.9 5.2h-4.2a6.6 6.6 0 0 0-2.6-4.6c.3-.3.6-.5.9-.6z" />
    </>,
    size,
  );

export const IconUser = ({ size }: P) =>
  Solid(
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0H4.8z" />
    </>,
    size,
  );

export const IconBook = ({ size }: P) => (
  <Carved size={size}>
    <path d="M4.6 4.2h9.4a2.2 2.2 0 0 1 2.2 2.2V20.4H6.8a2.2 2.2 0 0 1-2.2-2.2V4.2z" fill="#fff" />
    <rect x="16.2" y="6.2" width="3.6" height="14.2" rx="0.8" fill="#fff" />
    <rect x="7.4" y="8" width="5" height="1.5" rx="0.75" fill="#000" />
    <rect x="7.4" y="11" width="5" height="1.5" rx="0.75" fill="#000" />
  </Carved>
);

export const IconShield = ({ size }: P) => (
  <Carved size={size}>
    <path d="M12 2.6l7.4 3.2v5.2c0 4.5-3 8-7.4 9.5-4.4-1.5-7.4-5-7.4-9.5V5.8L12 2.6z" fill="#fff" />
    <path
      d="M8.4 11.8l2.6 2.6 4.6-4.8 1.4 1.4-6 6.2L7 13.2l1.4-1.4z"
      fill="#000"
    />
  </Carved>
);

export const IconHelp = ({ size }: P) => (
  <Carved size={size}>
    <circle cx="12" cy="12" r="9" fill="#fff" />
    <path
      d="M9 9a3 3 0 0 1 5.8 1.1c0 1.9-2.6 2.4-2.6 4.2h-1.8c0-2.4 2.6-2.8 2.6-4.2A1.2 1.2 0 0 0 10.7 9H9z"
      fill="#000"
    />
    <circle cx="12" cy="16.7" r="1.1" fill="#000" />
  </Carved>
);

export const IconPalette = ({ size }: P) => (
  <Carved size={size}>
    <path
      d="M12 2.8a9.2 9.2 0 0 0 0 18.4c1.6 0 2.2-1 2.2-2 0-.55-.2-1-.55-1.35-.3-.3-.55-.75-.55-1.3 0-1 .9-1.8 1.9-1.8H16.4a4.8 4.8 0 0 0 4.8-4.8C21.2 6.1 17 2.8 12 2.8z"
      fill="#fff"
    />
    <circle cx="8" cy="11" r="1.3" fill="#000" />
    <circle cx="12" cy="8" r="1.3" fill="#000" />
    <circle cx="16" cy="10.4" r="1.3" fill="#000" />
  </Carved>
);

export const IconCloud = ({ size }: P) =>
  Solid(
    <path d="M7 18.4a4.4 4.4 0 0 1-.55-8.75 5.4 5.4 0 0 1 10.35-1.3A4.1 4.1 0 0 1 17.8 18.4H7z" />,
    size,
  );

export const IconLeaf = ({ size }: P) => (
  <Carved size={size}>
    <path
      d="M4.6 19.4c0-7.6 5.4-12.8 15-12.8 0 9.6-5.4 13.9-11.8 13.9-1.2 0-2.4-.25-3.2-.7v1.6z"
      fill="#fff"
    />
    <path
      d="M8.6 15.4c2.2-2.7 4.8-4.3 7.5-5.3"
      fill="none"
      stroke="#000"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Carved>
);
