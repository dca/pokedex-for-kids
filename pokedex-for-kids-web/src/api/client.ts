// API 用戶端：網路錯誤或伺服器錯誤時自動重試（FR-061），重試期間由 onPendingChange 通知畫面顯示「連線中」。
import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorBody['code'] | 'network',
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiClientOptions {
  fetch?: typeof fetch
  basePath?: string
  onPendingChange?: (pending: boolean) => void
  /** 測試用：指定遭遇的寶可夢（只在 E2E 建置使用，伺服器也要開啟測試掛勾） */
  testPokemon?: () => number | null
}

const MAX_DELAY = 15_000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function createApiClient(opts: ApiClientOptions = {}) {
  const doFetch = opts.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const base = (opts.basePath ?? '') + '/api/v1'
  let retrying = 0
  let queue: Promise<unknown> = Promise.resolve()

  const setRetrying = (delta: number) => {
    const before = retrying > 0
    retrying += delta
    const after = retrying > 0
    if (before !== after) opts.onPendingChange?.(after)
  }

  async function request<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
    let delay = 1000
    let marked = false
    try {
      for (;;) {
        let res: Response | null = null
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const forced = opts.testPokemon?.()
          if (forced) headers['X-Test-Pokemon'] = String(forced)
          res = await doFetch(base + path, {
            method,
            credentials: 'include',
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
          })
        } catch {
          res = null // 網路錯誤
        }
        if (res && res.status < 500) {
          if (res.status === 204) return undefined as T
          const data = await res.json().catch(() => null)
          if (!res.ok) {
            const err = (data ?? {}) as Partial<ApiErrorBody>
            throw new ApiError(res.status, err.code ?? 'internal', err.message ?? '發生錯誤，請稍後再試')
          }
          return data as T
        }
        if (!marked) {
          marked = true
          setRetrying(1)
        }
        await sleep(delay)
        delay = Math.min(delay * 2, MAX_DELAY)
      }
    } finally {
      if (marked) setRetrying(-1)
    }
  }

  /** 依序送出：用於作答與結算，保證先送完作答才結算 */
  function enqueue<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
    const next = queue.then(() => request<T>(method, path, body))
    queue = next.catch(() => undefined)
    return next
  }

  return { request, enqueue }
}

export type ApiClient = ReturnType<typeof createApiClient>
