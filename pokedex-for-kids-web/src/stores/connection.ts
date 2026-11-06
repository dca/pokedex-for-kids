import { create } from 'zustand'

/** 有請求正在重試時為 true，畫面顯示「連線中」並暫停遊戲（FR-061） */
export const useConnection = create<{ pending: boolean; setPending: (p: boolean) => void }>((set) => ({
  pending: false,
  setPending: (pending) => set({ pending }),
}))
