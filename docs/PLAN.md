# Plan: Cute cycle tracker ("bear" app)

## Context
Your friend (Lis) wants a period tracker that is actually cute. Her mood board shows a cream/blush/brown palette, a teddy-bear mascot and 10 screens. In the WhatsApp chat she adds a business idea: the basics are free, and Pro unlocks other "support animals" as cosmetic companions. The `cycle-tracker` repo is empty.

**Decisions:** Lis has an iPhone. Data stays on her device only. UI is English, i18n-ready. **The MVP is a web app (PWA) on GitHub Pages:** you send a link and she adds it to her home screen. A real React Native app for the App Store / Play Store comes later. The MVP is built so its logic, design tokens, texts and data carry over.

### Is web-first a good idea? Yes, with these caveats
- **What it gives:** zero install friction, instant updates (every push = new version), and no Apple account needed yet.
- **Reminders:** iOS only supports web push for home-screen web apps, and it needs a push server. So **no reminders in the MVP**.
- **Storage:** data lives in the browser's IndexedDB. I believe iOS doesn't evict data for home-screen web apps the way it can for normal Safari sites, but I'm not certain, so **export/import is a must-have**, not a nice-to-have. Data saved in Safari and in the home-screen app is also separate storage, so she should use only the home-screen icon.
- **Porting later:** pure TypeScript logic, tokens, i18n strings and the data/export format move to React Native unchanged. **Screens and components must be rewritten** (HTML/CSS → RN views). That rewrite is expected and fine for an MVP whose job is to validate features. Her real data moves over via the same JSON export → import.
- **GitHub Pages + private repo:** I believe Pages on a private repo needs a paid GitHub plan. A public repo is fine (her data never touches GitHub), but verify this.

---

## Phase 0: Design system (Claude Design)
1. **Tokens.** These hex values are my estimates from the mood board; finalize them in Claude Design:
   cream #F4ECE4 (bg) · blush #E8CFC4 (cards/predicted) · sand #D2B4A0 (follicular) · rose #C27F78 (period, primary) · cocoa #7A4E35 (text, luteal) · olive #7C7E5E (ovulation/fertile).
   Type: a free elegant serif for headings and numbers (the board looks Garamond/Cormorant-like; that's a guess) plus a soft sans for UI. Use a 4pt spacing scale, radii of 16–24, soft shadows, and line icons.
2. **Components:** Card, StatCard, FAB (+), TabBar, SegmentedControl, MoodPicker (5 bear faces), SymptomChip, FlowPicker (5 drops), CalendarDay (period/predicted/fertile/today), CycleRing, ListRow, BottomSheet.
3. **Mascot:** the board's bears look AI-generated. We need one consistent, original set you own: sitting, side, lying, sleeping, back, and 5 mood faces, as transparent WebP/PNG. Model it as a `Companion` set so Pro animals later are just extra sets.
4. **Code mirror:** `src/theme/tokens.ts` exports plain objects (no CSS-only values), so React Native can import the same file later. I'm not certain what Claude Design exports, so we'll check and map it into this file.

---

## Phase 1: Web MVP

### Stack
- **Vite + React + TypeScript**, deployed to **GitHub Pages via a GitHub Actions workflow** (`.github/workflows/deploy.yml`)
- **vite-plugin-pwa**: manifest, app icon, iOS `apple-touch-icon`, standalone display, offline cache
- **Hash or base-aware routing** (react-router with `basename`) so deep links work on Pages
- **Dexie (IndexedDB)** behind a `Storage` interface in `src/data/`. Later, a SQLite implementation for RN uses the same interface.
- **date-fns**, **zustand**, **i18next** (strings in `src/i18n/en.json`), **vitest** for the domain logic
- CSS Modules or plain CSS with variables generated from `tokens.ts`. No Tailwind, to keep the mapping to RN styles one-to-one.

### Structure (portable parts marked ★)
```
src/
  domain/ ★     cycle.ts (pure prediction logic) + cycle.test.ts
  theme/ ★      tokens.ts
  i18n/ ★       en.json
  data/ ★       types.ts, Storage interface, export/import (versioned JSON)
  data/web/     Dexie implementation
  companions/ ★ Companion type + bear asset manifest
  components/   web UI components (rewritten in RN later)
  screens/      Home, Calendar, DayLog, Cycle, Insights, More, Onboarding
public/         icons, bear images, fonts
```

### Data model
- `periodDays { date, flow: spotting|light|medium|heavy }`, from which cycles are derived
- `dayLogs { date, mood 1–5, sleepMinutes, note, symptoms[] }`
- `settings { avgCycleLen, avgPeriodLen, companionId, onboarded }`
- Export: `{ schemaVersion: 1, exportedAt, periodDays, dayLogs, settings }`

### Prediction (`src/domain/cycle.ts`, pure and unit-tested)
- Cycle start = first period day after a gap. Cycle length = average of the last ≤6 complete cycles, falling back to the onboarding input (default 28).
- Ovulation ≈ next start − 14 days. Fertile window = ovulation −5…+1. This is the standard calendar estimate.
- Phases for "Cycle day 23 · Luteal".
- Disclaimer in onboarding + More: not for contraception or medical diagnosis.

### Screens (from the mood board)
1. Onboarding: last period start, cycle/period length, a "use from the home screen" tip
2. Home: greeting, bear, "period starts in X days", cycle day, phase
3. Calendar: month view with states, plus the "X days until next period" card. Tapping a day opens the log.
4. Day log: mood, symptoms, flow, sleep, notes (bottom sheets)
5. Cycle: ring with phase legend
6. Insights (basic): average cycle and period length, next period
7. More: export/import JSON, delete all data, about/disclaimer

**Not in MVP:** reminders, widgets, Pro/companions purchase, Dutch, dark mode.

---

## Phase 2: Native app (after Lis has used the MVP for 1–2 cycles)
- Expo / React Native, reusing ★ folders as-is. Rebuild the UI with the same tokens, then import her JSON export.
- Then add local reminders, iOS/Android widgets, Pro companions via in-app purchase (e.g. RevenueCat), and Dutch.
- Store prep: Apple Developer Program (I believe ~€99/yr; verify), Google Play account, privacy policy, App Store privacy label, and the Play Data safety form. Cycle data is health data, a special category under GDPR. On-device storage keeps this simplest.
- Choose the app name/branding early, and check store availability (a possible Romanticized Society tie-in).

## Milestones
1. Design system approved in Claude Design
2. Vite scaffold + tokens + PWA manifest + Pages deploy (send Lis a "hello bear" link to test add-to-home-screen early)
3. Domain logic + tests + storage + export/import
4. Onboarding, Home, Calendar
5. Day logging
6. Cycle, Insights, More
7. Lis uses it daily; collect feedback

## Verification
- `npm run typecheck`, `npm run lint`, `npm test` (vitest: irregular cycles, one cycle, no data, month boundaries)
- `npm run build && npm run preview`, and a Playwright screenshot at iPhone viewport (390×844) compared with the mood board
- Lighthouse PWA check (installable, offline)
- Export → delete all → import, then confirm identical data
- On a real iPhone: open the Pages URL in Safari → Add to Home Screen → opens standalone, works offline, data persists after closing
