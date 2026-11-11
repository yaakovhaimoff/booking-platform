import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import { logout, signIn } from '../auth'
import { fakeToken, loginResponse } from '../test/tokens'

function renderRoutes(element, startAt) {
  render(
    <MemoryRouter initialEntries={[startAt]}>
      <Routes>
        <Route path="/secret" element={element} />
        <Route path="/partner" element={<p>business login</p>} />
        <Route path="/auth" element={<p>customer login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => act(() => logout()))
afterEach(() => {
  act(() => logout())
  vi.unstubAllEnvs()
})

describe('ProtectedRoute', () => {
  it('sends a signed-out visitor to the business login', () => {
    renderRoutes(<ProtectedRoute type="business"><p>owner area</p></ProtectedRoute>, '/secret')

    expect(screen.getByText('business login')).toBeInTheDocument()
    expect(screen.queryByText('owner area')).not.toBeInTheDocument()
  })

  it('sends a signed-out visitor to the customer login for customer pages', () => {
    renderRoutes(<ProtectedRoute type="consumer"><p>my bookings</p></ProtectedRoute>, '/secret')

    expect(screen.getByText('customer login')).toBeInTheDocument()
  })

  it('shows the page to a matching account type', () => {
    act(() => signIn(loginResponse({ accountType: 'business' })))
    renderRoutes(<ProtectedRoute type="business"><p>owner area</p></ProtectedRoute>, '/secret')

    expect(screen.getByText('owner area')).toBeInTheDocument()
  })

  it('sends a customer away from the owner area, and an owner away from the customer area', () => {
    act(() => signIn(loginResponse({ accountType: 'consumer' })))
    renderRoutes(<ProtectedRoute type="business"><p>owner area</p></ProtectedRoute>, '/secret')
    expect(screen.getByText('business login')).toBeInTheDocument()
    expect(screen.queryByText('owner area')).not.toBeInTheDocument()
  })

  it('treats an owner as signed out on a customer page', () => {
    act(() => signIn(loginResponse({ accountType: 'business' })))
    renderRoutes(<ProtectedRoute type="consumer"><p>my bookings</p></ProtectedRoute>, '/secret')

    expect(screen.getByText('customer login')).toBeInTheDocument()
  })

  it('defaults to the business type', () => {
    act(() => signIn(loginResponse({ accountType: 'business' })))
    renderRoutes(<ProtectedRoute><p>owner area</p></ProtectedRoute>, '/secret')

    expect(screen.getByText('owner area')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  const adminSession = (email, accountType = 'business') => loginResponse({
    accountType, identity: email, token: fakeToken({ email }),
  })

  it('sends a signed-out visitor to the business login', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'boss@torni.test')
    renderRoutes(<AdminRoute><p>admin panel</p></AdminRoute>, '/secret')

    expect(screen.getByText('business login')).toBeInTheDocument()
  })

  it('shows the panel to a business account whose email is on the admin list', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'other@torni.test, boss@torni.test')
    act(() => signIn(adminSession('boss@torni.test')))
    renderRoutes(<AdminRoute><p>admin panel</p></AdminRoute>, '/secret')

    expect(screen.getByText('admin panel')).toBeInTheDocument()
  })

  it('refuses a signed-in owner who is not on the list', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'boss@torni.test')
    act(() => signIn(adminSession('owner@torni.test')))
    renderRoutes(<AdminRoute><p>admin panel</p></AdminRoute>, '/secret')

    expect(screen.queryByText('admin panel')).not.toBeInTheDocument()
    expect(screen.getByText('business login')).toBeInTheDocument()
  })

  it('refuses a customer account even if the email is on the list', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'boss@torni.test')
    act(() => signIn(adminSession('boss@torni.test', 'consumer')))
    renderRoutes(<AdminRoute><p>admin panel</p></AdminRoute>, '/secret')

    expect(screen.queryByText('admin panel')).not.toBeInTheDocument()
  })

  it('refuses everyone when no admin list is configured', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', '')
    act(() => signIn(adminSession('boss@torni.test')))
    renderRoutes(<AdminRoute><p>admin panel</p></AdminRoute>, '/secret')

    expect(screen.queryByText('admin panel')).not.toBeInTheDocument()
  })

  it('refuses a phone-login owner, who has no email claim', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'boss@torni.test')
    act(() => signIn(loginResponse({ accountType: 'business', identity: '+39333', token: fakeToken({}) })))
    renderRoutes(<AdminRoute><p>admin panel</p></AdminRoute>, '/secret')

    expect(screen.queryByText('admin panel')).not.toBeInTheDocument()
  })
})
