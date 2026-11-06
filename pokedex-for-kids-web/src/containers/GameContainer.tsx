'use client'
// 遊戲主畫面：組合 3D 場景、上方資訊列、搖桿、挑戰面板與各種提示。
import { useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ZoneId } from '@/api/types'
import { GameCanvas } from '@/scene/GameCanvas'
import { gymSpot, pickActivePatch, zoneSpawn } from '@/scene/layout'
import { runtime, teleport } from '@/scene/runtime'
import { Hud } from '@/components/Hud'
import { Joystick } from '@/components/Joystick'
import { ConnectionOverlay } from '@/components/Overlays'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useConnection } from '@/stores/connection'
import { useGame } from '@/stores/game'
import { useSession } from '@/stores/session'
import { ZONE_NAMES } from '@/content/types'
import { testHooks } from '@/services'
import { useEncounterFlow } from './useEncounterFlow'
import { ModeLayer } from './ModeLayer'
import { PartnerContainer } from './PartnerContainer'

export default function GameContainer() {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const child = useSession((s) => s.child)
  const pokemon = useSession((s) => s.pokemon)
  const { mode, zone, activePatch, wildAt, setZone, setActivePatch, setMode } = useGame()
  const pending = useConnection((s) => s.pending)
  const flow = useEncounterFlow()

  const unlocked = useMemo(() => (child?.unlockedZones ?? ['meadow']) as ZoneId[], [child])
  const badges = useMemo(() => (child?.badges ?? []).map((b) => b.zone), [child])
  const hasPartner = !!child?.partner
  const exploring = mode.kind === 'explore' && hasPartner && !pending

  // 第一次進入：選一叢晃動的草叢，預先建立遭遇
  useEffect(() => {
    if (!hasPartner) return
    if (!useGame.getState().activePatch) setActivePatch(pickActivePatch(useGame.getState().zone, null, Math.random))
    flow.prefetchFor(useGame.getState().zone)
  }, [hasPartner, flow, setActivePatch])

  const onZoneChange = useCallback(
    (z: ZoneId) => {
      setZone(z)
      if (useGame.getState().mode.kind !== 'explore') return
      setActivePatch(pickActivePatch(z, null, Math.random))
      if (hasPartner) {
        flow.resetPrefetch()
        flow.prefetchFor(z)
      }
    },
    [flow, hasPartner, setActivePatch, setZone],
  )

  const onEnterGym = useCallback((z: ZoneId) => {
    if (useGame.getState().mode.kind === 'explore') setMode({ kind: 'gym-confirm', zone: z })
  }, [setMode])

  // E2E 測試掛勾：不需要在 3D 畫面上點擊就能測完整流程
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_E2E !== '1') return
    const w = window as unknown as { __zhuyinIsland?: object }
    w.__zhuyinIsland = {
      enterGrass: () => {
        const p = useGame.getState().activePatch
        if (p) void flow.enterPatch(p)
      },
      setZone: (z: ZoneId) => {
        teleport(...zoneSpawn(z))
      },
      enterGym: (z: ZoneId) => onEnterGym(z),
      setTestPokemon: (id: number | null) => {
        testHooks.pokemon = id
        flow.resetPrefetch()
      },
      getState: () => ({ mode: useGame.getState().mode, zone: useGame.getState().zone, child: useSession.getState().child, fps: runtime.fps }),
    }
  }, [flow, onEnterGym])

  if (!child) return null
  const caughtCount = child.caught.length
  const hint = exploring ? (activePatch ? '草叢在動！走過去看看' : undefined) : undefined
  const partnerId = child.partner?.currentId ?? null

  return (
    <>
      <GameCanvas
        unlocked={unlocked}
        badges={badges}
        activePatch={activePatch}
        partnerId={partnerId}
        wild={wildAt && 'encounter' in mode && mode.encounter.pokemonId ? { id: mode.encounter.pokemonId, ...wildAt } : null}
        exploring={exploring}
        reducedMotion={reducedMotion}
        onZoneChange={onZoneChange}
        onEnterPatch={flow.enterPatch}
        onEnterGym={onEnterGym}
      />
      <Hud
        nickname={child.child.nickname}
        avatar={child.child.avatar}
        caughtCount={caughtCount}
        badges={badges.length}
        zoneName={ZONE_NAMES[zone]}
        hint={hint}
        onBook={() => setMode({ kind: 'book' })}
        onAccount={() => router.push('/account')}
      />
      <Joystick enabled={exploring} />
      {!hasPartner && pokemon.length > 0 && <PartnerContainer />}
      <ModeLayer
        flow={flow}
        reducedMotion={reducedMotion}
        gymAt={gymSpot}
      />
      <ConnectionOverlay visible={pending} />
    </>
  )
}
