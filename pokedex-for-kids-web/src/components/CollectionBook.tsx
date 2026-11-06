// 收集冊（FR-042）：151 格；未收服顯示剪影與「？？？」，三星收服有金框；點選可重聽中英文名稱。
import { useState } from 'react'
import type { Pokemon } from '@/content/types'
import { stickerUrl } from '@/content/types'
import { ZhuyinText } from './ZhuyinText'
import styles from './CollectionBook.module.css'

interface Props {
  pokemon: Pokemon[]
  caught: Map<number, number> // 寶可夢 → 最佳星星
  allCaught: boolean
  onPlay: (id: number, lang: 'zh' | 'en') => void
  onClose: () => void
}

export function CollectionBook({ pokemon, caught, allCaught, onPlay, onClose }: Props) {
  const [detail, setDetail] = useState<Pokemon | null>(null)
  const count = caught.size
  return (
    <section className={`${styles.book} ${allCaught ? styles.complete : ''}`} role="dialog" aria-modal="true" aria-label="我的收集冊">
      <div className={styles.head}>
        <h2>{allCaught ? '🏆 收集冊完成了！' : '我的收集冊'}</h2>
        <span className={styles.count}>
          已收集 {count} ／ {pokemon.length}
        </span>
        <button type="button" className="round-btn" onClick={onClose} aria-label="關閉收集冊">
          ✕
        </button>
      </div>
      <div className={styles.progress} aria-hidden>
        <i style={{ width: `${(count / pokemon.length) * 100}%` }} />
      </div>
      <ul className={styles.grid}>
        {pokemon.map((p) => {
          const stars = caught.get(p.id)
          const got = stars !== undefined
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`${styles.slot} ${got ? '' : styles.unknown} ${stars === 3 ? styles.gold : ''}`}
                disabled={!got}
                onClick={() => got && setDetail(p)}
                aria-label={got ? `${p.name}，${stars} 顆星` : `第 ${p.id} 號，還沒收服`}
              >
                <span className={styles.no}>#{String(p.id).padStart(3, '0')}</span>
                <img src={stickerUrl(p.id)} alt="" loading="lazy" />
                <span className={styles.nm}>{got ? p.name : '？？？'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {detail && <Detail p={detail} stars={caught.get(detail.id) ?? 0} onPlay={onPlay} onClose={() => setDetail(null)} />}
    </section>
  )
}

function Detail({ p, stars, onPlay, onClose }: { p: Pokemon; stars: number; onPlay: Props['onPlay']; onClose: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={p.name}>
      <div className={`panel ${styles.detail}`}>
        <img src={stickerUrl(p.id)} alt={p.name} />
        <h3>{p.name}</h3>
        <p className={styles.zy}>
          {p.syllables.map((s, i) => (
            <span key={i}>{s.isHan ? <ZhuyinText zhuyin={s.zhuyin} /> : s.char}</span>
          ))}
        </p>
        <p className={styles.en}>{p.en}</p>
        <p aria-label={`${stars} 顆星`}>{'⭐'.repeat(stars)}</p>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => onPlay(p.id, 'zh')}>
            🔊 中文
          </button>
          <button type="button" className="btn" onClick={() => onPlay(p.id, 'en')}>
            🔊 English
          </button>
          <button type="button" className="btn" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  )
}
