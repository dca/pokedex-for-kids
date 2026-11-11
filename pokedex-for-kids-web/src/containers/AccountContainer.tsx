'use client'
// 帳號頁（US5）：訪客註冊／登入、救援碼、重設密碼、管理小朋友檔案、登出、刪除帳號。
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Child, Me, RegisterResult } from '@/api/types'
import { ApiError } from '@/api/client'
import { CredentialForm, RescueCodeNotice, ResetPasswordForm } from '@/components/auth/AuthForms'
import { ChildForm, DeleteConfirm } from '@/components/ChildForm'
import { Avatar } from '@/components/Avatar'
import { ConnectionOverlay } from '@/components/Overlays'
import { api } from '@/services'
import { useConnection } from '@/stores/connection'
import { useSession } from '@/stores/session'
import styles from './AccountContainer.module.css'

type View =
  | { kind: 'home' }
  | { kind: 'register' }
  | { kind: 'login' }
  | { kind: 'reset' }
  | { kind: 'rescue'; code: string }
  | { kind: 'add-child' }
  | { kind: 'edit-child'; child: Child }
  | { kind: 'delete-child'; child: Child }
  | { kind: 'delete-me' }

const message = (e: unknown) => (e instanceof ApiError ? e.message : '發生錯誤，請稍後再試')

export function AccountContainer() {
  const router = useRouter()
  const pending = useConnection((s) => s.pending)
  const [me, setMeLocal] = useState<Me | null | undefined>(undefined)
  const [view, setView] = useState<View>({ kind: 'home' })
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const update = (next: Me | null) => {
    setMeLocal(next)
    useSession.getState().setMe(next)
    useSession.getState().setChildId(null) // 回到遊戲時重新選小朋友、重新載入進度
  }

  useEffect(() => {
    api.request<Me>('GET', '/me').then(update, () => update(null))
  }, [])

  async function run<T>(fn: () => Promise<T>, after: (r: T) => void) {
    setBusy(true)
    setError(undefined)
    try {
      after(await fn())
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  const go = (v: View) => {
    setError(undefined)
    setView(v)
  }
  const afterCredentials = (r: RegisterResult) => {
    update(r.me)
    go({ kind: 'rescue', code: r.rescueCode })
  }

  if (me === undefined) return <main className={styles.page}>載入中…</main>

  const body = (() => {
    switch (view.kind) {
      case 'register':
        return <CredentialForm mode="register" busy={busy} serverError={error} onSubmit={(v) => run(() => api.request<RegisterResult>('POST', '/auth/register', { username: v.username, password: v.password }), afterCredentials)} />
      case 'login':
        return (
          <CredentialForm
            mode="login"
            guest={me?.isGuest}
            busy={busy}
            serverError={error}
            onSubmit={(v) => run(() => api.request<Me>('POST', '/auth/login', v), (m) => (update(m), go({ kind: 'home' })))}
            extra={
              <button type="button" className={styles.link} onClick={() => go({ kind: 'reset' })}>
                忘記密碼？用救援碼重設
              </button>
            }
          />
        )
      case 'reset':
        return <ResetPasswordForm busy={busy} serverError={error} onSubmit={(v) => run(() => api.request<RegisterResult>('POST', '/auth/reset-password', v), afterCredentials)} />
      case 'rescue':
        return <RescueCodeNotice code={view.code} onDone={() => go({ kind: 'home' })} />
      case 'add-child':
        return <ChildForm withStage busy={busy} submitLabel="建立" onCancel={() => go({ kind: 'home' })} onSubmit={(v) => run(() => api.request('POST', '/children', v), () => api.request<Me>('GET', '/me').then((m) => (update(m), go({ kind: 'home' }))))} />
      case 'edit-child':
        return (
          <ChildForm initial={view.child} withStage={false} busy={busy} submitLabel="儲存" onCancel={() => go({ kind: 'home' })}
            onSubmit={(v) => run(() => api.request('PATCH', `/children/${view.child.id}`, { nickname: v.nickname, avatar: v.avatar }), () => api.request<Me>('GET', '/me').then((m) => (update(m), go({ kind: 'home' }))))} />
        )
      case 'delete-child':
        return <DeleteConfirm what={`「${view.child.nickname}」`} serverError={error} onCancel={() => go({ kind: 'home' })}
          onConfirm={(password) => run(() => api.request('DELETE', `/children/${view.child.id}`, { password }), () => api.request<Me>('GET', '/me').then((m) => (update(m), go({ kind: 'home' }))))} />
      case 'delete-me':
        return <DeleteConfirm what="整個帳號" serverError={error} onCancel={() => go({ kind: 'home' })} onConfirm={(password) => run(() => api.request('DELETE', '/me', { password }), () => (update(null), go({ kind: 'home' })))} />
    }
    return <Home me={me} go={go} onLogout={() => run(() => api.request('POST', '/auth/logout'), () => update(null))} />
  })()

  return (
    <main className={styles.page}>
      <div className={`panel ${styles.card}`}>
        <div className={styles.top}>
          <button type="button" className="btn" onClick={() => (view.kind === 'home' ? router.push('/') : go({ kind: 'home' }))}>
            {view.kind === 'home' ? '← 回到遊戲' : '← 返回'}
          </button>
        </div>
        {body}
      </div>
      <ConnectionOverlay visible={pending} />
    </main>
  )
}

function Home({ me, go, onLogout }: { me: Me | null; go: (v: View) => void; onLogout: () => void }) {
  const registered = me && !me.isGuest
  return (
    <section className={styles.home}>
      <h1>{registered ? `家長帳號：${me.username}` : '家長帳號'}</h1>
      {!registered && <p className={styles.note}>{me ? '現在是訪客。註冊帳號後，換裝置也能接著玩，進度不會不見。' : '登入或註冊帳號，就能在任何裝置接著玩。'}</p>}
      {!registered && (
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => go({ kind: 'register' })}>
            註冊（保存進度）
          </button>
          <button type="button" className="btn" onClick={() => go({ kind: 'login' })}>
            登入
          </button>
        </div>
      )}
      {me && (
        <>
          <h2>小朋友</h2>
          <ul className={styles.kids}>
            {me.children.map((c) => (
              <li key={c.id} className={styles.kid}>
                <Avatar id={c.avatar} size={56} />
                <span className={styles.name}>{c.nickname}</span>
                <button type="button" className="btn" onClick={() => go({ kind: 'edit-child', child: c })}>
                  修改
                </button>
                {registered && (
                  <button type="button" className="btn" onClick={() => go({ kind: 'delete-child', child: c })}>
                    刪除
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="btn" onClick={() => go({ kind: 'add-child' })}>
            ＋ 新增小朋友
          </button>
        </>
      )}
      {registered && (
        <div className={`btn-row ${styles.bottom}`}>
          <button type="button" className="btn" onClick={onLogout}>
            登出
          </button>
          <button type="button" className="btn" onClick={() => go({ kind: 'delete-me' })}>
            刪除帳號
          </button>
        </div>
      )}
    </section>
  )
}
