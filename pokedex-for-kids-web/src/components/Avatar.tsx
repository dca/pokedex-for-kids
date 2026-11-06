// 預設頭像：12 種動物與底色，不使用照片（spec Assumptions：不收集個人資料）。
const AVATARS: Record<string, [string, string]> = {
  'avatar-01': ['🐱', '#FFE3A3'],
  'avatar-02': ['🐶', '#CDEBFF'],
  'avatar-03': ['🐰', '#FFD6E0'],
  'avatar-04': ['🐻', '#E6D3C3'],
  'avatar-05': ['🐼', '#E7F7E1'],
  'avatar-06': ['🦊', '#FFE0C2'],
  'avatar-07': ['🐸', '#D4F5C9'],
  'avatar-08': ['🐯', '#FFF1B8'],
  'avatar-09': ['🐨', '#E2E6F0'],
  'avatar-10': ['🐵', '#F5DFC8'],
  'avatar-11': ['🐧', '#D9F1FF'],
  'avatar-12': ['🐤', '#FFF6C2'],
}

export const AVATAR_IDS = Object.keys(AVATARS)

export function Avatar({ id, size = 56 }: { id: string; size?: number }) {
  const [emoji, bg] = AVATARS[id] ?? AVATARS['avatar-01']
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        border: '3px solid var(--ink)',
        display: 'inline-grid',
        placeItems: 'center',
        fontSize: size * 0.58,
        flex: 'none',
      }}
    >
      {emoji}
    </span>
  )
}
