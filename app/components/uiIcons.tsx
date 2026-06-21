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
