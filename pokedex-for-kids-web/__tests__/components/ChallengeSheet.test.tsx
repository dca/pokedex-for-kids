import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChallengeSheet, promptText } from '@/components/ChallengeSheet'
import type { Question } from '@/api/types'
import type { ChallengeState } from '@/game/challenge'

const firstSound: Question = {
  type: 'first_sound',
  pokemonId: 25,
  itemIds: ['sym:ㄆ'],
  prompt: [
    { kind: 'audio', audioKey: 'name:zh:25' },
    { kind: 'audio', audioKey: 'prompt:first-sound' },
    { kind: 'text', text: '皮卡丘的第一個音是哪一個？' },
  ],
  display: {
    layout: 'horizontal',
    showSpeaker: true,
    cells: [
      { char: '皮', zhuyin: null, blank: 'none' },
      { char: '卡', zhuyin: null, blank: 'none' },
      { char: '丘', zhuyin: null, blank: 'none' },
    ],
  },
  options: [
    { id: 'ㄅ', label: 'ㄅ', category: 'initial' },
    { id: 'ㄆ', label: 'ㄆ', category: 'initial' },
  ],
  answer: ['ㄆ'],
}

const fillChar: Question = {
  ...firstSound,
  type: 'fill_char',
  prompt: [{ kind: 'audio', audioKey: 'prompt:fill-char' }],
  display: {
    layout: 'vertical',
    showSpeaker: true,
    cells: [
      { char: '皮', zhuyin: 'ㄆㄧˊ', blank: 'none' },
      { char: null, zhuyin: 'ㄎㄚˇ', blank: 'char' },
      { char: '丘', zhuyin: 'ㄑㄧㄡ', blank: 'none' },
    ],
  },
  options: [
    { id: '卡', label: '卡' },
    { id: '下', label: '下' },
  ],
  answer: ['卡'],
}

const asking = (over: Partial<Extract<ChallengeState, { phase: 'asking' }>> = {}): ChallengeState => ({
  phase: 'asking',
  index: 0,
  wrongCount: 0,
  disabled: [],
  picked: [],
  ...over,
})

function renderSheet(question: Question, state: ChallengeState) {
  const onSelect = jest.fn()
  const onSpeak = jest.fn()
  render(<ChallengeSheet question={question} state={state} index={0} total={1} stageLabel="🌱 學注音" onSelect={onSelect} onSpeak={onSpeak} />)
  return { onSelect, onSpeak }
}

describe('ChallengeSheet', () => {
  it('顯示題目文字、名稱（不顯示注音），點選項送出', async () => {
    const { onSelect } = renderSheet(firstSound, asking())
    expect(screen.getByText('皮卡丘的第一個音是哪一個？')).toBeInTheDocument()
    expect(screen.queryByText('ㄧ')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'ㄆ' }))
    expect(onSelect).toHaveBeenCalledWith('ㄆ')
  })

  it('重聽按鈕', async () => {
    const { onSpeak } = renderSheet(firstSound, asking())
    await userEvent.click(screen.getByRole('button', { name: '再聽一次題目' }))
    expect(onSpeak).toHaveBeenCalled()
  })

  it('答錯的選項不能再點，並顯示鼓勵', () => {
    renderSheet(firstSound, asking({ wrongCount: 1, disabled: ['ㄅ'] }))
    expect(screen.getByRole('button', { name: 'ㄅ' })).toBeDisabled()
    expect(screen.getByText('再聽一次喔。')).toBeInTheDocument()
  })

  it('第二次錯時標示答案', () => {
    renderSheet(firstSound, { phase: 'reveal', index: 0, wrongCount: 2, correctId: 'ㄆ', picked: [] })
    expect(screen.getByRole('button', { name: 'ㄆ，答案在這裡' })).toBeInTheDocument()
  })

  it('答對後在空格填入答案', () => {
    renderSheet(fillChar, { phase: 'correct', index: 0, wrongCount: 0 })
    expect(screen.getAllByLabelText('卡')).toHaveLength(2) // 填好的空格與選項
    expect(screen.getByText('好棒！')).toBeInTheDocument()
  })

  it('沒有文字片段時使用固定語句', () => {
    expect(promptText(fillChar)).toBe('缺了哪一個字呢？')
  })

  it('選項至少有鍵盤可以操作的按鈕', async () => {
    const { onSelect } = renderSheet(firstSound, asking())
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('ㄅ')
  })
})
