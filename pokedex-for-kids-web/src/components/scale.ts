// 介面縮放比例（CSS 變數 --ui）：以 1180×820 為基準，大螢幕放大、上限 1.6。
// 不縮小到 1 以下，讓小朋友會按的按鈕維持至少 80px（FR-081）；放不下的面板改成捲動，手機另外有專用版面。
// 這個檔案不是 client component，伺服器端的 layout 才能直接拿到 inline script 字串。
const BASE_W = 1180
const BASE_H = 820
const MAX = 1.6

export function uiScale(width: number, height: number): number {
  const raw = Math.min(width / BASE_W, height / BASE_H)
  return Math.round(Math.min(MAX, Math.max(1, raw)) * 100) / 100
}

/** 放在 <head> 的 inline script：在第一次繪製前就設好 --ui，避免畫面先以 1 倍畫出再跳到正確比例 */
export const UI_SCALE_SCRIPT = `(function(){var r=Math.min(innerWidth/${BASE_W},innerHeight/${BASE_H});document.documentElement.style.setProperty('--ui',String(Math.round(Math.min(${MAX},Math.max(1,r))*100)/100))})()`
