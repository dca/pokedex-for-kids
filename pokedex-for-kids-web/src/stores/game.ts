// 遊戲畫面的狀態：目前在做什麼、在哪一區、遭遇與結算結果。
import { create } from 'zustand'
import type { Encounter, EncounterResult, ZoneId } from '@/api/types'
import type { ChallengeState } from '@/game/challenge'
import type { PatchRef } from '@/scene/layout'

export type Mode =
  | { kind: 'explore' }
  | { kind: 'intro'; encounter: Encounter }
  | { kind: 'question'; encounter: Encounter; challenge: ChallengeState }
  | { kind: 'catch'; encounter: Encounter; result: EncounterResult }
  | { kind: 'gym-confirm'; zone: ZoneId }
  | { kind: 'gym-result'; encounter: Encounter; result: EncounterResult }
  | { kind: 'book' }

export interface Notice {
  title: string
  pokemonId?: number
  audio: string[]
}

interface GameState {
  mode: Mode
  zone: ZoneId
  activePatch: PatchRef | null
  /** 遭遇的寶可夢出現的位置 */
  wildAt: { x: number; z: number } | null
  notices: Notice[]
  setMode: (mode: Mode) => void
  setZone: (zone: ZoneId) => void
  setActivePatch: (p: PatchRef | null) => void
  setWildAt: (p: { x: number; z: number } | null) => void
  pushNotices: (n: Notice[]) => void
  shiftNotice: () => void
}

export const useGame = create<GameState>((set) => ({
  mode: { kind: 'explore' },
  zone: 'meadow',
  activePatch: null,
  wildAt: null,
  notices: [],
  setMode: (mode) => set({ mode }),
  setZone: (zone) => set({ zone }),
  setActivePatch: (activePatch) => set({ activePatch }),
  setWildAt: (wildAt) => set({ wildAt }),
  pushNotices: (n) => set((s) => ({ notices: [...s.notices, ...n] })),
  shiftNotice: () => set((s) => ({ notices: s.notices.slice(1) })),
}))
