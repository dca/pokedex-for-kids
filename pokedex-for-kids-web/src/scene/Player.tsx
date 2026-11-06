// 玩家：Q 版小訓練家。依鍵盤、搖桿或點擊目標移動，不能走進未開放的區域；
// 走進晃動的草叢或道館時通知上層（FR-002、FR-003）。
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ZoneId } from '@/api/types'
import { GYM_RADIUS, PATCH_RADIUS, walkable, zoneAt, ZONES, type PatchRef } from './layout'
import { inputDirection, runtime } from './runtime'

const SPEED = 5.2

interface Props {
  unlocked: readonly ZoneId[]
  activePatch: PatchRef | null
  enabled: boolean
  reducedMotion: boolean
  onZoneChange: (zone: ZoneId) => void
  onEnterPatch: (patch: PatchRef) => void
  onEnterGym: (zone: ZoneId) => void
}

export function Player({ unlocked, activePatch, enabled, reducedMotion, onZoneChange, onEnterPatch, onEnterGym }: Props) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const lastZone = useRef<ZoneId | null>(null)
  const inGym = useRef<ZoneId | null>(null)

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = runtime.player
    let [dx, dz] = enabled ? inputDirection() : [0, 0]
    if (enabled && (dx !== 0 || dz !== 0)) runtime.target = null
    if (enabled && runtime.target) {
      const tx = runtime.target.x - p.x
      const tz = runtime.target.z - p.z
      if (Math.hypot(tx, tz) < 0.15) runtime.target = null
      else [dx, dz] = [tx, tz]
    }
    const len = Math.hypot(dx, dz)
    p.moving = len > 0.01
    if (p.moving) {
      const nx = p.x + (dx / Math.max(1, len)) * dt * SPEED * Math.min(1, len)
      const nz = p.z + (dz / Math.max(1, len)) * dt * SPEED * Math.min(1, len)
      // 分開檢查 x、z，讓玩家可以沿著邊界滑動
      if (walkable(nx, p.z, unlocked)) p.x = nx
      if (walkable(p.x, nz, unlocked)) p.z = nz
      if (!walkable(nx, nz, unlocked) && runtime.target) runtime.target = null
      p.facing = THREE.MathUtils.lerp(p.facing, Math.atan2(dx, dz), 0.25)
    }
    if (group.current) {
      group.current.position.set(p.x, 0, p.z)
      group.current.rotation.y = p.facing
    }
    if (body.current) body.current.position.y = p.moving && !reducedMotion ? Math.abs(Math.sin(clock.elapsedTime * 12)) * 0.12 : 0

    const zone = zoneAt(p.x, p.z)
    if (zone !== lastZone.current) {
      lastZone.current = zone
      onZoneChange(zone)
    }
    if (!enabled) return
    if (activePatch && Math.hypot(p.x - activePatch.x, p.z - activePatch.z) < PATCH_RADIUS) onEnterPatch(activePatch)
    const gym = ZONES.find((z) => unlocked.includes(z.id) && Math.hypot(p.x - z.gym[0], p.z - z.gym[1]) < GYM_RADIUS)
    if (gym && inGym.current !== gym.id) onEnterGym(gym.id)
    inGym.current = gym?.id ?? null
  })

  return (
    <group ref={group}>
      <group ref={body}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <capsuleGeometry args={[0.45, 0.55, 4, 10]} />
          <meshStandardMaterial color="#3D7BF7" flatShading />
        </mesh>
        <mesh position={[0, 1.75, 0]} castShadow>
          <sphereGeometry args={[0.52, 16, 12]} />
          <meshStandardMaterial color="#FFD9B3" />
        </mesh>
        <mesh position={[0, 1.82, 0]}>
          <sphereGeometry args={[0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#F2545B" />
        </mesh>
        <mesh position={[0, 1.84, 0.28]}>
          <cylinderGeometry args={[0.42, 0.42, 0.08, 16, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#F2545B" />
        </mesh>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} position={[x, 1.72, 0.47]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#2B3A67" />
          </mesh>
        ))}
      </group>
    </group>
  )
}
