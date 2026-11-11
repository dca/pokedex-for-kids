// 道館：每區一座，屋頂顏色依區域；拿到徽章後屋頂上會有金色星星。
import type { ZoneId } from '@/api/types'
import { zoneLayout } from './layout'

const ROOF: Record<ZoneId, string> = { meadow: '#3D7BF7', beach: '#FF8A3D', forest: '#2FB36B', hill: '#F2545B' }

export function GymBuilding({ zone, hasBadge }: { zone: ZoneId; hasBadge: boolean }) {
  const { gym, angle } = zoneLayout(zone)
  return (
    <group position={[gym[0], 0, gym[1]]} rotation={[0, angle + Math.PI, 0]} scale={0.75}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 2.4]} />
        <meshStandardMaterial color="#FFFFFF" flatShading />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.4, 1.4, 4]} />
        <meshStandardMaterial color={ROOF[zone]} flatShading />
      </mesh>
      <mesh position={[0, 0.7, 1.22]}>
        <boxGeometry args={[0.9, 1.4, 0.05]} />
        <meshStandardMaterial color="#2B3A67" />
      </mesh>
      {hasBadge && (
        <mesh position={[0, 3.7, 0]}>
          <octahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color="#FFC93C" emissive="#FFC93C" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  )
}
