import { UI_SCALE_SCRIPT, uiScale } from '@/components/scale'
import { distanceScale } from '@/scene/CameraRig'
import { nearSightLine } from '@/scene/Decor'
import { ENCOUNTER_MAX_SCALE, ENCOUNTER_OFFSET, encounterSpots, gymSpot, wildSpot, ZONES } from '@/scene/layout'

describe('uiScale', () => {
  it('基準尺寸為 1，大螢幕放大、上限 1.6', () => {
    expect(uiScale(1180, 820)).toBe(1)
    expect(uiScale(1770, 1230)).toBe(1.5)
    expect(uiScale(3840, 2160)).toBe(1.6)
  })

  it('小視窗不縮小（按鈕維持至少 80px）', () => {
    expect(uiScale(1000, 700)).toBe(1)
    expect(uiScale(700, 600)).toBe(1)
    expect(uiScale(390, 844)).toBe(1)
    expect(uiScale(1366, 1024)).toBe(1.16)
  })

  it('<head> 的 inline script 算出的比例和 uiScale 一致', () => {
    for (const [w, h] of [[1180, 820], [1800, 1120], [700, 600], [3840, 2160], [1366, 1024]]) {
      const style = new Map<string, string>()
      const run = new Function('innerWidth', 'innerHeight', 'document', UI_SCALE_SCRIPT)
      run(w, h, { documentElement: { style: { setProperty: (k: string, v: string) => style.set(k, v) } } })
      expect(Number(style.get('--ui'))).toBe(uiScale(w, h))
    }
  })
})

describe('distanceScale', () => {
  it('視窗越窄鏡頭越遠，連續變化', () => {
    const wide = distanceScale(16 / 9, false)
    const tablet = distanceScale(1.45, false)
    const square = distanceScale(1, false)
    const phone = distanceScale(390 / 844, false)
    expect(tablet).toBe(1)
    expect(wide).toBeLessThan(tablet)
    expect(square).toBeGreaterThan(tablet)
    expect(phone).toBeGreaterThan(square)
    expect(distanceScale(0.1, false)).toBe(1.6)
    expect(distanceScale(5, false)).toBe(0.85)
  })

  it('遭遇時拉近的距離也隨寬高比調整', () => {
    expect(distanceScale(1.45, true)).toBe(1)
    expect(distanceScale(16 / 9, true)).toBe(1) // 寬螢幕遭遇時不比基準更近
    expect(distanceScale(0.46, true)).toBe(ENCOUNTER_MAX_SCALE)
  })
})

describe('遭遇視線', () => {
  const [ox, , oz] = ENCOUNTER_OFFSET

  it('遭遇位置包含所有草叢與道館', () => {
    const spots = encounterSpots()
    expect(spots).toHaveLength(ZONES.reduce((n, z) => n + z.patches.length, 0) + ZONES.length)
    expect(spots).toContainEqual(wildSpot({ x: ZONES[0].patches[0][0], z: ZONES[0].patches[0][1] }))
    expect(spots).toContainEqual(gymSpot('forest'))
  })

  it('從寶可夢到最遠的鏡頭位置（窄螢幕）整條都算在視線上', () => {
    const w = { x: 2, z: 3 }
    const far = { x: w.x + ox * ENCOUNTER_MAX_SCALE, z: w.z + oz * ENCOUNTER_MAX_SCALE }
    expect(nearSightLine(w.x, w.z, w.x, w.z)).toBe(true)
    expect(nearSightLine((w.x + far.x) / 2, (w.z + far.z) / 2, w.x, w.z)).toBe(true)
    expect(nearSightLine(far.x, far.z, w.x, w.z)).toBe(true)
    // 寶可夢背後、或偏離視線的位置不受影響
    expect(nearSightLine(w.x - ox, w.z - oz, w.x, w.z)).toBe(false)
    expect(nearSightLine(w.x + oz, w.z - ox, w.x, w.z)).toBe(false)
  })
})
