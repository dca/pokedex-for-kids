import { createApiClient, ApiError } from '@/api/client'

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) } as Response
}

describe('api client', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('帶 credentials 與 JSON content type，路徑加上 /api/v1', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    const api = createApiClient({ fetch: fetchFn, basePath: '/game' })
    await expect(api.request('POST', '/auth/guest')).resolves.toEqual({ ok: true })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('/game/api/v1/auth/guest')
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
  })

  it('204 回傳 undefined', async () => {
    const api = createApiClient({ fetch: jest.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null } as Response) })
    await expect(api.request('PUT', '/x', { a: 1 })).resolves.toBeUndefined()
  })

  it('4xx 不重試，轉成帶有正體中文訊息的 ApiError', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(409, { code: 'username_taken', message: '這個帳號名稱已經有人使用，請換一個' }))
    const api = createApiClient({ fetch: fetchFn })
    const err = await api.request('POST', '/auth/register', {}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 409, code: 'username_taken', message: '這個帳號名稱已經有人使用，請換一個' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('網路錯誤與 5xx 依 1、2、4 秒重試，期間 pending 為 true', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(502, {}))
      .mockResolvedValueOnce(jsonResponse(200, { done: 1 }))
    const pending: boolean[] = []
    const api = createApiClient({ fetch: fetchFn, onPendingChange: (p) => pending.push(p) })
    const p = api.request('POST', '/encounters/x/complete')
    await jest.advanceTimersByTimeAsync(0)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(pending).toEqual([true])
    await jest.advanceTimersByTimeAsync(1000)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(2000)
    await expect(p).resolves.toEqual({ done: 1 })
    expect(pending).toEqual([true, false])
  })

  it('重試間隔上限 15 秒', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new TypeError('offline'))
    const api = createApiClient({ fetch: fetchFn })
    api.request('GET', '/me').catch(() => undefined)
    await jest.advanceTimersByTimeAsync(1000 + 2000 + 4000 + 8000)
    expect(fetchFn).toHaveBeenCalledTimes(5)
    await jest.advanceTimersByTimeAsync(14_999)
    expect(fetchFn).toHaveBeenCalledTimes(5)
    await jest.advanceTimersByTimeAsync(1)
    expect(fetchFn).toHaveBeenCalledTimes(6)
  })

  it('依序送出：前一個請求完成前，下一個不會送出（作答要在結算之前）', async () => {
    const order: string[] = []
    let release!: () => void
    const fetchFn = jest.fn().mockImplementation((url: string) => {
      order.push(url)
      if (url.endsWith('/answers/0')) return new Promise((r) => (release = () => r(jsonResponse(204, null))))
      return Promise.resolve(jsonResponse(200, {}))
    })
    const api = createApiClient({ fetch: fetchFn })
    const a = api.enqueue('PUT', '/encounters/e/answers/0', { wrongCount: 0, durationMs: 1 })
    const b = api.enqueue('POST', '/encounters/e/complete')
    await jest.advanceTimersByTimeAsync(0)
    expect(order).toEqual(['/api/v1/encounters/e/answers/0'])
    release()
    await a
    await b
    expect(order).toEqual(['/api/v1/encounters/e/answers/0', '/api/v1/encounters/e/complete'])
  })
})
