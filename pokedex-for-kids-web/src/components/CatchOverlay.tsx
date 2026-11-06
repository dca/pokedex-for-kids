// 收服畫面：精靈球搖晃後出現寶可夢、名稱、注音與星星（US1 驗收 6）。
import { useEffect, useState } from 'react'
import type { Pokemon } from '@/content/types'
import { stickerUrl } from '@/content/types'
import { ZhuyinText } from './ZhuyinText'
import styles from './CatchOverlay.module.css'

interface Props {
  pokemon: Pokemon
  stars: number
  newlyCaught: boolean
  reducedMotion: boolean
  onContinue: () => void
  onOpenBook: () => void
}

export function CatchOverlay({ pokemon, stars, newlyCaught, reducedMotion, onContinue, onOpenBook }: Props) {
  const [opened, setOpened] = useState(reducedMotion)
  useEffect(() => {
    if (opened) return
    const t = setTimeout(() => setOpened(true), 1600)
    return () => clearTimeout(t)
  }, [opened])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`收服了${pokemon.name}`}>
      <div className={`panel ${styles.card}`}>
        {opened ? (
          <img className={styles.sticker} src={stickerUrl(pokemon.id)} alt={pokemon.name} />
        ) : (
          <div className={styles.ball} aria-label="精靈球" />
        )}
        <h2 className={styles.title}>收服了{pokemon.name}！</h2>
        {newlyCaught && <p className={styles.new}>新的寶可夢！</p>}
        <p className={styles.zy}>
          {pokemon.syllables.map((s, i) => (
            <span key={i} className={styles.syl}>
              {s.isHan ? <ZhuyinText zhuyin={s.zhuyin} /> : s.char}
            </span>
          ))}
        </p>
        <p className={styles.rating} aria-label={`${stars} 顆星`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? '' : styles.off} aria-hidden>
              ⭐
            </span>
          ))}
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={onContinue}>
            繼續探索
          </button>
          <button type="button" className="btn primary" onClick={onOpenBook}>
            打開收集冊
          </button>
        </div>
      </div>
    </div>
  )
}
