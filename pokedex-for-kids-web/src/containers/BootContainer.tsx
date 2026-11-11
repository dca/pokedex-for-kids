'use client'
// 開機流程：按「開始」→ 解鎖聲音 → 取得（或建立）訪客 session → 選小朋友 → 載入進度 → 進入遊戲。
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChildState, Me } from '@/api/types'
import { StartScreen } from '@/components/StartScreen'
import { api, audio, loadContent } from '@/services'
import { lastChildId, useSession } from '@/stores/session'
import { ApiError } from '@/api/client'

// 3D 場景較大，按下「開始」後才載入（research R9）
const GameContainer = dynamic(() => import('./GameContainer'), { ssr: false })

export function BootContainer() {
  const router = useRouter()
  const { me, childId, child, setMe, setChildId, setChild, setPokemon } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  async function enter(id: string) {
    setLoading(true)
    try {
      setChildId(id)
      setChild(await api.request<ChildState>('GET', `/children/${id}/state`))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '無法載入進度，請稍後再試')
      setChildId(null)
    } finally {
      setLoading(false)
    }
  }

  async function start() {
    setLoading(true)
    setError(undefined)
    void audio.unlock()
    void audio.playSequence(['prompt:start'])
    try {
      const [account, list] = await Promise.all([api.request<Me>('POST', '/auth/guest'), loadContent()])
      setPokemon(list)
      setMe(account)
      if (account.children.length === 0) {
        router.push('/account')
        return
      }
      const remembered = account.children.find((c) => c.id === lastChildId())
      if (account.children.length === 1 || (account.isGuest && remembered)) await enter((remembered ?? account.children[0]).id)
      else setLoading(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '連不上伺服器，請稍後再試')
      setLoading(false)
    }
  }

  if (childId && child) return <GameContainer />
  return (
    <StartScreen
      loading={loading}
      error={error}
      onStart={start}
      childList={me && me.children.length > 1 ? me.children : undefined}
      onPickChild={(id) => void enter(id)}
      onAccount={() => router.push('/account')}
    />
  )
}
