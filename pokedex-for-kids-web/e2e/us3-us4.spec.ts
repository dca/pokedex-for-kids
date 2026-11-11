// US3：答錯的項目在 5 次遭遇內再出現。US4：收集冊 151 格、剪影、重聽發音。
import { test, expect } from '@playwright/test'
import { answer, choosePartner, currentQuestion, hooks, playEncounter, start } from './helpers'

test('答錯的項目，之後 5 次遭遇內會再練到（US3 驗收 1）', async ({ page }) => {
  test.setTimeout(180_000)
  await start(page)
  await choosePartner(page)
  await expect.poll(() => hooks(page, (h) => h.getState().mode.kind)).toBe('explore')

  // 第一次遭遇：第一題答錯一次（每一題都至少有一個錯的選項）
  await hooks(page, (h) => h.enterGrass())
  const first = await currentQuestion(page)
  const target = first.q.itemIds[0]
  await answer(page, 1)
  for (let i = 1; i < first.total; i++) {
    await expect.poll(() => hooks(page, (h) => h.getState().mode.challenge?.index)).toBe(i)
    await answer(page, 0)
  }
  await page.getByRole('button', { name: '繼續探索' }).click()

  let seen = false
  for (let k = 0; k < 5 && !seen; k++) {
    await expect.poll(() => hooks(page, (h) => h.getState().mode.kind)).toBe('explore')
    await hooks(page, (h) => h.enterGrass())
    const { total } = await currentQuestion(page)
    const items = await hooks(page, (h) => h.getState().mode.encounter!.questions.flatMap((x) => x.itemIds))
    seen = items.includes(target)
    for (let i = 0; i < total; i++) {
      if (i > 0) await expect.poll(() => hooks(page, (h) => h.getState().mode.challenge?.index)).toBe(i)
      await answer(page, 0)
    }
    await page.getByRole('button', { name: '繼續探索' }).click()
  }
  expect(seen, `${target} 答錯後 5 次遭遇內應再出現`).toBe(true)
})

test('收集冊：151 格、未收服顯示？？？、可以重聽中英文名稱', async ({ page }) => {
  await start(page)
  await choosePartner(page, '妙蛙種子')
  await playEncounter(page, { pokemon: 16 })
  await page.getByRole('dialog', { name: '收服了波波' }).getByRole('button', { name: '打開收集冊' }).click()
  const book = page.getByRole('dialog', { name: '我的收集冊' })
  await expect(book.getByRole('listitem')).toHaveCount(151)
  await expect(book.getByText('已收集 1 ／ 151')).toBeVisible()
  await expect(book.getByRole('button', { name: '第 1 號，還沒收服' })).toBeDisabled()
  await book.getByRole('button', { name: /^波波，3 顆星$/ }).click()
  const detail = page.getByRole('dialog', { name: '波波' })
  await expect(detail.getByText('Pidgey')).toBeVisible()
  await detail.getByRole('button', { name: '🔊 中文' }).click()
  await detail.getByRole('button', { name: '🔊 English' }).click()
  await detail.getByRole('button', { name: '關閉' }).click()
  await book.getByRole('button', { name: '關閉收集冊' }).click()
  await expect(book).toBeHidden()
})
