// 音訊播放：以 Web Audio 解碼並快取音檔，依序播放題目片段。
// 平板與手機要在使用者第一次點擊時呼叫 unlock()，之後才能播放聲音。

export interface AudioDeps {
  createContext: () => AudioContext
  fetch: typeof fetch
  manifest: () => Promise<Record<string, string>>
  basePath?: string
  onError?: (key: string, err: unknown) => void
}

export function createAudioPlayer(deps: AudioDeps) {
  let ctx: AudioContext | null = null
  let manifest: Record<string, string> | null = null
  const buffers = new Map<string, Promise<AudioBuffer | null>>()
  let current: AudioBufferSourceNode | null = null
  let generation = 0

  const context = () => (ctx ??= deps.createContext())

  async function urlOf(key: string): Promise<string | null> {
    manifest ??= await deps.manifest()
    const path = manifest[key]
    return path ? (deps.basePath ?? '') + path : null
  }

  function load(key: string): Promise<AudioBuffer | null> {
    let p = buffers.get(key)
    if (!p) {
      p = (async () => {
        try {
          const url = await urlOf(key)
          if (!url) throw new Error(`沒有音檔：${key}`)
          const res = await deps.fetch(url)
          if (!res.ok) throw new Error(`下載失敗 ${res.status}`)
          return await context().decodeAudioData(await res.arrayBuffer())
        } catch (err) {
          buffers.delete(key) // 下次再試
          deps.onError?.(key, err)
          return null
        }
      })()
      buffers.set(key, p)
    }
    return p
  }

  function playBuffer(buf: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      const src = context().createBufferSource()
      src.buffer = buf
      src.connect(context().destination)
      src.onended = () => resolve()
      current = src
      src.start()
    })
  }

  return {
    /** 預先下載（例如目前區域會用到的音檔） */
    preload(keys: string[]) {
      keys.forEach((k) => void load(k))
    },
    /** 依序播放；新的序列會中斷舊的序列；載入失敗的片段直接略過 */
    async playSequence(keys: string[]): Promise<void> {
      const mine = ++generation
      this.stop(false)
      for (const key of keys) {
        const buf = await load(key)
        if (mine !== generation) return
        if (buf) await playBuffer(buf)
        if (mine !== generation) return
      }
    },
    stop(bump = true) {
      if (bump) generation++
      try {
        current?.stop()
      } catch {
        // 已經停止
      }
      current = null
    },
    /** 第一次點擊時呼叫：恢復 AudioContext（iOS Safari 需要） */
    async unlock() {
      const c = context()
      if (c.state === 'suspended') await c.resume()
      const silent = c.createBuffer(1, 1, 22050)
      const src = c.createBufferSource()
      src.buffer = silent
      src.connect(c.destination)
      src.start()
    },
  }
}

export type AudioPlayer = ReturnType<typeof createAudioPlayer>
