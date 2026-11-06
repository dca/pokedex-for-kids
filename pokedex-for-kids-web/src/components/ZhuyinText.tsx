// 注音顯示：依分類上色（FR-015），支援橫排、課本式直排（FR-013）與挖空「＿」。
import { categoryOf } from '@/game/zhuyin'
import styles from './ZhuyinText.module.css'

const BLANK = '＿'
const TONE_MARKS = new Set(['ˊ', 'ˇ', 'ˋ', '˙'])

interface Props {
  zhuyin: string
  layout?: 'horizontal' | 'vertical'
  /** 挖空格要顯示的內容（答對後填入） */
  fill?: string[]
}

function Sym({ s, fill }: { s: string; fill?: string }) {
  if (s === BLANK) {
    return (
      <span className={`${styles.slot} ${fill ? styles.filled : ''}`} aria-label={fill ? undefined : '空格'}>
        {fill ? <span className={`t-${categoryOf(fill)}`}>{fill}</span> : null}
      </span>
    )
  }
  return <span className={`t-${categoryOf(s)}`}>{s}</span>
}

export function ZhuyinText({ zhuyin, layout = 'horizontal', fill = [] }: Props) {
  const chars = [...zhuyin]
  let blankIndex = 0
  const items = chars.map((s, i) => {
    const f = s === BLANK ? fill[blankIndex++] : undefined
    return { s, f, key: i }
  })

  if (layout === 'horizontal') {
    return (
      <span className={styles.row} aria-label={zhuyin.replaceAll(BLANK, '空格')}>
        {items.map(({ s, f, key }) => (
          <Sym key={key} s={s} fill={f} />
        ))}
      </span>
    )
  }

  // 直排：符號由上往下，二三四聲在右側中間，輕聲在最上方
  const tone = items.find(({ s }) => TONE_MARKS.has(s))
  const body = items.filter((x) => x !== tone)
  return (
    <span className={styles.col} aria-label={zhuyin.replaceAll(BLANK, '空格')}>
      {tone?.s === '˙' && (
        <span className={styles.neutral}>
          <Sym s={tone.s} />
        </span>
      )}
      {body.map(({ s, f, key }) => (
        <span key={key} className={styles.cell}>
          <Sym s={s} fill={f} />
        </span>
      ))}
      {tone && tone.s !== '˙' && (
        <span className={styles.tone}>
          <Sym s={tone.s} />
        </span>
      )}
    </span>
  )
}
