// US5：訪客註冊後進度保留；另一台裝置登入看到同樣的進度；斷線時顯示「連線中」並自動繼續；救援碼重設密碼。
import { test, expect, type Page } from '@playwright/test'
import { choosePartner, hooks, playEncounter, start } from './helpers'

const unique = () => `fam_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`

async function openAccount(page: Page) {
  await page.getByRole('button', { name: '帳號與小朋友' }).click()
  await expect(page.getByRole('heading', { name: /家長帳號/ })).toBeVisible()
}

test('訪客註冊、換裝置登入、斷線重送、救援碼重設密碼', async ({ browser, page }) => {
  test.setTimeout(150_000)
  const username = unique()

  // 訪客玩一次
  await start(page)
  await choosePartner(page)
  await playEncounter(page, { pokemon: 16 })
  await page.getByRole('dialog', { name: '收服了波波' }).getByRole('button', { name: '繼續探索' }).click()

  // 註冊：救援碼要確認已保存才能繼續
  await openAccount(page)
  await page.getByRole('button', { name: '註冊（保存進度）' }).click()
  await page.getByLabel('帳號名稱').fill('ab')
  await page.getByLabel('密碼').fill('password123')
  await page.getByRole('button', { name: '註冊' }).click()
  await expect(page.getByText('帳號名稱至少 3 個字元')).toBeVisible()
  await page.getByLabel('帳號名稱').fill(username)
  await page.getByRole('button', { name: '註冊' }).click()
  const rescue = (await page.getByTestId('rescue-code').textContent())!.trim()
  expect(rescue).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/)
  await expect(page.getByRole('button', { name: '我已保存，繼續' })).toBeDisabled()
  await page.getByLabel('我已經把救援碼存好了').check()
  await page.getByRole('button', { name: '我已保存，繼續' }).click()
  await expect(page.getByRole('heading', { name: `家長帳號：${username}` })).toBeVisible()

  // 第二個小朋友
  await page.getByRole('button', { name: '＋ 新增小朋友' }).click()
  await page.getByLabel('暱稱（不用填真實姓名）').fill('妹妹')
  await page.getByRole('button', { name: '建立' }).click()
  await expect(page.getByText('妹妹')).toBeVisible()

  // 另一台裝置：名稱重複時有提示；登入後兩個檔案、進度一致
  const other = await browser.newContext()
  const p2 = await other.newPage()
  await p2.goto('/account')
  await p2.getByRole('button', { name: '註冊' }).first().click()
  await p2.getByLabel('帳號名稱').fill(username.toUpperCase())
  await p2.getByLabel('密碼').fill('password123')
  await p2.getByRole('button', { name: '註冊' }).click()
  await expect(p2.getByText('這個帳號名稱已經有人使用，請換一個')).toBeVisible()
  await p2.getByRole('button', { name: '← 返回' }).click()
  await p2.getByRole('button', { name: '登入' }).click()
  await p2.getByLabel('帳號名稱').fill(username)
  await p2.getByLabel('密碼').fill('password123')
  await p2.getByRole('button', { name: '登入' }).click()
  await expect(p2.getByRole('heading', { name: `家長帳號：${username}` })).toBeVisible()
  await p2.getByRole('button', { name: '← 回到遊戲' }).click()
  await p2.getByRole('button', { name: '開始' }).click()
  await p2.getByRole('button', { name: '小訓練家' }).click()
  await expect(p2.getByLabel(/已收集 1 隻/)).toBeVisible()

  // 斷線：顯示「連線中」，恢復後自動繼續完成遭遇
  await expect.poll(() => hooks(p2, (h) => h.getState().mode.kind)).toBe('explore')
  await other.setOffline(true)
  await hooks(p2, (h) => h.enterGrass())
  await expect(p2.getByRole('status').filter({ hasText: '連線中' })).toBeVisible({ timeout: 15000 })
  await other.setOffline(false)
  await expect(p2.getByRole('region', { name: '挑戰' })).toBeVisible({ timeout: 20000 })
  await other.close()

  // 用救援碼重設密碼
  const p3 = await browser.newPage()
  await p3.goto('/account')
  await p3.getByRole('button', { name: '登入' }).click()
  await p3.getByRole('button', { name: '忘記密碼？用救援碼重設' }).click()
  await p3.getByLabel('帳號名稱').fill(username)
  await p3.getByLabel('救援碼').fill(rescue.toLowerCase())
  await p3.getByLabel('新密碼').fill('newpassword1')
  await p3.getByRole('button', { name: '重設密碼' }).click()
  const newCode = (await p3.getByTestId('rescue-code').textContent())!.trim()
  expect(newCode).not.toBe(rescue)
  await p3.close()
})

test('連續輸入錯誤密碼會暫時鎖定', async ({ page }) => {
  const username = unique()
  await page.goto('/account')
  await page.getByRole('button', { name: '註冊' }).first().click()
  await page.getByLabel('帳號名稱').fill(username)
  await page.getByLabel('密碼').fill('password123')
  await page.getByRole('button', { name: '註冊' }).click()
  await page.getByLabel('我已經把救援碼存好了').check()
  await page.getByRole('button', { name: '我已保存，繼續' }).click()
  await page.getByRole('button', { name: '登出' }).click()
  await page.getByRole('button', { name: '登入' }).click()
  await page.getByLabel('帳號名稱').fill(username)
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('密碼').fill('wrong-password')
    await page.getByRole('button', { name: '登入' }).click()
    await expect(page.getByText('帳號或密碼不正確')).toBeVisible()
  }
  await page.getByLabel('密碼').fill('password123')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page.getByText('嘗試太多次了，請稍後再試')).toBeVisible()
})
