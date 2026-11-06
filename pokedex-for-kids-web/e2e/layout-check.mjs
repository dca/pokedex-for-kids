// 版面檢查（手動執行）：node e2e/layout-check.mjs <網址> <截圖資料夾>
// 在多種視窗尺寸下打開各畫面，找出超出視窗的元素、過小的按鈕，並截圖。
import { chromium, webkit } from '@playwright/test'
import fs from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:3200'
const outDir = process.argv[3] ?? 'layout-shots'
fs.mkdirSync(outDir, { recursive: true })

const SIZES = [
  { name: 'desktop-xl', width: 1800, height: 1120, touch: false },
  { name: 'desktop', width: 1180, height: 820, touch: false },
  { name: 'desktop-small', width: 700, height: 600, touch: false },
  { name: 'ipad-portrait', width: 820, height: 1180, touch: true },
  { name: 'iphone', width: 390, height: 844, touch: true },
]

const hook = (page, code) => page.evaluate(`window.__zhuyinIsland.${code}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 回傳超出視窗的可見元素與小於 minTap 的按鈕 */
async function audit(page, minTap) {
  return page.evaluate((minTap) => {
    const vw = innerWidth
    const vh = innerHeight
    const issues = []
    const describe = (el) => (el.getAttribute('aria-label') || el.textContent || el.className || el.tagName).toString().trim().slice(0, 30)
    for (const el of document.querySelectorAll('[role=dialog] > *, [role=region], header > *, button, [role=status]')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') continue
      // 在可捲動容器裡的元素不算超出
      const scroller = el.closest('[role=dialog] section, section[role=dialog], [class*="grid"]')
      const inScroll = !!el.closest('[class*="book"]') || !!scroller
      if (!inScroll && (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1)) {
        issues.push(`超出視窗：${describe(el)} [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`)
      }
      if (el.tagName === 'BUTTON' && minTap && !el.disabled && (r.width < minTap - 0.5 || r.height < minTap - 0.5)) {
        issues.push(`按鈕小於 ${minTap}px：${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`)
      }
    }
    if (document.documentElement.scrollWidth > vw + 1) issues.push(`頁面出現水平捲動：${document.documentElement.scrollWidth} > ${vw}`)
    return [...new Set(issues)]
  }, minTap)
}

async function shot(page, size, screen, report) {
  await sleep(700)
  const file = `${outDir}/${size.name}-${screen}.png`
  await page.screenshot({ path: file })
  const issues = await audit(page, 80)
  report.push({ size: size.name, screen, ui: await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui')), issues })
}

const report = []
for (const size of SIZES) {
  const browser = await (size.touch ? webkit : chromium).launch()
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch && size.width < 600 })
  const page = await ctx.newPage()
  await page.goto(base)
  await shot(page, size, '1-start', report)
  await page.getByRole('button', { name: '開始' }).click()
  await page.getByRole('dialog', { name: '選擇夥伴' }).waitFor()
  await shot(page, size, '2-partner', report)
  await page.getByRole('button', { name: '傑尼龜' }).click()
  await page.getByRole('button', { name: '就是你了！' }).click()
  await page.getByRole('dialog', { name: '選擇夥伴' }).waitFor({ state: 'hidden' })
  await shot(page, size, '3-explore', report)
  await hook(page, 'setTestPokemon(25)')
  await sleep(500)
  await hook(page, 'enterGrass()')
  await page.getByRole('region', { name: '挑戰' }).waitFor()
  await shot(page, size, '4-question', report)
  // 一路答對到收服
  for (let i = 0; i < 3; i++) {
    const m = await page.evaluate('window.__zhuyinIsland.getState().mode')
    if (m.kind !== 'question') break
    const q = m.encounter.questions[m.challenge.index]
    for (const id of q.answer) {
      const label = q.options.find((o) => o.id === id).label
      await page.getByRole('group', { name: '選項' }).getByRole('button', { name: label, exact: true }).click()
    }
    await sleep(1800)
  }
  await page.getByRole('dialog', { name: /收服了/ }).waitFor()
  await sleep(1800)
  await shot(page, size, '5-catch', report)
  await page.getByRole('dialog', { name: /收服了/ }).getByRole('button', { name: '打開收集冊' }).click()
  await page.getByRole('dialog', { name: '我的收集冊' }).waitFor()
  await shot(page, size, '6-book', report)
  await page.getByRole('button', { name: /皮卡丘，/ }).click()
  await shot(page, size, '7-book-detail', report)
  await page.goto(base + '/account')
  await page.getByRole('heading', { name: /家長帳號/ }).waitFor()
  await shot(page, size, '8-account', report)
  await browser.close()
}

fs.writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 1))
for (const r of report) console.log(`${r.size.padEnd(14)} ${r.screen.padEnd(14)} ui=${r.ui.trim().padEnd(5)} ${r.issues.length ? r.issues.join('；') : 'OK'}`)
