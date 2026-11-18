import type { CSSProperties } from 'react';

const paths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  book: 'M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1ZM12 6v14',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  check: 'm5 12 4.5 4.5L19 7',
  close: 'm6 6 12 12M6 18 18 6',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  calendar: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  edit: 'm15 5 4 4M4 20l5-1L21 7l-4-4L5 15l-1 5Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  info: 'M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  shield: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Zm-4 10 3 3 5-6',
  alert: 'M12 8v5M12 17h.01M10 3 1 20h22L14 3h-4Z',
  chevron: 'm9 5 7 7-7 7',
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  className = '',
  style,
}: {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Logo() {
  return (
    <span className="brand">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path fill="currentColor" d="M3 3h13v13H3zM20 3h13v13H20zM3 20h13v13H3z" />
        <path fill="#a5b767" d="M20 20h13v5a8 8 0 0 1-8 8h-5Z" />
      </svg>
      <span>
        studyflow<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
