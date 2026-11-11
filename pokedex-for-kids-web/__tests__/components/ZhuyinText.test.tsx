import { render, screen } from '@testing-library/react'
import { ZhuyinText } from '@/components/ZhuyinText'

describe('ZhuyinText', () => {
  it('依分類上色', () => {
    const { container } = render(<ZhuyinText zhuyin="ㄑㄧㄡ" />)
    const spans = container.querySelectorAll('span > span')
    expect([...spans].map((s) => s.className)).toEqual(['t-initial', 't-medial', 't-final'])
  })

  it('聲調上色', () => {
    render(<ZhuyinText zhuyin="ㄎㄚˇ" />)
    expect(screen.getByText('ˇ')).toHaveClass('t-tone')
  })

  it('挖空顯示空格，答對後填入答案', () => {
    const { rerender } = render(<ZhuyinText zhuyin="ㄑ＿ㄡ" />)
    expect(screen.getByLabelText('ㄑ空格ㄡ')).toBeInTheDocument()
    expect(screen.queryByText('ㄧ')).not.toBeInTheDocument()
    rerender(<ZhuyinText zhuyin="ㄑ＿ㄡ" fill={['ㄧ']} />)
    expect(screen.getByText('ㄧ')).toHaveClass('t-medial')
  })

  it('直排：輕聲點在最前面，其他聲調在最後', () => {
    const { container, rerender } = render(<ZhuyinText zhuyin="˙ㄉㄜ" layout="vertical" />)
    expect(container.textContent).toBe('˙ㄉㄜ')
    rerender(<ZhuyinText zhuyin="ㄎㄚˇ" layout="vertical" />)
    expect(container.textContent).toBe('ㄎㄚˇ')
  })
})
