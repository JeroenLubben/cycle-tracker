// Web-only: exposes tokens.ts as CSS custom properties, e.g. --color-primary, --space-lg.

import { colors, fonts, fontSize, phaseColors, radius, shadow, space } from './tokens'

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function applyTokens(root: HTMLElement = document.documentElement) {
  const vars: Record<string, string> = {}
  for (const [k, v] of Object.entries(colors)) vars[`--color-${kebab(k)}`] = v
  for (const [k, v] of Object.entries(phaseColors)) vars[`--phase-${k}`] = v
  for (const [k, v] of Object.entries(fontSize)) vars[`--font-size-${k}`] = `${v}px`
  for (const [k, v] of Object.entries(space)) vars[`--space-${k}`] = `${v}px`
  for (const [k, v] of Object.entries(radius)) vars[`--radius-${k}`] = `${v}px`
  vars['--font-display'] = `'${fonts.display}', Georgia, serif`
  vars['--font-body'] = `'${fonts.body}', system-ui, sans-serif`
  vars['--shadow-card'] = `0 ${shadow.offsetY}px ${shadow.radius}px ${hexToRgba(shadow.color, shadow.opacity)}`
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}
