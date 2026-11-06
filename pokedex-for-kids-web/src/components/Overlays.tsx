// 小型的提示畫面：連線中、遭遇橫幅、道館結果、新區域開放、進化。
import type { ReactNode } from 'react'
import prompts from '../../data/audio/prompts.json'
import type { Pokemon } from '@/content/types'
import { stickerUrl } from '@/content/types'
import styles from './Overlays.module.css'

export function ConnectionOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className={styles.connecting} role="status" aria-live="assertive">
      <span className={styles.spinner} aria-hidden />
      {prompts.connecting}
    </div>
  )
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <div className={styles.banner} role="status">
      {children}
    </div>
  )
}

interface GymResultProps {
  zoneName: string
  correctCount: number
  passed: boolean
  badgeEarned: boolean
  onClose: () => void
}

export function GymResult({ zoneName, correctCount, passed, badgeEarned, onClose }: GymResultProps) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="道館挑戰結果">
      <div className={`panel ${styles.card}`}>
        <div className={styles.badge} aria-hidden>
          {passed ? '🏅' : '💪'}
        </div>
        <h2 className={styles.title}>{passed ? `${zoneName}道館挑戰成功！` : prompts['gym-retry']}</h2>
        <p className={styles.text}>答對 {correctCount} ／ 10 題</p>
        {badgeEarned && <p className={styles.text}>{prompts['gym-pass']}</p>}
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={onClose}>
            繼續探索
          </button>
        </div>
      </div>
    </div>
  )
}

interface NoticeProps {
  title: string
  pokemon?: Pokemon
  onClose: () => void
}

/** 新區域開放、夥伴進化的通知 */
export function Notice({ title, pokemon, onClose }: NoticeProps) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`panel ${styles.card}`}>
        {pokemon ? <img className={styles.sticker} src={stickerUrl(pokemon.id)} alt={pokemon.name} /> : <div className={styles.badge}>🗺️</div>}
        <h2 className={styles.title}>{title}</h2>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={onClose}>
            好
          </button>
        </div>
      </div>
    </div>
  )
}
