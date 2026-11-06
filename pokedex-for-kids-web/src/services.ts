// 全站共用的服務：API 用戶端、音訊播放器、靜態內容。
import { createApiClient } from './api/client'
import { createAudioPlayer } from './audio/player'
import { basePath, type Pokemon } from './content/types'
import { useConnection } from './stores/connection'

/** E2E 測試時指定遭遇的寶可夢（只在 NEXT_PUBLIC_E2E=1 的建置有作用） */
export const testHooks = { pokemon: null as number | null }

export const api = createApiClient({
  basePath,
  onPendingChange: (pending) => useConnection.getState().setPending(pending),
  testPokemon: process.env.NEXT_PUBLIC_E2E === '1' ? () => testHooks.pokemon : undefined,
})

export const audio = createAudioPlayer({
  createContext: () => new AudioContext(),
  fetch: (...args) => fetch(...args),
  manifest: () => fetch(`${basePath}/data/audio.json`).then((r) => r.json()),
  basePath,
  onError: (key, err) => console.warn('音檔無法播放', key, err),
})

let contentPromise: Promise<Pokemon[]> | null = null
export function loadContent(): Promise<Pokemon[]> {
  contentPromise ??= fetch(`${basePath}/data/gen1.json`).then((r) => {
    if (!r.ok) throw new Error('無法載入寶可夢資料')
    return r.json()
  })
  return contentPromise
}
