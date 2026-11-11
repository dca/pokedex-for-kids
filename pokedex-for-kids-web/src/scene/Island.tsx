// 浮在雲上的小島：四個扇形區域的地面、下方的土層、海灘的水池；未開放的區域蓋上雲霧。
import { useMemo } from 'react'
import * as THREE from 'three'
import type { ZoneId } from '@/api/types'
import { ISLAND_RADIUS, ZONES } from './layout'

const flat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => (
  <meshStandardMaterial color={color} flatShading roughness={0.9} {...extra} />
)

function Wedge({ angle, color }: { angle: number; color: string }) {
  // CylinderGeometry 的角度從 +z 開始，與 layout 的 φ 相同
  return (
    <mesh position={[0, -0.5, 0]} receiveShadow>
      <cylinderGeometry args={[ISLAND_RADIUS - 0.4, ISLAND_RADIUS, 1, 18, 1, false, angle - Math.PI / 4, Math.PI / 2]} />
      {flat(color)}
    </mesh>
  )
}

function Fog({ angle }: { angle: number }) {
  // 一團團的雲把未開放的區域蓋住
  const puffs = useMemo(() => {
    const out: [number, number, number, number][] = []
    // 雲放在區域的外圈、壓低高度，不擋住中央與其他區域
    for (let i = 0; i < 10; i++) {
      const a = angle - Math.PI / 4 + 0.25 + (i / 9) * (Math.PI / 2 - 0.5)
      const r = 9 + (i % 3) * 2.6
      out.push([Math.sin(a) * r, 0.4 + (i % 2) * 0.5, Math.cos(a) * r, 1.6 + (i % 3) * 0.35])
    }
    return out
  }, [angle])
  return (
    <group>
      {puffs.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[s, 1]} />
          <meshStandardMaterial color="#ffffff" flatShading roughness={1} transparent opacity={0.94} />
        </mesh>
      ))}
    </group>
  )
}

export function Island({ unlocked }: { unlocked: readonly ZoneId[] }) {
  return (
    <group>
      {ZONES.map((z) => (
        <Wedge key={z.id} angle={z.angle} color={z.ground} />
      ))}
      {/* 中央廣場 */}
      <mesh position={[0, -0.45, 0]} receiveShadow>
        <cylinderGeometry args={[3, 3, 1, 24]} />
        {flat('#A6E3A1')}
      </mesh>
      {/* 土層 */}
      <mesh position={[0, -2.7, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS + 0.2, 12, 3.4, 16]} />
        {flat('#D9965F')}
      </mesh>
      <mesh position={[0, -6.4, 0]}>
        <cylinderGeometry args={[12, 4, 4, 12]} />
        {flat('#B97A4A')}
      </mesh>
      <mesh position={[0, -10, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[4, 3.2, 8]} />
        {flat('#9A6440')}
      </mesh>
      {/* 泡泡海灘的水池 */}
      <mesh position={[-12.5, -0.02, -3]} scale={[1, 1, 1.4]}>
        <cylinderGeometry args={[2.6, 2.6, 0.2, 24]} />
        {flat('#4FC3E8', { roughness: 0.3, metalness: 0.1 })}
      </mesh>
      {ZONES.filter((z) => !unlocked.includes(z.id)).map((z) => (
        <Fog key={z.id} angle={z.angle} />
      ))}
    </group>
  )
}
