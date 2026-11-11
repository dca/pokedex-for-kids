// 家長用的帳號表單：註冊、登入、用救援碼重設密碼、顯示救援碼。欄位驗證與伺服器規則一致（openapi.yaml）。
import { useState, type FormEvent, type ReactNode } from 'react'
import { z } from 'zod'
import styles from './AuthForms.module.css'

export const usernameSchema = z
  .string()
  .min(3, '帳號名稱至少 3 個字元')
  .max(20, '帳號名稱最多 20 個字元')
  .regex(/^[A-Za-z0-9_]+$/, '帳號名稱只能用英文字母、數字和底線')
export const passwordSchema = z.string().min(8, '密碼至少 8 個字元').max(128, '密碼太長了')

type Errors = Record<string, string | undefined>

function Field(props: { label: string; name: string; type?: string; value: string; error?: string; onChange: (v: string) => void; autoComplete?: string }) {
  const id = `f-${props.name}`
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        name={props.name}
        type={props.type ?? 'text'}
        value={props.value}
        autoComplete={props.autoComplete}
        autoCapitalize="off"
        aria-invalid={!!props.error}
        aria-describedby={props.error ? `${id}-err` : undefined}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.error && (
        <span id={`${id}-err`} className={styles.error} role="alert">
          {props.error}
        </span>
      )}
    </div>
  )
}

interface CredentialProps {
  mode: 'register' | 'login'
  /** 目前是訪客時，登入可以選擇帶入訪客的小朋友 */
  guest?: boolean
  serverError?: string
  busy?: boolean
  onSubmit: (v: { username: string; password: string; bringGuestChildren: boolean }) => void
  extra?: ReactNode
}

export function CredentialForm({ mode, guest, serverError, busy, onSubmit, extra }: CredentialProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [bring, setBring] = useState(true)
  const [errors, setErrors] = useState<Errors>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {
      username: usernameSchema.safeParse(username).error?.issues[0]?.message,
      password: mode === 'register' ? passwordSchema.safeParse(password).error?.issues[0]?.message : password ? undefined : '請輸入密碼',
    }
    setErrors(next)
    if (!next.username && !next.password) onSubmit({ username, password, bringGuestChildren: bring })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-label={mode === 'register' ? '註冊' : '登入'}>
      <Field label="帳號名稱" name="username" value={username} error={errors.username} onChange={setUsername} autoComplete="username" />
      <Field
        label="密碼"
        name="password"
        type="password"
        value={password}
        error={errors.password}
        onChange={setPassword}
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
      />
      {mode === 'login' && guest && (
        <label className={styles.check}>
          <input type="checkbox" checked={bring} onChange={(e) => setBring(e.target.checked)} />
          把現在這台裝置上訪客的進度帶進這個帳號
        </label>
      )}
      {serverError && (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      )}
      <button type="submit" className="btn primary" disabled={busy}>
        {mode === 'register' ? '註冊' : '登入'}
      </button>
      {extra}
    </form>
  )
}

export function ResetPasswordForm({ serverError, busy, onSubmit }: { serverError?: string; busy?: boolean; onSubmit: (v: { username: string; rescueCode: string; newPassword: string }) => void }) {
  const [username, setUsername] = useState('')
  const [rescueCode, setRescueCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {
      username: usernameSchema.safeParse(username).error?.issues[0]?.message,
      rescueCode: rescueCode.replace(/[-\s]/g, '').length === 16 ? undefined : '救援碼是 16 個字元',
      newPassword: passwordSchema.safeParse(newPassword).error?.issues[0]?.message,
    }
    setErrors(next)
    if (!next.username && !next.rescueCode && !next.newPassword) onSubmit({ username, rescueCode, newPassword })
  }
  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-label="重設密碼">
      <Field label="帳號名稱" name="username" value={username} error={errors.username} onChange={setUsername} autoComplete="username" />
      <Field label="救援碼" name="rescueCode" value={rescueCode} error={errors.rescueCode} onChange={setRescueCode} />
      <Field label="新密碼" name="newPassword" type="password" value={newPassword} error={errors.newPassword} onChange={setNewPassword} autoComplete="new-password" />
      {serverError && (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      )}
      <button type="submit" className="btn primary" disabled={busy}>
        重設密碼
      </button>
    </form>
  )
}

/** 救援碼只顯示這一次：家長確認已保存才能繼續（US5 驗收 2） */
export function RescueCodeNotice({ code, onDone }: { code: string; onDone: () => void }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className={styles.rescue} role="dialog" aria-modal="true" aria-label="救援碼">
      <h2>請保存這組救援碼</h2>
      <p>忘記密碼時，可以用它重設密碼。救援碼只會顯示這一次。</p>
      <p className={styles.code} data-testid="rescue-code">
        {code}
      </p>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => void navigator.clipboard?.writeText(code)}>
          複製
        </button>
        <button type="button" className="btn" onClick={() => window.print()}>
          列印
        </button>
      </div>
      <label className={styles.check}>
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        我已經把救援碼存好了
      </label>
      <button type="button" className="btn primary" disabled={!saved} onClick={onDone}>
        我已保存，繼續
      </button>
    </div>
  )
}
