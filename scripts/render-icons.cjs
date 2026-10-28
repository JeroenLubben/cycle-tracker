// Renders public/icons/icon.svg to the PNG sizes iOS and the PWA manifest need.
// Usage: node scripts/render-icons.cjs  (needs Playwright with Chromium available)
const { chromium } = require('playwright')
const { readFileSync } = require('node:fs')
const path = require('node:path')

const dir = path.join(__dirname, '../public/icons')
const svg = readFileSync(path.join(dir, 'icon.svg'), 'utf8')
const sizes = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 }

;(async () => {
  const browser = await chromium.launch()
  for (const [file, size] of Object.entries(sizes)) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    await page.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`)
    await page.screenshot({ path: path.join(dir, file) })
    await page.close()
  }
  await browser.close()
})()
