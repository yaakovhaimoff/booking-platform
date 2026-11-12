import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckoutForm from './CheckoutForm'

// The labels are not linked to their inputs, so the fields are found by position: name, then phone.
function setup(props = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  const { container } = render(<CheckoutForm onSubmit={onSubmit} {...props} />)
  const [nameField, phoneField] = container.querySelectorAll('input[type="text"]')
  const submit = () => user.click(screen.getByRole('button'))
  return { onSubmit, user, nameField, phoneField, submit }
}

describe('phone validation', () => {
  it.each(['123456', '1234567890', '123456789012345'])('accepts %s', async phone => {
    const { onSubmit, user, nameField, phoneField, submit } = setup()
    await user.type(nameField, 'Ann')
    await user.type(phoneField, phone)
    await submit()

    expect(onSubmit).toHaveBeenCalledWith('Ann', phone, '')
  })

  it.each(['12345', '1234567890123456'])('rejects %s as the wrong length without calling the server', async phone => {
    const { onSubmit, user, nameField, phoneField, submit } = setup()
    await user.type(nameField, 'Ann')
    await user.type(phoneField, phone)
    await submit()

    expect(screen.getByText('Phone must have 6 to 15 digits.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each(['12345a', '+393331234567', '333 111 2222'])('rejects %s because it is not only digits', async phone => {
    const { onSubmit, user, nameField, phoneField, submit } = setup()
    await user.type(nameField, 'Ann')
    await user.type(phoneField, phone)
    await submit()

    expect(screen.getByText('Phone must contain digits only.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('requires a phone', async () => {
    const { onSubmit, user, nameField, submit } = setup()
    await user.type(nameField, 'Ann')
    await submit()

    expect(screen.getByText('Phone is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('trims spaces around an otherwise valid phone', async () => {
    const { onSubmit, user, nameField, phoneField, submit } = setup()
    await user.type(nameField, '  Ann ')
    await user.type(phoneField, ' 3331112222 ')
    await submit()

    expect(onSubmit).toHaveBeenCalledWith('Ann', '3331112222', '')
  })
})

describe('name validation', () => {
  it('requires a name and caps it at 100 characters', async () => {
    const first = setup()
    await first.user.type(first.phoneField, '3331112222')
    await first.submit()
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(first.onSubmit).not.toHaveBeenCalled()
  })

  it('refuses a name longer than 100 characters', async () => {
    const { onSubmit, user, nameField, phoneField, submit } = setup()
    await user.click(nameField)
    await user.paste('n'.repeat(101))
    await user.type(phoneField, '3331112222')
    await submit()

    expect(screen.getByText('Name must be 100 characters or fewer.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('signed-in customers', () => {
  it('are not asked again and their saved details are sent', async () => {
    const { onSubmit, nameField, phoneField, submit } = setup({ knownName: 'Ann', knownPhone: '3331112222' })

    expect(nameField).toBeUndefined()
    expect(phoneField).toBeUndefined()
    await submit()

    expect(onSubmit).toHaveBeenCalledWith('Ann', '3331112222', '')
  })

  it('still rejects a saved phone that is the wrong length', async () => {
    const { onSubmit, submit } = setup({ knownName: 'Ann', knownPhone: '123' })
    await submit()

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
