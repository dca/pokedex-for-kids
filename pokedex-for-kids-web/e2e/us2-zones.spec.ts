// US2：起始階段為「認字」的檔案開放四區，每區的題型不同；道館 10 題答對 8 題得到徽章。
import { test, expect, type Page } from '@playwright/test'
import { answer, choosePartner, currentQuestion, hooks, setTestPokemon, start } from './helpers'

const TYPES: Record<string, string[]> = {
  meadow: ['listen_symbol', 'first_sound'],
  beach: ['listen_symbol', 'listen_tone'],
  forest: ['fill_symbol', 'fill_tone', 'build_syllable'],
  hill: ['listen_name', 'zhuyin_to_char', 'fill_char'],
}

async function createReader(page: Page) {
  await start(page)
  await choosePartner(page) // 訪客預設檔案
  await page.getByRole('button', { name: '帳號與小朋友' }).click()
  await page.getByRole('button', { name: '＋ 新增小朋友' }).click()
  await page.getByLabel('暱稱（不用填真實姓名）').fill('哥哥')
  await page.getByLabel(/認字/).check()
  await page.getByRole('button', { name: '建立' }).click()
  await expect(page.getByText('哥哥')).toBeVisible()
  await page.getByRole('button', { name: '← 回到遊戲' }).click()
  await page.getByRole('button', { name: '開始' }).click()
  await page.getByRole('button', { name: '哥哥' }).click()
  await choosePartner(page, '小火龍')
}

test('四區題型與認字的直排注音', async ({ page }) => {
  test.setTimeout(120_000)
  await createReader(page)
  await setTestPokemon(page, null)
  for (const zone of ['meadow', 'beach', 'forest', 'hill']) {
    await page.evaluate((z) => (window as unknown as { __zhuyinIsland: { setZone: (z: string) => void } }).__zhuyinIsland.setZone(z), zone)
    await expect.poll(() => hooks(page, (h) => h.getState().zone)).toBe(zone)
    await expect.poll(() => hooks(page, (h) => h.getState().mode.kind)).toBe('explore')
    await hooks(page, (h) => h.enterGrass())
    const { q, total } = await currentQuestion(page)
    expect(TYPES[zone]).toContain(q.type)
    if (zone === 'hill' && q.type !== 'listen_name') expect(q.display.layout).toBe('vertical')
    for (let i = 0; i < total; i++) {
      if (i > 0) await expect.poll(() => hooks(page, (h) => h.getState().mode.challenge?.index)).toBe(i)
      await answer(page, 0)
    }
    await page.getByRole('button', { name: '繼續探索' }).click()
  }
})

test('道館：沒通過時鼓勵再挑戰；通過得到徽章', async ({ page }) => {
  test.setTimeout(180_000)
  await createReader(page)
  for (const [round, wrongCount] of [[1, 3], [2, 0]] as const) {
    await expect.poll(() => hooks(page, (h) => h.getState().mode.kind)).toBe('explore')
    await hooks(page, (h) => h.enterGym('meadow'))
    await page.getByRole('button', { name: '挑戰！' }).click()
    for (let i = 0; i < 10; i++) {
      if (i > 0) await expect.poll(() => hooks(page, (h) => h.getState().mode.challenge?.index)).toBe(i)
      await answer(page, i < wrongCount ? 1 : 0)
    }
    const result = page.getByRole('dialog', { name: '道館挑戰結果' })
    await expect(result).toBeVisible()
    if (round === 1) {
      await expect(result.getByText('答對 7 ／ 10 題')).toBeVisible()
      await expect(result.getByRole('heading')).toHaveText('再多練習一下，等一下再來挑戰吧！')
    } else {
      await expect(result.getByRole('heading')).toHaveText('新手草原道館挑戰成功！')
      await expect(result.getByText('太厲害了，你拿到徽章了！')).toBeVisible()
    }
    await result.getByRole('button', { name: '繼續探索' }).click()
  }
  await expect(page.getByLabel(/徽章 1 個/)).toBeVisible()
})
