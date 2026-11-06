// 鏡頭：固定斜上方跟隨玩家；遭遇時拉近寶可夢，並把畫面往上平移，讓寶可夢在挑戰面板上方。
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from './runtime'
import { ENCOUNTER_MAX_SCALE, ENCOUNTER_OFFSET } from './layout'

const EXPLORE = new THREE.Vector3(0, 21, 24)
const ENCOUNTER = new THREE.Vector3(...ENCOUNTER_OFFSET)
/** 以平板橫向（約 1.45）為基準：視窗越窄鏡頭越遠，讓小島不被左右裁掉；越寬則稍微拉近 */
const REF_ASPECT = 1.45

export function distanceScale(aspect: number, encounter: boolean): number {
  const raw = Math.pow(REF_ASPECT / aspect, encounter ? 0.7 : 0.4)
  // 遭遇時不比基準更近，否則寬螢幕上寶可夢會被前景擋住
  return Math.min(encounter ? ENCOUNTER_MAX_SCALE : 1.6, Math.max(encounter ? 1 : 0.85, raw))
}

export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(runtime.player.x, 0, runtime.player.z))
  const shift = useRef(0)
  const tmp = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera
    const k = reducedMotion ? 1 : Math.min(1, delta * 3)
    const focus = runtime.focus ?? { x: runtime.player.x, z: runtime.player.z }
    const encounter = runtime.focus !== null
    const aspect = size.width / Math.max(1, size.height)
    const portrait = aspect < 1
    const off = (encounter ? ENCOUNTER : EXPLORE).clone().multiplyScalar(distanceScale(aspect, encounter))
    tmp.current.set(focus.x, 0, focus.z).add(off)
    cam.position.lerp(tmp.current, k)
    tmp.current.set(focus.x, encounter ? 1.2 : 0, focus.z)
    look.current.lerp(tmp.current, k)
    cam.lookAt(look.current)
    const want = encounter ? (portrait ? 0.12 : 0.24) : 0
    shift.current += (want - shift.current) * k
    if (shift.current > 0.001) cam.setViewOffset(size.width, size.height, 0, size.height * shift.current, size.width, size.height)
    else cam.clearViewOffset()
    runtime.fps = runtime.fps * 0.95 + (1 / Math.max(delta, 1e-3)) * 0.05
  })
  return null
}
