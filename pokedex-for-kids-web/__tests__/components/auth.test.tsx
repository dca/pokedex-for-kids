import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CredentialForm, RescueCodeNotice, ResetPasswordForm } from '@/components/auth/AuthForms'
import { ChildForm, DeleteConfirm } from '@/components/ChildForm'

describe('CredentialForm', () => {
  it('欄位錯誤顯示在旁邊，不送出', async () => {
    const onSubmit = jest.fn()
    render(<CredentialForm mode="register" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('帳號名稱'), 'ab')
    await userEvent.type(screen.getByLabelText('密碼'), 'short')
    await userEvent.click(screen.getByRole('button', { name: '註冊' }))
    expect(screen.getByText('帳號名稱至少 3 個字元')).toBeInTheDocument()
    expect(screen.getByText('密碼至少 8 個字元')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('格式正確時送出；訪客登入預設帶入進度', async () => {
    const onSubmit = jest.fn()
    render(<CredentialForm mode="login" guest onSubmit={onSubmit} serverError="帳號或密碼不正確" />)
    expect(screen.getByRole('alert')).toHaveTextContent('帳號或密碼不正確')
    await userEvent.type(screen.getByLabelText('帳號名稱'), 'family')
    await userEvent.type(screen.getByLabelText('密碼'), 'whatever')
    await userEvent.click(screen.getByRole('button', { name: '登入' }))
    expect(onSubmit).toHaveBeenCalledWith({ username: 'family', password: 'whatever', bringGuestChildren: true })
  })
})

describe('RescueCodeNotice', () => {
  it('勾選「已存好」才能繼續', async () => {
    const onDone = jest.fn()
    render(<RescueCodeNotice code="7K3M-Q9TB-2WXR-H4ZD" onDone={onDone} />)
    expect(screen.getByTestId('rescue-code')).toHaveTextContent('7K3M-Q9TB-2WXR-H4ZD')
    const next = screen.getByRole('button', { name: '我已保存，繼續' })
    expect(next).toBeDisabled()
    await userEvent.click(screen.getByLabelText('我已經把救援碼存好了'))
    await userEvent.click(next)
    expect(onDone).toHaveBeenCalled()
  })
})

describe('ResetPasswordForm', () => {
  it('救援碼長度檢查（忽略連字號）', async () => {
    const onSubmit = jest.fn()
    render(<ResetPasswordForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('帳號名稱'), 'family')
    await userEvent.type(screen.getByLabelText('救援碼'), '7K3M-Q9TB-2WXR-H4ZD')
    await userEvent.type(screen.getByLabelText('新密碼'), 'newpassword')
    await userEvent.click(screen.getByRole('button', { name: '重設密碼' }))
    expect(onSubmit).toHaveBeenCalledWith({ username: 'family', rescueCode: '7K3M-Q9TB-2WXR-H4ZD', newPassword: 'newpassword' })
  })
})

describe('ChildForm', () => {
  it('選暱稱、頭像、起始階段', async () => {
    const onSubmit = jest.fn()
    render(<ChildForm withStage submitLabel="建立" onSubmit={onSubmit} onCancel={jest.fn()} />)
    await userEvent.type(screen.getByLabelText('暱稱（不用填真實姓名）'), '妹妹')
    await userEvent.click(screen.getByRole('button', { name: '頭像 03' }))
    await userEvent.click(screen.getByLabelText(/認字/))
    await userEvent.click(screen.getByRole('button', { name: '建立' }))
    expect(onSubmit).toHaveBeenCalledWith({ nickname: '妹妹', avatar: 'avatar-03', startStage: 'read' })
  })

  it('暱稱不能空白', async () => {
    const onSubmit = jest.fn()
    render(<ChildForm withStage={false} submitLabel="儲存" onSubmit={onSubmit} onCancel={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '儲存' }))
    expect(screen.getByRole('alert')).toHaveTextContent('暱稱要 1～10 個字')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('DeleteConfirm', () => {
  it('說明進度會一起刪除，要輸入密碼', async () => {
    const onConfirm = jest.fn()
    render(<DeleteConfirm what="「妹妹」" onConfirm={onConfirm} onCancel={jest.fn()} />)
    expect(screen.getByText(/所有進度都會一起刪除/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刪除' })).toBeDisabled()
    await userEvent.type(screen.getByLabelText('請輸入密碼確認'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '刪除' }))
    expect(onConfirm).toHaveBeenCalledWith('password123')
  })
})
