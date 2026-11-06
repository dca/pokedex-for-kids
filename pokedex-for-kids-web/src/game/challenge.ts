// 作答流程的狀態機（US1 驗收 4～6）。題目與答案來自伺服器，這裡只決定畫面怎麼回應小朋友的點選。
import type { Question } from '@/api/types'

export type WrongCount = 0 | 1 | 2

export type ChallengeState =
  | { phase: 'asking'; index: number; wrongCount: 0 | 1; disabled: string[]; picked: string[] }
  | { phase: 'reveal'; index: number; wrongCount: 2; correctId: string; picked: string[] }
  | { phase: 'correct'; index: number; wrongCount: WrongCount }
  | { phase: 'done' }

export type ChallengeInput = { kind: 'select'; optionId: string } | { kind: 'next' }

export type ChallengeEffect =
  | { kind: 'replay_prompt' }
  | { kind: 'reveal' }
  | { kind: 'play_correct' }
  | { kind: 'submit_answer'; index: number; wrongCount: WrongCount }
  | { kind: 'finished' }

const asking = (index: number): ChallengeState => ({ phase: 'asking', index, wrongCount: 0, disabled: [], picked: [] })

export function startChallenge(questions: Question[]): ChallengeState {
  return questions.length === 0 ? { phase: 'done' } : asking(0)
}

/** 單選題只有一個答案；拼音節題要依序點出 answer 中的每個方塊 */
const isSequence = (q: Question) => q.type === 'build_syllable'

export function stepChallenge(
  questions: Question[],
  s: ChallengeState,
  input: ChallengeInput,
): { state: ChallengeState; effects: ChallengeEffect[] } {
  const same = { state: s, effects: [] as ChallengeEffect[] }

  if (input.kind === 'next') {
    if (s.phase !== 'correct') return same
    if (s.index + 1 < questions.length) return { state: asking(s.index + 1), effects: [] }
    return { state: { phase: 'done' }, effects: [{ kind: 'finished' }] }
  }

  if (s.phase !== 'asking' && s.phase !== 'reveal') return same
  const q = questions[s.index]
  const id = input.optionId
  if (!q.options.some((o) => o.id === id)) return same

  const expected = q.answer[s.picked.length]
  const correctDone = (wrongCount: WrongCount) => ({
    state: { phase: 'correct', index: s.index, wrongCount } as ChallengeState,
    effects: [{ kind: 'play_correct' }, { kind: 'submit_answer', index: s.index, wrongCount }] as ChallengeEffect[],
  })

  if (s.phase === 'reveal') {
    if (id !== s.correctId) return same
    const picked = [...s.picked, id]
    if (picked.length === q.answer.length) return correctDone(2)
    return { state: { ...s, picked, correctId: q.answer[picked.length] }, effects: [] }
  }

  if (s.disabled.includes(id)) return same
  if (id === expected) {
    const picked = [...s.picked, id]
    if (picked.length === q.answer.length) return correctDone(s.wrongCount)
    return { state: { ...s, picked }, effects: [] }
  }

  // 答錯
  if (s.wrongCount === 0) {
    const disabled = isSequence(q) ? [] : [id]
    return { state: { phase: 'asking', index: s.index, wrongCount: 1, disabled, picked: [] }, effects: [{ kind: 'replay_prompt' }] }
  }
  return {
    state: { phase: 'reveal', index: s.index, wrongCount: 2, correctId: q.answer[0], picked: [] },
    effects: [{ kind: 'reveal' }],
  }
}
