import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPage from './AdminPage'

vi.mock('../auth', () => ({
  useAuth0: () => ({ getAccessTokenSilently: async () => 'token-1', user: { email: 'boss@torni.test' } }),
}))
vi.mock('../api/adminApi', () => ({
  getAdminSummary: vi.fn(),
  getAdminTenants: vi.fn(),
  getAdminAccounts: vi.fn(),
  getAdminClients: vi.fn(),
  getAdminAuditLog: vi.fn(),
  setTenantEnabled: vi.fn(),
  deleteTenant: vi.fn(),
  deleteAccount: vi.fn(),
  cleanUpUnusedImages: vi.fn(),
}))

import {
  cleanUpUnusedImages, deleteAccount, deleteTenant, getAdminAccounts, getAdminAuditLog, getAdminClients,
  getAdminSummary, getAdminTenants, setTenantEnabled,
} from '../api/adminApi'

const alpha = { id: 1, slug: 'alpha-abc123', name: 'Alpha Cuts', ownerEmail: 'owner@torni.test', createdAt: '2026-01-02T10:00:00',
  enabled: true, visibleToPublic: true, bookingCount: 4, reviewCount: 2, lastActivity: '2026-03-01T09:00:00' }
const beta = { id: 2, slug: 'beta-xyz789', name: 'Beta Salon', ownerEmail: 'beta@torni.test', createdAt: '2026-02-02T10:00:00',
  enabled: false, visibleToPublic: false, bookingCount: 0, reviewCount: 0, lastActivity: null }

const bossAccount = { id: 1, identity: 'boss@torni.test', name: 'Boss', phone: null, accountType: 'business', createdAt: '2026-01-01T00:00:00' }
const ownerAccount = { id: 2, identity: 'owner@torni.test', name: 'Olive', phone: '3331112222', accountType: 'business',
  createdAt: '2026-01-02T00:00:00', ownedShopId: 1, ownedShopName: 'Alpha Cuts', ownedShopSlug: 'alpha-abc123' }
const clientAccount = { id: 3, identity: 'client@torni.test', name: 'Dana', phone: '3339998888', accountType: 'consumer', createdAt: '2026-01-03T00:00:00' }

beforeEach(() => {
  for (const mock of [getAdminSummary, getAdminTenants, getAdminAccounts, getAdminClients, getAdminAuditLog,
    setTenantEnabled, deleteTenant, deleteAccount, cleanUpUnusedImages]) mock.mockReset()
  getAdminSummary.mockResolvedValue({ shops: 2, visibleShops: 1, hiddenShops: 1, accounts: 3, businessAccounts: 2,
    consumerAccounts: 1, clients: 5, bookings: 4, reviews: 2 })
  getAdminTenants.mockResolvedValue([alpha, beta])
  getAdminAccounts.mockResolvedValue([bossAccount, ownerAccount, clientAccount])
  getAdminClients.mockResolvedValue([])
  getAdminAuditLog.mockResolvedValue([])
})

async function openTab(user, name) {
  await user.click(await screen.findByRole('tab', { name }))
}

describe('AdminPage overview and lists', () => {
  it('shows the usage totals', async () => {
    render(<AdminPage />)

    const clients = (await screen.findByText('Clients', { selector: 'dt' })).parentElement
    expect(within(clients).getByText('5')).toBeInTheDocument()
    const shopsCard = screen.getByText('Shops', { selector: 'dt' }).parentElement
    expect(within(shopsCard).getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Bookings', { selector: 'dt' }).parentElement).toHaveTextContent('4')
  })

  it('lists shops with booking count, last activity and whether the public sees them', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Shops')

    const alphaRow = screen.getByText('Alpha Cuts').closest('tr')
    expect(within(alphaRow).getByText('4')).toBeInTheDocument()
    expect(within(alphaRow).getByText('Visible')).toBeInTheDocument()
    const betaRow = screen.getByText('Beta Salon').closest('tr')
    expect(within(betaRow).getByText('Hidden')).toBeInTheDocument()
    expect(within(betaRow).getByText('beta@torni.test')).toBeInTheDocument()
  })

  it('searches and filters shops', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Shops')

    await user.selectOptions(screen.getByLabelText('Filter shops'), 'hidden')
    expect(screen.queryByText('Alpha Cuts')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Salon')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filter shops'), 'all')
    await user.type(screen.getByLabelText('Search shops'), 'OWNER@')
    expect(screen.getByText('Alpha Cuts')).toBeInTheDocument()
    expect(screen.queryByText('Beta Salon')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument()
  })

  it('hides a visible shop from the public with one click and updates the row', async () => {
    setTenantEnabled.mockResolvedValue({ ...alpha, enabled: false, visibleToPublic: false, bookingCount: 0 })
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Shops')

    await user.click(within(screen.getByText('Alpha Cuts').closest('tr')).getByRole('button', { name: 'Hide' }))

    expect(setTenantEnabled).toHaveBeenCalledWith('token-1', 1, false)
    const row = screen.getByText('Alpha Cuts').closest('tr')
    await waitFor(() => expect(within(row).getByText('Hidden')).toBeInTheDocument())
    expect(within(row).getByText('4')).toBeInTheDocument()
  })

  it('lists every account with its details and the shop it owns, and filters by type', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Accounts')

    const ownerRow = (await screen.findByText('owner@torni.test')).closest('tr')
    expect(within(ownerRow).getByText('Olive')).toBeInTheDocument()
    expect(within(ownerRow).getByText('3331112222')).toBeInTheDocument()
    expect(within(ownerRow).getByText('Alpha Cuts')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filter accounts'), 'consumer')
    expect(screen.queryByText('owner@torni.test')).not.toBeInTheDocument()
    expect(screen.getByText('client@torni.test')).toBeInTheDocument()
  })

  it('lists clients per shop and filters guests from account holders', async () => {
    getAdminClients.mockResolvedValue([
      { shopId: 1, shopName: 'Alpha Cuts', shopSlug: 'alpha-abc123', accountId: 3, name: 'Dana', phone: '3339998888',
        email: 'client@torni.test', bookingCount: 2, reviewCount: 1, lastBooking: '2026-03-01T09:00:00' },
      { shopId: 1, shopName: 'Alpha Cuts', shopSlug: 'alpha-abc123', accountId: null, name: 'Walk In', phone: '3330001111',
        email: null, bookingCount: 1, reviewCount: 0, lastBooking: '2026-03-02T09:00:00' },
    ])
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Clients')

    expect(await screen.findByText('Dana')).toBeInTheDocument()
    expect(screen.getByText('client@torni.test')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Filter clients'), 'guest')
    expect(screen.queryByText('Dana')).not.toBeInTheDocument()
    expect(screen.getByText('Walk In')).toBeInTheDocument()
  })

  it('shows who did what in the activity log', async () => {
    getAdminAuditLog.mockResolvedValue([{ id: 1, adminIdentity: 'boss@torni.test', action: 'SHOP_DELETED', targetType: 'SHOP',
      targetLabel: 'old-shop', details: 'Shop "Old" with 3 booking(s)', createdAt: '2026-03-01T09:00:00' }])
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Activity log')

    expect(await screen.findByText('SHOP_DELETED')).toBeInTheDocument()
    expect(screen.getByText('boss@torni.test')).toBeInTheDocument()
    expect(screen.getByText(/old-shop/)).toBeInTheDocument()
  })
})

describe('AdminPage permanent deletes', () => {
  async function askToDeleteAlpha(user) {
    await openTab(user, 'Shops')
    await user.click(screen.getByRole('button', { name: 'Delete shop Alpha Cuts' }))
    return screen.getByRole('dialog')
  }

  it('names what will be lost and keeps the delete button off until the exact slug is typed', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    const dialog = await askToDeleteAlpha(user)

    expect(within(dialog).getByText(/4 bookings and 2 reviews/)).toBeInTheDocument()
    expect(within(dialog).getByText(/owner@torni.test\) is kept/)).toBeInTheDocument()
    const confirmButton = within(dialog).getByRole('button', { name: 'Delete shop forever' })
    expect(confirmButton).toBeDisabled()

    await user.type(within(dialog).getByLabelText(/to confirm/), 'alpha-abc12')
    expect(confirmButton).toBeDisabled()
    await user.type(within(dialog).getByLabelText(/to confirm/), '3')
    expect(confirmButton).toBeEnabled()
    expect(deleteTenant).not.toHaveBeenCalled()
  })

  it('cancelling deletes nothing', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    const dialog = await askToDeleteAlpha(user)

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deleteTenant).not.toHaveBeenCalled()
  })

  it('deletes the shop with the typed slug and refreshes the lists', async () => {
    deleteTenant.mockResolvedValue()
    getAdminTenants.mockResolvedValueOnce([alpha, beta]).mockResolvedValue([beta])
    const user = userEvent.setup()
    render(<AdminPage />)
    const dialog = await askToDeleteAlpha(user)

    await user.type(within(dialog).getByLabelText(/to confirm/), 'alpha-abc123')
    await user.click(within(dialog).getByRole('button', { name: 'Delete shop forever' }))

    await waitFor(() => expect(deleteTenant).toHaveBeenCalledWith('token-1', 1, 'alpha-abc123'))
    expect(await screen.findByText('Deleted shop Alpha Cuts.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Alpha Cuts')).not.toBeInTheDocument())
    expect(screen.getByText('Beta Salon')).toBeInTheDocument()
  })

  it('keeps the dialog open and says nothing was deleted when the server refuses', async () => {
    deleteTenant.mockRejectedValue({ error: 'CONFIRMATION_MISMATCH' })
    const user = userEvent.setup()
    render(<AdminPage />)
    const dialog = await askToDeleteAlpha(user)

    await user.type(within(dialog).getByLabelText(/to confirm/), 'alpha-abc123')
    await user.click(within(dialog).getByRole('button', { name: 'Delete shop forever' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Nothing was deleted')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('never offers to delete the admin\'s own account', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Accounts')

    const ownRow = (await screen.findByText('boss@torni.test')).closest('tr')
    expect(within(ownRow).queryByRole('button')).not.toBeInTheDocument()
    expect(within(ownRow).getByText('You')).toBeInTheDocument()
  })

  it('deletes an account only after typing its exact identity', async () => {
    deleteAccount.mockResolvedValue()
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Accounts')

    await user.click(await screen.findByRole('button', { name: 'Delete account client@torni.test' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/no longer linked to anyone/)).toBeInTheDocument()
    const confirmButton = within(dialog).getByRole('button', { name: 'Delete account forever' })
    expect(confirmButton).toBeDisabled()
    await user.type(within(dialog).getByLabelText(/to confirm/), 'client@torni.test')
    await user.click(confirmButton)

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith('token-1', 3, 'client@torni.test'))
    expect(await screen.findByText('Deleted account client@torni.test.')).toBeInTheDocument()
  })

  it('explains that a shop owner must have the shop deleted first', async () => {
    deleteAccount.mockRejectedValue({ error: 'ACCOUNT_OWNS_SHOP' })
    const user = userEvent.setup()
    render(<AdminPage />)
    await openTab(user, 'Accounts')

    await user.click(await screen.findByRole('button', { name: 'Delete account owner@torni.test' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/delete that shop first/)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText(/to confirm/), 'owner@torni.test')
    await user.click(within(dialog).getByRole('button', { name: 'Delete account forever' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Delete the shop first')
  })
})

describe('AdminPage unused photos', () => {
  it('scans first without deleting and offers to delete what it found', async () => {
    cleanUpUnusedImages.mockResolvedValue({ dryRun: true, tenantsScanned: 3, unusedFiles: ['a', 'b'], deleted: 0 })
    const user = userEvent.setup()
    render(<AdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Scan for unused photos' }))

    expect(await screen.findByText('Found 2 unused photos across 3 shops.')).toBeInTheDocument()
    expect(cleanUpUnusedImages).toHaveBeenCalledWith('token-1', true)
    expect(screen.getByRole('button', { name: 'Delete 2 unused photos' })).toBeInTheDocument()
  })

  it('deletes only after the second, explicit click', async () => {
    cleanUpUnusedImages
      .mockResolvedValueOnce({ dryRun: true, tenantsScanned: 1, unusedFiles: ['a'], deleted: 0 })
      .mockResolvedValueOnce({ dryRun: false, tenantsScanned: 1, unusedFiles: ['a'], deleted: 1 })
    const user = userEvent.setup()
    render(<AdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Scan for unused photos' }))
    await user.click(await screen.findByRole('button', { name: 'Delete 1 unused photo' }))

    expect(await screen.findByText('Deleted 1 unused photo.')).toBeInTheDocument()
    expect(cleanUpUnusedImages).toHaveBeenLastCalledWith('token-1', false)
    expect(screen.queryByRole('button', { name: /^Delete \d/ })).not.toBeInTheDocument()
  })

  it('shows nothing to delete when no photo is unused', async () => {
    cleanUpUnusedImages.mockResolvedValue({ dryRun: true, tenantsScanned: 1, unusedFiles: [], deleted: 0 })
    const user = userEvent.setup()
    render(<AdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Scan for unused photos' }))

    expect(await screen.findByText('No unused photos found.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Delete \d/ })).not.toBeInTheDocument()
  })

  it('says so when photo storage is not configured', async () => {
    cleanUpUnusedImages.mockRejectedValue({ error: 'UPLOADS_NOT_CONFIGURED' })
    const user = userEvent.setup()
    render(<AdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Scan for unused photos' }))

    await waitFor(() => expect(screen.getByText('Photo storage is not configured.')).toBeInTheDocument())
  })
})
