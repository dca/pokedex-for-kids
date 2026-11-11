// 遭遇流程：預先向伺服器建立遭遇 → 走進草叢時出場 → 依狀態機處理作答 → 送出作答與結算（research R5）。
import { useCallback, useEffect, useRef } from 'react'
import type { Encounter, EncounterResult, Question, ZoneId } from '@/api/types'
import { startChallenge, stepChallenge, type ChallengeEffect } from '@/game/challenge'
import { api, audio } from '@/services'
import { useGame, type Notice } from '@/stores/game'
import { useSession } from '@/stores/session'
import { ZONE_NAMES } from '@/content/types'
import { pickActivePatch, wildSpot, type PatchRef } from '@/scene/layout'
import { runtime } from '@/scene/runtime'

const INTRO_MS = 1600
const NEXT_MS = 1400

const promptAudio = (q: Question) => q.prompt.flatMap((p) => (p.kind === 'audio' && p.audioKey ? [p.audioKey] : []))

export function useEncounterFlow() {
  const prefetch = useRef<{ zone: ZoneId; promise: Promise<Encounter> } | null>(null)
  const startedAt = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const childId = useSession((s) => s.childId)

  /** 預先建立下一次的野生遭遇，走進草叢時不必等網路 */
  const prefetchFor = useCallback(
    (zone: ZoneId) => {
      if (!childId || prefetch.current?.zone === zone) return
      const promise = api.request<Encounter>('POST', `/children/${childId}/encounters`, { zone, kind: 'wild' })
      promise.catch(() => undefined)
      prefetch.current = { zone, promise }
    },
    [childId],
  )

  const begin = useCallback((encounter: Encounter, at: { x: number; z: number }) => {
    const g = useGame.getState()
    runtime.focus = at
    runtime.target = null
    g.setWildAt(at)
    g.setMode({ kind: 'intro', encounter })
    const intro = encounter.kind === 'gym' ? ['prompt:gym-intro'] : ['prompt:encounter', `name:zh:${encounter.pokemonId}`]
    void audio.playSequence(intro)
    later(() => {
      useGame.getState().setMode({ kind: 'question', encounter, challenge: startChallenge(encounter.questions) })
      startedAt.current = Date.now()
      void audio.playSequence(promptAudio(encounter.questions[0]))
    }, INTRO_MS)
  }, [])

  const enterPatch = useCallback(
    async (patch: PatchRef) => {
      const g = useGame.getState()
      if (g.mode.kind !== 'explore' || !childId) return
      g.setMode({ kind: 'intro', encounter: { id: '', childId, zone: patch.zone, kind: 'wild', pokemonId: 0, questions: [] } })
      const pre = prefetch.current?.zone === patch.zone ? prefetch.current.promise : null
      prefetch.current = null
      try {
        const encounter = await (pre ?? api.request<Encounter>('POST', `/children/${childId}/encounters`, { zone: patch.zone, kind: 'wild' }))
        begin(encounter, wildSpot(patch))
      } catch {
        useGame.getState().setMode({ kind: 'explore' })
      }
    },
    [begin, childId],
  )

  const startGym = useCallback(
    async (zone: ZoneId, at: { x: number; z: number }) => {
      if (!childId) return
      const encounter = await api.request<Encounter>('POST', `/children/${childId}/encounters`, { zone, kind: 'gym' })
      begin(encounter, at)
    },
    [begin, childId],
  )

  const finish = useCallback(async (encounter: Encounter) => {
    const result = await api.enqueue<EncounterResult>('POST', `/encounters/${encounter.id}/complete`)
    const s = useSession.getState()
    s.setChild(result.state)
    const notices: Notice[] = []
    if (result.evolved) notices.push({ title: '哇！你的夥伴進化了！', pokemonId: result.evolved.toId, audio: ['prompt:evolve'] })
    for (const z of result.newlyUnlockedZones) notices.push({ title: `新的區域開放了：${ZONE_NAMES[z]}`, audio: ['prompt:zone-open'] })
    useGame.getState().pushNotices(notices)
    if (encounter.kind === 'gym') {
      useGame.getState().setMode({ kind: 'gym-result', encounter, result })
      void audio.playSequence([result.gym?.passed ? 'prompt:gym-pass' : 'prompt:gym-retry'])
    } else {
      useGame.getState().setMode({ kind: 'catch', encounter, result })
      later(() => void audio.playSequence(['prompt:caught', `name:zh:${encounter.pokemonId}`]), 1600)
    }
  }, [])

  const runEffects = useCallback(
    (encounter: Encounter, q: Question, effects: ChallengeEffect[]) => {
      for (const e of effects) {
        if (e.kind === 'replay_prompt') void audio.playSequence(['prompt:try-again', ...promptAudio(q)])
        if (e.kind === 'reveal') void audio.playSequence(['prompt:look-here'])
        if (e.kind === 'play_correct') void audio.playSequence([...(q.audioOnAnswer ? [q.audioOnAnswer] : []), 'prompt:great'])
        if (e.kind === 'submit_answer') {
          const durationMs = Math.min(600000, Date.now() - startedAt.current)
          void api.enqueue('PUT', `/encounters/${encounter.id}/answers/${e.index}`, { wrongCount: e.wrongCount, durationMs })
          later(() => next(encounter), NEXT_MS)
        }
        if (e.kind === 'finished') void finish(encounter).catch(() => useGame.getState().setMode({ kind: 'explore' }))
      }
    },
    // next 在下方定義，透過 ref 呼叫避免循環依賴
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finish],
  )

  const next = (encounter: Encounter) => {
    const m = useGame.getState().mode
    if (m.kind !== 'question') return
    const r = stepChallenge(encounter.questions, m.challenge, { kind: 'next' })
    useGame.getState().setMode({ kind: 'question', encounter, challenge: r.state })
    if (r.state.phase === 'asking') {
      startedAt.current = Date.now()
      void audio.playSequence(promptAudio(encounter.questions[r.state.index]))
    }
    runEffects(encounter, encounter.questions[0], r.effects)
  }

  const select = useCallback(
    (optionId: string) => {
      const m = useGame.getState().mode
      if (m.kind !== 'question' || m.challenge.phase === 'done') return
      const q = m.encounter.questions[m.challenge.index]
      const r = stepChallenge(m.encounter.questions, m.challenge, { kind: 'select', optionId })
      if (r.state === m.challenge) return
      useGame.getState().setMode({ ...m, challenge: r.state })
      runEffects(m.encounter, q, r.effects)
    },
    [runEffects],
  )

  const replay = useCallback(() => {
    const m = useGame.getState().mode
    if (m.kind === 'question' && m.challenge.phase !== 'done') void audio.playSequence(promptAudio(m.encounter.questions[m.challenge.index]))
  }, [])

  /** 回到探索：換一叢晃動的草叢，並預先建立下一次遭遇 */
  const backToExplore = useCallback(() => {
    const g = useGame.getState()
    runtime.focus = null
    g.setWildAt(null)
    g.setActivePatch(pickActivePatch(g.zone, g.activePatch, Math.random))
    g.setMode({ kind: 'explore' })
    prefetch.current = null
    prefetchFor(g.zone)
  }, [prefetchFor])

  return { prefetchFor, enterPatch, startGym, select, replay, backToExplore, resetPrefetch: () => (prefetch.current = null) }
}
