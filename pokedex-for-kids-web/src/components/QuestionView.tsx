// 題目顯示區：聽音題只有大喇叭；其他題型顯示名稱（橫排或課本式直排）與挖空位置。
import type { Question } from '@/api/types'
import type { ChallengeState } from '@/game/challenge'
import { ZhuyinText } from './ZhuyinText'
import styles from './QuestionView.module.css'

const TONE_MARK: Record<string, string> = { '1': 'ˉ', '2': 'ˊ', '3': 'ˇ', '4': 'ˋ', '5': '˙' }

/** 挖空位置目前要填入的內容：答對後顯示答案；拼音節題顯示已經點對的方塊 */
export function blankFill(q: Question, state: ChallengeState): string[] {
  if (state.phase === 'correct') {
    return q.type === 'fill_tone' ? q.answer.map((a) => TONE_MARK[a] ?? a) : q.answer
  }
  if ((state.phase === 'asking' || state.phase === 'reveal') && q.type === 'build_syllable') return state.picked
  return []
}

interface Props {
  question: Question
  state: ChallengeState
  onSpeak: () => void
}

export function QuestionView({ question: q, state, onSpeak }: Props) {
  const fill = blankFill(q, state)
  const { layout, cells } = q.display

  if (layout === 'none') {
    return (
      <div className={styles.listen}>
        <button type="button" className={styles.bigSpeaker} onClick={onSpeak} aria-label="再聽一次">
          🔊
        </button>
      </div>
    )
  }

  if (layout === 'vertical') {
    return (
      <div className={styles.hanRow}>
        {cells.map((c, i) => {
          const blank = c.blank === 'char'
          const shown = blank ? (fill[0] ?? null) : c.char
          return (
            <div key={i} className={`${styles.han} ${blank ? styles.blank : ''}`}>
              <span className={styles.ch} aria-label={shown ?? '空格'}>
                {shown ?? '？'}
              </span>
              {c.zhuyin && <ZhuyinText zhuyin={c.zhuyin} layout="vertical" />}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.puzzle}>
      {cells.map((c, i) => (
        <div key={i} className={styles.syl}>
          <span className={styles.char}>{c.char}</span>
          {c.zhuyin !== null && c.zhuyin !== undefined && (
            <span className={`${styles.box} ${c.blank !== 'none' ? styles.target : ''}`}>
              <ZhuyinText zhuyin={c.zhuyin} fill={c.blank !== 'none' ? fill : []} />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
