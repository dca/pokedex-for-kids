'use client'
// 視窗大小改變時更新 --ui（第一次的值由 layout <head> 的 inline script 先設好）
import { useEffect } from 'react'
import { uiScale } from './scale'

export function UiScale() {
  useEffect(() => {
    const apply = () => document.documentElement.style.setProperty('--ui', String(uiScale(window.innerWidth, window.innerHeight)))
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])
  return null
}
