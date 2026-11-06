// 虛擬搖桿（觸控裝置）：把方向寫進 3D 場景的暫態資料。鍵盤與點擊地面另外處理。
import { useEffect, useRef, useState } from 'react'
import { isMoveKey, runtime } from '@/scene/runtime'
import styles from './Joystick.module.css'

export function Joystick({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  // 鍵盤：方向鍵與 WASD
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!enabled || !isMoveKey(e.key)) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      runtime.keys.add(e.key.toLowerCase())
      e.preventDefault()
    }
    const up = (e: KeyboardEvent) => runtime.keys.delete(e.key.toLowerCase())
    const clear = () => runtime.keys.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      clear()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      runtime.joy.x = runtime.joy.y = 0
      setKnob({ x: 0, y: 0 })
    }
  }, [enabled])

  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    let x = e.clientX - r.left - r.width / 2
    let y = e.clientY - r.top - r.height / 2
    const max = r.width / 2 - 20
    const len = Math.hypot(x, y)
    if (len > max) {
      x = (x / len) * max
      y = (y / len) * max
    }
    setKnob({ x, y })
    runtime.joy.x = x / max
    runtime.joy.y = y / max
    runtime.target = null
  }
  const release = () => {
    runtime.joy.x = runtime.joy.y = 0
    setKnob({ x: 0, y: 0 })
  }

  return (
    <div
      ref={ref}
      className={styles.joystick}
      aria-hidden
      onPointerDown={(e) => {
        if (!enabled) return
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={(e) => enabled && e.currentTarget.hasPointerCapture(e.pointerId) && move(e)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className={styles.knob} style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
