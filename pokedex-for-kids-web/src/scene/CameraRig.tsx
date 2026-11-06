// 鏡頭：固定斜上方跟隨玩家；遭遇時拉近寶可夢，並把畫面往上平移，讓寶可夢在挑戰面板上方。
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from './runtime'

const EXPLORE = new THREE.Vector3(0, 21, 24)
const ENCOUNTER = new THREE.Vector3(-4, 6, 6.5)

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
    const portrait = size.height > size.width
    const off = (encounter ? ENCOUNTER : EXPLORE).clone().multiplyScalar(portrait ? (encounter ? 2 : 1.4) : 1)
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
