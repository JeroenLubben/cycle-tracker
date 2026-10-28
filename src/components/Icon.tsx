// Line-style icon set from the mood board. Stroke uses currentColor.

const paths = {
  home: 'M4 11 12 4l8 7v9h-5v-6h-6v6H4z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  insights: 'M4 20h16M7 17v-6M11 17V7M15 17v-4M19 17V9',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a7.5 7.5 0 0 0 0-2l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5z',
  plus: 'M12 5v14M5 12h14',
  chevron: 'm9 6 6 6-6 6',
  drop: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  back: 'm15 6-6 6 6 6',
  smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 10h.01M15 10h.01M8.5 14.5q3.5 3 7 0',
  journal: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  cramps: 'M4 12c2-3 4 3 6 0s4 3 6 0 4 3 4 0M7 18h10',
  headache: 'M12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 2v2M5 5l1.5 1.5M19 5l-1.5 1.5',
  bloating: 'M12 20c5 0 8-3.5 8-8s-3-8-8-8-8 3.5-8 8 3 8 8 8zM8 12h8M12 8v8',
  acne: 'M8 9h.01M15 8h.01M11 14h.01M16 15h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  tired: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5zM15 4h3l-3 3h3',
  cravings: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9h.01M14 8h.01M15 13h.01M10 14h.01M12 11h.01',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
