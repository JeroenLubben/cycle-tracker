# Cycle 🧸

A cosy, private period tracker. The MVP is a web app (PWA) hosted on GitHub Pages: open the link on an iPhone in Safari, tap **Share → Add to Home Screen**, and always open it from that icon.

All data stays on the phone (IndexedDB). Nothing is sent to a server. Use **More → Export** to make backups (coming soon).

> Estimates only. Not a method of contraception and not medical advice.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (cycle maths, backup round-trip)
npm run typecheck
npm run lint
npm run build      # production build in dist/
npm run icons      # re-render PNG app icons from public/icons/icon.svg (needs Playwright)
```

## Deploying

`.github/workflows/deploy.yml` builds and deploys every push to `main`. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Structure

Folders marked ★ have no browser or React dependencies, so the planned React Native app can reuse them unchanged.

| Folder | Purpose |
| --- | --- |
| `src/domain/` ★ | Cycle maths: phases, predictions, averages |
| `src/data/` ★ | Data types, `Storage` interface, versioned JSON backup |
| `src/data/web/` | IndexedDB (Dexie) implementation of `Storage` |
| `src/theme/tokens.ts` ★ | Design tokens, mirroring the Cycle design system |
| `src/i18n/` ★ | UI strings (English; add `nl.json` later) |
| `src/companions/` ★ | Mascot sets (bear now; Pro animals later) |
| `src/components/`, `src/screens/` | Web UI |

## Roadmap

1. Design system: https://claude.ai/artifact/4aUNo2TxSGeQ4fmQhLY8WC (tokens mirrored in `tokens.ts`); illustrated bear set still to do
2. Onboarding, Calendar
3. Day log (mood, symptoms, flow, sleep, notes)
4. Cycle ring, Insights, More (export / import / delete)
5. Native app (Expo / React Native) reusing the ★ folders; then reminders, widgets, Pro companions, app stores

## Backlog

- **Dark theme.** Samsung Internet force-darkens the app when the phone is in dark mode, even with `color-scheme: only light`. Shipping our own dark theme (a second theme in the design system) should stop that, because browsers leave sites with their own dark design alone.
- Home-screen icon opens a browser tab instead of the app, and can start at onboarding. Likely a browser shortcut rather than an installed app, or a different browser's storage. Check with the user's browser; fix may be guidance only.
- Reminders (native app), widgets, Pro companions, Dutch.
