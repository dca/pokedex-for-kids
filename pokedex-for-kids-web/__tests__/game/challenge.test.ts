import { startChallenge, stepChallenge, type ChallengeState } from '@/game/challenge'
import type { Question } from '@/api/types'

function q(answer: string[], options: string[], type: Question['type'] = 'first_sound'): Question {
  return {
    type,
    pokemonId: 25,
    itemIds: ['sym:ㄆ'],
    prompt: [],
    display: { layout: 'none', cells: [], showSpeaker: true },
    options: options.map((id) => ({ id, label: id })),
    answer,
  }
}

const single = q(['ㄆ'], ['ㄅ', 'ㄆ', 'ㄇ'])
const build = q(['ㄎ', 'ㄚ', 'ˇ'], ['ㄚ', 'ˇ', 'ㄎ', 'ㄍ'], 'build_syllable')

function run(questions: Question[], inputs: string[]) {
  let state: ChallengeState = startChallenge(questions)
  const effects: string[] = []
  for (const input of inputs) {
    const r = stepChallenge(questions, state, input === 'next' ? { kind: 'next' } : { kind: 'select', optionId: input })
    state = r.state
    effects.push(...r.effects.map((e) => (e.kind === 'submit_answer' ? `submit:${e.index}:${e.wrongCount}` : e.kind)))
  }
  return { state, effects }
}

describe('單選題', () => {
  it('第一次就答對：送出 wrongCount 0', () => {
    const { state, effects } = run([single], ['ㄆ'])
    expect(state).toMatchObject({ phase: 'correct', index: 0, wrongCount: 0 })
    expect(effects).toEqual(['play_correct', 'submit:0:0'])
  })

  it('第一次錯：選項變淡並重播題目', () => {
    const { state, effects } = run([single], ['ㄅ'])
    expect(state).toMatchObject({ phase: 'asking', wrongCount: 1, disabled: ['ㄅ'] })
    expect(effects).toEqual(['replay_prompt'])
  })

  it('點已經變淡的選項沒有作用', () => {
    const { state, effects } = run([single], ['ㄅ', 'ㄅ'])
    expect(state).toMatchObject({ phase: 'asking', wrongCount: 1 })
    expect(effects).toEqual(['replay_prompt'])
  })

  it('第二次錯：標示正解，只有點正解才前進', () => {
    const { state, effects } = run([single], ['ㄅ', 'ㄇ', 'ㄅ', 'ㄆ'])
    expect(state).toMatchObject({ phase: 'correct', wrongCount: 2 })
    expect(effects).toEqual(['replay_prompt', 'reveal', 'play_correct', 'submit:0:2'])
  })

  it('答對後的點擊不算作答（快速連續點擊）', () => {
    const { state, effects } = run([single], ['ㄆ', 'ㄅ', 'ㄆ'])
    expect(state).toMatchObject({ phase: 'correct', wrongCount: 0 })
    expect(effects).toEqual(['play_correct', 'submit:0:0'])
  })

  it('不存在的選項沒有作用', () => {
    const { state } = run([single], ['X'])
    expect(state).toMatchObject({ phase: 'asking', wrongCount: 0, disabled: [] })
  })
})

describe('多題與結束', () => {
  it('每題剛好送出一次，最後一題之後 finished', () => {
    const { state, effects } = run([single, single], ['ㄆ', 'next', 'ㄅ', 'ㄆ', 'next'])
    expect(state).toEqual({ phase: 'done' })
    expect(effects.filter((e) => e.startsWith('submit'))).toEqual(['submit:0:0', 'submit:1:1'])
    expect(effects.at(-1)).toBe('finished')
  })

  it('作答中按 next 沒有作用', () => {
    const { state } = run([single], ['next'])
    expect(state).toMatchObject({ phase: 'asking', index: 0 })
  })
})

describe('拼音節', () => {
  it('依序點對就完成', () => {
    const { state, effects } = run([build], ['ㄎ', 'ㄚ', 'ˇ'])
    expect(state).toMatchObject({ phase: 'correct', wrongCount: 0 })
    expect(effects).toEqual(['play_correct', 'submit:0:0'])
  })

  it('點錯一個就算答錯一次並清空', () => {
    const { state, effects } = run([build], ['ㄎ', 'ˇ'])
    expect(state).toMatchObject({ phase: 'asking', wrongCount: 1, picked: [] })
    expect(effects).toEqual(['replay_prompt'])
  })

  it('錯兩次後逐一標示下一個正確的方塊', () => {
    let r = run([build], ['ㄍ', 'ㄍ'])
    expect(r.state).toMatchObject({ phase: 'reveal', correctId: 'ㄎ', picked: [] })
    r = run([build], ['ㄍ', 'ㄍ', 'ㄎ'])
    expect(r.state).toMatchObject({ phase: 'reveal', correctId: 'ㄚ', picked: ['ㄎ'] })
    r = run([build], ['ㄍ', 'ㄍ', 'ㄎ', 'ㄍ', 'ㄚ', 'ˇ'])
    expect(r.state).toMatchObject({ phase: 'correct', wrongCount: 2 })
    expect(r.effects.filter((e) => e.startsWith('submit'))).toEqual(['submit:0:2'])
  })
})
