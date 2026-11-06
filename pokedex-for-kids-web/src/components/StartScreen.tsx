// 開始畫面：純 HTML（量 FCP / LCP 的畫面）。瀏覽器要先點擊才能播放聲音，所以先按「開始」。
import type { Child } from '@/api/types'
import { Avatar } from './Avatar'
import styles from './StartScreen.module.css'

interface Props {
  /** 已登入且有多個小朋友時，顯示頭像讓小朋友選 */
  childList?: Child[]
  loading: boolean
  error?: string
  onStart: () => void
  onPickChild?: (id: string) => void
  onAccount?: () => void
}

export function StartScreen({ childList, loading, error, onStart, onPickChild, onAccount }: Props) {
  const choosing = childList && childList.length > 0 && onPickChild
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>
        注音島
        <small>跟寶可夢一起學注音</small>
      </h1>
      {choosing ? (
        <>
          <p className={styles.ask}>今天誰要玩？</p>
          <ul className={styles.kids}>
            {childList.map((c) => (
              <li key={c.id}>
                <button type="button" className={styles.kid} onClick={() => onPickChild(c.id)}>
                  <Avatar id={c.avatar} size={96} />
                  <span>{c.nickname}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button type="button" className={styles.start} onClick={onStart} disabled={loading}>
          {loading ? '準備中…' : '開始'}
        </button>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p className={styles.credit}>
        注音符號發音：2017 © 教育部，國語注音符號手冊-開放部件（
        <a href="https://creativecommons.org/licenses/by/4.0/deed.zh_TW" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        ）。寶可夢為 Nintendo / Creatures / GAME FREAK 所有，本作品為非營利粉絲作品。
      </p>
      {onAccount && (
        <button type="button" className={`btn ${styles.account}`} onClick={onAccount}>
          家長登入／註冊
        </button>
      )}
    </main>
  )
}
