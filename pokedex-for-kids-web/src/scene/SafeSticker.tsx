// 貼紙圖片載入失敗（例如網路中斷）時不讓整個 3D 場景當掉：先不顯示，過幾秒再重試。
import { Component, Suspense, type ReactNode } from 'react'
import { useTexture } from '@react-three/drei'
import { stickerUrl } from '@/content/types'
import { Sticker } from './Sticker'

class Boundary extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false }
  private timer: ReturnType<typeof setTimeout> | null = null
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.timer = setTimeout(() => {
      this.props.onRetry()
      this.setState({ failed: false })
    }, 3000)
  }
  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function SafeSticker(props: Parameters<typeof Sticker>[0]) {
  return (
    <Boundary onRetry={() => useTexture.clear(stickerUrl(props.id))}>
      <Suspense fallback={null}>
        <Sticker {...props} />
      </Suspense>
    </Boundary>
  )
}
