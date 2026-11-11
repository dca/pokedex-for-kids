// 挑戰面板：從畫面下方滑出，顯示題目、重聽按鈕與選項（US1）。只透過 props 接收資料。
import type { Question } from '@/api/types'
import type { ChallengeState } from '@/game/challenge'
import prompts from '../../data/audio/prompts.json'
import { OptionCard, type OptionState } from './OptionCard'
import { QuestionView } from './QuestionView'
import styles from './ChallengeSheet.module.css'

const PROMPT_KEY: Record<Question['type'], keyof typeof prompts> = {
  listen_symbol: 'listen-symbol',
  first_sound: 'first-sound',
  listen_tone: 'listen-tone',
  fill_symbol: 'fill-symbol',
  fill_tone: 'fill-tone',
  build_syllable: 'build-syllable',
  listen_name: 'listen-name',
  zhuyin_to_char: 'zhuyin-to-char',
  fill_char: 'fill-char',
}

export function promptText(q: Question): string {
  const text = q.prompt.find((p) => p.kind === 'text')?.text
  return text ?? prompts[PROMPT_KEY[q.type]]
}

function optionState(q: Question, s: ChallengeState, id: string): OptionState {
  if (s.phase === 'correct') return q.answer.includes(id) ? 'correct' : 'disabled'
  if (s.phase === 'reveal') {
    if (s.picked.includes(id)) return 'picked'
    return id === s.correctId ? 'reveal' : 'normal'
  }
  if (s.phase === 'asking') {
    if (s.disabled.includes(id)) return 'disabled'
    if (s.picked.includes(id)) return 'picked'
  }
  return 'normal'
}

const FEEDBACK: Partial<Record<ChallengeState['phase'], string>> = {
  reveal: prompts['look-here'],
  correct: prompts.great,
}

interface Props {
  question: Question
  state: ChallengeState
  index: number
  total: number
  stageLabel: string
  onSelect: (id: string) => void
  onSpeak: () => void
}

export function ChallengeSheet({ question, state, index, total, stageLabel, onSelect, onSpeak }: Props) {
  const feedback = state.phase === 'asking' && state.wrongCount === 1 ? prompts['try-again'] : (FEEDBACK[state.phase] ?? '')
  const fallbackTab = question.type === 'listen_name' ? '名字' : '漢字'
  return (
    <section className={styles.sheet} aria-label="挑戰" aria-live="polite">
      <div className={styles.prompt}>
        <button type="button" className={styles.speak} onClick={onSpeak} aria-label="再聽一次題目">
          🔊
        </button>
        <p className={styles.text}>{promptText(question)}</p>
        <span className={styles.chip}>
          {stageLabel}
          {total > 1 && ` ${index + 1}／${total}`}
        </span>
      </div>
      <QuestionView question={question} state={state} onSpeak={onSpeak} />
      <div className={styles.options} role="group" aria-label="選項">
        {question.options.map((o) => (
          <OptionCard key={o.id} option={o} state={optionState(question, state, o.id)} fallbackTab={fallbackTab} onSelect={onSelect} />
        ))}
      </div>
      <p className={styles.feedback}>{feedback}</p>
    </section>
  )
}
