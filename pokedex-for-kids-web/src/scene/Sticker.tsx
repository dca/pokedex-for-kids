// 寶可夢貼紙：建置時做好白邊與墨線的圖片，面向鏡頭、輕輕彈跳；腳下有一圈影子。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { stickerUrl } from '@/content/types'

const shadowTexture = (() => {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
  g.addColorStop(0, 'rgba(43,58,103,.45)')
  g.addColorStop(1, 'rgba(43,58,103,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
})()

interface Props {
  id: number
  scale?: number
  reducedMotion: boolean
  /** 每格更新位置（例如跟隨玩家） */
  follow?: (out: THREE.Vector3, dt: number) => void
  position?: [number, number, number]
  /** 從 0 長大到 1 的出場動畫 */
  popIn?: boolean
}

export function Sticker({ id, scale = 2.4, reducedMotion, follow, position, popIn }: Props) {
  const tex = useTexture(stickerUrl(id))
  tex.colorSpace = THREE.SRGBColorSpace
  const group = useRef<THREE.Group>(null)
  const sprite = useRef<THREE.Sprite>(null)
  const phase = useMemo(() => Math.random() * 6, [])
  const grow = useRef(popIn && !reducedMotion ? 0 : 1)

  useFrame(({ clock }, dt) => {
    if (!group.current || !sprite.current) return
    if (follow) follow(group.current.position, dt)
    grow.current = Math.min(1, grow.current + dt * 2.5)
    const k = grow.current
    const ease = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2)
    const hop = reducedMotion ? 0 : Math.abs(Math.sin(clock.elapsedTime * 3 + phase)) * 0.18
    sprite.current.position.y = hop
    sprite.current.scale.set(scale * ease * (1 + hop * 0.15), scale * ease * (1 - hop * 0.08), 1)
  })

  return (
    <group ref={group} position={position}>
      <sprite ref={sprite} center={new THREE.Vector2(0.5, 0.06)}>
        <spriteMaterial map={tex} transparent alphaTest={0.05} toneMapped={false} fog={false} />
      </sprite>
      {shadowTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <planeGeometry args={[scale * 0.8, scale * 0.45]} />
          <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
