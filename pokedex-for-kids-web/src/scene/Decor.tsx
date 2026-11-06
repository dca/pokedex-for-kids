// 裝飾：棒棒糖樹、麻糬石、小花，依區域放置；用 InstancedMesh 減少繪製次數。數量隨畫質調整。
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ENCOUNTER_MAX_SCALE, ENCOUNTER_OFFSET, ISLAND_RADIUS, PLAZA_RADIUS, START, allPatches, encounterSpots, ZONES, zoneAt } from './layout'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface Spot {
  x: number
  z: number
  s: number
  rot: number
}

// 遭遇鏡頭的水平方向與最遠距離（窄螢幕會拉遠到 ENCOUNTER_MAX_SCALE 倍）
const CAM_DIST = Math.hypot(ENCOUNTER_OFFSET[0], ENCOUNTER_OFFSET[2])
const CAM_DIR = { x: ENCOUNTER_OFFSET[0] / CAM_DIST, z: ENCOUNTER_OFFSET[2] / CAM_DIST }
const SIGHT_LEN = CAM_DIST * ENCOUNTER_MAX_SCALE + 1

/** 點 (x, z) 是否在「寶可夢 (wx, wz) → 遭遇鏡頭」的視線附近 */
export function nearSightLine(x: number, z: number, wx: number, wz: number): boolean {
  const t = (x - wx) * CAM_DIR.x + (z - wz) * CAM_DIR.z
  if (t < -1 || t > SIGHT_LEN) return false
  return Math.hypot(x - (wx + CAM_DIR.x * t), z - (wz + CAM_DIR.z * t)) < 2.4
}

/** 在島上隨機找位置，避開廣場、草叢、道館 */
function scatter(count: number, seed: number, filter: (x: number, z: number) => boolean, minR = PLAZA_RADIUS + 1): Spot[] {
  const rand = seeded(seed)
  const blocked = [...allPatches().map((p) => [p.x, p.z]), ...ZONES.map((z) => z.gym)]
  const focusSpots = encounterSpots()
  const out: Spot[] = []
  for (let tries = 0; out.length < count && tries < count * 30; tries++) {
    const a = rand() * Math.PI * 2
    const r = minR + rand() * (ISLAND_RADIUS - 1.5 - minR)
    const x = Math.sin(a) * r
    const z = Math.cos(a) * r
    if (!filter(x, z) || blocked.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 2.6)) continue
    // 出生點與它和鏡頭之間保持空曠，玩家才不會被樹擋住
    if (Math.abs(x - START[0]) < 4 && z > START[1] - 3) continue
    // 遭遇與道館挑戰時鏡頭從寶可夢左前方看過去，這條視線上也不放裝飾
    if (focusSpots.some((w) => nearSightLine(x, z, w.x, w.z))) continue
    out.push({ x, z, s: 0.8 + rand() * 0.5, rot: rand() * Math.PI })
  }
  return out
}

function Instances({ spots, geometry, color, y, scaleY = 1 }: { spots: Spot[]; geometry: THREE.BufferGeometry; color: string; y: (s: number) => number; scaleY?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    spots.forEach((p, i) => {
      m.compose(new THREE.Vector3(p.x, y(p.s), p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, 0)), new THREE.Vector3(p.s, p.s * scaleY, p.s))
      ref.current!.setMatrixAt(i, m)
    })
    ref.current!.instanceMatrix.needsUpdate = true
  }, [spots, y, scaleY])
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, spots.length]} castShadow receiveShadow>
      <meshStandardMaterial color={color} flatShading roughness={0.9} />
    </instancedMesh>
  )
}

const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.4, 6)
const crownGeo = new THREE.IcosahedronGeometry(1.15, 0)
const rockGeo = new THREE.DodecahedronGeometry(0.7, 0)
const flowerGeo = new THREE.IcosahedronGeometry(0.16, 0)

export function Decor({ quality }: { quality: 'high' | 'low' }) {
  const n = quality === 'high' ? 1 : 0.5
  const { trees, pines, rocks, flowers } = useMemo(
    () => ({
      trees: scatter(Math.round(14 * n), 7, (x, z) => zoneAt(x, z) === 'meadow' || zoneAt(x, z) === 'beach', 7),
      pines: scatter(Math.round(20 * n), 11, (x, z) => zoneAt(x, z) === 'forest'),
      rocks: scatter(Math.round(16 * n), 13, (x, z) => zoneAt(x, z) === 'hill' || zoneAt(x, z) === 'beach'),
      flowers: scatter(Math.round(40 * n), 17, (x, z) => zoneAt(x, z) === 'meadow', 2),
    }),
    [n],
  )
  return (
    <group>
      <Instances spots={[...trees, ...pines]} geometry={trunkGeo} color="#A8703F" y={(s) => 0.7 * s} />
      <Instances spots={trees} geometry={crownGeo} color="#6CC77C" y={(s) => 2 * s} />
      <Instances spots={pines} geometry={crownGeo} color="#2F7D4F" y={(s) => 2.2 * s} scaleY={1.5} />
      <Instances spots={rocks} geometry={rockGeo} color="#C4BEDA" y={(s) => 0.25 * s} scaleY={0.65} />
      <Instances spots={flowers} geometry={flowerGeo} color="#FF8FB1" y={() => 0.3} />
    </group>
  )
}
