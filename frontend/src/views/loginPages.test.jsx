import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PartnerLoginPage from './partner/PartnerLoginPage'
import ConsumerAuthPage from './consumer/ConsumerAuthPage'
import { authToken, logout, signIn } from '../auth'
import { jsonResponse, loginResponse } from '../test/tokens'

beforeEach(() => {
  act(() => logout())
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  act(() => logout())
  vi.unstubAllGlobals()
})

const phoneField = () => document.querySelector('input[type="tel"]')

async function openLogin(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/partner" element={<PartnerLoginPage />} />
        <Route path="/auth" element={<ConsumerAuthPage />} />
        <Route path="/auth/routing" element={<p>owner routing</p>} />
        <Route path="/client/dashboard" element={<p>customer dashboard</p>} />
        <Route path="/for-business" element={<p>business landing</p>} />
        <Route path="/" element={<p>home</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('business login page', () => {
  it('has no passwordless demo shortcut', async () => {
    await openLogin('/partner')

    expect(screen.queryByText(/demo shop/i)).not.toBeInTheDocument()
  })

  it('signs in with the server token and goes on to owner routing', async () => {
    const response = loginResponse({ accountType: 'business' })
    fetch.mockResolvedValue(jsonResponse(200, response))
    const user = userEvent.setup()
    await openLogin('/partner')

    await user.type(screen.getByLabelText('Email'), 'owner@torni.test')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('owner routing')).toBeInTheDocument()
    expect(authToken()).toBe(response.token)
  })

  it('does not sign in a customer account', async () => {
    fetch.mockResolvedValue(jsonResponse(200, loginResponse({ accountType: 'consumer' })))
    const user = userEvent.setup()
    await openLogin('/partner')

    await user.type(screen.getByLabelText('Email'), 'ann@torni.test')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('other side of torni')
    expect(authToken()).toBeNull()
  })

  it('skips the form when an owner is already signed in', async () => {
    act(() => signIn(loginResponse({ accountType: 'business' })))
    await openLogin('/partner')

    expect(screen.getByText('owner routing')).toBeInTheDocument()
  })
})

describe('customer login page', () => {
  it('signs in with the server token and goes to the customer dashboard', async () => {
    const response = loginResponse({ accountType: 'consumer', identity: '+39333123456' })
    fetch.mockResolvedValue(jsonResponse(200, response))
    const user = userEvent.setup()
    await openLogin('/auth')

    await user.type(phoneField(), '333123456')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('customer dashboard')).toBeInTheDocument()
    expect(authToken()).toBe(response.token)
  })

  it('does not sign in an owner account', async () => {
    fetch.mockResolvedValue(jsonResponse(200, loginResponse({ accountType: 'business' })))
    const user = userEvent.setup()
    await openLogin('/auth')

    await user.type(phoneField(), '333123456')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('other side of torni'))
    expect(authToken()).toBeNull()
  })

  it('skips the form when a customer is already signed in', async () => {
    act(() => signIn(loginResponse({ accountType: 'consumer' })))
    await openLogin('/auth')

    expect(screen.getByText('customer dashboard')).toBeInTheDocument()
  })
})
