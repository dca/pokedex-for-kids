// 小島的配置：四個扇形區域、草叢、道館的位置，以及哪裡可以走（純函式，可測試）。
// 角度 φ = atan2(x, z)：φ = 0 是朝向鏡頭的 +z 方向（新手草原）。
import type { ZoneId } from '@/api/types'

export const ISLAND_RADIUS = 18
export const PLAZA_RADIUS = 3
export const START: [number, number] = [0, 5]

export interface ZoneLayout {
  id: ZoneId
  /** 扇形的中心角度（弧度） */
  angle: number
  ground: string
  patches: [number, number][]
  gym: [number, number]
}

const deg = (d: number) => (d * Math.PI) / 180
const polar = (angleDeg: number, r: number): [number, number] => [Math.sin(deg(angleDeg)) * r, Math.cos(deg(angleDeg)) * r]

export const ZONES: ZoneLayout[] = [
  { id: 'meadow', angle: 0, ground: '#7BD389', patches: [polar(-25, 9), polar(22, 10.5), polar(-8, 14)], gym: polar(32, 14.5) },
  { id: 'hill', angle: deg(90), ground: '#D8C08E', patches: [polar(70, 9), polar(110, 11), polar(90, 13.5)], gym: polar(90, 16.2) },
  { id: 'forest', angle: deg(180), ground: '#4FA36B', patches: [polar(160, 9), polar(200, 11), polar(180, 13.5)], gym: polar(180, 16.2) },
  { id: 'beach', angle: deg(-90), ground: '#FFE3A3', patches: [polar(-70, 9), polar(-110, 11.5), polar(-90, 13.5)], gym: polar(-90, 16.2) },
]

export const zoneLayout = (id: ZoneId) => ZONES.find((z) => z.id === id)!

/** 某個位置所在的區域（中央廣場算新手草原） */
export function zoneAt(x: number, z: number): ZoneId {
  if (Math.hypot(x, z) < PLAZA_RADIUS) return 'meadow'
  const phi = Math.atan2(x, z) // -π..π
  if (Math.abs(phi) <= deg(45)) return 'meadow'
  if (phi > deg(45) && phi <= deg(135)) return 'hill'
  if (phi < -deg(45) && phi >= -deg(135)) return 'beach'
  return 'forest'
}

/** 能不能走到這個位置：在島上，而且是已開放的區域（中央廣場永遠可以走） */
export function walkable(x: number, z: number, unlocked: readonly ZoneId[]): boolean {
  const r = Math.hypot(x, z)
  if (r > ISLAND_RADIUS - 1.2) return false
  if (r < PLAZA_RADIUS) return true
  return unlocked.includes(zoneAt(x, z))
}

/** 區域中心附近可以站的位置（E2E 的 setZone 與換區時使用） */
export function zoneSpawn(id: ZoneId): [number, number] {
  const z = zoneLayout(id)
  return [Math.sin(z.angle) * 6, Math.cos(z.angle) * 6]
}

export interface PatchRef {
  zone: ZoneId
  index: number
  x: number
  z: number
}

export const allPatches = (): PatchRef[] =>
  ZONES.flatMap((z) => z.patches.map(([x, pz], index) => ({ zone: z.id, index, x, z: pz })))

/** 選一個會晃動的草叢：在玩家目前的區域，避開剛遭遇過的那一叢 */
export function pickActivePatch(zone: ZoneId, previous: PatchRef | null, rand: () => number): PatchRef {
  const list = allPatches().filter((p) => p.zone === zone && !(previous && p.zone === previous.zone && p.index === previous.index))
  return list[Math.floor(rand() * list.length)] ?? allPatches().find((p) => p.zone === zone)!
}

export const PATCH_RADIUS = 1.6
export const GYM_RADIUS = 2.2

/** 遭遇時鏡頭相對於寶可夢的位置（從左前方看過去），以及依寬高比拉遠的最大倍數 */
export const ENCOUNTER_OFFSET: [number, number, number] = [-4, 6, 6.5]
export const ENCOUNTER_MAX_SCALE = 2.2

/** 野生寶可夢站的位置：草叢前方一點 */
export const wildSpot = (p: { x: number; z: number }) => ({ x: p.x + 0.3, z: p.z + 2.3 })

/** 道館館主寶可夢站的位置：道館前方（往廣場方向） */
export function gymSpot(zone: ZoneId) {
  const [x, z] = zoneLayout(zone).gym
  return { x: x * 0.85, z: z * 0.85 }
}

/** 所有會拉近鏡頭的位置（野生與道館） */
export const encounterSpots = () => [...allPatches().map(wildSpot), ...ZONES.map((z) => gymSpot(z.id))]
