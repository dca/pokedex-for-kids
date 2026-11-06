// 遊戲中的上方資訊列：小朋友、收集數、目前區域；右上是收集冊與帳號按鈕。
import { Avatar } from './Avatar'
import styles from './Hud.module.css'

interface Props {
  nickname: string
  avatar: string
  caughtCount: number
  zoneName: string
  badges: number
  hint?: string
  onBook: () => void
  onAccount: () => void
}

export function Hud({ nickname, avatar, caughtCount, zoneName, badges, hint, onBook, onAccount }: Props) {
  return (
    <>
      <header className={styles.hud}>
        <div className={styles.profile}>
          <Avatar id={avatar} size={52} />
          <span className={styles.name}>{nickname}</span>
          <span className={styles.meta} aria-label={`已收集 ${caughtCount} 隻，徽章 ${badges} 個`}>
            📒 {caughtCount}　🏅 {badges}
          </span>
        </div>
        <span className={styles.zone}>{zoneName}</span>
        <div className={styles.actions}>
          <button type="button" className="round-btn" onClick={onBook} aria-label="打開收集冊">
            📖
          </button>
          <button type="button" className="round-btn" onClick={onAccount} aria-label="帳號與小朋友">
            👤
          </button>
        </div>
      </header>
      {hint && (
        <p className={styles.hint} role="status">
          {hint}
        </p>
      )}
    </>
  )
}
