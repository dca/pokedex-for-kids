// 3D 場景的組合：燈光、小島、裝飾、草叢、道館、玩家、夥伴、遭遇的寶可夢。
// 畫面掉格時自動降低畫質（FR-082），手機從低畫質開始。
import { Suspense, useCallback, useState } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import type { ZoneId } from '@/api/types'
import { Island } from './Island'
import { Decor } from './Decor'
import { TallGrass } from './TallGrass'
import { GymBuilding } from './GymBuilding'
import { Player } from './Player'
import { Sticker } from './Sticker'
import { CameraRig } from './CameraRig'
import { allPatches, walkable, ZONES, type PatchRef } from './layout'
import { runtime } from './runtime'
import styles from './GameCanvas.module.css'

export interface GameCanvasProps {
  unlocked: readonly ZoneId[]
  badges: readonly ZoneId[]
  activePatch: PatchRef | null
  partnerId: number | null
  /** 遭遇中的寶可夢與牠出現的位置 */
  wild: { id: number; x: number; z: number } | null
  exploring: boolean
  reducedMotion: boolean
  onZoneChange: (zone: ZoneId) => void
  onEnterPatch: (patch: PatchRef) => void
  onEnterGym: (zone: ZoneId) => void
}

const isSmallScreen = () => typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600

export function GameCanvas(props: GameCanvasProps) {
  const { unlocked, badges, activePatch, partnerId, wild, exploring, reducedMotion } = props
  const [quality, setQuality] = useState<'high' | 'low'>(() => (isSmallScreen() ? 'low' : 'high'))
  const [dpr, setDpr] = useState(() => (isSmallScreen() ? 1.25 : Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio)))

  const onGround = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!exploring) return
      const { x, z } = e.point
      if (walkable(x, z, unlocked)) runtime.target = { x, z }
    },
    [exploring, unlocked],
  )

  const followPlayer = useCallback((out: THREE.Vector3, dt: number) => {
    const p = runtime.player
    const tx = p.x - Math.sin(p.facing) * 1.6 - 0.6
    const tz = p.z - Math.cos(p.facing) * 1.6 + 0.4
    out.lerp(new THREE.Vector3(tx, 0, tz), Math.min(1, dt * 3))
  }, [])

  return (
    <div className={styles.wrap} aria-label="注音島 3D 場景" role="img">
      <Canvas
        shadows={quality === 'high'}
        dpr={dpr}
        camera={{ fov: 34, near: 0.1, far: 200, position: [0, 21, 29] }}
        gl={{ antialias: quality === 'high', alpha: true }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr((d) => Math.max(1, d - 0.5))
            setQuality('low')
          }}
        />
        <fog attach="fog" args={['#E4F6FF', 45, 90]} />
        <hemisphereLight args={['#FFFFFF', '#A8D8A0', 1.6]} />
        <directionalLight
          position={[-10, 22, 12]}
          intensity={2.4}
          color="#FFF1D6"
          castShadow={quality === 'high'}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={24}
          shadow-camera-bottom={-24}
          shadow-bias={-0.0008}
        />
        <Island unlocked={unlocked} />
        <Decor quality={quality} />
        {allPatches()
          .filter((p) => unlocked.includes(p.zone))
          .map((p) => (
            <TallGrass
              key={`${p.zone}-${p.index}`}
              x={p.x}
              z={p.z}
              reducedMotion={reducedMotion}
              active={exploring && activePatch?.zone === p.zone && activePatch.index === p.index}
            />
          ))}
        {ZONES.filter((z) => unlocked.includes(z.id)).map((z) => (
          <GymBuilding key={z.id} zone={z.id} hasBadge={badges.includes(z.id)} />
        ))}
        {/* 點擊地面移動 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onPointerDown={onGround} visible={false}>
          <circleGeometry args={[18, 32]} />
          <meshBasicMaterial />
        </mesh>
        <Player
          unlocked={unlocked}
          activePatch={activePatch}
          enabled={exploring}
          reducedMotion={reducedMotion}
          onZoneChange={props.onZoneChange}
          onEnterPatch={props.onEnterPatch}
          onEnterGym={props.onEnterGym}
        />
        <Suspense fallback={null}>
          {partnerId && <Sticker key={`partner-${partnerId}`} id={partnerId} scale={2.2} reducedMotion={reducedMotion} follow={followPlayer} />}
          {wild && <Sticker key={`wild-${wild.id}`} id={wild.id} scale={2.6} reducedMotion={reducedMotion} position={[wild.x, 0, wild.z]} popIn />}
        </Suspense>
        <CameraRig reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
