import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CatchOverlay } from '@/components/CatchOverlay'
import { CollectionBook } from '@/components/CollectionBook'
import { PartnerPicker } from '@/components/PartnerPicker'
import { StartScreen } from '@/components/StartScreen'
import { ConnectionOverlay, GymResult } from '@/components/Overlays'
import type { Pokemon } from '@/content/types'

const pika: Pokemon = {
  id: 25,
  name: '皮卡丘',
  en: 'Pikachu',
  zone: 'forest',
  rare: true,
  evolvesTo: null,
  syllables: [
    { char: '皮', isHan: true, zhuyin: 'ㄆㄧˊ', tone: 2 },
    { char: '卡', isHan: true, zhuyin: 'ㄎㄚˇ', tone: 3 },
    { char: '丘', isHan: true, zhuyin: 'ㄑㄧㄡ', tone: 1 },
  ],
}
const mon = (id: number, name: string): Pokemon => ({ ...pika, id, name, rare: false })

describe('CatchOverlay', () => {
  it('顯示名稱、注音與星星，按鈕可用', async () => {
    const onContinue = jest.fn()
    render(<CatchOverlay pokemon={pika} stars={2} newlyCaught reducedMotion onContinue={onContinue} onOpenBook={jest.fn()} />)
    expect(screen.getByRole('heading', { name: '收服了皮卡丘！' })).toBeInTheDocument()
    expect(screen.getByLabelText('2 顆星')).toBeInTheDocument()
    expect(screen.getByText('新的寶可夢！')).toBeInTheDocument()
    expect(screen.getByAltText('皮卡丘')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '繼續探索' }))
    expect(onContinue).toHaveBeenCalled()
  })
})

describe('CollectionBook', () => {
  const list = [mon(1, '妙蛙種子'), mon(2, '妙蛙草'), pika]
  it('已收服顯示名稱、未收服顯示？？？、三星有金框', () => {
    render(<CollectionBook pokemon={list} caught={new Map([[1, 3], [25, 1]])} allCaught={false} onPlay={jest.fn()} onClose={jest.fn()} />)
    expect(screen.getByText('已收集 2 ／ 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '妙蛙種子，3 顆星' }).className).toMatch(/gold/)
    expect(screen.getByRole('button', { name: '第 2 號，還沒收服' })).toBeDisabled()
    expect(screen.getByText('？？？')).toBeInTheDocument()
  })

  it('點已收服的寶可夢可以重聽中英文名稱', async () => {
    const onPlay = jest.fn()
    render(<CollectionBook pokemon={list} caught={new Map([[25, 2]])} allCaught={false} onPlay={onPlay} onClose={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '皮卡丘，2 顆星' }))
    await userEvent.click(screen.getByRole('button', { name: '🔊 中文' }))
    await userEvent.click(screen.getByRole('button', { name: '🔊 English' }))
    expect(onPlay.mock.calls).toEqual([
      [25, 'zh'],
      [25, 'en'],
    ])
    expect(screen.getByText('Pikachu')).toBeInTheDocument()
  })
})

describe('PartnerPicker', () => {
  it('先選再確認', async () => {
    const onConfirm = jest.fn()
    const onPreview = jest.fn()
    render(<PartnerPicker starters={[mon(1, '妙蛙種子'), mon(4, '小火龍'), mon(7, '傑尼龜')]} onPreview={onPreview} onConfirm={onConfirm} />)
    const confirm = screen.getByRole('button', { name: '就是你了！' })
    expect(confirm).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '小火龍' }))
    expect(onPreview).toHaveBeenCalledWith(4)
    await userEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledWith(4)
  })
})

describe('StartScreen', () => {
  it('按開始', async () => {
    const onStart = jest.fn()
    render(<StartScreen loading={false} onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: '開始' }))
    expect(onStart).toHaveBeenCalled()
  })

  it('有多個小朋友時顯示頭像', async () => {
    const onPick = jest.fn()
    const kids = [
      { id: 'a', nickname: '哥哥', avatar: 'avatar-02', startStage: 'read' as const, createdAt: '' },
      { id: 'b', nickname: '妹妹', avatar: 'avatar-03', startStage: 'learn' as const, createdAt: '' },
    ]
    render(<StartScreen loading={false} onStart={jest.fn()} childList={kids} onPickChild={onPick} />)
    await userEvent.click(screen.getByRole('button', { name: '妹妹' }))
    expect(onPick).toHaveBeenCalledWith('b')
  })
})

describe('其他畫面', () => {
  it('連線中', () => {
    const { rerender } = render(<ConnectionOverlay visible={false} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    rerender(<ConnectionOverlay visible />)
    expect(screen.getByRole('status')).toHaveTextContent('連線中')
  })

  it('道館沒通過用鼓勵的語氣', () => {
    render(<GymResult zoneName="新手草原" correctCount={7} passed={false} badgeEarned={false} onClose={jest.fn()} />)
    expect(screen.getByText('答對 7 ／ 10 題')).toBeInTheDocument()
    expect(screen.getByRole('heading')).toHaveTextContent('再多練習一下')
  })
})
