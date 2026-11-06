// 前端使用的靜態內容（由 npm run content 產生的 public/data/*.json）。
export interface Syllable {
  char: string
  isHan: boolean
  zhuyin: string
  tone: number
}

export interface Pokemon {
  id: number
  name: string
  en: string
  zone: 'meadow' | 'beach' | 'forest' | 'hill'
  rare: boolean
  evolvesTo: number | null
  syllables: Syllable[]
}

export interface Zone {
  id: Pokemon['zone']
  name: string
  stage: 'learn' | 'spell' | 'read'
  order: number
}

export const ZONE_NAMES: Record<Zone['id'], string> = {
  meadow: '新手草原',
  beach: '泡泡海灘',
  forest: '拼音森林',
  hill: '文字山丘',
}

export const STAGE_LABEL: Record<Zone['stage'], string> = {
  learn: '🌱 學注音',
  spell: '🌿 拼注音',
  read: '🌳 認字',
}

export const ZONE_STAGE: Record<Zone['id'], Zone['stage']> = {
  meadow: 'learn',
  beach: 'learn',
  forest: 'spell',
  hill: 'read',
}

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
export const stickerUrl = (id: number) => `${basePath}/pokemon/${String(id).padStart(3, '0')}.webp`
