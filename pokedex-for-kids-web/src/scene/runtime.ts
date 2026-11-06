// 3D 場景每格都會讀寫的暫態資料（玩家位置、輸入）。放在 React 之外，避免每格重新渲染（plan Complexity Tracking）。
import { START } from './layout'

export const runtime = {
  player: { x: START[0], z: START[1], facing: 0, moving: false },
  /** 鍵盤按著的方向鍵 */
  keys: new Set<string>(),
  /** 虛擬搖桿的方向（-1～1） */
  joy: { x: 0, y: 0 },
  /** 點擊地面的目標 */
  target: null as null | { x: number; z: number },
  /** 鏡頭要對準的位置（遭遇時是寶可夢） */
  focus: null as null | { x: number; z: number },
  fps: 60,
}

export function teleport(x: number, z: number) {
  runtime.player.x = x
  runtime.player.z = z
  runtime.target = null
}

const MOVE_KEYS: Record<string, [number, number]> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
}

/** 目前輸入的移動方向（未正規化） */
export function inputDirection(): [number, number] {
  let x = 0
  let z = 0
  for (const k of runtime.keys) {
    const v = MOVE_KEYS[k]
    if (v) {
      x += v[0]
      z += v[1]
    }
  }
  if (Math.hypot(runtime.joy.x, runtime.joy.y) > 0.1) {
    x = runtime.joy.x
    z = runtime.joy.y
  }
  return [x, z]
}

export function isMoveKey(key: string) {
  return key.toLowerCase() in MOVE_KEYS
}
