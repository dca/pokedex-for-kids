// 小朋友檔案：暱稱、頭像、起始階段（取代家長區，research R7）。不需要其他個人資料。
import { useState, type FormEvent } from 'react'
import type { Stage } from '@/api/types'
import { Avatar, AVATAR_IDS } from './Avatar'
import styles from './ChildForm.module.css'

const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: 'learn', label: '🌱 學注音', hint: '大班：從認識注音符號開始' },
  { id: 'spell', label: '🌿 拼注音', hint: '一年級：直接開放前三區' },
  { id: 'read', label: '🌳 認字', hint: '二、三年級：四區全部開放' },
]

interface Props {
  initial?: { nickname: string; avatar: string }
  /** 編輯既有檔案時不能改起始階段 */
  withStage: boolean
  busy?: boolean
  submitLabel: string
  onSubmit: (v: { nickname: string; avatar: string; startStage: Stage }) => void
  onCancel: () => void
}

export function ChildForm({ initial, withStage, busy, submitLabel, onSubmit, onCancel }: Props) {
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATAR_IDS[0])
  const [stage, setStage] = useState<Stage>('learn')
  const [error, setError] = useState<string>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = nickname.trim()
    if (name.length < 1 || name.length > 10) return setError('暱稱要 1～10 個字')
    onSubmit({ nickname: name, avatar, startStage: stage })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-label="小朋友檔案">
      <label className={styles.label} htmlFor="nickname">
        暱稱（不用填真實姓名）
      </label>
      <input id="nickname" className={styles.input} value={nickname} maxLength={10} onChange={(e) => setNickname(e.target.value)} aria-invalid={!!error} />
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
      <fieldset className={styles.set}>
        <legend>頭像</legend>
        <div className={styles.avatars}>
          {AVATAR_IDS.map((id) => (
            <button key={id} type="button" className={`${styles.avatar} ${avatar === id ? styles.on : ''}`} aria-pressed={avatar === id} aria-label={`頭像 ${id.slice(-2)}`} onClick={() => setAvatar(id)}>
              <Avatar id={id} size={56} />
            </button>
          ))}
        </div>
      </fieldset>
      {withStage && (
        <fieldset className={styles.set}>
          <legend>從哪裡開始</legend>
          {STAGES.map((s) => (
            <label key={s.id} className={styles.stage}>
              <input type="radio" name="stage" value={s.id} checked={stage === s.id} onChange={() => setStage(s.id)} />
              <span>
                {s.label}
                <small>{s.hint}</small>
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="btn-row">
        <button type="submit" className="btn primary" disabled={busy}>
          {submitLabel}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  )
}

/** 刪除前再輸入一次密碼（FR-062），並說明進度會一起刪除 */
export function DeleteConfirm({ what, serverError, onConfirm, onCancel }: { what: string; serverError?: string; onConfirm: (password: string) => void; onCancel: () => void }) {
  const [password, setPassword] = useState('')
  return (
    <form
      className={styles.form}
      aria-label="確認刪除"
      onSubmit={(e) => {
        e.preventDefault()
        onConfirm(password)
      }}
    >
      <p className={styles.warn}>確定要刪除{what}嗎？所有進度都會一起刪除，而且無法復原。</p>
      <label className={styles.label} htmlFor="del-pw">
        請輸入密碼確認
      </label>
      <input id="del-pw" className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      {serverError && (
        <span className={styles.error} role="alert">
          {serverError}
        </span>
      )}
      <div className="btn-row">
        <button type="submit" className="btn" style={{ background: 'var(--tone)', color: '#fff' }} disabled={!password}>
          刪除
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  )
}
