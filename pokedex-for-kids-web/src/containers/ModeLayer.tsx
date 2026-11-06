// 依目前的遊戲狀態顯示對應的 2D 畫面：遭遇橫幅、挑戰面板、收服、道館、收集冊、通知。
import { useMemo } from 'react'
import type { ZoneId } from '@/api/types'
import { Banner, GymResult, Notice } from '@/components/Overlays'
import { ChallengeSheet } from '@/components/ChallengeSheet'
import { CatchOverlay } from '@/components/CatchOverlay'
import { CollectionBook } from '@/components/CollectionBook'
import { STAGE_LABEL, ZONE_NAMES, ZONE_STAGE } from '@/content/types'
import { audio } from '@/services'
import { useGame } from '@/stores/game'
import { useSession } from '@/stores/session'
import type { useEncounterFlow } from './useEncounterFlow'

interface Props {
  flow: ReturnType<typeof useEncounterFlow>
  reducedMotion: boolean
  gymAt: (zone: ZoneId) => { x: number; z: number }
}

export function ModeLayer({ flow, reducedMotion, gymAt }: Props) {
  const { mode, setMode, notices, shiftNotice } = useGame()
  const child = useSession((s) => s.child)
  const pokemon = useSession((s) => s.pokemon)
  const byId = useMemo(() => new Map(pokemon.map((p) => [p.id, p])), [pokemon])
  const caught = useMemo(() => new Map((child?.caught ?? []).map((c) => [c.pokemonId, c.bestStars])), [child])

  // 探索中才顯示通知（新區域、進化），避免蓋住收服畫面
  if (mode.kind === 'explore' && notices.length > 0) {
    const n = notices[0]
    return (
      <Notice
        title={n.title}
        pokemon={n.pokemonId ? byId.get(n.pokemonId) : undefined}
        onClose={() => shiftNotice()}
      />
    )
  }

  switch (mode.kind) {
    case 'intro': {
      const p = byId.get(mode.encounter.pokemonId)
      if (!p) return null
      return mode.encounter.kind === 'gym' ? (
        <Banner>{ZONE_NAMES[mode.encounter.zone]}道館挑戰開始！</Banner>
      ) : (
        <Banner>
          野生的 <strong>{p.name}</strong> 出現了！
        </Banner>
      )
    }
    case 'question': {
      const c = mode.challenge
      if (c.phase === 'done') return null
      const q = mode.encounter.questions[c.index]
      return (
        <ChallengeSheet
          question={q}
          state={c}
          index={c.index}
          total={mode.encounter.questions.length}
          stageLabel={STAGE_LABEL[ZONE_STAGE[mode.encounter.zone]]}
          onSelect={flow.select}
          onSpeak={flow.replay}
        />
      )
    }
    case 'catch': {
      const p = byId.get(mode.encounter.pokemonId)
      if (!p) return null
      return (
        <CatchOverlay
          pokemon={p}
          stars={mode.result.stars ?? 1}
          newlyCaught={mode.result.newlyCaught}
          reducedMotion={reducedMotion}
          onContinue={flow.backToExplore}
          onOpenBook={() => {
            flow.backToExplore()
            setMode({ kind: 'book' })
          }}
        />
      )
    }
    case 'gym-confirm':
      return (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="道館挑戰">
          <div className="panel" style={{ padding: 28, textAlign: 'center', width: 'min(460px, calc(100vw - 32px))' }}>
            <p style={{ fontSize: 88, margin: 0 }} aria-hidden>
              🏟️
            </p>
            <h2 style={{ fontWeight: 'normal', fontSize: 28 }}>要挑戰{ZONE_NAMES[mode.zone]}道館嗎？</h2>
            <p style={{ fontSize: 20 }}>10 題答對 8 題就能拿到徽章</p>
            <div className="btn-row">
              <button type="button" className="btn primary" onClick={() => void flow.startGym(mode.zone, gymAt(mode.zone)).catch(() => setMode({ kind: 'explore' }))}>
                挑戰！
              </button>
              <button type="button" className="btn" onClick={() => setMode({ kind: 'explore' })}>
                等一下
              </button>
            </div>
          </div>
        </div>
      )
    case 'gym-result': {
      const g = mode.result.gym!
      return (
        <GymResult zoneName={ZONE_NAMES[mode.encounter.zone]} correctCount={g.correctCount} passed={g.passed} badgeEarned={g.badgeEarned} onClose={flow.backToExplore} />
      )
    }
    case 'book':
      return (
        <CollectionBook
          pokemon={pokemon}
          caught={caught}
          allCaught={child?.allCaught ?? false}
          onPlay={(id, lang) => void audio.playSequence([`name:${lang}:${id}`])}
          onClose={() => setMode({ kind: 'explore' })}
        />
      )
    default:
      return null
  }
}
