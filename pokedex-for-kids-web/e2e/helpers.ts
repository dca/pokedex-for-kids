// E2E 共用操作：透過 window.__zhuyinIsland 測試掛勾觸發遭遇，不需要在 3D 畫面上點擊。
import { expect, type Page } from '@playwright/test'
import type { Question } from '../src/api/types'

type Hooks = {
  enterGrass: () => void
  setZone: (z: string) => void
  enterGym: (z: string) => void
  setTestPokemon: (id: number | null) => void
  getState: () => { mode: { kind: string; encounter?: { questions: Question[]; pokemonId: number; kind: string }; challenge?: { phase: string; index: number } }; zone: string; child: { caught: { pokemonId: number }[] } | null }
}

export const hooks = <T>(page: Page, fn: (h: Hooks) => T) =>
  page.evaluate((src) => {
    const h = (window as unknown as { __zhuyinIsland: Hooks }).__zhuyinIsland
    return new Function('h', `return (${src})(h)`)(h)
  }, fn.toString()) as Promise<Awaited<T>>

export async function setTestPokemon(page: Page, id: number | null) {
  await page.evaluate((v) => (window as unknown as { __zhuyinIsland: Hooks }).__zhuyinIsland.setTestPokemon(v), id)
}

export async function start(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '開始' }).click()
}

export async function choosePartner(page: Page, name = '傑尼龜') {
  const dialog = page.getByRole('dialog', { name: '選擇夥伴' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name }).click()
  await dialog.getByRole('button', { name: '就是你了！' }).click()
  await expect(dialog).toBeHidden()
  await expect.poll(() => hooks(page, (h) => !!h.getState().child)).toBe(true)
}

/** 等到出現挑戰面板，回傳目前的題目 */
export async function currentQuestion(page: Page): Promise<{ q: Question; index: number; total: number }> {
  const sheet = page.getByRole('region', { name: '挑戰' })
  await expect(sheet).toBeVisible()
  await expect.poll(() => hooks(page, (h) => h.getState().mode.challenge?.phase)).toBe('asking')
  // 等畫面換成這一題（上一題的「好棒！」消失）再操作，避免點到上一題的選項
  await expect(sheet.getByText('好棒！')).toBeHidden()
  return hooks(page, (h) => {
    const m = h.getState().mode
    return { q: m.encounter!.questions[m.challenge!.index], index: m.challenge!.index, total: m.encounter!.questions.length }
  })
}

const label = (q: Question, id: string) => q.options.find((o) => o.id === id)!.label

async function tap(page: Page, text: string) {
  await page.getByRole('region', { name: '挑戰' }).getByRole('group', { name: '選項' }).getByRole('button', { name: text, exact: true }).click()
}

/** 回答目前這題；wrong 次先點錯的選項 */
export async function answer(page: Page, wrong: 0 | 1 | 2 = 0) {
  const { q, index } = await currentQuestion(page)
  const wrongIds = q.options.map((o) => o.id).filter((id) => !q.answer.includes(id))
  for (let i = 0; i < wrong; i++) {
    const id = q.type === 'build_syllable' ? wrongIds[0] : wrongIds[i]
    await tap(page, label(q, id))
    if (i === 1) await expect(page.getByText('答案在這裡，點點看。')).toBeVisible()
  }
  for (const id of q.answer) {
    const name = wrong === 2 ? `${label(q, id)}，答案在這裡` : label(q, id)
    await tap(page, name)
  }
  await expect(page.getByText('好棒！')).toBeVisible()
  return { q, index }
}

/** 在草叢遭遇並答完所有題目；回傳總題數 */
export async function playEncounter(page: Page, opts: { pokemon?: number; wrongOnFirst?: 0 | 1 | 2 } = {}) {
  if (opts.pokemon) await setTestPokemon(page, opts.pokemon)
  await expect.poll(() => hooks(page, (h) => h.getState().mode.kind)).toBe('explore')
  await hooks(page, (h) => h.enterGrass())
  const first = await currentQuestion(page)
  for (let i = 0; i < first.total; i++) {
    await answer(page, i === 0 ? (opts.wrongOnFirst ?? 0) : 0)
    if (i + 1 < first.total) await expect.poll(() => hooks(page, (h) => h.getState().mode.challenge?.index)).toBe(i + 1)
  }
  return first.total
}
