// 第一次玩：從妙蛙種子、小火龍、傑尼龜選一隻夥伴（FR-040）。
import { useEffect, useMemo, useState } from 'react'
import type { ChildState } from '@/api/types'
import { PartnerPicker } from '@/components/PartnerPicker'
import { api, audio } from '@/services'
import { useSession } from '@/stores/session'

export function PartnerContainer() {
  const pokemon = useSession((s) => s.pokemon)
  const childId = useSession((s) => s.childId)
  const setChild = useSession((s) => s.setChild)
  const [busy, setBusy] = useState(false)
  const starters = useMemo(() => pokemon.filter((p) => [1, 4, 7].includes(p.id)), [pokemon])

  useEffect(() => {
    void audio.playSequence(['prompt:partner-pick'])
  }, [])

  return (
    <PartnerPicker
      starters={starters}
      busy={busy}
      onPreview={(id) => void audio.playSequence([`name:zh:${id}`])}
      onConfirm={async (id) => {
        if (!childId) return
        setBusy(true)
        try {
          setChild(await api.request<ChildState>('POST', `/children/${childId}/partner`, { pokemonId: id }))
        } finally {
          setBusy(false)
        }
      }}
    />
  )
}
