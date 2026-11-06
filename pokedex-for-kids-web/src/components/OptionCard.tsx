// 選項字卡：上方是分類色條，至少 80px（FR-081），以鍵盤也能操作。
import type { Option } from '@/api/types'
import styles from './OptionCard.module.css'

export type OptionState = 'normal' | 'disabled' | 'reveal' | 'correct' | 'picked'

const TAB_LABEL: Record<string, string> = { initial: '聲母', medial: '介音', final: '韻母', tone: '聲調' }

interface Props {
  option: Option
  state: OptionState
  /** 沒有分類時（字、名稱）用的標籤 */
  fallbackTab?: string
  onSelect: (id: string) => void
}

export function OptionCard({ option, state, fallbackTab = '漢字', onSelect }: Props) {
  const cat = option.category
  const tab = cat ? TAB_LABEL[cat] : fallbackTab
  const isName = option.label.length > 1 && !cat
  const label = state === 'reveal' ? `${option.label}，答案在這裡` : option.label
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[state]} ${isName ? styles.name : ''}`}
      aria-label={label}
      aria-disabled={state === 'disabled'}
      disabled={state === 'disabled' || state === 'picked'}
      onClick={() => onSelect(option.id)}
    >
      <span className={`${styles.tab} ${cat ? `c-${cat}` : 'c-han'}`} aria-hidden>
        {tab}
      </span>
      <span className={`${styles.face} ${cat ? `t-${cat}` : ''}`} aria-hidden>
        {option.label}
      </span>
    </button>
  )
}
