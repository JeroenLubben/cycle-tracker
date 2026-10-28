// Design tokens: the single source of truth for colours, type and spacing.
// Plain values only (no CSS strings beyond font names), so React Native can import this file too.
// Mirrors the Cycle design system (tokens.json). Change a value there and here together.

import type { Phase } from '../domain/cycle'

export const palette = {
  cream: '#F4ECE4',
  creamDeep: '#EDE2D8',
  blush: '#E8CFC4',
  sand: '#D2B4A0',
  rose: '#BA7670',
  roseDeep: '#A15F59',
  roseTint: '#E6BDB6',
  cocoa: '#7A4E35',
  olive: '#7C7E5E',
  oliveTint: '#D5D6BF',
  white: '#FBF7F3',
} as const

export const colors = {
  background: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.creamDeep,
  text: '#5A3E2E',
  textMuted: '#785C4D',
  primary: palette.rose,
  onPrimary: palette.white,
  border: '#E6D9CE',
  borderControl: '#9C8170',
  focus: palette.cocoa,
  period: palette.rose,
  periodTint: palette.roseTint,
  predicted: '#9C8170',
  fertileTint: palette.oliveTint,
  fertile: palette.olive,
  today: palette.cocoa,
} as const

export const phaseColors: Record<Phase, string> = {
  menstruation: palette.rose,
  follicular: palette.sand,
  ovulation: palette.olive,
  luteal: palette.cocoa,
}

export const fonts = {
  display: 'Cormorant Garamond',
  body: 'Nunito',
} as const

/** Font sizes in px (web) / dp (native). */
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 26, xxl: 34, hero: 44 } as const

/** 4-point spacing scale. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const

export const shadow = { color: '#7A4E35', opacity: 0.08, radius: 16, offsetY: 4 } as const
