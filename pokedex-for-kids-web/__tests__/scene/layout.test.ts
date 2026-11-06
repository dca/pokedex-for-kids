import { allPatches, pickActivePatch, walkable, zoneAt, zoneSpawn, ZONES, START, ISLAND_RADIUS } from '@/scene/layout'

describe('island layout', () => {
  it('四個扇形區域', () => {
    expect(zoneAt(0, 10)).toBe('meadow')
    expect(zoneAt(10, 0)).toBe('hill')
    expect(zoneAt(0, -10)).toBe('forest')
    expect(zoneAt(-10, 0)).toBe('beach')
    expect(zoneAt(0.5, 0.5)).toBe('meadow') // 中央廣場
  })

  it('草叢與道館都在自己的區域裡，而且在島上', () => {
    for (const z of ZONES) {
      for (const [x, pz] of [...z.patches, z.gym]) {
        expect(zoneAt(x, pz)).toBe(z.id)
        expect(Math.hypot(x, pz)).toBeLessThan(ISLAND_RADIUS - 1)
      }
    }
  })

  it('未開放的區域走不進去，中央廣場永遠可以走', () => {
    expect(walkable(...START, ['meadow'])).toBe(true)
    expect(walkable(10, 0, ['meadow'])).toBe(false)
    expect(walkable(10, 0, ['meadow', 'hill'])).toBe(true)
    expect(walkable(1, 0, ['meadow'])).toBe(true)
    expect(walkable(0, ISLAND_RADIUS, ['meadow'])).toBe(false)
  })

  it('區域的出生點在區域內且可以走', () => {
    for (const z of ZONES) {
      const [x, pz] = zoneSpawn(z.id)
      expect(zoneAt(x, pz)).toBe(z.id)
      expect(walkable(x, pz, [z.id])).toBe(true)
    }
  })

  it('挑選會晃動的草叢：在同一區、避開上一叢', () => {
    const prev = allPatches().find((p) => p.zone === 'meadow' && p.index === 0)!
    for (let i = 0; i < 20; i++) {
      const p = pickActivePatch('meadow', prev, () => i / 20)
      expect(p.zone).toBe('meadow')
      expect(p.index).not.toBe(0)
    }
  })
})
