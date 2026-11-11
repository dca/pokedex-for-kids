// 目前的帳號、正在玩的小朋友與他的進度（資料都來自伺服器，這裡只是記憶體中的快取）。
import { create } from 'zustand'
import type { ChildState, Me } from '@/api/types'
import type { Pokemon } from '@/content/types'

interface SessionState {
  me: Me | null
  childId: string | null
  child: ChildState | null
  pokemon: Pokemon[]
  setMe: (me: Me | null) => void
  setChildId: (id: string | null) => void
  setChild: (state: ChildState | null) => void
  setPokemon: (list: Pokemon[]) => void
}

const LAST_CHILD = 'zhuyin-island:last-child'

export const useSession = create<SessionState>((set) => ({
  me: null,
  childId: null,
  child: null,
  pokemon: [],
  setMe: (me) => set({ me }),
  setChildId: (childId) => {
    // 只記住「上次選的是哪個小朋友」，方便下次開啟；進度不存在瀏覽器
    if (typeof localStorage !== 'undefined') {
      if (childId) localStorage.setItem(LAST_CHILD, childId)
      else localStorage.removeItem(LAST_CHILD)
    }
    set({ childId, child: null })
  },
  setChild: (child) => set({ child }),
  setPokemon: (pokemon) => set({ pokemon }),
}))

export function lastChildId(): string | null {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(LAST_CHILD)
}
