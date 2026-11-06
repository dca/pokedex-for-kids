import { createAudioPlayer } from '@/audio/player'

/** 模擬的 AudioContext：每個 source 開始播放後，由測試呼叫 finish() 結束 */
function fakeContext() {
  const played: string[] = []
  const sources: { name: string; onended: (() => void) | null; stopped: boolean }[] = []
  const ctx = {
    state: 'suspended',
    destination: {},
    resume: jest.fn(async () => {
      ctx.state = 'running'
    }),
    decodeAudioData: jest.fn(async (buf: { url: string }) => ({ name: buf.url })),
    createBuffer: jest.fn(() => ({ name: 'silent' })),
    createBufferSource: jest.fn(() => {
      const s = {
        buffer: null as { name: string } | null,
        onended: null as (() => void) | null,
        stopped: false,
        connect: jest.fn(),
        start: jest.fn(() => {
          played.push(s.buffer!.name)
          sources.push({ name: s.buffer!.name, onended: s.onended, stopped: false })
        }),
        stop: jest.fn(() => {
          s.stopped = true
        }),
      }
      return s
    }),
  }
  const finish = () => sources.at(-1)?.onended?.()
  return { ctx, played, finish }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

function setup(failing: string[] = []) {
  const f = fakeContext()
  const fetchFn = jest.fn(async (url: string) => {
    if (failing.some((k) => url.includes(k))) return { ok: false, status: 404 } as Response
    return { ok: true, status: 200, arrayBuffer: async () => ({ url }) } as unknown as Response
  })
  const onError = jest.fn()
  const player = createAudioPlayer({
    createContext: () => f.ctx as unknown as AudioContext,
    fetch: fetchFn as unknown as typeof fetch,
    manifest: async () => ({ a: '/a.mp3', b: '/b.mp3', c: '/c.mp3' }),
    basePath: '/base',
    onError,
  })
  return { ...f, player, fetchFn, onError }
}

describe('audio player', () => {
  it('依序播放，前一段結束才播下一段', async () => {
    const { player, played, finish } = setup()
    const done = player.playSequence(['a', 'b'])
    await flush()
    expect(played).toEqual(['/base/a.mp3'])
    finish()
    await flush()
    expect(played).toEqual(['/base/a.mp3', '/base/b.mp3'])
    finish()
    await done
  })

  it('新的序列會中斷舊的序列', async () => {
    const { player, played, finish } = setup()
    void player.playSequence(['a', 'b'])
    await flush()
    void player.playSequence(['c'])
    await flush()
    finish()
    await flush()
    expect(played).toEqual(['/base/a.mp3', '/base/c.mp3'])
  })

  it('載入失敗的片段略過並回報，不會卡住', async () => {
    const { player, played, finish, onError } = setup(['b.mp3'])
    const done = player.playSequence(['b', 'c', 'missing'])
    await flush()
    expect(played).toEqual(['/base/c.mp3'])
    finish()
    await done
    expect(onError).toHaveBeenCalledTimes(2)
  })

  it('同一個音檔只下載一次', async () => {
    const { player, fetchFn, finish } = setup()
    player.preload(['a', 'a'])
    const done = player.playSequence(['a'])
    await flush()
    finish()
    await done
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('unlock 恢復 AudioContext', async () => {
    const { player, ctx } = setup()
    await player.unlock()
    expect(ctx.resume).toHaveBeenCalled()
    expect(ctx.state).toBe('running')
  })
})
