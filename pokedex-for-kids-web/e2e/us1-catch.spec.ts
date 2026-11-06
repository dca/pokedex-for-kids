// US1：以訪客打開遊戲、走進草叢、答題、收服（Independent Test）。
import { test, expect } from '@playwright/test'
import { answer, choosePartner, currentQuestion, hooks, setTestPokemon, start } from './helpers'

test('訪客完整玩一次遭遇：答錯不懲罰、依答錯次數給星星、重新整理後進度還在', async ({ page }) => {
  await start(page)
  await choosePartner(page)
  await expect(page.getByText('草叢在動！走過去看看')).toBeVisible()

  await setTestPokemon(page, 25)
  await hooks(page, (h) => h.enterGrass())
  await expect(page.getByText(/野生的\s*皮卡丘\s*出現了！/)).toBeVisible()

  const { q, total } = await currentQuestion(page)
  // 題目不洩漏答案：開頭音題不顯示注音、聽音題不顯示名稱
  if (q.type === 'first_sound') expect(q.display.cells.every((c) => c.zhuyin === null)).toBe(true)
  if (q.type === 'listen_symbol' || q.type === 'listen_tone') expect(q.display.layout).toBe('none')
  await expect(page.getByRole('button', { name: '再聽一次題目' })).toBeVisible()

  // 第一題答錯一次：那張選項變淡、不能再點
  const wrong = q.options.find((o) => !q.answer.includes(o.id))!
  const sheet = page.getByRole('region', { name: '挑戰' })
  await sheet.getByRole('button', { name: wrong.label, exact: true }).click()
  await expect(sheet.getByRole('button', { name: wrong.label, exact: true })).toBeDisabled()
  await expect(page.getByText('再聽一次喔。')).toBeVisible()
  await sheet.getByRole('button', { name: q.options.find((o) => o.id === q.answer[0])!.label, exact: true }).click()
  for (let i = 1; i < total; i++) {
    await expect.poll(() => hooks(page, (h) => h.getState().mode.challenge?.index)).toBe(i)
    await answer(page, 0)
  }

  const caught = page.getByRole('dialog', { name: '收服了皮卡丘' })
  await expect(caught).toBeVisible()
  await expect(caught.getByLabel('2 顆星')).toBeVisible()
  await caught.getByRole('button', { name: '繼續探索' }).click()
  await expect(caught).toBeHidden()
  await expect(page.getByLabel(/已收集 1 隻/)).toBeVisible()

  // 進度存在伺服器：重新整理後再開始，收集冊裡仍有皮卡丘
  await page.reload()
  await start(page)
  await page.getByRole('button', { name: '打開收集冊' }).click()
  const book = page.getByRole('dialog', { name: '我的收集冊' })
  await expect(book.getByText('已收集 1 ／ 151')).toBeVisible()
  await expect(book.getByRole('button', { name: '皮卡丘，2 顆星' })).toBeVisible()
})
