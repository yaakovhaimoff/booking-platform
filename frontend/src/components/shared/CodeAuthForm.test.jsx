import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CodeAuthForm from './CodeAuthForm'
import { jsonResponse, loginResponse } from '../../test/tokens'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function setup({ primary = 'email', accountType = 'business' } = {}) {
  const onVerified = vi.fn()
  const user = userEvent.setup()
  render(<CodeAuthForm primary={primary} accountType={accountType} onVerified={onVerified} />)
  return { onVerified, user }
}

const emailField = () => screen.getByLabelText('Email')
const phoneField = () => document.querySelector('input[type="tel"]')
const passwordField = () => screen.getByLabelText('Password')
const submitButton = name => screen.getByRole('button', { name })
const lastRequest = () => {
  const [url, options] = fetch.mock.calls.at(-1)
  return { url, body: JSON.parse(options.body) }
}

describe('validation before any request', () => {
  it('rejects an invalid email', async () => {
    const { user } = setup()
    await user.type(emailField(), 'not-an-email')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 6 characters', async () => {
    const { user } = setup()
    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), '12345')
    await user.click(submitButton('Log in'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Use at least 6 characters.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('requires a name when signing up', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('tab', { name: 'Sign up' }))
    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Sign up'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Name is required.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a phone number that is too short', async () => {
    const { user } = setup({ primary: 'phone', accountType: 'consumer' })
    await user.type(phoneField(), '123')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid phone number.')
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('logging in', () => {
  it('posts the lowercased identity with the portal account type and reports the server response', async () => {
    const response = loginResponse()
    fetch.mockResolvedValue(jsonResponse(200, response))
    const { user, onVerified } = setup()

    await user.type(emailField(), '  Owner@Torni.TEST ')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    await waitFor(() => expect(onVerified).toHaveBeenCalledWith(response))
    const { url, body } = lastRequest()
    expect(url).toMatch(/\/auth\/login$/)
    expect(body).toEqual({ identity: 'owner@torni.test', password: 'secret1', accountType: 'business' })
  })

  it('builds a phone identity from the country code and digits only', async () => {
    fetch.mockResolvedValue(jsonResponse(200, loginResponse({ accountType: 'consumer', identity: '+39333123456' })))
    const { user, onVerified } = setup({ primary: 'phone', accountType: 'consumer' })

    await user.type(phoneField(), '333 123-456')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    await waitFor(() => expect(onVerified).toHaveBeenCalled())
    expect(lastRequest().body.identity).toBe('+39333123456')
    expect(lastRequest().body.accountType).toBe('consumer')
  })

  it('refuses an account that belongs to the other portal and does not sign in', async () => {
    fetch.mockResolvedValue(jsonResponse(200, loginResponse({ accountType: 'consumer' })))
    const { user, onVerified } = setup({ accountType: 'business' })

    await user.type(emailField(), 'ann@torni.test')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    expect(await screen.findByRole('alert')).toHaveTextContent('This account is for the other side of torni')
    expect(onVerified).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'Wrong password.'],
    [404, 'No account found. Sign up first.'],
    [500, 'Could not reach the server. Try again.'],
  ])('shows the right message for a %i answer', async (status, message) => {
    fetch.mockResolvedValue(jsonResponse(status, {}))
    const { user, onVerified } = setup()

    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(onVerified).not.toHaveBeenCalled()
  })

  it('shows a server-unreachable message when the request itself fails', async () => {
    fetch.mockRejectedValue(new TypeError('offline'))
    const { user, onVerified } = setup()

    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server. Try again.')
    expect(onVerified).not.toHaveBeenCalled()
    expect(submitButton('Log in')).toBeEnabled()
  })
})

describe('signing up', () => {
  it('posts the trimmed name and portal account type and reports the server response', async () => {
    const response = loginResponse({ name: 'Owner' })
    fetch.mockResolvedValue(jsonResponse(200, response))
    const { user, onVerified } = setup()

    await user.click(screen.getByRole('tab', { name: 'Sign up' }))
    await user.type(screen.getByLabelText('Full name'), '  Owner ')
    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Sign up'))

    await waitFor(() => expect(onVerified).toHaveBeenCalledWith(response))
    const { url, body } = lastRequest()
    expect(url).toMatch(/\/auth\/signup$/)
    expect(body).toEqual({ identity: 'owner@torni.test', password: 'secret1', name: 'Owner', accountType: 'business' })
  })

  it('tells the user when the account already exists', async () => {
    fetch.mockResolvedValue(jsonResponse(409, { error: 'ACCOUNT_EXISTS' }))
    const { user, onVerified } = setup()

    await user.click(screen.getByRole('tab', { name: 'Sign up' }))
    await user.type(screen.getByLabelText('Full name'), 'Owner')
    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Sign up'))

    expect(await screen.findByRole('alert')).toHaveTextContent('An account already exists. Log in instead.')
    expect(onVerified).not.toHaveBeenCalled()
  })
})

describe('accounts created before logins moved to the server', () => {
  async function legacyHash(text) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('')
  }

  it('uploads a matching browser-only account once and signs in', async () => {
    localStorage.setItem('demo-accounts', JSON.stringify({
      'owner@torni.test': { h: await legacyHash('owner@torni.test:secret1'), name: 'Old Owner' },
    }))
    const response = loginResponse({ name: 'Old Owner' })
    fetch.mockResolvedValueOnce(jsonResponse(404, {})).mockResolvedValueOnce(jsonResponse(200, response))
    const { user, onVerified } = setup()

    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), 'secret1')
    await user.click(submitButton('Log in'))

    await waitFor(() => expect(onVerified).toHaveBeenCalledWith(response))
    expect(fetch.mock.calls[1][0]).toMatch(/\/auth\/signup$/)
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ name: 'Old Owner', accountType: 'business' })
  })

  it('does not upload when the password does not match the old local hash', async () => {
    localStorage.setItem('demo-accounts', JSON.stringify({
      'owner@torni.test': { h: await legacyHash('owner@torni.test:secret1'), name: 'Old Owner' },
    }))
    fetch.mockResolvedValue(jsonResponse(404, {}))
    const { user, onVerified } = setup()

    await user.type(emailField(), 'owner@torni.test')
    await user.type(passwordField(), 'different')
    await user.click(submitButton('Log in'))

    expect(await screen.findByRole('alert')).toHaveTextContent('No account found. Sign up first.')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(onVerified).not.toHaveBeenCalled()
  })
})
