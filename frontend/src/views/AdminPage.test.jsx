import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPage from './AdminPage'

vi.mock('../auth', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-1' }) }))
vi.mock('../api/adminApi', () => ({
  getAdminTenants: vi.fn(),
  setTenantEnabled: vi.fn(),
  cleanUpUnusedImages: vi.fn(),
}))

import { cleanUpUnusedImages, getAdminTenants } from '../api/adminApi'

beforeEach(() => {
  getAdminTenants.mockReset()
  getAdminTenants.mockResolvedValue([])
  cleanUpUnusedImages.mockReset()
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
