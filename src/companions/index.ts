// Companions are the mascot sets. The bear is free; later, Pro unlocks extra animals.
// Each companion supplies the same set of poses so screens never depend on a specific animal.

export type Pose = 'sitting' | 'side' | 'lying' | 'sleeping' | 'back'

export interface Companion {
  id: string
  /** i18n key for the display name. */
  nameKey: string
  pro: boolean
  /** Image paths relative to the app's public folder. Missing poses fall back to `sitting`. */
  poses: Partial<Record<Pose, string>> & { sitting: string }
}

export const companions: Companion[] = [
  {
    id: 'bear',
    nameKey: 'companion.bear',
    pro: false,
    // Placeholder line drawing until the illustrated bear set is ready.
    poses: { sitting: 'companions/bear/sitting.svg' },
  },
]

export const getCompanion = (id: string): Companion => companions.find((c) => c.id === id) ?? companions[0]

