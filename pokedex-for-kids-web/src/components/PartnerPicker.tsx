// 夥伴三選一（FR-040）：點一下聽名字，再點「就是你了」確認。
import { useState } from 'react'
import prompts from '../../data/audio/prompts.json'
import type { Pokemon } from '@/content/types'
import { stickerUrl } from '@/content/types'
import styles from './PartnerPicker.module.css'

interface Props {
  starters: Pokemon[]
  onPreview: (id: number) => void
  onConfirm: (id: number) => void
  busy?: boolean
}

export function PartnerPicker({ starters, onPreview, onConfirm, busy }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="選擇夥伴">
      <div className={`panel ${styles.card}`}>
        <h2 className={styles.title}>{prompts['partner-pick']}</h2>
        <div className={styles.row}>
          {starters.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.choice} ${picked === p.id ? styles.on : ''}`}
              aria-pressed={picked === p.id}
              onClick={() => {
                setPicked(p.id)
                onPreview(p.id)
              }}
            >
              <img src={stickerUrl(p.id)} alt="" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="btn primary" disabled={picked === null || busy} onClick={() => picked && onConfirm(picked)}>
            就是你了！
          </button>
        </div>
      </div>
    </div>
  )
}
