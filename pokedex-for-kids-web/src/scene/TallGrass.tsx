// 高草叢：寶可夢藏身的地方。正在晃動的草叢代表可以遭遇；減少動態效果時改成亮黃色描邊。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const bladeGeo = new THREE.ConeGeometry(0.28, 1.5, 4)

export function TallGrass({ x, z, active, reducedMotion }: { x: number; z: number; active: boolean; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const blades = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + i * 0.37
        const d = ((i * 7) % 10) / 8
        return { x: Math.cos(a) * d, z: Math.sin(a) * d, rx: ((i % 5) - 2) * 0.06, rz: ((i % 3) - 1) * 0.08 }
      }),
    [],
  )
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.z = active && !reducedMotion ? Math.sin(t * 18) * 0.06 * (Math.sin(t * 2) > 0 ? 1 : 0.2) : 0
  })
  return (
    <group position={[x, 0, z]}>
      <group ref={ref}>
        {blades.map((b, i) => (
          <mesh key={i} geometry={bladeGeo} position={[b.x, 0.7, b.z]} rotation={[b.rx, 0, b.rz]} castShadow>
            <meshStandardMaterial color={active ? '#2E8B4E' : '#3E9E5C'} flatShading roughness={0.9} />
          </mesh>
        ))}
      </group>
      {active && reducedMotion && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial color="#FFC93C" />
        </mesh>
      )}
    </group>
  )
}
